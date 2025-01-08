import React, { useState } from 'react';
import BackButton from './BackButton';
import '../western-theme.css';

const Options = () => {
  const [volume, setVolume] = useState(50);

  const handleVolumeChange = (e) => {
    setVolume(e.target.value);
  };

  return (
    <div className="container">
      <BackButton />
      <h2>Options</h2>
      <div>
        <label>Sound volume</label>
        <input 
          type="range" 
          min="0" 
          max="100" 
          value={volume}
          onChange={handleVolumeChange}
        />
        <span>{volume}</span>
      </div>
    </div>
  );
};
