import React, { useState, useRef, useEffect } from 'react';
import './ChatArea.css';
import { FiPaperclip, FiImage, FiMic, FiGrid, FiSend, FiBook, FiUser } from 'react-icons/fi';

function ChatArea() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    //scrollToBottom();
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
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
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
      // 可以添加错误提示
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-area">
      <div className="chat-header">
        <h2>AI Assistant</h2>
        <button className="new-chat-button" onClick={() => setMessages([])}>+ New chat</button>
      </div>

      <div className="chat-messages">
        {messages.map((message, index) => (
          <div key={index} className="message-group">
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
            </div>
            <div className="message-content">
              {message.content}
              {message.role === 'assistant' && (
                <>
                  <div className="message-actions">
                    <button className="message-action-button">Copy</button>
                    <button className="message-action-button">Share</button>
                  </div>
                  <div className="message-icons">
                    <span className="tokens">{Math.floor(message.content.length / 4)} tokens</span>
                  </div>
                </>
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
