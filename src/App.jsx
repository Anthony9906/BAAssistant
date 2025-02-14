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
  
  useEffect(() => {
    if (chatId) {
      fetchChatData();
    } else {
      setMessages([]);
      setTemplatePrompt('');
      setGeneratePrompt('');
      setCurrentChat(null);
    }
  }, [chatId]);

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
      // 如果是替换消息，找到并替换临时消息
      setMessages(prev => prev.map(msg => 
        msg.id === message.replaceId ? message : msg
      ));
    } else {
      // 如果是新消息，直接添加
      setMessages(prev => [...prev, message]);
    }
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
          <Route path="*" element={<Navigate to="/library" />} />
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
