import React, { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import './SettingsModal.css';

// 为不同的 router 定义独立的模型信息
const ROUTER_MODELS = {
  'router-a': {
    'deepseek/deepseek-r1:free': {
      name: 'DeepSeek R1',
      description: 'Performance on par with OpenAI o1, but open-sourced and with fully open reasoning tokens. It\'s 671B parameters in size, with 37B active in an inference pass.'
    },
    'openai/gpt-4o-mini': {
      name: 'GPT-4o-mini',
      description: 'GPT-4o mini achieves an 82% score on MMLU and presently ranks higher than GPT-4 on chat preferences common leaderboards'
    },
    'openai/gpt-4o-2024-11-20': {
      name: 'GPT-4o',
      description: 'GPT-4o offers a leveled-up creative writing ability with more natural, engaging, and tailored writing to improve relevance & readability. It\'s also better at working with uploaded files, providing deeper insights & more thorough responses.'
    },
    'anthropic/claude-3.5-sonnet': {
      name: 'Claude 3.5 Sonnet',
      description: 'Sonnet is particularly good at: Coding: Scores ~49% on SWE-Bench Verified; Data science: Augments human data science expertise; Visual processing: excelling at interpreting charts, graphs, and images; Agentic tasks: exceptional tool use.'
    }
  },
  'router-b': {
    'deepseek-r1': {
      name: 'DeepSeek R1',
      description: 'Specialized in code analysis and technical documentation'
    },
    'gpt-4o': {
      name: 'GPT-4O',
      description: 'Excels at natural language and complex reasoning tasks'
    },
    'o3-mini': {
      name: 'O3 Mini',
      description: 'Fast and efficient for general tasks and quick responses'
    },
    'claude-3-5-sonnet-20241022': {
      name: 'Claude 3.5 Sonnet',
      description: 'Balanced performance in analysis, writing and coding tasks'
    }
  }
};

const ROUTER_INFO = {
  'router-a': {
    name: 'OpenRouter',
    description: 'Default router using OpenAI SDK with OpenRouter',
    configFields: [
      { key: 'baseUrl', label: 'Base URL', type: 'text', placeholder: 'https://api.example.com' },
      { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'Enter API key' }
    ]
  },
  'router-b': {
    name: 'Wildcard',
    description: 'Alternative router using custom API endpoints with Wildcard',
    configFields: [
      { key: 'baseUrl', label: 'Base URL', type: 'text', placeholder: 'https://api.alternate.com' },
      { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'Enter API key' }
    ]
  }
};

function SettingsModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('models');
  const [settings, setSettings] = useState({
    models: {},
    router: 'router-a',
    routerConfigs: {
      'router-a': { baseUrl: '', apiKey: '' },
      'router-b': { baseUrl: '', apiKey: '' }
    }
  });
  const [loading, setLoading] = useState(true);
  const [localRouterConfigs, setLocalRouterConfigs] = useState({
    'router-a': { baseUrl: '', apiKey: '' },
    'router-b': { baseUrl: '', apiKey: '' }
  });

  useEffect(() => {
    if (isOpen) {
      fetchSettings();
    }
  }, [isOpen]);

  useEffect(() => {
    setLocalRouterConfigs(settings.routerConfigs);
  }, [settings.routerConfigs]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('settings')
        .select('*');

      if (error) throw error;

      const modelSettings = {};
      let routerSetting = 'router-a';
      const routerConfigs = {
        'router-a': { baseUrl: '', apiKey: '' },
        'router-b': { baseUrl: '', apiKey: '' }
      };

      data.forEach(setting => {
        if (setting.key.startsWith('model.')) {
          const modelId = setting.key.replace('model.', '');
          modelSettings[modelId] = setting.value.enabled;
        } else if (setting.key === 'router.selected') {
          routerSetting = setting.value;
        } else if (setting.key.startsWith('router.config.')) {
          const [, , routerId, field] = setting.key.split('.');
          if (routerConfigs[routerId]) {
            routerConfigs[routerId][field] = setting.value;
          }
        }
      });

      setSettings({
        models: modelSettings,
        router: routerSetting,
        routerConfigs
      });
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key, value) => {
    try {
      const { error } = await supabase
        .from('settings')
        .upsert({
          key,
          value,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'key'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error updating setting:', error);
      toast.error('Failed to update setting');
      throw error;
    }
  };

  const handleModelToggle = async (modelId) => {
    try {
      const newEnabled = !settings.models[modelId];
      await updateSetting(`model.${modelId}`, { enabled: newEnabled });
      
      setSettings(prev => ({
        ...prev,
        models: {
          ...prev.models,
          [modelId]: newEnabled
        }
      }));
    } catch (error) {
      // Error already handled in updateSetting
    }
  };

  const handleRouterChange = async (routerId) => {
    try {
      await updateSetting('router.selected', routerId);
      
      // 当切换 router 时，重置所有模型的启用状态
      const newModelSettings = {};
      Object.keys(ROUTER_MODELS[routerId]).forEach(modelId => {
        newModelSettings[modelId] = false;
      });

      // 为新 router 的每个模型创建设置
      for (const modelId of Object.keys(ROUTER_MODELS[routerId])) {
        await updateSetting(`model.${modelId}`, { enabled: false });
      }
      
      setSettings(prev => ({
        ...prev,
        router: routerId,
        models: newModelSettings
      }));
    } catch (error) {
      // Error already handled in updateSetting
    }
  };

  const handleRouterConfigChange = (routerId, field, value) => {
    setLocalRouterConfigs(prev => ({
      ...prev,
      [routerId]: {
        ...prev[routerId],
        [field]: value
      }
    }));
  };

  const handleRouterConfigSave = async (routerId, field, value) => {
    try {
      await updateSetting(`router.config.${routerId}.${field}`, value);
      
      setSettings(prev => ({
        ...prev,
        routerConfigs: {
          ...prev.routerConfigs,
          [routerId]: {
            ...prev.routerConfigs[routerId],
            [field]: value
          }
        }
      }));

      toast.success('Setting saved successfully');
    } catch (error) {
      setLocalRouterConfigs(prev => ({
        ...prev,
        [routerId]: {
          ...prev[routerId],
          [field]: settings.routerConfigs[routerId][field]
        }
      }));
      // Error already handled in updateSetting
    }
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

        <div className="settings-modal__tabs">
          <button 
            className={`settings-modal__tab ${activeTab === 'models' ? 'active' : ''}`}
            onClick={() => setActiveTab('models')}
          >
            Models
          </button>
          <button 
            className={`settings-modal__tab ${activeTab === 'routers' ? 'active' : ''}`}
            onClick={() => setActiveTab('routers')}
          >
            Routers
          </button>
        </div>

        {loading ? (
          <div className="settings-modal__loading">Loading settings...</div>
        ) : (
          <div className="settings-modal__content">
            {activeTab === 'models' && (
              <div className="settings-modal__section">
                <h3 className="settings-modal__section-title">AI Models</h3>
                <div className="settings-modal__model-list">
                  {Object.entries(ROUTER_MODELS[settings.router] || {}).map(([modelId, { name, description }]) => (
                    <div key={modelId} className="settings-modal__model-item">
                      <div className="settings-modal__model-info">
                        <div className="settings-modal__model-name">{name}</div>
                        <div className="settings-modal__model-description">{description}</div>
                      </div>
                      <label className="settings-modal__switch">
                        <input
                          type="checkbox"
                          role="switch"
                          checked={settings.models[modelId] ?? false}
                          onChange={() => handleModelToggle(modelId)}
                        />
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'routers' && (
              <div className="settings-modal__section">
                <h3 className="settings-modal__section-title">API Routers</h3>
                <div className="settings-modal__router-list">
                  {Object.entries(ROUTER_INFO).map(([routerId, { name, description, configFields }]) => (
                    <div key={routerId} className="settings-modal__router-item">
                      <div className="settings-modal__router-info">
                        <div className="settings-modal__router-header">
                          <div className="settings-modal__router-name">{name}</div>
                          <label className="settings-modal__radio">
                            <input
                              type="radio"
                              name="router"
                              checked={settings.router === routerId}
                              onChange={() => handleRouterChange(routerId)}
                            />
                          </label>
                        </div>
                        <div className="settings-modal__router-description">{description}</div>
                        
                        <div className="settings-modal__router-config">
                          {configFields.map(({ key, label, type, placeholder }) => (
                            <div key={key} className="settings-modal__config-field">
                              <label className="settings-modal__config-label">{label}</label>
                              <input
                                type={type}
                                className="settings-modal__config-input"
                                placeholder={placeholder}
                                value={localRouterConfigs[routerId][key] || ''}
                                onChange={(e) => handleRouterConfigChange(routerId, key, e.target.value)}
                                onBlur={(e) => handleRouterConfigSave(routerId, key, e.target.value)}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

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