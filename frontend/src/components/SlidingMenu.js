import React, { useState } from 'react';
import Options from './Options';
import '../sliding-menu.css';

const SlidingMenu = ({ isOpen, onClose, onLogOff, onInventory, onChat, onWasteland }) => {
  const [showOptions, setShowOptions] = useState(false);
  const [volume, setVolume] = useState(1);

  const handleVolumeChange = (newVolume) => {
    setVolume(newVolume);
  };

  return (
    <div className={`sliding-menu ${isOpen ? 'open' : ''}`}>
      <button className="close-button" onClick={onClose}>×</button>
      <div className="menu-content">
        {showOptions ? (
          <Options onVolumeChange={handleVolumeChange} />
        ) : (
          <>
            <button onClick={onInventory}>Inventory</button>
            <button onClick={onChat}>Chat</button>
            <button onClick={onWasteland}>Wasteland</button>
            <button onClick={() => setShowOptions(true)}>Options</button>
          </>
        )}
      </div>
      <div className="menu-footer">
        <button onClick={onLogOff}>Log off</button>
      </div>
    </div>
  );
};

export default SlidingMenu;