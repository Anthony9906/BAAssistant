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

      // 直接格式化消息，移除了添加系统消息的逻辑
      const formattedMessages = messagesData.map(msg => ({
        ...msg,
        timestamp: new Date(msg.created_at).toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        })
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
    setMessages(prevMessages => {
      if (message.replaceId) {
        // 如果是替换消息，需要检查原消息是否应该保留
        const existingMessage = prevMessages.find(msg => msg.id === message.replaceId);
        
        if (existingMessage?.persisted && !message.persisted) {
          // 如果现有消息是持久化的，而新消息不是，则保留现有消息
          return prevMessages;
        }

        // 确保不会意外删除其他消息
        return prevMessages.map(msg => 
          msg.id === message.replaceId ? {
            ...message,
            // 保留原消息的持久化状态，除非新消息明确指定
            persisted: message.persisted ?? existingMessage?.persisted,
            id: message.id
          } : msg
        );
      }

      // 添加新消息时确保消息对象的完整性
      const newMessage = {
        ...message,
        id: message.id || Date.now(),  // 确保消息有 ID
        timestamp: message.timestamp || new Date().toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        })
      };

      return [...prevMessages, newMessage];
    });
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
