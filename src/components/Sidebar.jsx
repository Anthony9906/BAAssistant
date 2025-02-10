import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, NavLink } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import './Sidebar.css';
import { FiSettings, FiLogOut, FiSearch, FiMessageSquare, FiBook, FiFileText, FiUser, FiHome, FiMessageCircle, FiMonitor, FiGrid, FiChevronRight } from 'react-icons/fi';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import UserProfileModal from './UserProfileModal';

function Sidebar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [chatHistory, setChatHistory] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  useEffect(() => {
    fetchChatHistory();
    if (user) {
      fetchUserProfile();
    }

    // 只订阅消息插入事件
    const subscription = supabase
      .channel('message-inserts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',  // 只监听插入事件
          schema: 'public',
          table: 'messages'
        },
        async (payload) => {
          const chatId = payload.new.chat_id;
          
          // 获取最新的消息计数
          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('chat_id', chatId);

          // 更新本地状态
          setChatHistory(prev => prev.map(chat => 
            chat.id === chatId 
              ? { ...chat, messageCount: count || 0 }
              : chat
          ));
        }
      )
      .subscribe();

    // 清理订阅
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchChatHistory = async () => {
    try {
      // 首先获取聊天记录
      const { data: chats, error: chatsError } = await supabase
        .from('chats')
        .select('id, title, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(8);

      if (chatsError) throw chatsError;

      // 为每个聊天获取消息数量
      const promises = chats.map(chat => 
        supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('chat_id', chat.id)
      );

      const results = await Promise.all(promises);
      
      // 将消息数量添加到聊天记录中
      const historyWithCount = chats.map((chat, index) => ({
        ...chat,
        messageCount: results[index].count || 0
      }));

      setChatHistory(historyWithCount);
    } catch (error) {
      console.error('Error fetching chat history:', error);
      toast.error('加载聊天记录失败');
    }
  };

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setUserProfile(data);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const truncateTitle = (title) => {
    return title.length > 25 ? title.substring(0, 25) + '...' : title;
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleProfileUpdate = async (updatedData) => {
    try {
      const updates = {
        id: userProfile?.id,
        user_id: user.id,
        username: updatedData.username,
        phone: updatedData.phone,
        avatar: updatedData.avatar,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('profiles')
        .upsert(updates, {
          returning: 'representation',
          onConflict: 'user_id'
        });

      if (error) throw error;

      if (data && data.length > 0) {
        setUserProfile(data[0]);
      } else {
        setUserProfile({ ...userProfile, ...updates });
      }
      
      toast.success('Profile updated successfully!', {
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
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile. Please try again.', {
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

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        {/* 保留header结构，移除user-info和sidebar-actions的内容 */}
      </div>
      <div className="search-bar">
        <FiSearch style={{ color: '#71717a', width: 16, height: 16, marginRight: 8 }} />
        <input type="text" placeholder="Search for chats..." />
        <span className="search-shortcut">K</span>
      </div>
      <div className="nav-section">
        <NavLink to="/chats" className="nav-item">
          <FiMessageCircle className="nav-icon" />
          <span>Chats</span>
          <FiChevronRight className="nav-arrow" />
        </NavLink>
        <NavLink to="/library" className="nav-item">
          <FiMonitor className="nav-icon" />
          <span>Library</span>
          <FiChevronRight className="nav-arrow" />
        </NavLink>
        <NavLink to="/docs" className="nav-item">
          <FiGrid className="nav-icon" />
          <span>Docs</span>
          <FiChevronRight className="nav-arrow" />
        </NavLink>
      </div>
      <div className="chat-history-section">
        <p className="chat-history-header">CHAT HISTORY</p>
        <ul className="chat-history-list">
          {chatHistory.map((chat) => (
            <li 
              key={chat.id}
              className={`chat-history-item ${location.pathname === `/chats/${chat.id}` ? 'active' : ''}`}
              onClick={() => navigate(`/chats/${chat.id}`)}
            >
              <div className="chat-history-content">
                <FiMessageCircle className="chat-icon" />
                <span className="chat-title">{truncateTitle(chat.title)}</span>
              </div>
              <span className="message-count">{chat.messageCount}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="sidebar-footer">
        <div className="sidebar-menu">
          <button className="menu-item" onClick={() => setIsProfileModalOpen(true)}>
            <span className="sidebar-user-avatar">{userProfile?.avatar || '👤'}</span>
            <span>{userProfile?.username || user?.email}</span>
          </button>
          <button className="menu-item">
            <FiSettings className="menu-icon" />
            <span>Settings</span>
          </button>
          <button className="menu-item" onClick={handleLogout}>
            <FiLogOut className="menu-icon" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {userProfile !== null && (
        <UserProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          user={{ ...user, ...userProfile }}
          onUpdate={handleProfileUpdate}
        />
      )}
    </div>
  );
}

export default Sidebar;
