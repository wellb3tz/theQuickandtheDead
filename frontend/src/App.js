import React from 'react';
import Chat from './components/Chat';
import Inventory from './components/Inventory';
import Login from './components/Login';

function App() {
  return (
    <div className="App">
      <h1>Welcome to the Game</h1>
      <Login />
      <Inventory />
      <Chat />
    </div>
  );
}

export default App;