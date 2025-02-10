import React, { useState, useEffect } from 'react';
import './Library.css';
import { FiHome, FiBox, FiClipboard, FiBarChart2, FiUsers, FiMap, FiLayers, FiFileText, FiCheckSquare, FiFlag, FiEdit, FiPlus, FiEdit2 } from 'react-icons/fi';
import { supabase } from '../../lib/supabase';
import LoadingSpinner from '../common/LoadingSpinner';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

function Library() {
  const [templates, setTemplates] = useState([]);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  const documentTypes = [
    {
      id: 1,
      title: "调研计划",
      description: "生成包含项目调研对象与目标分析、方法论及关键问题清单的调研计划",
      icon: FiClipboard,
      color: "#3B82F6"
    },
    {
      id: 2,
      title: "项目案例分析",
      description: "创建包含市场洞察和建议的商业案例分析或行业最佳实践分析",
      icon: FiBarChart2,
      color: "#10B981"
    },
    {
      id: 3,
      title: "调研报告",
      description: "将项目调研发现整理成结构清晰、见解深刻的完整调研报告",
      icon: FiFileText,
      color: "#6366F1"
    },
    {
      id: 4,
      title: "项目立项文档",
      description: "生成包含现状分析、目标、价值分析和高阶计划的项目立项文档",
      icon: FiFlag,
      color: "#F59E0B"
    },
    {
      id: 5,
      title: "用户旅程分析",
      description: "根据业务流程绘制和分析用户旅程，识别接触点和机会",
      icon: FiMap,
      color: "#EC4899"
    },
    {
      id: 6,
      title: "概念模型分析",
      description: "根据项目规划与目标，进行业务对象分析并绘制概念模型",
      icon: FiLayers,
      color: "#8B5CF6"
    },
    {
      id: 7,
      title: "项目需求文档",
      description: "编写详细的项目需求和规格说明文档",
      icon: FiBox,
      color: "#14B8A6"
    },
    {
      id: 8,
      title: "项目计划书",
      description: "创建包含里程碑和交付物的结构化项目计划",
      icon: FiUsers,
      color: "#F97316"
    },
    {
      id: 9,
      title: "结项报告",
      description: "生成全面的项目结项报告和评估文档",
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

      // 成功提示
      toast.success('提示词保存成功', {
        duration: 3000,
        position: 'top-center',
        style: {
          background: '#10B981',
          color: '#fff',
          borderRadius: '8px',
          padding: '12px 24px',
        },
      });
    } catch (error) {
      console.error('Error saving prompt:', error);
      // 错误提示
      toast.error('提示词保存失败，请重试', {
        duration: 3000,
        position: 'top-center',
        style: {
          background: '#EF4444',
          color: '#fff',
          borderRadius: '8px',
          padding: '12px 24px',
        },
      });
    }
  };

  const handleGenerate = async (doc) => {
    if (!doc.prompt) {
      toast.error('请先设置文档提示词模板', {
        duration: 3000,
        position: 'top-center',
        style: {
          background: '#EF4444',
          color: '#fff',
          borderRadius: '8px',
          padding: '12px 24px',
        },
      });
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
            template_prompt: doc.prompt,
            user_id: user.id
          }
        ])
        .select()
        .single();

      if (error) throw error;

      // 只创建一条初始消息
      const { error: messageError } = await supabase
        .from('messages')
        .insert([
          {
            chat_id: chat.id,
            role: 'user',
            content: '可以帮助我一起讨论分析我的项目吗？',
            user_id: user.id
          }
        ]);

      if (messageError) throw messageError;

      // 导航到新创建的 chat
      navigate(`/chats/${chat.id}`);
    } catch (error) {
      console.error('Error creating chat:', error);
      toast.error('创建对话失败，请重试');
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
                    <FiFileText />
                    <span>Generate</span>
                  </button>
                  <button 
                    className="edit-prompt-btn"
                    onClick={() => setEditingTemplate(doc)}
                  >
                    <FiEdit2 />
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