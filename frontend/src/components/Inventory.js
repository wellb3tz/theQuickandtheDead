import React, { useState, useEffect } from 'react';
import BackButton from './BackButton';
import '../styles/inventory.css';

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
      <div className="inventory-layout">
        <div className="equipped-items">
          <div className="slot">
            <label>Head</label>
            <select>
              <option value="">Select item</option>
              {items.map((item, index) => (
                <option key={index} value={item}>{item}</option>
              ))}
            </select>
          </div>
          <div className="slot">
            <label>Body</label>
            <select>
              <option value="">Select item</option>
              {items.map((item, index) => (
                <option key={index} value={item}>{item}</option>
              ))}
            </select>
          </div>
          <div className="slot">
            <label>Left Arm</label>
            <select>
              <option value="">Select item</option>
              {items.map((item, index) => (
                <option key={index} value={item}>{item}</option>
              ))}
            </select>
          </div>
          <div className="slot">
            <label>Right Arm</label>
            <select>
              <option value="">Select item</option>
              {items.map((item, index) => (
                <option key={index} value={item}>{item}</option>
              ))}
            </select>
          </div>
          <div className="slot">
            <label>Legs</label>
            <select>
              <option value="">Select item</option>
              {items.map((item, index) => (
                <option key={index} value={item}>{item}</option>
              ))}
            </select>
          </div>
          <div className="slot">
            <label>Feet</label>
            <select>
              <option value="">Select item</option>
              {items.map((item, index) => (
                <option key={index} value={item}>{item}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="all-items">
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index}>
                  <td>{item}</td>
                  <td><button>Equip</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Inventory;