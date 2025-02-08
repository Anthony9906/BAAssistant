import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useParams } from 'react-router-dom';
import { supabase } from './lib/supabase';
import Sidebar from './components/Sidebar';
import Library from './components/Library/Library';
import ChatArea from './components/ChatArea';
import ModelInfo from './components/ModelInfo';
import Docs from './components/Docs/Docs';
import Resizer from './components/common/Resizer';
import './App.css';

// 聊天容器组件
function ChatContainer() {
  const [chatAreaWidth, setChatAreaWidth] = useState(0.6);
  const [messages, setMessages] = useState([]);
  const [templatePrompt, setTemplatePrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { chatId } = useParams();

  useEffect(() => {
    if (chatId) {
      fetchChatData();
    } else {
      setMessages([]);
      setTemplatePrompt('');
    }
  }, [chatId]);

  const fetchChatData = async () => {
    setIsLoading(true);
    try {
      // 获取chat信息
      const { data: chat, error: chatError } = await supabase
        .from('chats')
        .select('*')
        .eq('id', chatId)
        .single();

      if (chatError) throw chatError;

      if (chat.template_prompt) {
        setTemplatePrompt(chat.template_prompt);
      }

      // 获取消息历史
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;

      const formattedMessages = messagesData.map(msg => ({
        ...msg,
        timestamp: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }));

      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error fetching chat data:', error);
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
          templatePrompt={templatePrompt}
          isLoading={isLoading}
        />
      </div>
      <Resizer onResize={handleResize} />
      <div className="model-info-wrapper" style={{ width: `${(1 - chatAreaWidth) * 100}%` }}>
        <ModelInfo />
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <div className="app">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Library />} />
            <Route path="/library" element={<Library />} />
            <Route path="/docs" element={<Docs />} />
            <Route path="/chats/:chatId" element={<ChatContainer />} />
            <Route path="/chats" element={<ChatContainer />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
