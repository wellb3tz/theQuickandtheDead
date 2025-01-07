import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import InitialScreen from './components/InitialScreen';
import Register from './components/Register';
import Login from './components/Login';
import Inventory from './components/Inventory';
import Chat from './components/Chat';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<InitialScreen />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/chat" element={<Chat />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;