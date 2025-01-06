import React from 'react';
import Chat from './components/Chat';
import Inventory from './components/Inventory';
import Login from './components/Login';
import Register from './components/Register';

function App() {
  return (
    <div className="App">
      <h1>Welcome to the Game</h1>
      <Register />
      <Login />
      <Inventory />
      <Chat />
    </div>
  );
}

export default App;