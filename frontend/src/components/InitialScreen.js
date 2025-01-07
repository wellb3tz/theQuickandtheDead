import React, { useEffect } from 'react';
import { useHistory } from 'react-router-dom';

const InitialScreen = () => {
  const history = useHistory();

  useEffect(() => {
    console.log('InitialScreen component mounted');
  }, []);

  const handleRegister = () => {
    console.log('Register button clicked');
    history.push('/register');
  };

  const handleLogin = () => {
    console.log('Login button clicked');
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