import React, { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import './SettingsModal.css';

const MODEL_INFO = {
  'deepseek-r1': {
    name: 'DeepSeek R1',
    description: 'Specialized in code analysis and technical documentation'
  },
  'gpt-4o': {
    name: 'GPT-4O',
    description: 'Excels at natural language and complex reasoning tasks'
  }
};

function SettingsModal({ isOpen, onClose }) {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    models: {
      'deepseek-r1': true,
      'gpt-4o': true
    }
  });

  useEffect(() => {
    if (isOpen) {
      fetchSettings();
    }
  }, [isOpen, user]);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // 如果没有找到设置，使用默认值
          await saveSettings(settings);
        } else {
          throw error;
        }
      }

      if (data) {
        setSettings(data.settings);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load settings');
    }
  };

  const saveSettings = async (newSettings) => {
    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          settings: newSettings
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;
      
      setSettings(newSettings);
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    }
  };

  const handleModelToggle = async (model) => {
    const newSettings = {
      ...settings,
      models: {
        ...settings.models,
        [model]: !settings.models[model]
      }
    };
    await saveSettings(newSettings);
  };

  if (!isOpen) return null;

  return (
    <div className="settings-modal-overlay">
      <div className="settings-modal">
        <div className="settings-modal__header">
          <h2 className="settings-modal__title">Settings</h2>
          <button className="settings-modal__close-button" onClick={onClose}>
            <FiX />
          </button>
        </div>

        <div className="settings-modal__content">
          <div className="settings-modal__section">
            <h3 className="settings-modal__section-title">AI Models</h3>
            <div className="settings-modal__model-list">
              {Object.entries(MODEL_INFO).map(([modelId, { name, description }]) => (
                <div key={modelId} className="settings-modal__model-item">
                  <div className="settings-modal__model-info">
                    <div className="settings-modal__model-name">{name}</div>
                    <div className="settings-modal__model-description">{description}</div>
                  </div>
                  <label className="settings-modal__switch">
                    <input
                      type="checkbox"
                      role="switch"
                      checked={settings.models[modelId]}
                      onChange={() => handleModelToggle(modelId)}
                    />
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="settings-modal__footer">
          <div className="settings-modal__app-info">
            <span className="settings-modal__app-name">AI Docs</span>
            <span className="settings-modal__app-version">Ver 0.1.6</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsModal; 