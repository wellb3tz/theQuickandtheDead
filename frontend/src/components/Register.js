import React, { useState } from 'react';

const Register = () => {
  const [telegramId, setTelegramId] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = () => {
    fetch('http://localhost:5000/register', {
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
      <h2>Register</h2>
      <input
        type="text"
        placeholder="Telegram ID"
        value={telegramId}
        onChange={(e) => setTelegramId(e.target.value)}
      />
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