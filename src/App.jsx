import React from 'react';
    import Sidebar from './components/Sidebar';
    import ChatArea from './components/ChatArea';
    import ModelInfo from './components/ModelInfo';
    import './App.css';

    function App() {
      return (
        <div className="app-container">
          <Sidebar />
          <ChatArea />
          <ModelInfo />
        </div>
      );
    }

    export default App;
