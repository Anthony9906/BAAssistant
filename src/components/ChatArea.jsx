import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './ChatArea.css';
import { FiPaperclip, FiImage, FiMic, FiGrid, FiSend, FiUser, FiCopy, FiShare2, FiHelpCircle, FiFileText, FiAlertCircle, FiX, FiCheck, FiRefreshCw, FiClock, FiMessageSquare } from 'react-icons/fi';
import LoadingSpinner from './common/LoadingSpinner';
import { supabase } from '../lib/supabase';
import OpenAI from 'openai';
import { toast } from 'react-hot-toast';
import { AiEditor } from "aieditor";
import "aieditor/dist/style.css";
import DocumentPreview from './DocumentPreview';
import HelpBot from './HelpBot';
import { encode } from 'gpt-tokenizer';  // 需要先安装 gpt-tokenizer 包
import { useOpenAI } from '../hooks/useOpenAI';

// 为不同的 router 定义独立的模型信息
const ROUTER_MODELS = {
  'router-a': {
    'deepseek/deepseek-r1:free': {
      name: 'DeepSeek R1'
    },
    'openai/gpt-4o-mini': {
      name: 'GPT-4o-mini'
    },
    'openai/gpt-4o-2024-11-20': {
      name: 'GPT-4o'
    },
    'anthropic/claude-3.5-sonnet': {
      name: 'Claude 3.5 Sonnet'
    }
  },
  'router-b': {
    'deepseek-r1': {
      name: 'DeepSeek R1'
    },
    'gpt-4o': {
      name: 'GPT-4O'
    },
    'o3-mini': {
      name: 'O3 Mini'
    },
    'claude-3-5-sonnet-20241022': {
      name: 'Claude 3.5 Sonnet'
    }
  }
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
  const [availableModels, setAvailableModels] = useState({});
  const [selectedModel, setSelectedModel] = useState(() => {
    const savedModel = localStorage.getItem('selectedModel');
    return savedModel || 'openai/gpt-4o-mini'; // 默认模型
  });
  const [selectedRouter, setSelectedRouter] = useState('router-a');
  const editorRef = useRef(null);
  const editorInstanceRef = useRef(null);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const { openai, loading: openaiLoading } = useOpenAI();
  const processedMessageRef = useRef(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

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

  // 添加新的 useEffect 来模拟用户操作
  useEffect(() => {
    // 只在有 chatId 且没有任何消息时执行
    if (chatId && parentMessages.length === 0 && !parentLoading && !isLoading) {
      // 使用 setTimeout 确保组件完全加载
      const timer = setTimeout(() => {
        // 1. 设置输入框的值
        setInputMessage("你好，我是一名项目经理，可以协助我分析我的项目吗？");
        
        // 2. 创建一个模拟的表单提交事件
        const form = document.querySelector('.chat-input');
        if (form) {
          // 使用另一个 setTimeout 确保输入值已经被设置
          setTimeout(() => {
            const submitEvent = new Event('submit', {
              bubbles: true,
              cancelable: true,
            });
            form.dispatchEvent(submitEvent);
          }, 100);
        }
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [chatId, parentMessages.length, parentLoading, isLoading]);

  // 获取全局路由和模型配置
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        // 获取当前选择的路由
        const { data: routerData, error: routerError } = await supabase
          .from('settings')
          .select('*')
          .eq('key', 'router.selected')
          .single();

        if (routerError) throw routerError;
        
        const currentRouter = routerData?.value || 'router-a';
        setSelectedRouter(currentRouter);

        // 获取模型配置
        const { data: modelData, error: modelError } = await supabase
          .from('settings')
          .select('*')
          .like('key', 'model.%');

        if (modelError) throw modelError;

        const modelSettings = {};
        modelData.forEach(setting => {
          const modelId = setting.key.replace('model.', '');
          modelSettings[modelId] = setting.value.enabled;
        });

        setAvailableModels(modelSettings);

        // 检查保存的模型是否可用
        const savedModel = localStorage.getItem('selectedModel');
        const currentRouterModels = ROUTER_MODELS[currentRouter] || {};
        
        if (!savedModel || 
            !modelSettings[savedModel] || 
            !currentRouterModels[savedModel]) {
          // 如果保存的模型不可用，选择第一个可用的模型
          const firstAvailableModel = Object.keys(currentRouterModels)
            .find(modelId => modelSettings[modelId]);
          
          if (firstAvailableModel) {
            setSelectedModel(firstAvailableModel);
            localStorage.setItem('selectedModel', firstAvailableModel);
          }
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
        toast.error('Failed to load settings');
      }
    };

    fetchSettings();

    // 订阅设置变更
    const subscription = supabase
      .channel('settings_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'settings'
      }, fetchSettings)
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

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
        const { data, error } = await supabase
          .from('messages')
          .insert([{
            chat_id: chatId,
            role: message.role,
            content: message.content,
            user_id: user.id,
            model: selectedModel || 'gpt-4o',
            created_at: message.created_at || new Date().toISOString()
          }])
          .select()  // 添加这行来获取插入的数据
          .single(); // 添加这行来获取单条记录

        if (error) throw error;
        return data;  // 返回保存的消息数据
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
    if ((!messageContent.trim() && !content) || isLoading || !openai) return;

    setIsLoading(true);
    setInputMessage('');
    setStreamingMessage('');

    try {
      // 如果是手动发送的消息，先添加用户消息到界面
      if (!content) {
        const userMessage = {
          role: 'user',
          content: messageContent,
          chat_id: chatId,
          id: `user-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        onNewMessage(userMessage);
      }

      // 然后添加 loading 消息
      const tempLoadingMessage = {
        role: 'assistant',
        content: '{{loading}}',
        chat_id: chatId,
        id: Date.now(),  // 直接使用时间戳作为数字 ID
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      onNewMessage(tempLoadingMessage);

      // 保存用户消息到数据库
      if (!content) {  // 确保是手动发送的消息
        if (chatId) {
          await saveMessageToSupabase({
            role: 'user',
            content: messageContent,
            chat_id: chatId
          });
        } else {
          // 保存到 freetalks 表
          const { error } = await supabase
            .from('freetalks')
            .insert([{
              user_id: user.id,
              role: 'user',
              content: messageContent,
              created_at: new Date().toISOString(),
              model: selectedModel
            }]);

          if (error) {
            console.error('保存用户消息失败:', error);
            toast.error('保存消息失败，但对话可以继续');
          }
        }
      }

      let fullResponse = '';
      
      const stream = await openai.chat.completions.create({
        model: selectedModel,
        messages: [
          {
            role: "system",
            content: templatePrompt || "你是一名资深的项目管理专家，你对企业管理有深入的了解，同时具有丰富的数字化项目实践经验，擅长为企业提供数字化项目咨询与建议"
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
        max_tokens: 1024,
        temperature: 0.5
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        fullResponse += content;
        
        // 使用相同的 ID 更新消息内容
        onNewMessage({
          role: 'assistant',
          content: fullResponse,
          chat_id: chatId,
          id: tempLoadingMessage.id,
          model: selectedModel,
          timestamp: tempLoadingMessage.timestamp,
          replaceId: tempLoadingMessage.id
        });
      }

      // 保存最终的 AI 响应到数据库
      if (chatId) {
        const savedMessage = await saveMessageToSupabase({
          role: 'assistant',
          content: fullResponse,
          chat_id: chatId,
          model: selectedModel,
          created_at: new Date().toISOString()
        });
        
        // 最后一次更新消息，包含新的 ID
        onNewMessage({
          role: 'assistant',
          content: fullResponse,
          chat_id: chatId,
          id: savedMessage.id,
          model: selectedModel,
          timestamp: tempLoadingMessage.timestamp,
          replaceId: tempLoadingMessage.id
        });
      } else {
        // 保存到 freetalks 表
        const { data: savedMessage, error } = await supabase
          .from('freetalks')
          .insert([{
            user_id: user.id,
            role: 'assistant',
            content: fullResponse,
            created_at: new Date().toISOString(),
            model: selectedModel
          }])
          .select()
          .single();

        if (error) {
          console.error('保存 AI 回复失败:', error);
          toast.error('保存消息失败，但对话可以继续');
        } else {
          // 最后一次更新消息，包含新的 ID
          onNewMessage({
            role: 'assistant',
            content: fullResponse,
            id: savedMessage.id,
            model: selectedModel,
            timestamp: tempLoadingMessage.timestamp,
            replaceId: tempLoadingMessage.id
          });
        }
      }
      
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
        max_tokens: 4096,
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
          <h3>准备生成文档预览</h3>
        </div>
        <div class="generate-confirm-body">
          <div class="main-message">
            <p>AI 将分析与您关于项目相关话题的全部讨论内容，并进行总结梳理后生成文档。</p>
          </div>
          <div class="tips-section">
            <p class="tips-title">为了获得高质量的文档，建议您：</p>
            <ul>
              <li><span class="bullet">•</span> 跟随并完成全部 AI 建议话题的讨论</li>
              <li><span class="bullet">•</span> 与 AI 讨论您希望包含在文档中的其它问题，让 AI 给出分析与洞察</li>
              <li><span class="bullet">•</span> 你重点关心的话题与 AI 进行多轮的深入探讨</li>
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

  // 处理模型选择变更
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
        id: messageId,
        model: selectedModel
      });

      // 重新请求 AI 响应
      const stream = await openai.chat.completions.create({
        model: selectedModel,
        messages: [
          {
            role: "system",
            content: templatePrompt || "你是一名资深的项目管理专家，你对企业管理有深入的了解，同时具有丰富的数字化项目实践经验，擅长为企业提供数字化项目咨询与建议"
          },
          ...previousMessages.map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        ],
        stream: true,
        max_tokens: 1024,
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
          model: selectedModel,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
      }

      // 更新数据库中的消息
      if (chatId) {
        console.log('更新 messages 表中的消息:', messageId);
        const { error } = await supabase
          .from('messages')
          .update({
            content: fullResponse,
            model: selectedModel,
            created_at: new Date().toISOString()
          })
          .eq('id', messageId);

        if (error) {
          console.error('更新消息失败:', error);
          toast.error('更新消息失败，但对话可以继续');
        }
      } else {
        // 更新 freetalks 表中的消息
        console.log('更新 freetalks 表中的消息:', messageId);
        const { error } = await supabase
          .from('freetalks')
          .update({
            content: fullResponse,
            model: selectedModel,
            created_at: new Date().toISOString()
          })
          .eq('id', messageId);

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
        replaceId: currentMessage.id,
        role: 'assistant',
        content: currentMessage.content,
        id: currentMessage.id,
        timestamp: currentMessage.timestamp
      });
    } finally {
      setIsLoading(false);
      setStreamingMessage('');
    }
  };

  const calculateTokens = (content, model) => {
    try {
      // 使用 gpt-tokenizer 计算 tokens
      const tokens = encode(content);
      return tokens.length;
    } catch (error) {
      console.error('Error calculating tokens:', error);
      // 如果计算失败，返回一个估算值
      return Math.floor(content.length / 4);
    }
  };

  // 如果 OpenAI 实例还在加载中，可以显示加载状态
  if (openaiLoading) {
    return <div className="chat-loading">Initializing chat...</div>;
  }

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
            {Object.entries(ROUTER_MODELS[selectedRouter] || {})
              .filter(([modelId]) => availableModels[modelId])
              .map(([modelId, { name, description, color }]) => (
                <option 
                  key={modelId} 
                  value={modelId}
                  style={{ borderLeft: `4px solid ${color}` }}
                >
                  {name}
                </option>
              ))}
          </select>
          <button 
            className="help-button"
            onClick={() => setShowHelpModal(true)}
            title="App Help"
          >
            <FiHelpCircle className="help-icon" />
          </button>
          <button 
            className="history-button"
            onClick={() => setShowHistoryModal(true)}
            title="历史对话"
          >
            <FiMessageSquare className="history-icon" />
          </button>
        </div>
        <button 
          className="generate-doc-button"
          onClick={handleGenerateClick}
          disabled={isGenerating}
          title="生成文档"
        >
          <FiFileText className="generate-icon" />
          <span>{isGenerating ? 'Generating...' : '生成文档预览'}</span>
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
                      title={ROUTER_MODELS[selectedRouter][message.model]?.name || message.model}
                      data-tooltip={ROUTER_MODELS[selectedRouter][message.model]?.name || message.model}
                    >
                      {calculateTokens(message.content, message.model)} tokens
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
                      {/* 只在最后一条 AI 消息上显示重新生成按钮 */}
                      {parentMessages
                        .slice(parentMessages.indexOf(message) + 1)
                        .every(msg => msg.role === 'user') && (
                        <button 
                          className="message-action-button" 
                          title="重新生成"
                          onClick={() => regenerateResponse(parentMessages.indexOf(message))}
                          disabled={isLoading}
                        >
                          <FiRefreshCw className={`action-icon ${isLoading ? 'spinning' : ''}`} />
                        </button>
                      )}
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
