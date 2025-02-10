import React, { useState, useEffect } from 'react';
import './ModelInfo.css';
import { LuFeather } from "react-icons/lu";
import { FiCheckCircle, FiMoreVertical, FiMessageSquare, FiSearch, FiFileText } from 'react-icons/fi';
import { supabase } from '../lib/supabase';

function ModelInfo() {
  const [documents, setDocuments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('chats')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  // 过滤文档
  const filteredDocuments = documents.filter(doc => 
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 格式化时间
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / 1000 / 60);
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} min ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)} hrs ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)} days ago`;
    }
  };

  const providers = [
    {
      name: 'OpenAI',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/4/4d/OpenAI_Logo.svg'
    },
    {
      name: 'DeepSeek',
      logo: 'https://cdn.deepseek.com/platform/favicon.png'
    },
    {
      name: 'Anthropic',
      logo: 'https://images.seeklogo.com/logo-png/51/2/anthropic-icon-logo-png_seeklogo-515014.png'
    },
    {
      name: 'Meta AI',
      logo: 'https://images.seeklogo.com/logo-png/42/1/meta-icon-new-facebook-2021-logo-png_seeklogo-424014.png?v=1957907069834115656'
    },
    {
      name: 'Gemini AI',
      logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTJeGbkM-VT8QxLK2nGoQ7E2_g3-1xEt6LmtA&s'
    },
    {
      name: 'xAI',
      logo: 'https://x.ai/favicon.ico'
    }
  ];

  return (
    <div className="model-info">
      <div className="model-info-header">
        <LuFeather className="model-info-logo" />
        <h2>LLM Project Docs Generator</h2>
      </div>
      <p className="model-info-description">
        A helper to generate docs for your project with LLM Agent, reproducible outputs, parallel function calling, and more...
      </p>
      
      <div className="model-info-providers">
        {providers.map((provider) => (
          <img 
            key={provider.name}
            src={provider.logo} 
            alt={provider.name} 
            className="provider-info-logo"
            title={provider.name}
          />
        ))}
      </div>

      <div className="response-topic">
        <FiCheckCircle className="icon" />
        <span>Generated Documents</span>
      </div>

      <div className="documents-section">
        <div className="documents-title">
          <FiFileText className="title-icon" />
          <h2>AI Documents</h2>
        </div>

        <div className="documents-search">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search docs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="documents-list">
          {filteredDocuments.map((doc) => (
            <div key={doc.id} className="document-item">
              <div className="document-title">
                {doc.title}
              </div>
              <div className="document-meta">
                <div className="model-tag">
                  {doc.model || 'GPT 4'}
                </div>
                <div className="interaction-count">
                  <FiMessageSquare className="meta-icon" />
                  {doc.message_count || '0'}
                </div>
                <div className="timestamp">
                  {formatTime(doc.created_at)}
                </div>
                <button className="more-options">
                  <FiMoreVertical />
                </button>
              </div>
            </div>
          ))}
          {filteredDocuments.length === 0 && (
            <div className="no-results">
              No documents found matching "{searchQuery}"
            </div>
          )}
        </div>
      </div>

      <div className="message-group">
        <div className="message-header">
          <div className="message-sender-icon">
            <span className="message-sender-icon-inner"></span>
          </div>
          <span className="message-sender">Documentation</span>
        </div>
        <div className="message-content">
        </div>
      </div>
    </div>
  );
}

export default ModelInfo;
