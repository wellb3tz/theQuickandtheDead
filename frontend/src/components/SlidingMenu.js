import React from 'react';
import './sliding-menu.css';

const SlidingMenu = ({ isOpen, onClose, onLogOff }) => {
  return (
    <div className={`sliding-menu ${isOpen ? 'open' : ''}`}>
      <button className="close-button" onClick={onClose}>×</button>
      <div className="menu-content">
        <button onClick={onLogOff}>Log off</button>
      </div>
    </div>
  );
};

export default SlidingMenu;