import React from 'react';
    import './Sidebar.css';
    import { FiSettings, FiLogOut, FiSearch, FiMessageSquare, FiBook, FiFileText } from 'react-icons/fi';

    function Sidebar() {
      return (
        <div className="sidebar">
          <div className="sidebar-header">
            <div className="user-info">
              <img src="https://placekitten.com/40/40" alt="User Avatar" className="user-avatar" />
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
            <div className="nav-item active">
              <FiMessageSquare className="icon" />
              <span>Chats</span>
              <span className="shortcut">⌘1</span>
            </div>
            <div className="nav-item">
              <FiBook className="icon" />
              <span>Library</span>
              <span className="shortcut">⌘2</span>
            </div>
            <div className="nav-item">
              <FiFileText className="icon" />
              <span>Docs</span>
              <span className="shortcut">⌘3</span>
            </div>
          </nav>
          <div className="pinned-section">
            <p className="pinned-header">PINNED</p>
            <ul className="pinned-list">
              <li>Create a blog outline</li>
              <li>Generate [] keywords for a mar...</li>
              <li>Could you please explain how ta...</li>
              <li>Create a JS function for...</li>
            </ul>
          </div>
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
