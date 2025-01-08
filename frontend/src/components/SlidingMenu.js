import React from 'react';
import ShootableButton from './ShootableButton';
import '../sliding-menu.css';

const SlidingMenu = ({ isOpen, onClose, onLogOff, onInventory, onChat, onWasteland }) => {
  return (
    <div className={`sliding-menu ${isOpen ? 'open' : ''}`}>
      <button className="close-button" onClick={onClose}>×</button>
      <div className="menu-content">
        <ShootableButton onClick={onInventory}>Inventory</ShootableButton>
        <ShootableButton onClick={onChat}>Chat</ShootableButton>
        <ShootableButton onClick={onWasteland}>Wasteland</ShootableButton>
      </div>
      <div className="menu-footer">
        <ShootableButton onClick={onLogOff}>Log off</ShootableButton>
      </div>
    </div>
  );
};

export default SlidingMenu;