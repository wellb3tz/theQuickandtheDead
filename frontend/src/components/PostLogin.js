import React, { useEffect, useState } from 'react';

const PostLogin = () => {
  const [username, setUsername] = useState('');

  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    if (storedUsername) {
      setUsername(storedUsername);
    }
  }, []);

  return (
    <div className="container">
      <h2>Welcome to the Game!</h2>
      <p>You have successfully logged in.</p>
      {username && (
        <div style={{ position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#8B4513', color: 'white', padding: '10px', borderRadius: '4px' }}>
          Logged in as: {username}
        </div>
      )}
    </div>
  );
};

export default PostLogin;