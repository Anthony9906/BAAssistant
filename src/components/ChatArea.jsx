import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './ChatArea.css';
import { FiPaperclip, FiImage, FiMic, FiGrid, FiSend, FiBook, FiUser, FiCopy, FiShare2, FiX } from 'react-icons/fi';
import LoadingSpinner from './common/LoadingSpinner';
import { supabase } from '../lib/supabase';
import OpenAI from 'openai';
import { toast } from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { AiEditor } from "aieditor";
import "aieditor/dist/style.css";
import DocumentPreview from './DocumentPreview';

export const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  baseURL: 'https://api.gptsapi.net/v1',
  dangerouslyAllowBrowser: true
});

function ChatArea({ 
  messages: parentMessages, 
  onNewMessage, 
  isLoading: parentLoading, 
  templatePrompt,
  generatePrompt,
  chatTitle
}) {
  const { user } = useAuth();
  const { chatId } = useParams();
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [editorContent, setEditorContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const editorRef = useRef(null);
  const editorInstanceRef = useRef(null);
  const [previewContent, setPreviewContent] = useState('');
  const previewRef = useRef(null);

  // 添加滚动到底部的函数
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'end'
    });
  };

  // 当消息更新时滚动到底部
  useEffect(() => {
    if (!parentLoading && parentMessages.length > 0) {
      scrollToBottom();
    }
  }, [parentMessages, parentLoading]);

  useEffect(() => {
    // 如果有初始消息且没有 AI 回复，发送 AI 请求
    if (parentMessages?.length === 1 && 
        parentMessages[0].role === 'user' && 
        !parentMessages.some(msg => msg.role === 'assistant')) {
      sendMessage(null, parentMessages[0].content);
    }
  }, [parentMessages]);

  // 当流式消息更新时也滚动到底部
  useEffect(() => {
    if (streamingMessage) {
      scrollToBottom();
    }
  }, [streamingMessage]);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.scrollTop = editorRef.current.scrollHeight;
    }
  }, [editorContent]);

  // 更新编辑器内容的方法
  useEffect(() => {
    if (editorInstanceRef.current?.editor && editorContent) {
      try {
        // 尝试延迟设置内容，确保编辑器已完全初始化
        setTimeout(() => {
          if (editorInstanceRef.current?.editor) {
            editorInstanceRef.current.editor.setContent(editorContent);
          }
        }, 100);
      } catch (error) {
        console.error('Error setting editor content:', error);
      }
    }
  }, [editorContent]);

  // 初始化编辑器
  useEffect(() => {
    if (showPreview && editorRef.current && !editorInstanceRef.current) {
      try {
        editorInstanceRef.current = new AiEditor({
          element: editorRef.current,
          placeholder: "文档内容将在这里生成...",
          height: '100%',
          contentIsMarkdown: true,
          draggable: true,
          pasteAsText: false,
          onChange: () => {
            if (editorInstanceRef.current) {
              // 使用 getText 获取纯文本内容
              const content = editorInstanceRef.current.getText();
              setPreviewContent(content);
            }
          }
        });
      } catch (error) {
        console.error('Error initializing editor:', error);
      }
    }

    return () => {
      if (editorInstanceRef.current) {
        editorInstanceRef.current.destroy();
        editorInstanceRef.current = null;
      }
    };
  }, [showPreview]);

  // 同步滚动处理
  useEffect(() => {
    const editorElement = editorRef.current?.querySelector('.aie-content');  // 获取实际的编辑区域
    const previewElement = previewRef.current;

    const handleEditorScroll = () => {
      if (editorElement && previewElement) {
        const percentage = editorElement.scrollTop / (editorElement.scrollHeight - editorElement.clientHeight);
        previewElement.scrollTop = percentage * (previewElement.scrollHeight - previewElement.clientHeight);
      }
    };

    const handlePreviewScroll = () => {
      if (editorElement && previewElement) {
        const percentage = previewElement.scrollTop / (previewElement.scrollHeight - previewElement.clientHeight);
        editorElement.scrollTop = percentage * (editorElement.scrollHeight - editorElement.clientHeight);
      }
    };

    if (editorElement) {
      editorElement.addEventListener('scroll', handleEditorScroll);
    }
    if (previewElement) {
      previewElement.addEventListener('scroll', handlePreviewScroll);
    }

    return () => {
      if (editorElement) {
        editorElement.removeEventListener('scroll', handleEditorScroll);
      }
      if (previewElement) {
        previewElement.removeEventListener('scroll', handlePreviewScroll);
      }
    };
  }, [showPreview]);

  const sendMessage = async (e, content = null) => {
    if (e) e.preventDefault();
    const messageContent = content || inputMessage;
    if ((!messageContent.trim() && !content) || isLoading) return;

    setIsLoading(true);
    setInputMessage('');
    setStreamingMessage('');

    try {
      // 立即添加用户消息到界面
      const userMessage = {
        role: 'user',
        content: messageContent,
        chat_id: chatId,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      onNewMessage(userMessage);

      // 保存用户消息到数据库
      if (chatId && !content) {
        const { error: messageError } = await supabase
          .from('messages')
          .insert([{
            chat_id: chatId,
            role: 'user',
            content: messageContent,
            user_id: user.id
          }]);

        if (messageError) throw messageError;
      }

      // 使用流式API
      const stream = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: templatePrompt || "你是一名资深的项目管理专家，你对企业管理有深入的了解，同时具有丰富的数字化项目实践经验，擅长于帮助企业解决数字化转型问题，也擅长编写各类项目文档，能够为用户提供这些方面的专业咨询与建议"
          },
          ...parentMessages.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          {
            role: "user",
            content: messageContent
          }
        ],
        stream: true,
      });

      let fullResponse = '';
      
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        fullResponse += content;
        setStreamingMessage(prev => prev + content);
      }

      // 流式响应完成后，保存完整消息到数据库
      const assistantMessage = {
        role: 'assistant',
        content: fullResponse,
        chat_id: chatId,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      if (chatId) {
        const { error: assistantError } = await supabase
          .from('messages')
          .insert([{
            chat_id: chatId,
            role: 'assistant',
            content: fullResponse,
            user_id: user.id
          }]);

        if (assistantError) throw assistantError;
      }

      onNewMessage(assistantMessage);
      setStreamingMessage('');

    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!generatePrompt) {
      toast.error('未设置生成提示词，无法生成文档');
      return;
    }

    setIsGenerating(true);
    setShowPreview(true);
    setEditorContent(''); // 清空之前的内容

    try {
      const chatContent = parentMessages
        .filter(msg => msg.role !== 'system')
        .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
        .join('\n\n');

      const stream = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: generatePrompt
          },
          {
            role: "user",
            content: chatContent
          }
        ],
        stream: true,
      });

      let fullContent = '';
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        fullContent += content;
        setEditorContent(fullContent); // 更新编辑器内容
      }
    } catch (error) {
      console.error('Error generating document:', error);
      toast.error('生成文档失败，请重试');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="chat-area">
      {parentLoading && <LoadingSpinner />}
      <div className="chat-header">
        <h2>AI <span style={{fontSize: '12px', color: '#999', marginLeft: '4px', fontWeight: 'normal'}}>gpt-4o</span></h2>
        <button 
          className="generate-doc-button"
          onClick={handleGenerate}
          disabled={isGenerating}
        >
          <span>{isGenerating ? 'Generating...' : 'Generate'}</span>
        </button>
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
              <span className="chat-message-sender">
                {message.role === 'user' ? 'You' : 'AI Assistant'}
              </span>
              <span className="message-time">{message.timestamp}</span>
              {message.role === 'assistant' && (
                <span className="tokens">{Math.floor(message.content.length / 4)} tokens</span>
              )}
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
            </div>
          </div>
        ))}
        {(isLoading || streamingMessage) && (
          <div className="message-group assistant">
            <div className="message-content">
              {streamingMessage || (
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              )}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} style={{ height: '20px' }} />
      </div>

      <form onSubmit={sendMessage} className="chat-input">
        <textarea
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              sendMessage(e);
            }
          }}
          placeholder="How can I help you?"
          disabled={isLoading}
          rows="1"
          style={{ height: 'auto' }}
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
            <FiSend className="send-icon" />
            <span>Send</span>
          </button>
        </div>
      </form>

      <DocumentPreview 
        show={showPreview}
        onClose={() => {
          setShowPreview(false);
          setEditorContent('');
        }}
        title="文档编辑"
        initialContent={editorContent}
        isGenerating={isGenerating}
        generatePrompt={generatePrompt}
        chatId={chatId}
        chatTitle={chatTitle}
        user={user}
      />
    </div>
  );
}

export default ChatArea;
