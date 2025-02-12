import React, { useEffect, useRef, useState } from 'react';
import './Popover.css';

function Popover({ 
  isOpen, 
  onClose, 
  anchor, 
  children,
  position = 'bottom-start' 
}) {
  const popoverRef = useRef(null);
  const [style, setStyle] = useState({});

  useEffect(() => {
    const updatePosition = () => {
      if (!isOpen || !anchor.current || !popoverRef.current) return;

      const anchorRect = anchor.current.getBoundingClientRect();
      const popoverRect = popoverRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;

      let top, left;
      
      // 计算基础位置
      switch (position) {
        case 'bottom-end':
          top = anchorRect.bottom;
          left = anchorRect.right - popoverRect.width;
          break;
        case 'bottom-start':
        default:
          top = anchorRect.bottom;
          left = anchorRect.left;
          break;
      }

      // 检查是否会超出视口
      if (top + popoverRect.height > viewportHeight) {
        top = anchorRect.top - popoverRect.height; // 显示在上方
      }

      if (left + popoverRect.width > viewportWidth) {
        left = viewportWidth - popoverRect.width - 8; // 8px 作为安全边距
      }

      if (left < 0) {
        left = 8; // 8px 作为安全边距
      }

      setStyle({
        position: 'fixed',
        top: `${top}px`,
        left: `${left}px`,
        zIndex: 1000
      });
    };

    const handleClickOutside = (event) => {
      if (popoverRef.current && 
          !popoverRef.current.contains(event.target) && 
          !anchor.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      // 初始定位
      setTimeout(updatePosition, 0);
      
      // 添加事件监听
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen, onClose, anchor, position]);

  if (!isOpen) return null;

  return (
    <div 
      className={`popover ${position}`} 
      ref={popoverRef}
      style={style}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  );
}

export default Popover; 