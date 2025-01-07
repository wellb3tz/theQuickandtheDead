import React, { useState, useEffect } from 'react';
import BackButton from './BackButton';

const Inventory = () => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetch('https://thequickandthedead.onrender.com/inventory?user_id=1')
      .then(response => response.json())
      .then(data => setItems(data));
  }, []);

  return (
    <div>
      <BackButton />
      <h2>Inventory</h2>
      <ul>
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </div>
  );
};

export default Inventory;