import React, { useState, useEffect, useRef, useMemo } from 'react';
import './Docs.css';
import { FiFolder, FiArrowRight, FiPlus, FiEdit2, FiTrash2, FiBox, FiLayers, FiFileText, FiMoreVertical, FiMessageSquare, FiSearch } from 'react-icons/fi';
import { supabase } from '../../lib/supabase';
import LoadingSpinner from '../common/LoadingSpinner';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import Popover from '../common/Popover';
import { useNavigate } from 'react-router-dom';
import DocumentPreview from '../DocumentPreview';

function Docs() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('all');
  const [documents, setDocuments] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(true);
  const [editingProject, setEditingProject] = useState(null);
  const { user } = useAuth();
  const newProjectBtnRef = useRef(null);
  const [showProjectMenu, setShowProjectMenu] = useState(null);
  const menuButtonRefs = useRef({});  // 用于存储每个文档的按钮引用
  const [projectSearchQuery, setProjectSearchQuery] = useState('');
  const navigate = useNavigate();
  const [showPreview, setShowPreview] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [docSearchQuery, setDocSearchQuery] = useState('');

  const fetchDocuments = async () => {
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
    }
  };

  useEffect(() => {
    if (user) {
      fetchProjects();
      fetchDocuments();
    }
  }, [user]);

  const filteredDocuments = useMemo(() => {
    let filtered = documents;

    // 首先按项目过滤
    if (selectedProject !== 'all') {
      filtered = filtered.filter(doc => doc.project_id === selectedProject.id);
    }

    // 然后按搜索关键词过滤
    if (docSearchQuery.trim()) {
      const query = docSearchQuery.toLowerCase();
      filtered = filtered.filter(doc => 
        doc.title.toLowerCase().includes(query) ||
        doc.content?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [documents, selectedProject, docSearchQuery]);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('获取项目列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProject.name.trim()) {
      toast.error('请输入项目名称');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('projects')
        .insert([
          {
            name: newProject.name,
            description: newProject.description,
            user_id: user.id
          },
        ])
        .select();

      if (error) throw error;

      setProjects([data[0], ...projects]);
      setNewProject({ name: '', description: '' });
      setIsCreating(false);
      toast.success('项目创建成功');
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('创建项目失败');
    }
  };

  const deleteProject = async (projectId, e) => {
    e.stopPropagation(); // 防止触发项目选择
    if (!confirm('Are you sure you want to delete this project?')) return;

    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;

      setProjects(projects.filter(p => p.id !== projectId));
      if (selectedProject?.id === projectId) {
        setSelectedProject(null);
      }
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  const updateProject = async (e) => {
    e.preventDefault();
    if (!editingProject.name.trim()) return;

    try {
      const { data, error } = await supabase
        .from('projects')
        .update({
          name: editingProject.name,
          description: editingProject.description,
        })
        .eq('id', editingProject.id)
        .select();

      if (error) throw error;

      setProjects(projects.map(p => 
        p.id === editingProject.id ? data[0] : p
      ));
      if (selectedProject?.id === editingProject.id) {
        setSelectedProject(data[0]);
      }
      setEditingProject(null);
    } catch (error) {
      console.error('Error updating project:', error);
    }
  };

  // 添加格式化时间的函数
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

  // 处理项目关联
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

  // 获取文档所属的项目名称
  const getProjectName = (doc) => {
    if (!doc.project_id) return "未关联项目";
    const project = projects.find(p => p.id === doc.project_id);
    return project ? project.name : "未关联项目";
  };

  // 添加点击外部关闭菜单的处理
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showProjectMenu) {
        const menuElement = document.querySelector('.project-menu-dropdown');
        const buttonElement = menuButtonRefs.current[showProjectMenu];
        if (menuElement && !menuElement.contains(event.target) && 
            buttonElement && !buttonElement.contains(event.target)) {
          setShowProjectMenu(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProjectMenu]);

  // 过滤项目的函数
  const filteredProjectsList = useMemo(() => {
    if (!projectSearchQuery.trim()) return projects;
    const query = projectSearchQuery.toLowerCase();
    return projects.filter(project => 
      project.name.toLowerCase().includes(query) ||
      project.description?.toLowerCase().includes(query)
    );
  }, [projects, projectSearchQuery]);

  // 处理聊天记录点击
  const handleChatClick = (e, chatId) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (chatId) {
      navigate(`/chats/${chatId}`);
    }
  };

  return (
    <div className="docs-container">
      {loading && <LoadingSpinner />}
      {/* 左侧项目列表 */}
      <div className="projects-sidebar">
        <div className="projects-header">
          <div className="header-title">
            <FiLayers className="header-icon" />
            <div className="title-content">
              <h2>Projects</h2>
              <p className="subtitle">管理和组织您的文档集合</p>
            </div>
          </div>
          <button 
            className="new-project-btn" 
            onClick={() => setIsCreating(true)}
            ref={newProjectBtnRef}
            title="创建新项目"
          >
            <FiPlus />
          </button>
        </div>

        <Popover 
          isOpen={isCreating}
          onClose={() => {
            setIsCreating(false);
            setNewProject({ name: '', description: '' });
          }}
          anchor={newProjectBtnRef}
          position="bottom-end"
        >
          <div className="create-project-popover">
            <h3>创建新项目</h3>
            <form onSubmit={handleCreateProject}>
              <div className="form-group">
                <label htmlFor="project-name">项目名称</label>
                <input
                  id="project-name"
                  type="text"
                  placeholder="输入项目名称"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label htmlFor="project-description">项目描述</label>
                <textarea
                  id="project-description"
                  placeholder="输入项目描述（可选）"
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="form-actions">
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => {
                    setIsCreating(false);
                    setNewProject({ name: '', description: '' });
                  }}
                >
                  取消
                </button>
                <button type="submit" className="create-btn">
                  创建
                </button>
              </div>
            </form>
          </div>
        </Popover>

        {editingProject && (
          <div className="create-project-form">
            <form onSubmit={updateProject}>
              <input
                type="text"
                placeholder="Project Name"
                value={editingProject.name}
                onChange={(e) => setEditingProject({ ...editingProject, name: e.target.value })}
              />
              <textarea
                placeholder="Project Description"
                value={editingProject.description}
                onChange={(e) => setEditingProject({ ...editingProject, description: e.target.value })}
              />
              <div className="form-actions">
                <button type="button" onClick={() => setEditingProject(null)}>Cancel</button>
                <button type="submit">Update</button>
              </div>
            </form>
          </div>
        )}

        <div className="projects-list">
          <div
            className={`project-item ${selectedProject === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedProject('all')}
          >
            <FiFolder className="project-icon" />
            <div className="project-info">
              <h3>全部文档</h3>
              <div className="project-meta">
                <span className="document-count">
                  {documents.length} 个文档
                </span>
              </div>
            </div>
            <FiArrowRight className="arrow-icon" />
          </div>

          {projects.map((project) => (
            <div
              key={project.id}
              className={`project-item ${selectedProject?.id === project.id ? 'active' : ''}`}
              onClick={() => setSelectedProject(project)}
            >
              <FiFolder className="project-icon" />
              <div className="project-info">
                <h3>{project.name}</h3>
                <div className="project-meta">
                  <span className="document-count">
                    {documents.filter(doc => doc.project_id === project.id).length} 个文档
                  </span>
                  <span className="project-date">
                    {new Date(project.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="project-actions">
                <button 
                  className="icon-button edit-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingProject(project);
                  }}
                >
                  <FiEdit2 />
                </button>
                <button 
                  className="icon-button delete-btn"
                  onClick={(e) => deleteProject(project.id, e)}
                >
                  <FiTrash2 />
                </button>
              </div>
              <FiArrowRight className="arrow-icon" />
            </div>
          ))}
        </div>
      </div>

      {/* 右侧文档列表 */}
      <div className="documents-content">
        <div className="documents-header">
          <div className="header-left">
            <h1>{selectedProject === 'all' ? '全部文档' : selectedProject.name}</h1>
            {selectedProject !== 'all' && (
              <p className="documents-description">{selectedProject.description}</p>
            )}
          </div>
          <div className="search-wrapper">
            <FiSearch className="search-icon" />
            <input
              type="text"
              className="doc-search-input"
              placeholder="搜索文档..."
              value={docSearchQuery}
              onChange={(e) => setDocSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="documents-grid">
          {filteredDocuments.length > 0 ? (
            filteredDocuments.map((doc) => (
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
                <div className="document-content">
                  {doc.content?.split('\n')[0]?.slice(0, 100)}...
                </div>
                <div className="document-meta">
                  <div className="document-tags">
                    <button 
                      className={`project-tag ${doc.project_id ? 'has-project' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowProjectMenu(showProjectMenu === doc.id ? null : doc.id);
                      }}
                      ref={el => menuButtonRefs.current[doc.id] = el}
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
                      <div className="project-menu-header">
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
                        {filteredProjectsList.length === 0 && (
                          <div className="no-results">
                            未找到匹配的项目
                          </div>
                        )}
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
            ))
          ) : (
            <div className="no-documents">
              <FiFileText className="empty-icon" />
              <p>未找到匹配的文档</p>
              {docSearchQuery && (
                <p className="search-tip">
                  尝试使用其他搜索关键词
                </p>
              )}
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
      />
    </div>
  );
}

export default Docs; 