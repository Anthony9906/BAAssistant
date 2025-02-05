import React from 'react';
import './Sidebar.css';
import { FiSettings, FiLogOut, FiSearch, FiMessageSquare, FiBook, FiFileText, FiUser } from 'react-icons/fi';

function Sidebar({ onNavigate, currentView }) {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="user-info">
          <FiUser className="user-icon" />
          <span>Anthony Wang</span>
        </div>
        <div className="sidebar-actions">
          <FiSettings className="icon" />
          <FiLogOut className="icon" />
        </div>
      </div>
      <div className="search-bar">
        <FiSearch className="icon" />
        <input type="text" placeholder="Search for chats..." />
      </div>
      <nav className="sidebar-nav">
        <div 
          className={`nav-item ${currentView === 'chat' ? 'active' : ''}`}
          onClick={() => onNavigate('chat')}
        >
          <FiMessageSquare className="icon" />
          <span>Chats</span>
          <span className="shortcut">⌘1</span>
        </div>
        <div 
          className={`nav-item ${currentView === 'library' ? 'active' : ''}`}
          onClick={() => onNavigate('library')}
        >
          <FiBook className="icon" />
          <span>Library</span>
          <span className="shortcut">⌘2</span>
        </div>
        <div 
          className={`nav-item ${currentView === 'docs' ? 'active' : ''}`}
          onClick={() => onNavigate('docs')}
        >
          <FiFileText className="icon" />
          <span>Docs</span>
          <span className="shortcut">⌘3</span>
        </div>
      </nav>
      <div className="chat-history-section">
        <p className="chat-history-header">CHAT HISTORY</p>
        <ul className="chat-history-list">
          <li>Give me 10 ways to create an re...</li>
          <li>TypeScript Function for Z...</li>
        </ul>
      </div>
      <button className="new-chat-button">
        + Start new chat
      </button>
    </div>
  );
}

export default Sidebar;
