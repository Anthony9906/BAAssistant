import React, { useRef, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
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
  documentId
}) {
  const editorRef = useRef(null);
  const editorInstanceRef = useRef(null);
  const previewRef = useRef(null);
  const [previewContent, setPreviewContent] = React.useState('');
  const [streamContent, setStreamContent] = React.useState('');

  // 初始化编辑器
  useEffect(() => {
    if (show && editorRef.current && !isGenerating && !editorInstanceRef.current) {
      try {
        editorInstanceRef.current = new AiEditor({
          element: editorRef.current,
          placeholder: "文档内容将在这里生成...",
          height: '100%',
          markdown: true,
          contentIsMarkdown: true,
          draggable: true,
          pasteAsText: false,
          onChange: () => {
            if (editorInstanceRef.current) {
              const content = editorInstanceRef.current.getMarkdown();
              setPreviewContent(content);
            }
          }
        });

        // 设置初始内容
        if (initialContent) {
          editorInstanceRef.current.setMarkdownContent(initialContent);
          setPreviewContent(initialContent);
        }
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

  // 监听生成状态变化，在生成完成后初始化编辑器
  useEffect(() => {
    if (!isGenerating && initialContent && show) {
      // 确保先销毁旧的编辑器实例
      if (editorInstanceRef.current) {
        editorInstanceRef.current.destroy();
        editorInstanceRef.current = null;
      }

      // 短暂延时后初始化新的编辑器
      setTimeout(() => {
        if (editorRef.current && !editorInstanceRef.current) {
          try {
            editorInstanceRef.current = new AiEditor({
              element: editorRef.current,
              placeholder: "文档内容将在这里生成...",
              height: '100%',
              markdown: true,
              contentIsMarkdown: true,
              draggable: true,
              pasteAsText: false,
              onChange: () => {
                if (editorInstanceRef.current) {
                  const content = editorInstanceRef.current.getMarkdown();
                  setPreviewContent(content);
                }
              }
            });

            editorInstanceRef.current.setMarkdownContent(initialContent);
            setPreviewContent(initialContent);
          } catch (error) {
            console.error('Error initializing editor:', error);
          }
        }
      }, 100);
    }
  }, [isGenerating, show, initialContent]);

  // 同步滚动处理
  useEffect(() => {
    const editorElement = editorRef.current?.querySelector('.aie-content');
    const previewElement = previewRef.current;

    const handleEditorScroll = () => {
      if (editorElement && previewElement) {
        const percentage = editorElement.scrollTop / (editorElement.scrollHeight - editorElement.clientHeight);
        previewElement.scrollTop = percentage * (previewElement.scrollHeight - previewElement.clientHeight);
      }
    };

    const handlePreviewScroll = () => {
      if (editorElement && previewElement) {
        const percentage = previewElement.scrollTop / (previewElement.scrollHeight - previewElement.clientHeight);
        editorElement.scrollTop = percentage * (editorElement.scrollHeight - editorElement.clientHeight);
      }
    };

    if (editorElement) {
      editorElement.addEventListener('scroll', handleEditorScroll);
    }
    if (previewElement) {
      previewElement.addEventListener('scroll', handlePreviewScroll);
    }

    return () => {
      if (editorElement) {
        editorElement.removeEventListener('scroll', handleEditorScroll);
      }
      if (previewElement) {
        previewElement.removeEventListener('scroll', handlePreviewScroll);
      }
    };
  }, [show]);

  // 监听流式内容更新
  useEffect(() => {
    if (isGenerating && initialContent) {
      setStreamContent(initialContent);
    }
  }, [isGenerating, initialContent]);

  const handleSave = async () => {
    let content;
    if (isGenerating) {
      content = streamContent;
    } else if (!editorInstanceRef.current) {
      toast.error('编辑器未初始化');
      return;
    } else {
      content = editorInstanceRef.current.getMarkdown();
    }

    try {
      if (documentId) {
        // 更新已有文档
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
        // 创建新文档
        const docTitle = content.split('\n')[0].slice(0, 20) + '...';
        const { data, error } = await supabase
          .from('docs')
          .insert([
            {
              title: docTitle,
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

      onClose(); // 保存成功后关闭弹窗
    } catch (error) {
      console.error('Error saving document:', error);
      toast.error(documentId ? '更新文档失败' : '保存文档失败');
    }
  };

  if (!show) return null;

  return (
    <div className="preview-modal">
      <div className="preview-content">
        <div className="preview-header">
          <h3>{title}</h3>
          <div className="preview-header-actions">
            <button 
              className="save-doc-button"
              onClick={handleSave}
              disabled={isGenerating}
            >
              Save Doc
            </button>
            <button 
              className="close-button"
              onClick={onClose}
            >
              <FiX />
            </button>
          </div>
        </div>
        <div className="split-view">
          {/* 左侧编辑区 */}
          <div className="editor-section">
            {isGenerating ? (
              <div className="stream-content">
                <ReactMarkdown>
                  {streamContent}
                </ReactMarkdown>
              </div>
            ) : (
              <div 
                ref={editorRef} 
                className="editor-container"
              />
            )}
          </div>

          {/* 右侧预览区 */}
          <div className="preview-section">
            <div className="preview-header-small">
              <h4>预览</h4>
            </div>
            <div 
              ref={previewRef} 
              className="markdown-preview"
            >
              <ReactMarkdown>
                {isGenerating ? streamContent : previewContent}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DocumentPreview; 