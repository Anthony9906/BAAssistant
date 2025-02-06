import React from 'react';
    import './ModelInfo.css';
    import { FiCheckCircle } from 'react-icons/fi';
    import { LuFeather, LuBookmarkPlus } from "react-icons/lu";

    function ModelInfo() {
      return (
        <div className="model-info">
          <div className="model-header">
            <LuFeather className="model-logo" />
            <h2>LLM Project Docs Generator</h2>
          </div>
          <p className="model-description">
            The easier way to generate project docs with LLM Agent, use library templates for reproducible outputs, parallel function calling, and more...
          </p>
          <div className="response-topic">
            <FiCheckCircle className="icon" />
            <span>Generated for: Topic</span>
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
              Document display here
            </div>
          </div>
        </div>
      );
    }

    export default ModelInfo;
