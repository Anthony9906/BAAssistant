import React from 'react';
    import './ChatArea.css';
    import { FiPaperclip, FiImage, FiMic, FiGrid, FiSend, FiBook } from 'react-icons/fi';

    function ChatArea() {
      return (
        <div className="chat-area">
          <div className="chat-header">
            <h2>Lorem ipsum dolor sit amet conectur</h2>
            <button className="new-chat-button">+ New chat</button>
          </div>
          <div className="chat-messages">
            <div className="message-group">
              <div className="message-header">
                <img src="https://placekitten.com/30/30" alt="User Avatar" className="message-avatar" />
                <span className="message-sender">Mauro Sicard</span>
                <span className="message-time">2:45 PM</span>
              </div>
              <div className="message-content">
                Lorem ipsum dolor sit amet consectetur tincidunt bibendum gravida phasellus sed dignissim id tempus ridiculus
              </div>
            </div>
            <div className="message-group">
              <div className="message-header">
                <div className="message-sender-icon">
                  <span className="message-sender-icon-inner"></span>
                </div>
                <span className="message-sender">LanguageGUI</span>
                <span className="message-time">2:46 PM</span>
              </div>
              <div className="message-content">
                <div className="message-content-text">
                  Lorem ipsum dolor sit amet ele senectus do eiusmod tincidunt bibendum gravida phasellus sed dignitas id tempus ridiculus Elementum exercitation ullamco laboris nisi ut aliquip ex ea commo consequat
                </div>
                <div className="message-actions">
                  <button className="message-action-button">Fact check</button>
                  <button className="message-action-button">Share</button>
                </div>
                <div className="message-icons">
                  <FiPaperclip className="icon" />
                  <FiImage className="icon" />
                  <FiGrid className="icon" />
                  <span className="tokens">32 tokens</span>
                </div>
              </div>
            </div>
          </div>
          <div className="chat-input">
            <div className="chat-input-icons">
              <FiBook className="icon" />
              <FiPaperclip className="icon" />
              <FiImage className="icon" />
              <FiMic className="icon" />
              <FiGrid className="icon" />
            </div>
            <input type="text" placeholder="How can I help you?" />
            <button className="send-button">
              <FiSend className="icon" />
              Send message
            </button>
          </div>
        </div>
      );
    }

    export default ChatArea;
