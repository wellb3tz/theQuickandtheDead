import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import io from 'socket.io-client';
import SlidingMenu from './SlidingMenu';
import '../styles/western-theme.css';

const socket = io('https://thequickandthedead.onrender.com');

const PostLogin = ({ volume }) => {
  const [username, setUsername] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(0);
  const history = useHistory();

  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    if (storedUsername) {
      setUsername(storedUsername);
    } else {
      history.push('/login');
    }

    // Fetch the number of online users initially
    fetch('https://thequickandthedead.onrender.com/online-users')
      .then(response => response.json())
      .then(data => {
        setOnlineUsers(data.onlineUsers);
      })
      .catch(error => console.error('Error fetching online users:', error));

    // Listen for online users updates
    socket.on('online_users', (data) => {
      setOnlineUsers(data.onlineUsers);
    });

    return () => {
      socket.off('online_users');
    };
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

  const handleWasteland = () => {
    history.push('/wasteland-confirmation');
  };

  return (
    <div className="container">
      <h2>Welcome to the Game!</h2>
      <p>You have successfully logged in.</p>
      {username && (
        <div style={{ position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#000000', color: '#ffffff', padding: '10px', borderRadius: '4px' }}>
          <p>Online: {onlineUsers}</p>
          <p>Logged in as: {username}</p>
        </div>
      )}
      <button onClick={() => setMenuOpen(true)} style={{ position: 'fixed', top: '20px', left: '20px', fontSize: '16px' }}>☰</button>
      <SlidingMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} onLogOff={handleLogOff} onInventory={handleInventory} onChat={handleChat} onWasteland={handleWasteland} volume={volume} />
    </div>
  );
};

export default PostLogin;