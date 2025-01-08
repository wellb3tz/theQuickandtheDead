import React, { useEffect } from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import InitialScreen from './components/InitialScreen';
import Register from './components/Register';
import Login from './components/Login';
import Inventory from './components/Inventory';
import Chat from './components/Chat';
import PostLogin from './components/PostLogin';
import WastelandConfirmation from './components/WastelandConfirmation';
import Wasteland from './components/Wasteland';
import Options from './components/Options';
import { ChatProvider } from './contexts/ChatContext';
import './western-theme.css';
import gunshotSound from './sounds/gunshot.mp3'; // Ensure you have this sound file

const App = () => {
  useEffect(() => {
    const handleShot = (e) => {
      // Play gunshot sound
      const audio = new Audio(gunshotSound);
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
  }, []);

  return (
    <ErrorBoundary>
      <ChatProvider>
        <Router basename="/theQuickandtheDead">
          <div className="App">
            <Switch>
              <Route path="/" exact component={InitialScreen} />
              <Route path="/register" component={Register} />
              <Route path="/login" component={Login} />
              <Route path="/inventory" component={Inventory} />
              <Route path="/chat" component={Chat} />
              <Route path="/post-login" component={PostLogin} />
              <Route path="/wasteland-confirmation" component={WastelandConfirmation} />
              <Route path="/wasteland" component={Wasteland} />
              <Route path="/options" component={Options} />
            </Switch>
          </div>
        </Router>
      </ChatProvider>
    </ErrorBoundary>
  );
};

export default App;