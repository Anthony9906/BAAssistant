import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './ChatArea.css';
import { FiPaperclip, FiImage, FiMic, FiGrid, FiSend, FiUser, FiCopy, FiShare2, FiHelpCircle, FiFileText, FiAlertCircle, FiX, FiCheck, FiRefreshCw } from 'react-icons/fi';
import LoadingSpinner from './common/LoadingSpinner';
import { supabase } from '../lib/supabase';
import OpenAI from 'openai';
import { toast } from 'react-hot-toast';
import { AiEditor } from "aieditor";
import "aieditor/dist/style.css";
import DocumentPreview from './DocumentPreview';
import HelpBot from './HelpBot';

export const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  baseURL: import.meta.env.VITE_OPENAI_BASE_URL,
  dangerouslyAllowBrowser: true
});

const MODEL_DISPLAY_NAMES = {
  'gpt-4o': 'GPT-4O',
  'deepseek-r1': 'DeepSeek R1',
  'o3-mini': 'O3 Mini',
  'claude-3-5-sonnet-20241022': 'Claude 3.5'
};

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
  const [streamingMessage, setStreamingMessage] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [editorContent, setEditorContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [availableModels, setAvailableModels] = useState({
    'gpt-4o': true,
    'deepseek-r1': true,
    'o3-mini': true,
    'claude-3-5-sonnet-20241022': true
  });
  const [selectedModel, setSelectedModel] = useState(() => {
    const savedModel = localStorage.getItem('selectedModel');
    return savedModel || 'gpt-4o';
  });
  const editorRef = useRef(null);
  const editorInstanceRef = useRef(null);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // 根据消息和加载状态决定是否显示欢迎图片
  const showWelcome = parentMessages.length === 0 && !parentLoading && !streamingMessage;

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

  // 获取用户设置的可用模型
  useEffect(() => {
    const fetchUserSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('user_settings')
          .select('settings')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;

        if (data?.settings?.models) {
          setAvailableModels(data.settings.models);
          // 如果当前选中的模型被禁用，自动切换到第一个可用的模型
          if (!data.settings.models[selectedModel]) {
            const firstAvailableModel = Object.entries(data.settings.models)
              .find(([_, enabled]) => enabled)?.[0];
            if (firstAvailableModel) {
              setSelectedModel(firstAvailableModel);
              localStorage.setItem('selectedModel', firstAvailableModel);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching user settings:', error);
      }
    };

    if (user?.id) {
      fetchUserSettings();
    }
  }, [user?.id]);

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
          pasteAsText: false
        });
      } catch (error) {
        console.error('Error initializing editor:', error);
      }
    }

    // 清理函数
    return () => {
      if (editorInstanceRef.current) {
        editorInstanceRef.current.destroy();
        editorInstanceRef.current = null;
      }
    };
  }, [showPreview]);

  // 添加保存消息到数据库的函数
  const saveMessageToSupabase = async (message, retryCount = 3) => {
    for (let i = 0; i < retryCount; i++) {
      try {
        const { error } = await supabase
          .from('messages')
          .insert([{
            chat_id: chatId,
            role: message.role,
            content: message.content,
            user_id: user.id,
            model: selectedModel || 'gpt-4o',
            created_at: message.created_at || new Date().toISOString()
          }]);

        if (error) throw error;
        return true;
      } catch (error) {
        console.error(`保存消息失败，尝试次数: ${i + 1}`, error);
        if (i === retryCount - 1) {
          toast.error('保存消息失败，但对话可以继续');
          return false;
        }
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  };

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
        await saveMessageToSupabase(userMessage);
      }

      // 使用选中的模型
      const stream = await openai.chat.completions.create({
        model: selectedModel,
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
        max_tokens: 512,
        temperature: 0.5
      });

      let fullResponse = '';
      
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        fullResponse += content;
        setStreamingMessage(prev => prev + content);
      }

      const assistantMessage = {
        role: 'assistant',
        content: fullResponse,
        chat_id: chatId,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      if (chatId) {
        await saveMessageToSupabase(assistantMessage);
      }

      onNewMessage(assistantMessage);
      setStreamingMessage('');

    } catch (error) {
      console.error('Error:', error);
      toast.error('发送消息失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!generatePrompt || !chatId) {
      toast.success('请打开 Library 选择一种文档类型开始创建', {
        duration: 3000,
        position: 'top-center',
        style: {
          background: '#10b981',
          color: '#fff',
          fontSize: '14px',
          padding: '16px',
          borderRadius: '8px'
        },
      });
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
        model: selectedModel,
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
        max_tokens: 2048,
        temperature: 0.5
      });

      let fullContent = '';
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        fullContent += content;
        setEditorContent(fullContent);
      }
    } catch (error) {
      console.error('Error generating document:', error);
      toast.error('生成文档失败，请重试');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateClick = () => {
    if (!generatePrompt || !chatId) {
      toast.success('请打开 Library 选择一种文档类型开始创建', {
        duration: 3000,
        position: 'top-center',
        style: {
          background: '#10b981',
          color: '#fff',
          fontSize: '14px',
          padding: '16px',
          borderRadius: '8px'
        },
      });
      return;
    }

    const confirmDialog = document.createElement('div');
    confirmDialog.className = 'generate-confirm-dialog';
    confirmDialog.innerHTML = `
      <div class="generate-confirm-content">
        <div class="generate-confirm-header">
          <div class="header-icon-wrapper">
            <svg class="alert-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <h3>准备生成文档</h3>
        </div>
        <div class="generate-confirm-body">
          <div class="main-message">
            <p>AI 将分析与您关于项目相关话题的全部讨论内容，并进行总结梳理后生成文档。</p>
          </div>
          <div class="tips-section">
            <p class="tips-title">为了获得高质量的文档，建议您：</p>
            <ul>
              <li><span class="bullet">•</span> 完成全部 AI 建议话题的讨论</li>
              <li><span class="bullet">•</span> 与 AI 讨论您希望包含在文档中的其它话题，并让 AI 给出分析与洞察</li>
              <li><span class="bullet">•</span> 就您重点关注的话题与 AI 进行多轮的深入探讨</li>
            </ul>
          </div>
        </div>
        <div class="generate-confirm-footer">
          <button class="cancel-btn">
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            继续对话
          </button>
          <button class="confirm-btn">
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="12" y1="18" x2="12" y2="12"></line>
              <line x1="9" y1="15" x2="15" y2="15"></line>
            </svg>
            立即生成
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(confirmDialog);

    // 添加按钮事件监听
    const cancelBtn = confirmDialog.querySelector('.cancel-btn');
    const confirmBtn = confirmDialog.querySelector('.confirm-btn');

    cancelBtn.onclick = () => {
      document.body.removeChild(confirmDialog);
    };

    confirmBtn.onclick = () => {
      document.body.removeChild(confirmDialog);
      handleGenerate();
    };
  };

  // 当模型选择改变时，保存到 localStorage
  const handleModelChange = (e) => {
    const newModel = e.target.value;
    setSelectedModel(newModel);
    localStorage.setItem('selectedModel', newModel);
  };

  const copyToClipboard = async (content) => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success('已复制到剪贴板', {
        duration: 2000,
        position: 'top-center'
      });
    } catch (err) {
      console.error('复制失败:', err);
      toast.error('复制失败，请重试');
    }
  };

  const regenerateResponse = async (messageIndex) => {
    if (isLoading) return;

    // 检查是否是最后一条 AI 消息
    const isLastAIMessage = parentMessages
      .slice(messageIndex + 1)
      .every(msg => msg.role === 'user');

    if (!isLastAIMessage) {
      toast.error('你只能对 AI 最后一次回复进行重新生成，或直接提问 AI', {
        duration: 4000,
        position: 'top-center',
        style: {
          background: '#f43f5e',
          color: '#fff',
          fontSize: '14px',
          padding: '16px',
          maxWidth: '500px',
          borderRadius: '8px'
        },
      });
      return;
    }

    try {
      setIsLoading(true);
      setStreamingMessage('');

      const currentMessage = parentMessages[messageIndex];
      const messageId = currentMessage.id;
      const previousMessages = parentMessages.slice(0, messageIndex);

      // 显示加载动画
      onNewMessage({
        replaceId: messageId,
        role: 'assistant',
        content: '{{loading}}',
        id: messageId
      });

      // 重新请求 AI 响应
      const stream = await openai.chat.completions.create({
        model: selectedModel,
        messages: [
          {
            role: "system",
            content: templatePrompt || "你是一名资深的项目管理专家..."
          },
          ...previousMessages.map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        ],
        stream: true,
        max_tokens: 512,
        temperature: 0.5
      });

      let fullResponse = '';
      
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        fullResponse += content;
        onNewMessage({
          replaceId: messageId,
          role: 'assistant',
          content: fullResponse,
          id: messageId,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
      }

      // 更新数据库中的消息
      if (chatId) {
        const { error } = await supabase
          .from('messages')
          .update({
            content: fullResponse,
            model: selectedModel,
            created_at: new Date().toISOString()  // 更新创建时间为当前时间
          })
          .eq('id', messageId);  // 使用消息ID定位要更新的记录

        if (error) {
          console.error('更新消息失败:', error);
          toast.error('更新消息失败，但对话可以继续');
        }
      }

    } catch (error) {
      console.error('重新生成失败:', error);
      toast.error('重新生成失败，请重试');
      // 发生错误时恢复原消息
      onNewMessage({
        replaceId: messageId,
        role: 'assistant',
        content: currentMessage.content,
        id: messageId,
        timestamp: currentMessage.timestamp
      });
    } finally {
      setIsLoading(false);
      setStreamingMessage('');
    }
  };

  return (
    <div className="chat-area">
      {parentLoading && <LoadingSpinner />}
      <div className="chat-header">
        <div className="model-selector">
          <h2>AI</h2>
          <select 
            value={selectedModel}
            onChange={handleModelChange}
            className="model-select"
          >
            {Object.entries(availableModels).map(([model, enabled]) => (
              enabled && (
                <option key={model} value={model}>
                  {MODEL_DISPLAY_NAMES[model]}
                </option>
              )
            ))}
          </select>
          <button 
            className="help-button"
            onClick={() => setShowHelpModal(true)}
            title="App Help"
          >
            <FiHelpCircle className="help-icon" />
          </button>
        </div>
        <button 
          className="generate-doc-button"
          onClick={handleGenerateClick}
          disabled={isGenerating}
          title="生成文档"
        >
          <FiFileText className="generate-icon" />
          <span>{isGenerating ? 'Generating...' : 'Generate'}</span>
        </button>
      </div>

      <div className="chat-messages">
        {showWelcome ? (
          <div className="welcome-container">
            <img 
              src="/images/welcome-image.png" 
              alt="Welcome" 
              className="welcome-image"
            />
          </div>
        ) : (
          <>
            {parentMessages.map((message, index) => (
              <div key={message.id || index} 
                   className={`message-group ${message.role === 'user' ? 'user' : 'assistant'}`}>
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
                    <span 
                      className="tokens"
                      title={MODEL_DISPLAY_NAMES[message.model] || message.model}
                      data-tooltip={MODEL_DISPLAY_NAMES[message.model] || message.model}
                    >
                      {Math.floor(message.content.length / 4)} tokens
                    </span>
                  )}
                  {message.role === 'assistant' && (
                    <div className="message-actions">
                      <button 
                        className="message-action-button" 
                        title="复制到剪贴板"
                        onClick={() => copyToClipboard(message.content)}
                      >
                        <FiCopy className="action-icon" />
                      </button>
                      <button 
                        className="message-action-button" 
                        title="重新生成"
                        onClick={() => regenerateResponse(index)}
                        disabled={isLoading}
                      >
                        <FiRefreshCw className={`action-icon ${isLoading ? 'spinning' : ''}`} />
                      </button>
                    </div>
                  )}
                </div>
                <div className="message-content">
                  {message.content === '{{loading}}' ? (
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  ) : (
                    message.content
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
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

      {/* 添加帮助弹窗 */}
      {showHelpModal && (
        <div className="help-modal">
          <div className="help-modal-content">
            <div className="help-modal-header">
              <h3>AI Docs Help</h3>
              <button 
                className="close-button"
                onClick={() => setShowHelpModal(false)}
              >
                ×
              </button>
            </div>
            <div className="help-modal-body">
              <HelpBot onClose={() => setShowHelpModal(false)} />
            </div>
          </div>
        </div>
      )}

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
