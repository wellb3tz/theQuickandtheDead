import React from 'react';
import { useNavigate } from 'react-router-dom';

const InitialScreen = () => {
  const navigate = useNavigate();

  const handleRegister = () => {
    navigate('/register');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  return (
    <div>
      <h1>Welcome to the Game</h1>
      <button onClick={handleRegister}>Register</button>
      <button onClick={handleLogin}>Login</button>
    </div>
  );
};

export default InitialScreen;