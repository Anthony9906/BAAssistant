import React from 'react';
import './Resizer.css';

const Resizer = ({ onResize }) => {
  const handleMouseDown = (e) => {
    e.preventDefault();
    
    const handleMouseMove = (moveEvent) => {
      // 获取父容器
      const container = e.target.parentElement;
      const containerRect = container.getBoundingClientRect();
      
      // 计算鼠标在容器内的相对位置(0-1)
      const position = (moveEvent.clientX - containerRect.left) / containerRect.width;
      
      // 确保位置在合理范围内(0.2-0.8)
      const clampedPosition = Math.max(0.2, Math.min(0.8, position));
      
      onResize(clampedPosition);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div 
      className="resizer"
      onMouseDown={handleMouseDown}
    />
  );
};

export default Resizer;
