import React from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import InitialScreen from './components/InitialScreen';
import Register from './components/Register';
import Login from './components/Login';
import Inventory from './components/Inventory';
import Chat from './components/Chat';
import PostLogin from './components/PostLogin';

function App() {
  return (
    <ErrorBoundary>
      <Router basename="/theQuickandtheDead">
        <div className="App">
          <Switch>
            <Route path="/" exact component={InitialScreen} />
            <Route path="/register" component={Register} />
            <Route path="/login" component={Login} />
            <Route path="/inventory" component={Inventory} />
            <Route path="/chat" component={Chat} />
            <Route path="/post-login" component={PostLogin} />
          </Switch>
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;