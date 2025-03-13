import React, { useState } from 'react';
import './Teams.css';

function Teams() {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Mock data for tasks
  const tasks = [
    { id: 1, title: 'Lorem ipsum dolor sit amet consectetur adipisc', model: 'GPT 4', comments: 24, time: '1 min ago' },
    { id: 2, title: 'Duis aute irure dolor in reprehenderit', model: 'Llama 2', comments: 13, time: '5 min ago' },
    { id: 3, title: 'Purus in massa tempor nec feugiat nisi pretium fus', model: 'Mistral 8×7B', comments: 4, time: '22 min ago' },
    { id: 4, title: 'Urna nec tincidunt praesent semper feugiat', model: 'GPT 3.5', comments: 20, time: '1 hr ago' },
    { id: 5, title: 'Vulputate odio ut enim blandit volutpat maecenas volu', model: 'GPT 4', comments: 18, time: '2 hrs ago' },
    { id: 6, title: 'Arcu ac tortor dignissim convallis', model: 'Llama 2', comments: 7, time: '3 hrs ago' },
  ];

  // 更新团队成员数据，使用更适合角色的emoji
  const teamMembers = [
    { id: 1, name: 'Aline', icon: '🙆‍♀️', role: 'Content Creator' },
    { id: 2, name: 'Lucas', icon: '🙅‍♂️', role: 'Data Expert' },
    { id: 3, name: 'Lara', icon: '🦸‍♀️', role: 'UI/UX' },
    { id: 4, name: 'Adrian', icon: '👨‍💻', role: 'Developer' },
    { id: 5, name: 'John', icon: '👨‍💼', role: 'Manager' },
    { id: 6, name: 'Mauro', icon: '👩‍⚖️‍', role: 'Lawyer' },
  ];

  return (
    <div className="tm-container">
      {/* Top Toolbar */}
      <div className="tm-toolbar">
        <div className="tm-title">Teams</div>
        <div className="tm-search-container">
          <input 
            type="text" 
            placeholder="Search for Tasks..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="tm-search-input"
          />
        </div>
        <button className="tm-new-task-button">
          <span className="tm-plus-icon">+</span>
          New task
        </button>
      </div>

      {/* Main Content Area */}
      <div className="tm-content-area">
        {/* Welcome Section / Chat Area */}
        <div className="tm-welcome-section">
          <h2 className="tm-welcome-title">Welcome back, Anthony</h2>
          <p className="tm-welcome-subtitle">Leave your message, let's see what we can do for you</p>
          
          <div className="tm-chat-input-container">
            <input 
              type="text" 
              placeholder="Something you want to be done?" 
              className="tm-chat-input"
            />
            <button className="tm-send-button">
              <span className="tm-send-icon">➤</span>
            </button>
          </div>
        </div>

        {/* Team Members Section */}
        <div className="tm-members-section">
          {teamMembers.map(member => (
            <div key={member.id} className="tm-member-card">
              <div className="tm-member-icon">{member.icon}</div>
              <div className="tm-member-name">{member.name}</div>
              <div className="tm-member-role">{member.role}</div>
            </div>
          ))}
        </div>

        {/* Tasks Section */}
        <div className="tm-tasks-section">
          <div className="tm-tasks-header">
            <h3 className="tm-tasks-title">Tasks <span className="tm-tasks-count">(56)</span></h3>
            <div className="tm-tasks-filters">
              <div className="tm-search-tasks-container">
                <input 
                  type="text" 
                  placeholder="Search for tasks..." 
                  className="tm-search-tasks-input"
                />
              </div>
              <div className="tm-filter">
                <span className="tm-filter-label">Role</span>
                <span className="tm-filter-arrow">▼</span>
              </div>
              <div className="tm-filter">
                <span className="tm-filter-label">Sort by</span>
                <span className="tm-filter-arrow">▼</span>
              </div>
            </div>
          </div>
          
          <div className="tm-tasks-list">
            {tasks.map(task => (
              <div key={task.id} className="tm-task-card">
                <div className="tm-task-content">
                  <div className="tm-task-title">{task.title}</div>
                  <div className="tm-task-model">{task.model}</div>
                </div>
                <div className="tm-task-meta">
                  <div className="tm-comments">
                    <span className="tm-comments-icon">💬</span>
                    <span className="tm-comments-count">{task.comments}</span>
                  </div>
                  <div className="tm-task-time">{task.time}</div>
                  <div className="tm-task-actions">⋮</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Teams; 