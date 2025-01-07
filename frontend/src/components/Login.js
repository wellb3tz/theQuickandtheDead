import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import BackButton from './BackButton';
import '../western-theme.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const history = useHistory();

  useEffect(() => {
    console.log('Login component mounted');
    if (window.Telegram && window.Telegram.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.onEvent('auth', (authData) => {
        fetch('https://thequickandthedead.onrender.com/telegram_auth', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(authData),
        })
          .then(response => response.json())
          .then(data => {
            if (data.access_token) {
              localStorage.setItem('token', data.access_token);
              setMessage("Login successful!");
              history.push('/post-login');
            } else {
              setMessage(data.msg);
            }
          });
      });
    } else {
      console.error('Telegram WebApp is not defined');
    }
  }, []);

  const handleLogin = () => {
    console.log('Login button clicked');
    fetch('https://thequickandthedead.onrender.com/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    })
      .then(response => response.json())
      .then(data => {
        if (data.access_token) {
          localStorage.setItem('token', data.access_token);
          setMessage("Login successful!");
          history.push('/post-login');
        } else {
          setMessage(data.msg);
        }
      })
      .catch(error => {
        console.error('Error:', error);
        setMessage('An error occurred. Please try again.');
      });
  };

  return (
    <div className="container">
      <BackButton />
      <h2>Login</h2>
      {message && <p>{message}</p>}
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={handleLogin}>Login</button>
    </div>
  );
};

export default Login;