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
            <p>以对话的方式与 AI 一起分析你的项目，让 AI 更深入的理解并提供建议</p>
          </li>
          <li>
            <div className="feature-title">
              <div className="feature-icon">
                <FiFileText />
              </div>
              <strong>文档生成 <span> Library </span></strong>
            </div>
            <p>让 AI 分析总结对话并生成文档，支持多种项目文档类型</p>
          </li>
          <li>
            <div className="feature-title">
              <div className="feature-icon">
                <FiDatabase />
              </div>
              <strong>文档库 <span> Docs </span></strong>
            </div>
            <p>管理和组织生成的所有文档，并按项目分类管理，方便查阅和编辑</p>
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