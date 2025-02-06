import React, { useState, useEffect } from 'react';
import './Library.css';
import { FiHome, FiBox, FiClipboard, FiBarChart2, FiUsers, FiMap, FiLayers, FiFileText, FiCheckSquare, FiFlag, FiEdit } from 'react-icons/fi';
import { supabase } from '../../lib/supabase';
import LoadingSpinner from '../common/LoadingSpinner';
import { useNavigate } from 'react-router-dom';

function Library() {
  const [templates, setTemplates] = useState([]);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const documentTypes = [
    {
      id: 1,
      title: "Research Plan",
      description: "Generate comprehensive research plans with objectives, methodologies, and timelines",
      icon: FiClipboard,
      color: "#3B82F6"
    },
    {
      id: 2,
      title: "Business Case Analysis",
      description: "Create detailed analysis of business cases with market insights and recommendations",
      icon: FiBarChart2,
      color: "#10B981"
    },
    {
      id: 3,
      title: "Research Report",
      description: "Compile research findings into well-structured and insightful reports",
      icon: FiFileText,
      color: "#6366F1"
    },
    {
      id: 4,
      title: "Project Initiation",
      description: "Generate project initiation documents with scope, objectives, and success criteria",
      icon: FiFlag,
      color: "#F59E0B"
    },
    {
      id: 5,
      title: "User Journey Analysis",
      description: "Map and analyze user journeys to identify touchpoints and opportunities",
      icon: FiMap,
      color: "#EC4899"
    },
    {
      id: 6,
      title: "Business Model Analysis",
      description: "Analyze business models with comprehensive market and competitive insights",
      icon: FiLayers,
      color: "#8B5CF6"
    },
    {
      id: 7,
      title: "Project Requirements",
      description: "Document detailed project requirements and specifications",
      icon: FiBox,
      color: "#14B8A6"
    },
    {
      id: 8,
      title: "Project Plan",
      description: "Create structured project plans with milestones and deliverables",
      icon: FiUsers,
      color: "#F97316"
    },
    {
      id: 9,
      title: "Project Closure Report",
      description: "Generate comprehensive project closure reports and evaluations",
      icon: FiCheckSquare,
      color: "#6B7280"
    }
  ];

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('document_templates')
        .select('*');

      if (error) throw error;

      // 将模板数据与文档类型合并
      const mergedTemplates = documentTypes.map(doc => {
        const template = data?.find(t => t.type_id === doc.id);
        return {
          ...doc,
          prompt: template?.prompt || ''
        };
      });

      setTemplates(mergedTemplates);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePrompt = async (typeId, prompt) => {
    try {
      const { data, error } = await supabase
        .from('document_templates')
        .upsert({
          type_id: typeId,
          prompt: prompt,
          title: templates.find(t => t.id === typeId)?.title || '',
          description: templates.find(t => t.id === typeId)?.description || ''
        })
        .select();

      if (error) throw error;

      setTemplates(templates.map(template => 
        template.id === typeId ? { ...template, prompt } : template
      ));
      setEditingTemplate(null);
    } catch (error) {
      console.error('Error saving prompt:', error);
    }
  };

  const handleGenerate = async (doc) => {
    if (!doc.prompt) {
      alert('Please set the prompt template for this document type first.');
      setEditingTemplate(doc);
      return;
    }

    try {
      // 创建新的 chat
      const { data: chat, error } = await supabase
        .from('chats')
        .insert([
          {
            title: `Generate ${doc.title}`,
            template_id: doc.id,
            template_prompt: doc.prompt
          }
        ])
        .select()
        .single();

      if (error) throw error;

      // 创建第一条系统消息
      await supabase
        .from('messages')
        .insert([
          {
            chat_id: chat.id,
            role: 'user',
            content: 'Can you help to generate my Docs?'
          }
        ]);

      // 导航到新创建的 chat
      navigate(`/chats/${chat.id}`);
    } catch (error) {
      console.error('Error creating chat:', error);
    }
  };

  return (
    <div className="library-container">
      {loading && <LoadingSpinner />}
      <div className="library-header">
        <h1>Document Generator</h1>
        <p className="library-subtitle">
          Create professional documents with AI-powered templates and insights
        </p>
        
        <div className="library-tabs">
          <button className="tab-item active">
            <FiHome className="tab-icon" />
            Home
          </button>
          <button className="tab-item">
            <FiBox className="tab-icon" />
            Generator
          </button>
        </div>
      </div>

      <div className="docs-generator">
        <div className="section-header">
          <h2>Document Templates</h2>
          <button className="view-all">View all</button>
        </div>

        <div className="docs-grid">
          {templates.map((doc) => {
            const IconComponent = doc.icon;
            return (
              <div key={doc.id} className="doc-card">
                <div className="doc-icon" style={{ backgroundColor: `${doc.color}15` }}>
                  <IconComponent style={{ color: doc.color }} />
                </div>
                <h3>{doc.title}</h3>
                <p className="doc-description">{doc.description}</p>
                <div className="card-footer">
                  <button 
                    className="generate-btn"
                    onClick={() => handleGenerate(doc)}
                  >
                    Generate
                  </button>
                  <button 
                    className="edit-prompt-btn"
                    onClick={() => setEditingTemplate(doc)}
                  >
                    <FiEdit />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 提示词编辑弹窗 */}
      {editingTemplate && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Edit Template Prompt</h2>
            <h3>{editingTemplate.title}</h3>
            <textarea
              className="prompt-editor"
              value={editingTemplate.prompt}
              onChange={(e) => setEditingTemplate({
                ...editingTemplate,
                prompt: e.target.value
              })}
              placeholder="Enter the prompt template for this document type..."
            />
            <div className="modal-actions">
              <button 
                className="cancel-btn"
                onClick={() => setEditingTemplate(null)}
              >
                Cancel
              </button>
              <button 
                className="save-btn"
                onClick={() => savePrompt(editingTemplate.id, editingTemplate.prompt)}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Library; 