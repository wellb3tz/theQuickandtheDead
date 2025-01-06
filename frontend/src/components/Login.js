import React, { useState, useEffect } from 'react';

const Login = () => {
  const [telegramId, setTelegramId] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    window.Telegram.WebApp.ready();
    window.Telegram.WebApp.onEvent('auth', (authData) => {
      fetch('https://your-backend-url.onrender.com/telegram_auth', {
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
            alert("Login successful!");
          } else {
            alert(data.msg);
          }
        });
    });
  }, []);

  const handleLogin = () => {
    fetch('http://localhost:5000/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ telegram_id: telegramId, password }),
    })
      .then(response => response.json())
      .then(data => {
        if (data.access_token) {
          localStorage.setItem('token', data.access_token);
          alert("Login successful!");
        } else {
          alert(data.msg);
        }
      });
  };

  return (
    <div>
      <h2>Login</h2>
      <input
        type="text"
        placeholder="Telegram ID"
        value={telegramId}
        onChange={(e) => setTelegramId(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={handleLogin}>Login</button>
      <h2>Login with Telegram</h2>
      <button onClick={() => window.Telegram.WebApp.showAuth()}>Login</button>
    </div>
  );
};

export default Login;