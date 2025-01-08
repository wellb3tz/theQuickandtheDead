import React, { useState } from 'react';

const Options = ({ onVolumeChange }) => {
  const [volume, setVolume] = useState(1);

  const handleVolumeChange = (e) => {
    const newVolume = e.target.value;
    setVolume(newVolume);
    onVolumeChange(newVolume);
  };

  return (
    <div className="options-menu">
      <label htmlFor="volume-slider">Sound volume</label>
      <input
        type="range"
        id="volume-slider"
        min="0"
        max="1"
        step="0.01"
        value={volume}
        onChange={handleVolumeChange}
      />
    </div>
  );
};

export default Options;