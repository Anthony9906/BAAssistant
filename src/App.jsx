import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Library from './components/Library/Library';
import ChatArea from './components/ChatArea';
import ModelInfo from './components/ModelInfo';
import Docs from './components/Docs/Docs';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Library />} />
            <Route path="/library" element={<Library />} />
            <Route path="/docs" element={<Docs />} />
            <Route 
              path="/chats/:chatId" 
              element={
                <div className="chat-container">
                  <ChatArea />
                  <ModelInfo />
                </div>
              } 
            />
            <Route 
              path="/chats" 
              element={
                <div className="chat-container">
                  <ChatArea />
                  <ModelInfo />
                </div>
              } 
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
