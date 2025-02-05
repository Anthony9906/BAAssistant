import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import ModelInfo from './components/ModelInfo';
import Library from './components/Library/Library';
import Docs from './components/Docs/Docs';
import './App.css';
import styled from 'styled-components';

const ModelInfoStyled = styled.div`
  width: 420px;
`;

function App() {
  const [currentView, setCurrentView] = useState('chat'); // 'chat' or 'library' or 'docs'

  const handleNavigation = (view) => {
    setCurrentView(view);
  };

  return (
    <div className="app">
      <Sidebar onNavigate={handleNavigation} currentView={currentView} />
      <main className="main-content">
        {currentView === 'chat' && (
          <>
            <ChatArea />
            <ModelInfoStyled>
              <ModelInfo />
            </ModelInfoStyled>
          </>
        )}
        {currentView === 'library' && <Library />}
        {currentView === 'docs' && <Docs />}
      </main>
    </div>
  );
}

export default App;
