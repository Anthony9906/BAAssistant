import React, { useState, useEffect, useMemo } from 'react';
import './ModelInfo.css';
import { LuFeather } from "react-icons/lu";
import { FiCheckCircle, FiMoreVertical, FiMessageSquare, FiSearch, FiFileText, FiFolder, FiTrash2, FiX } from 'react-icons/fi';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import DocumentPreview from './DocumentPreview';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

function ModelInfo() {
  const [documents, setDocuments] = useState([]);
  const { user } = useAuth();
  const [showPreview, setShowPreview] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [projects, setProjects] = useState([]);
  const [showProjectMenu, setShowProjectMenu] = useState(null);
  const [projectSearchQuery, setProjectSearchQuery] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    fetchDocuments();
    fetchProjects();
  }, [user]);

  const fetchDocuments = async () => {
    if (!user) return;
    
    setIsLoading(true);  // 开始加载
    try {
      const { data, error } = await supabase
        .from('docs_with_message_count')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('获取文档列表失败');
    } finally {
      setIsLoading(false);  // 结束加载
    }
  };

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('获取项目列表失败');
    }
  };

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

  // 关联文档到项目
  const handleAssignToProject = async (docId, projectId) => {
    try {
      const { error } = await supabase
        .from('docs')
        .update({ project_id: projectId })
        .eq('id', docId);

      if (error) throw error;
      
      // 更新本地文档列表
      setDocuments(documents.map(doc => 
        doc.id === docId ? { ...doc, project_id: projectId } : doc
      ));
      
      toast.success('已关联到项目');
    } catch (error) {
      console.error('Error assigning document to project:', error);
      toast.error('关联项目失败');
    } finally {
      setShowProjectMenu(null);
    }
  };

  // 从项目中移除文档
  const handleRemoveFromProject = async (docId) => {
    try {
      const { error } = await supabase
        .from('docs')
        .update({ project_id: null })
        .eq('id', docId);

      if (error) throw error;
      
      // 更新本地文档列表
      setDocuments(documents.map(doc => 
        doc.id === docId ? { ...doc, project_id: null } : doc
      ));
      
      toast.success('已从项目中移除');
    } catch (error) {
      console.error('Error removing document from project:', error);
      toast.error('移除失败');
    } finally {
      setShowProjectMenu(null);
    }
  };

  // 获取文档所属的项目名称，并限制长度
  const getProjectName = (doc) => {
    if (!doc.project_id) return "未关联项目";
    const project = projects.find(p => p.id === doc.project_id);
    const name = project ? project.name : "未关联项目";
    return name.length > 6 ? name.slice(0, 6) + '...' : name;
  };

  // 过滤项目
  const filteredProjectsList = projects.filter(project => 
    project.name.toLowerCase().includes(projectSearchQuery.toLowerCase())
  );

  // 添加文档搜索过滤函数
  const filteredDocuments = useMemo(() => {
    if (!searchQuery.trim()) return documents;
    const query = searchQuery.toLowerCase();
    return documents.filter(doc => 
      doc.title.toLowerCase().includes(query) ||
      doc.content?.toLowerCase().includes(query)
    );
  }, [documents, searchQuery]);

  // 处理聊天记录点击
  const handleChatClick = (e, chatId) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (chatId) {
      navigate(`/chats/${chatId}`);
    }
  };

  // 添加一个回调函数来处理文档更新
  const handleDocumentUpdate = async () => {
    await fetchDocuments(); // 重新获取文档列表
  };

  // 添加清理文本内容的函数
  const cleanPreviewContent = (content) => {
    if (!content) return '';
    return content
      .replace(/\[.*?\]/g, '') // 移除 markdown 链接标记
      .replace(/\(.*?\)/g, '') // 移除 markdown URL
      .replace(/[#*`~]/g, '') // 移除 markdown 标记符号
      .replace(/<[^>]*>/g, '') // 移除 HTML 标签
      .replace(/\s+/g, ' ') // 将多个空白字符替换为单个空格
      .trim(); // 移除首尾空白
  };

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

      <div className="documents-section">
        <div className="documents-title">
          <FiFileText className="title-icon" />
          <h2>My Documents</h2>
        </div>

        <div className="search-container">
          <div className="search-input-wrapper">
            <FiSearch className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="搜索文档..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="documents-list-container">
          {isLoading ? (
            <div className="documents-loading">
              <div className="loading-spinner-container">
                <div className="loading-spinner-circle"></div>
              </div>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="empty-documents">
              <div className="empty-documents-content">
                <div className="empty-icon-wrapper">
                  <FiFileText className="empty-icon" />

                  <h3>AI还没有为你生成任何文档</h3>
                  <ul className="empty-documents-steps">
                    <li>
                      <span className="step-number">1</span>
                      使用 Library 文档库创建对话
                    </li>
                    <li>
                      <span className="step-number">2</span>
                      通过话题讨论，让 AI 帮你分析项目
                    </li>
                    <li>
                      <span className="step-number">3</span>
                      让 AI 总结你们的讨论生成文档
                    </li>
                    <li>
                      <span className="step-number">4</span>
                      你可以尝试使用不同 LLM 生成
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div className="documents-list">
              {filteredDocuments.map((doc) => (
                <div 
                  key={doc.id} 
                  className="document-item"
                  onClick={() => {
                    setSelectedDoc(doc);
                    setShowPreview(true);
                  }}
                >
                  <div className="document-header">
                    <div className="document-title-wrapper">
                      <FiFileText className="document-icon" />
                      <div className="document-title">
                        {doc.title}
                      </div>
                    </div>
                  </div>
                  <div className="document-preview">
                    {cleanPreviewContent(doc.content).slice(0, 36)}...
                  </div>
                  <div className="document-meta">
                    <div className="document-tags">
                      <button 
                        className={`project-tag ${doc.project_id ? 'has-project' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowProjectMenu(showProjectMenu === doc.id ? null : doc.id);
                        }}
                      >
                        <FiFolder className="tag-icon" />
                        {getProjectName(doc)}
                      </button>
                      <div className="doc-type-tag">
                        {doc.doc_type_name || "Document"}
                      </div>
                      <button 
                        className="chat-count-tag"
                        onClick={(e) => handleChatClick(e, doc.chat_id)}
                        title={doc.message_count > 0 ? "查看关联的聊天记录" : "暂无聊天记录"}
                        disabled={!doc.chat_id || doc.message_count === 0}
                      >
                        <FiMessageSquare className="tag-icon" />
                        <span>{doc.message_count}</span>
                      </button>
                    </div>
                    <div className="timestamp">
                      {formatTime(doc.created_at)}
                    </div>
                    {showProjectMenu === doc.id && (
                      <div className="project-menu-dropdown">
                        <div className="search-box">
                          <input
                            type="text"
                            placeholder="搜索项目..."
                            value={projectSearchQuery}
                            onChange={(e) => setProjectSearchQuery(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            autoFocus
                          />
                        </div>
                        <div className="project-menu-list">
                          {filteredProjectsList.map(project => (
                            <button
                              key={project.id}
                              className={`project-menu-item ${doc.project_id === project.id ? 'active' : ''}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAssignToProject(doc.id, project.id);
                              }}
                            >
                              <FiFolder className="project-icon" />
                              {project.name}
                            </button>
                          ))}
                        </div>
                        {doc.project_id && (
                          <button
                            className="project-menu-item remove"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveFromProject(doc.id);
                            }}
                          >
                            <FiTrash2 className="project-icon" />
                            从项目中移除
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <DocumentPreview 
        show={showPreview}
        onClose={() => {
          setShowPreview(false);
          setSelectedDoc(null);
        }}
        title={selectedDoc?.title}
        initialContent={selectedDoc?.content}
        user={user}
        chatTitle={selectedDoc?.doc_type_name}
        chatId={selectedDoc?.chat_id}
        generatePrompt={selectedDoc?.generate_prompt}
        documentId={selectedDoc?.id}
        onDocumentUpdate={handleDocumentUpdate}
      />
    </div>
  );
}

export default ModelInfo;
