import React from 'react';
import anime from 'animejs/lib/anime.es.js';
import '../styles/animated-button.css';

const AnimatedButton = () => {
  const handleClick = () => {
    anime({
      targets: '.animated-button',
      scale: [1, 1.5, 1],
      duration: 800,
      easing: 'easeInOutQuad'
    });
  };

  return (
    <button className="animated-button" onClick={handleClick}>
      Click Me!
    </button>
  );
};

export default AnimatedButton;