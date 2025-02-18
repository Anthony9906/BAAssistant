import { useState, useEffect } from 'react';
import OpenAI from 'openai';
import { supabase } from '../lib/supabase';

export function useOpenAI() {
  const [openaiInstance, setOpenaiInstance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('settings')
          .select('*')
          .in('key', ['router.selected', 'router.config.router-a.baseUrl', 'router.config.router-a.apiKey', 'router.config.router-b.baseUrl', 'router.config.router-b.apiKey']);

        if (error) throw error;

        // 解析设置
        const settings = data.reduce((acc, item) => {
          acc[item.key] = item.value;
          return acc;
        }, {});

        const selectedRouter = settings['router.selected'] || 'router-a';
        const baseUrl = settings[`router.config.${selectedRouter}.baseUrl`];
        const apiKey = settings[`router.config.${selectedRouter}.apiKey`];

        // 创建新的 OpenAI 实例
        const instance = new OpenAI({
          apiKey: apiKey || import.meta.env.VITE_OPENAI_API_KEY,
          baseURL: baseUrl || import.meta.env.VITE_OPENAI_BASE_URL,
          dangerouslyAllowBrowser: true
        });

        setOpenaiInstance(instance);
      } catch (error) {
        console.error('Error initializing OpenAI:', error);
        // 如果出错，使用默认配置
        const defaultInstance = new OpenAI({
          apiKey: import.meta.env.VITE_OPENAI_API_KEY,
          baseURL: import.meta.env.VITE_OPENAI_BASE_URL,
          dangerouslyAllowBrowser: true
        });
        setOpenaiInstance(defaultInstance);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();

    // 订阅设置变更
    const subscription = supabase
      .channel('settings_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'settings' 
      }, fetchSettings)
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { openai: openaiInstance, loading };
} 