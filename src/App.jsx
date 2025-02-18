import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useParams, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Auth/Login';
import Sidebar from './components/Sidebar';
import Library from './components/Library/Library';
import ChatArea from './components/ChatArea';
import ModelInfo from './components/ModelInfo';
import Docs from './components/Docs/Docs';
import Resizer from './components/common/Resizer';
import SignUp from './components/Auth/SignUp';
import './App.css';
import { Toaster } from 'react-hot-toast';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

// 聊天容器组件
function ChatContainer() {
  const [chatAreaWidth, setChatAreaWidth] = useState(0.6);
  const [messages, setMessages] = useState([]);
  const [templatePrompt, setTemplatePrompt] = useState('');
  const [generatePrompt, setGeneratePrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentChat, setCurrentChat] = useState(null);
  const { chatId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedModel, setSelectedModel] = useState(() => {
    return localStorage.getItem('selectedModel') || 'gpt-4o';
  });
  
  useEffect(() => {
    if (chatId) {
      fetchChatData();
    } else {
      // 清空当前状态
      setMessages([]);
      setTemplatePrompt('');
      setGeneratePrompt('');
      setCurrentChat(null);
    }
  }, [chatId]); // 只依赖 chatId

  // 单独处理 messages 的保存
  useEffect(() => {
    // 只在没有 chatId 且有消息时保存
    if (!chatId && messages.length > 0) {
      const saveFreetalks = async () => {
        try {
          // 过滤掉 loading 状态的消息和临时消息
          const validMessages = messages.filter(msg => 
            !msg.content.includes('{{loading}}') && // 过滤 loading 状态
            !msg.id?.startsWith('temp-') // 过滤临时消息
          );

          const newMessages = validMessages.map(msg => ({
            user_id: user.id,
            role: msg.role,
            content: msg.content,
            created_at: msg.created_at || new Date().toISOString(),
            model: msg.model || selectedModel,
            timestamp: new Date(msg.created_at || new Date()).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })
          }));

          const { error: insertError } = await supabase
            .from('freetalks')
            .upsert(newMessages, {
              onConflict: 'user_id,created_at',
              returning: true
            });

          if (insertError) throw insertError;
        } catch (error) {
          console.error('Error saving freetalks:', error);
          toast.error('保存对话记录失败');
        }
      };

      // 使用防抖来避免频繁保存
      const timeoutId = setTimeout(() => {
        saveFreetalks();
      }, 1000); // 1秒后执行保存

      return () => clearTimeout(timeoutId); // 清理定时器
    }
  }, [chatId, messages, user?.id, selectedModel]); // 添加必要的依赖项

  const fetchChatData = async () => {
    setIsLoading(true);

    try {
      const { data: chat, error: chatError } = await supabase
        .from('chats')
        .select('*')
        .eq('id', chatId)
        .eq('user_id', user.id)
        .single();

      if (chatError) {
        if (chatError.code === 'PGRST116') {
          toast.error('聊天记录不存在或无权访问');
          navigate('/library');
          return;
        }
        throw chatError;
      }

      setCurrentChat(chat);

      if (chat.chat_prompt) {
        setTemplatePrompt(chat.chat_prompt);
      }
      if (chat.generate_prompt) {
        setGeneratePrompt(chat.generate_prompt);
      }

      if (chat.model) {
        setSelectedModel(chat.model);
      }

      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;

      if (messagesData.length === 0 && chat.chat_prompt) {
        const systemMessage = {
          id: 'system-' + Date.now(),
          role: 'system',
          content: chat.chat_prompt,
          chat_id: chatId,
          user_id: user.id,
          created_at: new Date().toISOString()
        };
        messagesData.unshift(systemMessage);
      }

      const formattedMessages = messagesData.map(msg => ({
        ...msg,
        timestamp: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }));

      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error fetching chat data:', error);
      toast.error('加载聊天记录失败');
      navigate('/library');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResize = (position) => {
    setChatAreaWidth(position);
  };

  const handleNewMessage = (message) => {
    if (message.replaceId) {
      setMessages(prev => prev.map(msg => 
        msg.id === message.replaceId ? {
          ...message,
          created_at: new Date().toISOString(),
          model: selectedModel,
          user_id: user.id
        } : msg
      ));
    } else {
      setMessages(prev => [...prev, {
        ...message,
        created_at: new Date().toISOString(),
        model: selectedModel,
        user_id: user.id
      }]);
    }
  };

  const handleModelChange = (newModel) => {
    setSelectedModel(newModel);
    localStorage.setItem('selectedModel', newModel);
  };

  return (
    <div className="chat-container">
      <div className="chat-area-wrapper" style={{ width: `${chatAreaWidth * 100}%` }}>
        <ChatArea 
          messages={messages} 
          onNewMessage={handleNewMessage}
          isLoading={isLoading}
          templatePrompt={templatePrompt}
          generatePrompt={generatePrompt}
          chatTitle={currentChat?.title}
          selectedModel={selectedModel}
          onModelChange={handleModelChange}
        />
      </div>
      <Resizer onResize={handleResize} />
      <div className="model-info-wrapper" style={{ width: `${(1 - chatAreaWidth) * 100}%` }}>
        <ModelInfo />
      </div>
    </div>
  );
}

// 受保护的路由组件
function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  return user ? children : <Navigate to="/login" />;
}

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  // 未登录用户只能访问登录和注册页面
  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // 已登录用户的路由
  return (
    <div className="app">
      <Sidebar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Navigate to="/chats" replace />} />
          <Route path="/library" element={<Library />} />
          <Route path="/docs" element={<Docs />} />
          <Route path="/chats/:chatId" element={<ChatContainer />} />
          <Route path="/chats" element={<ChatContainer />} />
          <Route path="*" element={<Navigate to="/chats" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <>
      <AuthProvider>
        <Router>
          <AppContent />
          <Toaster />
        </Router>
      </AuthProvider>
    </>
  );
}

export default App;
