import React from 'react';
import '../sliding-menu.css';

const SlidingMenu = ({ isOpen, onClose, onLogOff, onInventory, onChat, onWasteland }) => {
  return (
    <div className={`sliding-menu ${isOpen ? 'open' : ''}`}>
      <button className="close-button" onClick={onClose}>×</button>
      <div className="menu-content">
      <button onClick={onInventory}>Inventory</button>
      <button onClick={onChat}>Chat</button>
      <button onClick={onWasteland}>Wasteland</button>
      </div>
      <div className="menu-footer">
      <button onClick={onLogOff}>Log off</button>
      </div>
    </div>
  );
};

export default SlidingMenu;