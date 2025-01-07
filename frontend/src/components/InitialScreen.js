import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const InitialScreen = () => {
  const navigate = useNavigate();

  useEffect(() => {
    console.log('InitialScreen component mounted');
  }, []);

  const handleRegister = () => {
    console.log('Register button clicked');
    navigate('/register');
  };

  const handleLogin = () => {
    console.log('Login button clicked');
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