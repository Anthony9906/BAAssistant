import React from 'react';
import { FiMessageSquare, FiFileText, FiDatabase, FiUsers, FiCommand } from 'react-icons/fi';
import './HelpBot.css';

function HelpBot({ onClose }) {
  return (
    <div className="help-bot">
      
      <div className="feature-section">
        <div className="section-header">
          <span className="emoji">👋</span>
          <h3>欢迎使用 AI Docs 项目文档智能助手</h3>
        </div>
        <ul className="feature-list">
          <li>
            <div className="feature-title">
              <div className="feature-icon">
                <FiMessageSquare />
              </div>
              <strong>AI 对话 <span> Chats </span></strong>
            </div>
            <p>支持 AI 进行对话讨论您的项目，包括 DeepSeek R1 和 GPT-4O</p>
          </li>
          <li>
            <div className="feature-title">
              <div className="feature-icon">
                <FiFileText />
              </div>
              <strong>文档生成 <span> Library </span></strong>
            </div>
            <p>可以基于对话内容生成文档，支持 Markdown 格式</p>
          </li>
          <li>
            <div className="feature-title">
              <div className="feature-icon">
                <FiDatabase />
              </div>
              <strong>文档库 <span> Docs </span></strong>
            </div>
            <p>管理和组织生成的所有文档，方便后续查阅和编辑</p>
          </li>
          <li>
            <div className="feature-title">
              <div className="feature-icon">
                <FiUsers />
              </div>
              <strong>团队协作 <span> Teams </span></strong>
            </div>
            <p>支持团队成员之间共享和协作处理文档（即将推出）</p>
          </li>
        </ul>
      </div>

      <div className="shortcuts-section">
        <div className="section-header">
          <span className="emoji">⌨️</span>
          <h3>快捷操作</h3>
        </div>
        <ul className="shortcuts-list">
          <li>
            <div className="feature-title">
              <div className="feature-icon">
                <FiCommand />
              </div>
              <strong>Enter</strong>
            </div>
            <p>发送消息</p>
          </li>
          <li>
            <div className="feature-title">
              <div className="feature-icon">
                <FiCommand />
              </div>
              <strong>Shift + Enter</strong>
            </div>
            <p>换行</p>
          </li>
          <li>
            <div className="feature-title">
              <div className="feature-icon">
                <FiCommand />
              </div>
              <strong>Generate</strong>
            </div>
            <p>生成文档</p>
          </li>
        </ul>
      </div>

      <div className="help-footer">
        <span className="emoji">💡</span>
        <p>如需更多帮助，请随时联系 @Anthony </p>
      </div>
    </div>
  );
}

export default HelpBot;