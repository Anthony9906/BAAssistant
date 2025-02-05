import React, { useState, useEffect } from 'react';
import './Docs.css';
import { FiFolder, FiArrowRight, FiPlus, FiEdit2, FiTrash2, FiBox } from 'react-icons/fi';
import { supabase } from '../../lib/supabase';

function Docs() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(true);
  const [editingProject, setEditingProject] = useState(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const createProject = async (e) => {
    e.preventDefault();
    if (!newProject.name.trim()) return;

    try {
      const { data, error } = await supabase
        .from('projects')
        .insert([
          {
            name: newProject.name,
            description: newProject.description,
          },
        ])
        .select();

      if (error) throw error;

      setProjects([...projects, data[0]]);
      setNewProject({ name: '', description: '' });
      setIsCreating(false);
    } catch (error) {
      console.error('Error creating project:', error);
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

  return (
    <div className="docs-container">
      {/* 左侧项目列表 */}
      <div className="projects-sidebar">
        <div className="projects-header">
          <h2>Projects</h2>
          <button className="new-project-btn" onClick={() => setIsCreating(true)}>
            <FiPlus />
          </button>
        </div>

        {isCreating && (
          <div className="create-project-form">
            <form onSubmit={createProject}>
              <input
                type="text"
                placeholder="Project Name"
                value={newProject.name}
                onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
              />
              <textarea
                placeholder="Project Description"
                value={newProject.description}
                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
              />
              <div className="form-actions">
                <button type="button" onClick={() => setIsCreating(false)}>Cancel</button>
                <button type="submit">Create</button>
              </div>
            </form>
          </div>
        )}

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
          {loading ? (
            <div className="loading">Loading projects...</div>
          ) : (
            projects.map((project) => (
              <div
                key={project.id}
                className={`project-item ${selectedProject?.id === project.id ? 'active' : ''}`}
                onClick={() => setSelectedProject(project)}
              >
                <FiBox className="project-icon" />
                <div className="project-info">
                  <h3>{project.name}</h3>
                  <div className="project-meta">
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
            ))
          )}
        </div>
      </div>

      {/* 右侧文档列表 */}
      <div className="documents-content">
        {selectedProject ? (
          <>
            <div className="documents-header">
              <h1>{selectedProject.name}</h1>
              <p className="documents-description">{selectedProject.description}</p>
            </div>
            <div className="documents-list">
              {/* 这里将来显示选中项目的文档列表 */}
              <div className="document-card">
                <h3>Ultricies mi quis hendrerit dolor magna eget</h3>
                <p>Elementum integer enim neque volutpat ac imperdiet massa tincidunt nuncol</p>
                <div className="document-meta">
                  <div className="meta-left">
                    <span className="likes">13.9K</span>
                    <span className="date">Jan 20, 2024</span>
                    <span className="author">User</span>
                  </div>
                  <div className="meta-right">
                    <button className="share-btn">Share</button>
                    <button className="more-btn">•••</button>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="no-selection">
            <p>Select a project to view its documents</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Docs; 