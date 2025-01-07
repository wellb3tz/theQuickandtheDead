import React from 'react';
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
import { ChatProvider } from './contexts/ChatContext';

function App() {
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
            </Switch>
          </div>
        </Router>
      </ChatProvider>
    </ErrorBoundary>
  );
}

export default App;