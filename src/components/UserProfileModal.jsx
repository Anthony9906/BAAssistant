import React, { useState } from 'react';
import { FiX } from 'react-icons/fi';
import './UserProfileModal.css';

const avatars = [
  { id: 1, icon: '👨‍💻', label: 'Developer' },
  { id: 2, icon: '👩‍💻', label: 'Developer Woman' },
  { id: 3, icon: '🤖', label: 'Robot' },
  { id: 4, icon: '👾', label: 'Space' },
  { id: 5, icon: '🦊', label: 'Fox' },
  { id: 6, icon: '🐼', label: 'Panda' },
  { id: 7, icon: '🦁', label: 'Lion' },
  { id: 8, icon: '🦉', label: 'Owl' },
  { id: 9, icon: '🐯', label: 'Tiger' },
  { id: 10, icon: '🐸', label: 'Frog' },
];

function UserProfileModal({ isOpen, onClose, user, onUpdate }) {
  const [username, setUsername] = useState(user?.username || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar || avatars[0].icon);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await onUpdate({
        username,
        phone,
        avatar: selectedAvatar
      });
      onClose();
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Edit Profile</h2>
          <button className="close-button" onClick={onClose}>
            <FiX />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="avatar-section">
            <label>Choose Avatar</label>
            <div className="avatar-grid">
              {avatars.map((avatar) => (
                <button
                  key={avatar.id}
                  type="button"
                  className={`avatar-item ${selectedAvatar === avatar.icon ? 'selected' : ''}`}
                  onClick={() => setSelectedAvatar(avatar.icon)}
                  title={avatar.label}
                >
                  {avatar.icon}
                </button>
              ))}
            </div>
          </div>

          <div className="form-field">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
            />
          </div>

          <div className="form-field">
            <label>Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter your phone number"
            />
          </div>

          <div className="form-field">
            <label>Email</label>
            <input
              type="email"
              value={user?.email}
              disabled
              className="disabled-input"
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="cancel-button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="save-button">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UserProfileModal; 