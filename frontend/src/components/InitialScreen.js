import React from 'react';
import { useHistory } from 'react-router-dom';

const InitialScreen = () => {
  const history = useHistory();

  const handleRegister = () => {
    history.push('/register');
  };

  const handleLogin = () => {
    history.push('/login');
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