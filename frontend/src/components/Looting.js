import React from 'react';
import { useHistory } from 'react-router-dom';
import BackButton from './BackButton';
import '../styles/western-theme.css';

const Looting = () => {
  const history = useHistory();

  return (
    <div className="container">
      <BackButton />
      <h2 style={{ textAlign: 'center' }}>You found:</h2>
      {/* Add any additional content or logic for displaying found items */}
    </div>
  );
};

export default Looting;