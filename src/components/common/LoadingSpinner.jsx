import React from 'react';
import './LoadingSpinner.css';

function LoadingSpinner() {
  return (
    <div className="ai-loading-spinner-overlay">
      <div className="ai-loading-spinner-container">
        <div className="ai-loading-spinner-circle"></div>
      </div>
    </div>
  );
}

export default LoadingSpinner; 