import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Sidebar.css';
import { FiSettings, FiLogOut, FiSearch, FiMessageSquare, FiBook, FiFileText, FiUser, FiHome, FiMessageCircle, FiMonitor, FiGrid } from 'react-icons/fi';
import { supabase } from '../lib/supabase';

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [chatHistory, setChatHistory] = useState([]);

  useEffect(() => {
    fetchChatHistory();
  }, []);

  const fetchChatHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('chats')
        .select('id, title, created_at')
        .order('created_at', { ascending: false })
        .limit(8);

      if (error) throw error;

      setChatHistory(data);
    } catch (error) {
      console.error('Error fetching chat history:', error);
    }
  };

  const truncateTitle = (title) => {
    return title.length > 25 ? title.substring(0, 25) + '...' : title;
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="user-info">
          <FiUser className="user-icon" />
          <span style={{margin: '0 12px'}}>Anthony Wang</span>
        </div>
        <div className="sidebar-actions">
          <FiSettings className="icon" />
          <FiLogOut className="icon" />
        </div>
      </div>
      <div className="search-bar">
        <FiSearch style={{ color: '#71717a', width: 16, height: 16, marginRight: 8 }} />
        <input type="text" placeholder="Search for chats..." />
        <span className="search-shortcut">K</span>
      </div>
      <div className="nav-section">
        <button 
          className={`nav-item ${location.pathname.startsWith('/chats') ? 'active' : ''}`}
          onClick={() => navigate('/chats')}
        >
          <FiMessageCircle className="nav-icon" />
          <span>Chats</span>
          <span className="shortcut-badge">1</span>
        </button>
        
        <button 
          className={`nav-item ${location.pathname === '/library' || location.pathname === '/' ? 'active' : ''}`}
          onClick={() => navigate('/library')}
        >
          <FiMonitor className="nav-icon" />
          <span>Library</span>
          <span className="shortcut-badge">2</span>
        </button>

        <button 
          className={`nav-item ${location.pathname.startsWith('/docs') ? 'active' : ''}`}
          onClick={() => navigate('/docs')}
        >
          <FiGrid className="nav-icon" />
          <span>Docs</span>
          <span className="shortcut-badge">3</span>
        </button>
      </div>
      <div className="chat-history-section">
        <p className="chat-history-header">CHAT HISTORY</p>
        <ul className="chat-history-list">
          {chatHistory.map((chat) => (
            <li 
              key={chat.id}
              className={`chat-history-item ${location.pathname === `/chats/${chat.id}` ? 'active' : ''}`}
              onClick={() => navigate(`/chats/${chat.id}`)}
            >
              <FiMessageCircle className="chat-icon" />
              <span className="chat-title">{truncateTitle(chat.title)}</span>
            </li>
          ))}
        </ul>
      </div>
      <button 
        className="new-chat-button"
        onClick={() => navigate('/chats/new')}
      >
        + Start new chat
      </button>
    </div>
  );
}

export default Sidebar;
