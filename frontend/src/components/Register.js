import React, { useState, useEffect } from 'react';
import BackButton from './BackButton';

const Register = () => {
  const [telegramId, setTelegramId] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    console.log('Register component mounted');
    if (window.Telegram && window.Telegram.WebApp) {
      window.Telegram.WebApp.ready();
      const user = window.Telegram.WebApp.initDataUnsafe.user;
      if (user) {
        setTelegramId(user.id);
      } else {
        console.error('Telegram user data is not available');
      }
    } else {
      console.error('Telegram WebApp is not defined');
    }
  }, []);

  const handleRegister = () => {
    console.log('Register button clicked');
    fetch('https://thequickandthedead.onrender.com/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ telegram_id: telegramId, username, password }),
    })
      .then(response => response.json())
      .then(data => {
        if (data.msg === "User registered successfully") {
          alert("Registration successful! Please log in.");
        } else {
          alert(data.msg);
        }
      });
  };

  return (
    <div>
      <BackButton />
      <h2>Register</h2>
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
      <button onClick={handleRegister}>Register</button>
    </div>
  );
};

export default Register;