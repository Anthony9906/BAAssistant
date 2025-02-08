import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import './ChatArea.css';
import { FiPaperclip, FiImage, FiMic, FiGrid, FiSend, FiBook, FiUser, FiCopy, FiShare2 } from 'react-icons/fi';
import LoadingSpinner from './common/LoadingSpinner';
import { supabase } from '../lib/supabase';
import OpenAI from 'openai';

export const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  baseURL: 'https://api.gptsapi.net/v1',
  dangerouslyAllowBrowser: true
});

function ChatArea({ messages: parentMessages, onNewMessage, isLoading: parentLoading }) {
  const { chatId } = useParams();
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // 如果有初始消息且没有 AI 回复，发送 AI 请求
    if (parentMessages?.length === 1 && 
        parentMessages[0].role === 'user' && 
        !parentMessages.some(msg => msg.role === 'assistant')) {
      sendMessage(null, parentMessages[0].content);
    }
  }, [parentMessages]);

  const sendMessage = async (e, content = null) => {
    if (e) e.preventDefault();
    const messageContent = content || inputMessage;
    if ((!messageContent.trim() && !content) || isLoading) return;

    setIsLoading(true);

    try {
      // 只在用户手动发送消息时保存到数据库
      if (chatId && !content) {
        const { error: messageError } = await supabase
          .from('messages')
          .insert([{
            chat_id: chatId,
            role: 'user',
            content: messageContent
          }]);

        if (messageError) throw messageError;
        
        onNewMessage({
          role: 'user',
          content: messageContent,
          chat_id: chatId,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
      }

      // 发送到 AI API
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "你是一名资深的项目管理专家..."
          },
          ...parentMessages.map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        ],
      });

      const assistantMessage = {
        role: 'assistant',
        content: completion.choices[0].message.content,
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

      onNewMessage(assistantMessage);
      setInputMessage('');
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-area">
      {parentLoading && <LoadingSpinner />}
      <div className="chat-header">
        <h2>AI <span style={{fontSize: '12px', color: '#999', marginLeft: '4px', fontWeight: 'normal'}}>gpt-4o-mini</span></h2>
        <button className="new-chat-button" onClick={() => onNewMessage({ role: 'user', content: '', chat_id: chatId, timestamp: '' })}>+ New chat</button>
      </div>

      <div className="chat-messages">
        {parentMessages.map((message, index) => (
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
