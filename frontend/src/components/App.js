import React, { useEffect, useState } from 'react';
import SlidingMenu from './SlidingMenu';
import '../styles/western-theme.css';
import gunshotSound from '../sounds/gunshot.mp3'; // Ensure you have this sound file

const App = () => {
  const [volume, setVolume] = useState(1);

  useEffect(() => {
    const handleShot = (e) => {
      // Play gunshot sound
      const audio = new Audio(gunshotSound);
      audio.volume = volume;
      audio.play();

      const hole = document.createElement('div');
      hole.className = 'bullet-hole';
      hole.style.left = `${e.clientX}px`;
      hole.style.top = `${e.clientY}px`;
      document.body.appendChild(hole);

      setTimeout(() => {
        hole.remove();
      }, 2000);
    };

    document.addEventListener('click', handleShot);

    return () => {
      document.removeEventListener('click', handleShot);
    };
  }, [volume]);

  return (
    <div>
      <SlidingMenu volume={volume} setVolume={setVolume} />
      {/* Your app content */}
    </div>
  );
};

export default App;