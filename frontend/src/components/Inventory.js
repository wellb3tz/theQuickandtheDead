import React, { useState, useEffect } from 'react';
import BackButton from './BackButton';
import '../western-theme.css';

const Inventory = () => {
  const [items, setItems] = useState([]);
  const [username, setUsername] = useState('');

  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    if (storedUsername) {
      setUsername(storedUsername);
    }

    fetch('https://thequickandthedead.onrender.com/inventory?user_id=1')
      .then(response => response.json())
      .then(data => setItems(data));
  }, []);

  return (
    <div className="container">
      <BackButton />
      <h2>Inventory of {username}</h2>
      <ul>
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </div>
  );
};

export default Inventory;