import React, { useState, useEffect } from 'react';
import './Library.css';
import { FiHome, FiBox, FiBarChart2, FiUsers, FiMap, FiLayers, FiFileText, FiCheckSquare, FiFlag, FiEdit, FiPlus, FiEdit2, FiMessageSquare, FiBook } from 'react-icons/fi';
import { Sparkles } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import LoadingSpinner from '../common/LoadingSpinner';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { DocumentDefinitions } from '../../data/DocumentDefinitions'; 

function Library() {
  const [templates, setTemplates] = useState([]);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  const documentTypes = DocumentDefinitions;

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
          chat_prompt: template?.chat_prompt || '',
          generate_prompt: template?.generate_prompt || ''
        };
      });

      setTemplates(mergedTemplates);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('加载模板失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const savePrompt = async (typeId, chatPrompt, generatePrompt) => {
    try {
      // 先检查是否已存在记录
      const { data: existingTemplate, error: checkError } = await supabase
        .from('document_templates')
        .select('*')
        .eq('type_id', typeId)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 是"没有找到记录"的错误
        throw checkError;
      }

      // 根据是否存在记录决定使用 update 还是 insert
      const { data, error } = await supabase
        .from('document_templates')
        [existingTemplate ? 'update' : 'insert']({
          type_id: typeId,
          chat_prompt: chatPrompt,
          generate_prompt: generatePrompt,
          title: templates.find(t => t.id === typeId)?.title || '',
          title_en: templates.find(t => t.id === typeId)?.title_en || '',
          description: templates.find(t => t.id === typeId)?.description || ''
        })
        .eq(existingTemplate ? 'type_id' : '', typeId) // 如果是更新操作才添加条件
        .select();

      if (error) throw error;

      setTemplates(templates.map(template => 
        template.id === typeId 
          ? { ...template, chat_prompt: chatPrompt, generate_prompt: generatePrompt } 
          : template
      ));
      setEditingTemplate(null);

      toast.success('Prompt saved successfully', {
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
      console.error('Error saving prompts:', error);
      toast.error('Failed to save prompts, please try again', {
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
    if (!doc.chat_prompt || !doc.generate_prompt) {
      toast.error('请先设置文档的提示词', {
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
      // 从 localStorage 获取当前模型，默认值改为 'gemini-2.0-flash'
      const currentModel = localStorage.getItem('selectedModel') || 'google/gemini-2.0-flash';

      // 创建新的 chat
      const { data: chat, error: chatError } = await supabase
        .from('chats')
        .insert([{
          title: doc.title_en,
          template_id: doc.id,
          chat_prompt: doc.chat_prompt,
          generate_prompt: doc.generate_prompt,
          user_id: user.id
        }])
        .select()
        .single();

      if (chatError) throw chatError;

      // 直接跳转到新会话
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
              <div key={doc.id} className={`doc-card`} style={{backgroundImage: `linear-gradient(to bottom, #fff, ${doc.color}15)`}}>
                <div className="doc-icon" style={{ backgroundColor: `${doc.color}15` }}>
                  <IconComponent style={{ color: doc.color }} />
                </div>
                <h3>{doc.title}</h3>
                <div className="doc-title-en" style={{color: `${doc.color}90`}}>{doc.title_en}</div>
                <p className="doc-description">{doc.description}</p>
                <div className="card-footer">
                  <button 
                    className="generate-btn"
                    onClick={() => handleGenerate(doc)}
                  >
                    <Sparkles size={16} />
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
          <div className="doc-modal-content">
            <h2>Edit Template Prompts</h2>
            <h3>{editingTemplate.title}</h3>
            
            <div className="prompt-section">
              <div className="prompt-label">
                <FiMessageSquare className="prompt-icon" />
                <label htmlFor="chatPrompt">Chat Prompt</label>
              </div>
              <textarea
                id="chatPrompt"
                className="prompt-editor"
                value={editingTemplate.chat_prompt}
                onChange={(e) => setEditingTemplate({
                  ...editingTemplate,
                  chat_prompt: e.target.value
                })}
                placeholder="Enter the chat prompt template for this document type..."
              />
            </div>

            <div className="prompt-section">
              <div className="prompt-label">
                <FiFileText className="prompt-icon" />
                <label htmlFor="generatePrompt">Generate Prompt</label>
              </div>
              <textarea
                id="generatePrompt"
                className="prompt-editor"
                value={editingTemplate.generate_prompt}
                onChange={(e) => setEditingTemplate({
                  ...editingTemplate,
                  generate_prompt: e.target.value
                })}
                placeholder="Enter the generate prompt template for this document type..."
              />
            </div>

            <div className="modal-actions">
              <button 
                className="cancel-btn"
                onClick={() => setEditingTemplate(null)}
              >
                Cancel
              </button>
              <button 
                className="save-btn"
                onClick={() => savePrompt(editingTemplate.id, editingTemplate.chat_prompt, editingTemplate.generate_prompt)}
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