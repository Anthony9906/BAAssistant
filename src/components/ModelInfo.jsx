import React from 'react';
    import './ModelInfo.css';
    import { FiCheckCircle } from 'react-icons/fi';

    function ModelInfo() {
      return (
        <div className="model-info">
          <div className="model-header">
            <img src="https://placekitten.com/50/50" alt="Model Logo" className="model-logo" />
            <h2>GPT 4 Model</h2>
          </div>
          <p className="model-description">
            he latest GPT-4 model with improved instruction following, JSON mode, reproducible outputs, parallel function calling, and more...
          </p>
          <div className="model-context">
            <span className="context-label">CONTEXT</span>
            <span className="context-value">128,000 tokens</span>
          </div>
          <div className="model-date">
            <span className="date-label">DATE</span>
            <span className="date-value">Apr 10, 2023</span>
          </div>
          <div className="response-topic">
            <FiCheckCircle className="icon" />
            <span>Response for: Topic</span>
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
              Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua
              <br />
              <br />
              <strong>Dolor sit ame consectur</strong>
              <ul>
                <li>Quis faucibus massa sit e</li>
                <li>Morbi fringilla molestie</li>
                <li>Quisque euismod posuere lacus sit</li>
              </ul>
              <a href="https://google.com" target="_blank" rel="noopener noreferrer">google.com</a>
            </div>
          </div>
        </div>
      );
    }

    export default ModelInfo;
