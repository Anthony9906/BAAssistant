import React from 'react';
import './LoadingSpinner.css';

function LoadingSpinner() {
  return (
    <div className="loading-spinner-overlay">
      <div className="loading-spinner-container">
        <div className="loading-spinner-circle"></div>
      </div>
    </div>
  );
}

export default LoadingSpinner; 