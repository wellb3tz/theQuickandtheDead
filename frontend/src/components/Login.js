import React, { useState, useEffect } from 'react';

const Login = () => {
  const [telegramId, setTelegramId] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
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
              alert("Login successful!");
            } else {
              alert(data.msg);
            }
          });
      });
    } else {
      console.error('Telegram WebApp is not defined');
    }
  }, []);

  const handleLogin = () => {
    fetch('https://thequickandthedead.onrender.com/login', {
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