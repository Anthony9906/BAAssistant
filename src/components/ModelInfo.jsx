import React from 'react';
import './ModelInfo.css';
import { LuFeather } from "react-icons/lu";
import { FiCheckCircle } from 'react-icons/fi';

function ModelInfo() {
  const providers = [
    {
      name: 'DeepSeek',
      logo: 'https://cdn.deepseek.com/platform/favicon.png'
    },
    {
      name: 'OpenAI',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/4/4d/OpenAI_Logo.svg'
    },
    {
      name: 'Anthropic',
      logo: 'https://images.seeklogo.com/logo-png/51/2/anthropic-icon-logo-png_seeklogo-515014.png'
    },
    {
      name: 'Meta AI',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Meta_Platforms_Inc._logo.svg'
    },
    {
      name: 'xAI',
      logo: 'https://x.ai/favicon.ico'
    }
  ];

  return (
    <div className="model-info">
      <div className="model-header">
        <LuFeather className="model-logo" />
        <h2>LLM Project Docs Generator</h2>
      </div>
      <p className="model-description">
        A helper to generate docs for your project with LLM Agent, reproducible outputs, parallel function calling, and more...
      </p>
      
      <div className="llm-providers">
        {providers.map((provider) => (
          <img 
            key={provider.name}
            src={provider.logo} 
            alt={provider.name} 
            className="provider-logo"
            title={provider.name}
          />
        ))}
      </div>

      <div className="response-topic">
        <FiCheckCircle className="icon" />
        <span>Generated for: Topic</span>
      </div>
      <div className="message-group">
        <div className="message-header">
          <div className="message-sender-icon">
            <span className="message-sender-icon-inner"></span>
          </div>
          <span className="message-sender">AI Documentation Tools</span>
          <span className="message-time">Latest Update: 02/07</span>
        </div>
        <div className="message-content">
        </div>
      </div>
    </div>
  );
}

export default ModelInfo;
