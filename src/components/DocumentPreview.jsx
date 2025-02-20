import React, { useRef, useEffect, useState, useCallback } from 'react';
import { FiX, FiEdit2, FiSave, FiMessageSquare, FiFolder, FiTrash2 } from 'react-icons/fi';
import { AiEditor } from "aieditor";
import ReactMarkdown from 'react-markdown';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import './DocumentPreview.css';

function DocumentPreview({ 
  show, 
  onClose, 
  title,
  initialContent,
  isGenerating = false,
  generatePrompt,
  chatId,
  chatTitle,
  user,
  documentId,
  onDocumentUpdate
}) {
  const editorRef = useRef(null);
  const editorInstanceRef = useRef(null);
  const [streamContent, setStreamContent] = useState('');
  const [editableTitle, setEditableTitle] = useState(title ?? '');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const titleInputRef = useRef(null);
  const contentRef = useRef(null);
  const streamContentRef = useRef(null);
  const [isSaving, setIsSaving] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [projects, setProjects] = useState([]);
  const [showProjectMenu, setShowProjectMenu] = useState(false);
  const [projectId, setProjectId] = useState(null);
  const [projectName, setProjectName] = useState("未关联项目");

  useEffect(() => {
    if (title) {
      setEditableTitle(title);
    }
  }, [title]);

  // 优化滚动函数
  const scrollToBottom = useCallback(() => {
    if (streamContentRef.current) {
      const { scrollHeight, clientHeight } = streamContentRef.current;
      streamContentRef.current.scrollTo({
        top: scrollHeight - clientHeight,
        behavior: 'smooth'
      });
    }
  }, []);

  // 使用 ResizeObserver 监听内容高度变化
  useEffect(() => {
    if (isGenerating && streamContentRef.current) {
      const resizeObserver = new ResizeObserver(() => {
        scrollToBottom();
      });

      resizeObserver.observe(streamContentRef.current);

      return () => {
        resizeObserver.disconnect();
      };
    }
  }, [isGenerating, scrollToBottom]);

  // 监听流式内容更新
  useEffect(() => {
    if (isGenerating && streamContent) {
      scrollToBottom();
    }
  }, [streamContent, isGenerating, scrollToBottom]);

  // 添加标题处理的通用函数
  const processDocumentTitle = (content) => {
    const lines = content.split('\n');
    return lines[0]
      .replace(/^[#\s]+/, '')         // 移除开头的 # 和空格
      .replace(/[*_`~]/g, '')         // 移除 markdown 格式字符
      .replace(/<[^>]+>/g, '')        // 移除 HTML 标签
      .replace(/\[([^\]]+)\](\([^)]+\))?/g, '$1')  // 提取链接文本
      .replace(/markdown/gi, '')      // 移除 'markdown' 字符串（不区分大小写）
      .trim();
  };

  // 修改标题设置的 useEffect
  useEffect(() => {
    if (!isGenerating && initialContent && !documentId) {  // 只在新文档生成时处理标题
      const processedTitle = processDocumentTitle(initialContent);
      if (processedTitle) {
        setEditableTitle(processedTitle);
      }
    }
  }, [isGenerating, initialContent, documentId]);

  // 初始化编辑器
  useEffect(() => {
    if (!isGenerating && show && editorRef.current && !editorInstanceRef.current) {
      try {
        // 确保先销毁旧的编辑器实例
        if (editorInstanceRef.current) {
          editorInstanceRef.current.destroy();
          editorInstanceRef.current = null;
        }

        // 短暂延时后初始化新的编辑器
        setTimeout(() => {
          if (editorRef.current && !editorInstanceRef.current) {
            editorInstanceRef.current = new AiEditor({
              element: editorRef.current,
              placeholder: "文档内容将在这里生成...",
              height: '100%',
              markdown: true,
              contentIsMarkdown: true,
              draggable: true,
              pasteAsText: false,
              ai: {
                models: {
                  openai: {
                    apiKey: import.meta.env.VITE_OPENAI_API_KEY_OPENROUTER,
                    model: 'openai/gpt-4o-mini',
                    max_tokens: 8000,
                    customUrl: import.meta.env.VITE_OPENAI_BASE_URL_OPENROUTER+"/chat/completions"
                  }
                },
                menus:[
                  {
                      icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M15 18H16.5C17.8807 18 19 16.8807 19 15.5C19 14.1193 17.8807 13 16.5 13H3V11H16.5C18.9853 11 21 13.0147 21 15.5C21 17.9853 18.9853 20 16.5 20H15V22L11 19L15 16V18ZM3 4H21V6H3V4ZM9 18V20H3V18H9Z"></path></svg>`,
                      name: "AI 文档续写",
                      prompt: "请根据这段话的内容，帮我继续扩展分析，扩展的内容需要具有很强的相关性，并且逻辑清晰，最好采用列表形式逐一说明",
                      text: "focusBefore",
                      model:"auto",
                  },
                  {
                      icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M17.0007 1.20825 18.3195 3.68108 20.7923 4.99992 18.3195 6.31876 17.0007 8.79159 15.6818 6.31876 13.209 4.99992 15.6818 3.68108 17.0007 1.20825ZM10.6673 9.33325 15.6673 11.9999 10.6673 14.6666 8.00065 19.6666 5.33398 14.6666.333984 11.9999 5.33398 9.33325 8.00065 4.33325 10.6673 9.33325ZM11.4173 11.9999 9.18905 10.8115 8.00065 8.58325 6.81224 10.8115 4.58398 11.9999 6.81224 13.1883 8.00065 15.4166 9.18905 13.1883 11.4173 11.9999ZM19.6673 16.3333 18.0007 13.2083 16.334 16.3333 13.209 17.9999 16.334 19.6666 18.0007 22.7916 19.6673 19.6666 22.7923 17.9999 19.6673 16.3333Z"></path></svg>`,
                      name: "AI 内容优化",
                      prompt: "请帮我优化一下这段文档文字的内容，内容为：{content}，让它更专业和准确，并且符合项目文档的格式规范，直接返回结果",
                      text: "selected",
                      model:"auto",
                  },
                  {
                      icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 5C13.567 5 12 6.567 12 8.5C12 10.433 13.567 12 15.5 12C17.433 12 19 10.433 19 8.5C19 6.567 17.433 5 15.5 5ZM10 8.5C10 5.46243 12.4624 3 15.5 3C18.5376 3 21 5.46243 21 8.5C21 9.6575 20.6424 10.7315 20.0317 11.6175L22.7071 14.2929L21.2929 15.7071L18.6175 13.0317C17.7315 13.6424 16.6575 14 15.5 14C12.4624 14 10 11.5376 10 8.5ZM3 4H8V6H3V4ZM3 11H8V13H3V11ZM21 18V20H3V18H21Z"></path></svg>`,
                      name: "AI 格式优化",
                      prompt: "根据这段内容上下文的排版，帮我优化这段文档内容的排版，内容为：{content}，让标题、副标题、段落、列表、表格等内容与上下文排版结构一致，结构层次清晰、容易阅读，直接返回结果",
                      text: "selected",
                      model:"auto",
                  },
                  {
                      icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M19.7134 8.12811L19.4668 8.69379C19.2864 9.10792 18.7136 9.10792 18.5331 8.69379L18.2866 8.12811C17.8471 7.11947 17.0555 6.31641 16.0677 5.87708L15.308 5.53922C14.8973 5.35653 14.8973 4.75881 15.308 4.57612L16.0252 4.25714C17.0384 3.80651 17.8442 2.97373 18.2761 1.93083L18.5293 1.31953C18.7058 0.893489 19.2942 0.893489 19.4706 1.31953L19.7238 1.93083C20.1558 2.97373 20.9616 3.80651 21.9748 4.25714L22.6919 4.57612C23.1027 4.75881 23.1027 5.35653 22.6919 5.53922L21.9323 5.87708C20.9445 6.31641 20.1529 7.11947 19.7134 8.12811ZM5 17V15H3V17C3 19.2091 4.79086 21 7 21H10V19H7L6.85074 18.9945C5.81588 18.9182 5 18.0544 5 17ZM22.4 21L18 10H16L11.601 21H13.755L14.954 18H19.044L20.245 21H22.4ZM15.753 16L17 12.8852L18.245 16H15.753ZM8 4V2H6V4H2V11H6V14H8V11H12V4H8ZM4 6H6V9H4V6ZM8 6H10V9H8V6Z"></path></svg>`,
                      name: "AI 智能翻译",
                      prompt: "请帮我翻译这段内容，内容为：{content}，在翻译之前，先判断一下内容是不是中文，如果是中文，则翻译成英文，如果是其他语言，则需要翻译为中文，注意，你只需要返回翻译的结果，不需要对此进行任何解释，不需要返回翻译结果以外的其他任何内容。",
                      text: "selected",
                      model:"auto",
                  },
              ],
              bubblePanelMenus:[
                {
                    prompt: `<content>{content}</content>\n请帮我简化这段内容，只保留关键内容，并确保核心含义保持不变，直接返回结果。`,
                    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 12 18.4497 7.05029 19.864 8.46451 17.3284 11H23V13H17.3284L19.8615 15.5331 18.4473 16.9473 13.5 12ZM1 13H6.67084L4.13584 15.535 5.55005 16.9493 10.5 11.9996 5.55025 7.0498 4.13604 8.46402 6.67206 11H1V13Z"></path></svg>`,
                    title: 'Make Shorter',
                },
                {
                    prompt: `<content>{content}</content>\n请帮我丰富这段内容，对关键内容进行更深入的分析与说明，也可以添加合适的相关性内容，直接返回结果。`,
                    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M2 3H22V5H2V3ZM4 7H20V9H4V7ZM8 11H22V13H8V11ZM10 15H18V17H10V15ZM8 19H14V21H8V19Z"></path></svg>`,
                    title: 'Make Longer',
                },
              ],
              commands:[
                
              ],
              }
            });

            // 设置初始内容
            if (initialContent) {
              editorInstanceRef.current.setMarkdownContent(initialContent);
            }
          }
        }, 100);
      } catch (error) {
        console.error('Error initializing editor:', error);
      }
    }

    return () => {
      if (editorInstanceRef.current) {
        editorInstanceRef.current.destroy();
        editorInstanceRef.current = null;
      }
    };
  }, [show, isGenerating, initialContent]);

  // 修改监听流式内容更新的 useEffect
  useEffect(() => {
    if (isGenerating && initialContent) {
      setStreamContent(initialContent);
      
      // 只在新文档生成时更新标题
      if (!documentId) {
        const processedTitle = processDocumentTitle(initialContent);
        if (processedTitle) {
          setEditableTitle(processedTitle);
        }
      }
    }
  }, [isGenerating, initialContent, documentId]);

  // 当进入编辑模式时自动聚焦输入框
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [isEditingTitle]);

  // 处理标题更新
  const handleTitleUpdate = async () => {
    if (editableTitle.trim() === '') {
      setEditableTitle(title);
      setIsEditingTitle(false);
      return;
    }

    // 如果没有 documentId，说明是新文档，直接更新本地状态
    if (!documentId) {
      setIsEditingTitle(false);
      return;
    }

    try {
      const { error } = await supabase
        .from('docs')
        .update({ title: editableTitle })
        .eq('id', documentId);

      if (error) throw error;
      setIsEditingTitle(false);
      toast.success('标题更新成功');
    } catch (error) {
      console.error('Error updating title:', error);
      toast.error('更新标题失败');
      setEditableTitle(title);
    }
  };

  // 处理按键事件
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleTitleUpdate();
    } else if (e.key === 'Escape') {
      setEditableTitle(title);
      setIsEditingTitle(false);
    }
  };

  const handleSave = async () => {
    // 检查标题是否为空
    if (!editableTitle || editableTitle.trim().length === 0) {
      toast.error('文档标题为空，请先编辑文档标题');
      setIsSaving(false);
      return;
    }

    setIsSaving(true);
    let content;
    if (isGenerating) {
      content = streamContent;
    } else if (!editorInstanceRef.current) {
      toast.error('编辑器未初始化');
      setIsSaving(false);
      return;
    } else {
      content = editorInstanceRef.current.getMarkdown();
    }

    try {
      if (documentId) {
        const { data, error } = await supabase
          .from('docs')
          .update({
            content,
            updated_at: new Date().toISOString()
          })
          .eq('id', documentId)
          .select()
          .single();

        if (error) throw error;
        toast.success('文档更新成功');
      } else {
        const { data, error } = await supabase
          .from('docs')
          .insert([
            {
              title: editableTitle.trim(),
              content,
              generate_prompt: generatePrompt,
              chat_id: chatId,
              user_id: user.id,
              doc_type_name: chatTitle
            }
          ])
          .select()
          .single();

        if (error) throw error;
        toast.success('文档保存成功');
      }
      
      // 保存成功后调用回调函数更新文档列表
      if (onDocumentUpdate) {
        await onDocumentUpdate();
      }
    } catch (error) {
      console.error('Error saving document:', error);
      toast.error(documentId ? '更新文档失败' : '保存文档失败');
    } finally {
      setIsSaving(false);
    }
  };

  // 获取消息数量
  useEffect(() => {
    const fetchMessageCount = async () => {
      if (chatId) {
        try {
          const { data, error } = await supabase
            .from('messages')
            .select('id', { count: 'exact' })
            .eq('chat_id', chatId);

          if (error) throw error;
          setMessageCount(data.length);
        } catch (error) {
          console.error('Error fetching message count:', error);
        }
      }
    };

    fetchMessageCount();
  }, [chatId]);

  // 处理聊天记录点击
  const handleChatClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (chatId && messageCount > 0) {
      window.location.href = `/chats/${chatId}`;
    }
  };

  // 获取项目列表和当前文档的项目信息
  useEffect(() => {
    const fetchProjectData = async () => {
      if (!documentId) return;
      
      try {
        // 获取所有项目
        const { data: projectsData, error: projectsError } = await supabase
          .from('projects')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (projectsError) throw projectsError;
        setProjects(projectsData);

        // 获取当前文档的项目 ID
        const { data: docData, error: docError } = await supabase
          .from('docs')
          .select('project_id')
          .eq('id', documentId)
          .single();

        if (docError) throw docError;
        setProjectId(docData.project_id);

        // 设置项目名称
        if (docData.project_id) {
          const project = projectsData.find(p => p.id === docData.project_id);
          setProjectName(project ? project.name : "未关联项目");
        }
      } catch (error) {
        console.error('Error fetching project data:', error);
      }
    };

    fetchProjectData();
  }, [documentId, user?.id]);

  // 处理项目关联
  const handleAssignToProject = async (newProjectId) => {
    try {
      const { error } = await supabase
        .from('docs')
        .update({ project_id: newProjectId })
        .eq('id', documentId);

      if (error) throw error;
      
      setProjectId(newProjectId);
      const project = projects.find(p => p.id === newProjectId);
      setProjectName(project ? project.name : "未关联项目");
      toast.success('已关联到项目');
    } catch (error) {
      console.error('Error assigning document to project:', error);
      toast.error('关联项目失败');
    } finally {
      setShowProjectMenu(false);
    }
  };

  // 处理文档删除
  const handleDelete = async () => {
    if (!documentId) return;

    const confirmed = window.confirm('确定要删除此文档吗？文档删除后将无法恢复。');
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('docs')
        .delete()
        .eq('id', documentId);

      if (error) throw error;
      
      toast.success('文档已删除');
      if (onDocumentUpdate) {
        await onDocumentUpdate();
      }
      onClose();
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('删除文档失败');
    }
  };

  if (!show) return null;

  return (
    <div className="preview-modal">
      <div className="preview-content">
        <div className="preview-header">
          <div className="title-section">
            <div className="preview-doc-type-tag">
              {chatTitle || "Document"}
            </div>
            <button 
              className="chat-count-tag"
              onClick={handleChatClick}
              title={messageCount > 0 ? "查看关联的聊天记录" : "暂无聊天记录"}
              disabled={!chatId || messageCount === 0}
            >
              <FiMessageSquare className="tag-icon" />
              <span>{messageCount}</span>
            </button>
            <button 
              className="edit-title-button"
              onClick={() => setIsEditingTitle(true)}
              title="编辑标题"
            >
              <FiEdit2 />
            </button>
            {isEditingTitle ? (
              <div className="title-edit-container">
                <input
                  ref={titleInputRef}
                  type="text"
                  className="title-input"
                  value={editableTitle}
                  onChange={(e) => setEditableTitle(e.target.value)}
                  onBlur={(e) => {
                    if (!e.relatedTarget?.classList.contains('save-title-button')) {
                      handleTitleUpdate();
                    }
                  }}
                  onKeyDown={handleKeyDown}
                  maxLength={30}
                />
                <button 
                  className="save-title-button"
                  onClick={handleTitleUpdate}
                >
                  保存
                </button>
              </div>
            ) : (
              <h3>{isGenerating && !documentId ? '生成文档中...' : editableTitle}</h3>
            )}
          </div>
          <div className="preview-header-actions">
            {documentId && (
              <button 
                className="delete-doc-button"
                onClick={handleDelete}
                title="删除文档"
              >
                <FiTrash2 />
              </button>
            )}
            <button 
              className="save-doc-button"
              onClick={handleSave}
              disabled={isGenerating || isSaving}
            >
              <FiSave />
              {isSaving ? '保存中...' : 'Save Doc'}
            </button>
            <button 
              className="close-button"
              onClick={onClose}
            >
              <FiX />
            </button>
          </div>
        </div>
        <div className="preview-document-meta">
          <div className="preview-document-tags">
            <div className="preview-doc-type-tag">
              {chatTitle || "Document"}
            </div>
          </div>
        </div>
        <div className="editor-section" ref={contentRef}>
          {isGenerating ? (
            <div className="stream-content" ref={streamContentRef}>
              {streamContent ? (
                <ReactMarkdown>
                  {streamContent}
                </ReactMarkdown>
              ) : (
                <div className="generating-indicator">
                  <div className="loading-spinner-container">
                    <div className="loading-spinner-circle"></div>
                  </div>
                  <p>AI 正在生成文档内容...</p>
                </div>
              )}
            </div>
          ) : (
            <div 
              ref={editorRef} 
              className="editor-container"
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default DocumentPreview; 