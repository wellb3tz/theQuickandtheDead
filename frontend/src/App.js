import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import InitialScreen from './components/InitialScreen';
import Register from './components/Register';
import Login from './components/Login';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<InitialScreen />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;