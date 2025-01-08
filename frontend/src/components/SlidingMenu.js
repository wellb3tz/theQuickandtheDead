import React from 'react';
import '../sliding-menu.css';

const SlidingMenu = ({ isOpen, onClose, onLogOff, onInventory, onChat, onWasteland }) => {

  const handleShot = (e) => {
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Create bullet hole
    const hole = document.createElement('div');
    hole.className = 'bullet-hole';
    hole.style.left = x + 'px';
    hole.style.top = y + 'px';
    btn.appendChild(hole);

    // Create shatter pieces
    for (let i = 0; i < 8; i++) {
      const piece = document.createElement('div');
      piece.className = 'shatter-piece';
      piece.style.setProperty('--tx', (Math.random() - 0.5) * 100 + 'px');
      piece.style.setProperty('--ty', (Math.random() - 0.5) * 100 + 'px');
      piece.style.setProperty('--rot', Math.random() * 360 + 'deg');
      piece.style.animation = `shatter 0.5s forwards ${i * 0.1}s`;
      btn.appendChild(piece);
    }

    // Fade out button
    setTimeout(() => {
      btn.style.opacity = '0';
    }, 500);
  };

  return (
    <div className={`sliding-menu ${isOpen ? 'open' : ''}`}>
      <button className="close-button" onClick={onClose}>×</button>
      <div className="menu-content">
        <button className="shootable-button" onClick={(e) => {handleShot(e); onInventory();}}>Inventory</button>
        <button className="shootable-button" onClick={(e) => {handleShot(e); onChat();}}>Chat</button>
        <button className="shootable-button" onClick={(e) => {handleShot(e); onWasteland();}}>Wasteland</button>
      </div>
      <div className="menu-footer">
        <button className="shootable-button" onClick={(e) => {handleShot(e); onLogOff();}}>Log off</button>
      </div>
    </div>
  );
};

export default SlidingMenu;