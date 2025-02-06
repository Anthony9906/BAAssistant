import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import './ChatArea.css';
import { FiPaperclip, FiImage, FiMic, FiGrid, FiSend, FiBook, FiUser, FiCopy, FiShare2 } from 'react-icons/fi';
import LoadingSpinner from './common/LoadingSpinner';
import { supabase } from '../lib/supabase';

function ChatArea() {
  const { chatId } = useParams();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(!!chatId);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (chatId) {
      fetchChatAndMessages();
    } else {
      setLoading(false);
    }
  }, [chatId]);

  const fetchChatAndMessages = async () => {
    if (!chatId) return;

    try {
      // 获取chat信息
      const { data: chat, error: chatError } = await supabase
        .from('chats')
        .select('*')
        .eq('id', chatId)
        .single();

      if (chatError) throw chatError;

      // 获取消息历史
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;

      setMessages(messagesData.map(msg => ({
        ...msg,
        timestamp: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      })));

      // 如果是新chat且有模板提示词，自动发送第一条消息
      if (chat.template_prompt && messagesData.length === 1) {
        sendMessage(null, chat.template_prompt);
      }
    } catch (error) {
      console.error('Error fetching chat:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e, content = null) => {
    if (e) e.preventDefault();
    const messageContent = content || inputMessage;
    if ((!messageContent.trim() && !content) || isLoading) return;

    const userMessage = {
      role: 'user',
      content: messageContent,
      chat_id: chatId,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // 保存用户消息到数据库
      if (chatId && !content) {
        const { error: messageError } = await supabase
          .from('messages')
          .insert([{
            chat_id: chatId,
            role: 'user',
            content: messageContent
          }]);

        if (messageError) throw messageError;
      }

      // 发送到 AI API
      const response = await fetch('https://api.gptsapi.net/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [...messages, userMessage].map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        })
      });

      const data = await response.json();
      
      const assistantMessage = {
        role: 'assistant',
        content: data.choices[0].message.content,
        chat_id: chatId,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      // 保存 AI 回复到数据库
      if (chatId) {
        const { error: assistantError } = await supabase
          .from('messages')
          .insert([{
            chat_id: chatId,
            role: 'assistant',
            content: assistantMessage.content
          }]);

        if (assistantError) throw assistantError;
      }

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-area">
      {loading && <LoadingSpinner />}
      <div className="chat-header">
        <h2>AI <span style={{fontSize: '12px', color: '#999', marginLeft: '4px', fontWeight: 'normal'}}>gpt-4o-mini</span></h2>
        <button className="new-chat-button" onClick={() => setMessages([])}>+ New chat</button>
      </div>

      <div className="chat-messages">
        {messages.map((message, index) => (
          <div key={index} className={`message-group ${message.role === 'assistant' ? 'assistant' : ''}`}>
            <div className="message-header">
              {message.role === 'user' ? (
                <div className="user-avatar">
                  <FiUser className="avatar-icon" />
                </div>
              ) : (
                <div className="ai-avatar">
                  <span className="ai-avatar-inner">AI</span>
                </div>
              )}
              <span className="message-sender">
                {message.role === 'user' ? 'You' : 'AI Assistant'}
              </span>
              <span className="message-time">{message.timestamp}</span>
              {message.role === 'assistant' && (
                <div className="message-actions">
                  <button className="message-action-button" title="Copy to clipboard">
                    <FiCopy className="action-icon" />
                  </button>
                  <button className="message-action-button" title="Share message">
                    <FiShare2 className="action-icon" />
                  </button>
                </div>
              )}
            </div>
            <div className="message-content">
              {message.content}
              {message.role === 'assistant' && (
                <div className="message-icons">
                  <span className="tokens">{Math.floor(message.content.length / 4)} tokens</span>
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="message-group">
            <div className="message-header">
              <div className="ai-avatar">
                <span className="ai-avatar-inner">AI</span>
              </div>
              <span className="message-sender">AI Assistant</span>
            </div>
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="chat-input">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="How can I help you?"
          disabled={isLoading}
        />
        <div className="chat-input-footer">
          <div className="chat-input-icons">
            <button type="button" className="icon-button">
              <FiBook className="icon" />
            </button>
            <button type="button" className="icon-button">
              <FiPaperclip className="icon" />
            </button>
            <button type="button" className="icon-button">
              <FiImage className="icon" />
            </button>
            <button type="button" className="icon-button">
              <FiMic className="icon" />
            </button>
            <button type="button" className="icon-button">
              <FiGrid className="icon" />
            </button>
          </div>
          <button type="submit" className="send-button" disabled={isLoading || !inputMessage.trim()}>
            Send message
          </button>
        </div>
      </form>
    </div>
  );
}

export default ChatArea;
