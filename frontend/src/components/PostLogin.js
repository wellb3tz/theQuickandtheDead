import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import SlidingMenu from './SlidingMenu';
import '../western-theme.css';

const PostLogin = () => {
  const [username, setUsername] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const history = useHistory();

  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    if (storedUsername) {
      setUsername(storedUsername);
    } else {
      history.push('/login'); // Redirect to login if not logged in
    }
  }, [history]);

  const handleLogOff = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    history.push('/login');
  };

  const handleInventory = () => {
    history.push('/inventory');
  };

  const handleChat = () => {
    history.push('/chat');
  };

  return (
    <div className="container">
      <h2>Welcome to the Game!</h2>
      <p>You have successfully logged in.</p>
      {username && (
        <div style={{ position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#8B4513', color: 'white', padding: '10px', borderRadius: '4px' }}>
          Logged in as: {username}
        </div>
      )}
      <button onClick={() => setMenuOpen(true)} style={{ position: 'fixed', top: '20px', left: '20px', fontSize: '16px' }}>☰</button>
      <SlidingMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} onLogOff={handleLogOff} onInventory={handleInventory} onChat={handleChat} />
    </div>
  );
};

export default PostLogin;