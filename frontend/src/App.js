import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import InitialScreen from './components/InitialScreen';
import Register from './components/Register';
import Login from './components/Login';

function App() {
  return (
    <Router>
      <div className="App">
        <Switch>
          <Route path="/" exact component={InitialScreen} />
          <Route path="/register" component={Register} />
          <Route path="/login" component={Login} />
        </Switch>
      </div>
    </Router>
  );
}

export default App;