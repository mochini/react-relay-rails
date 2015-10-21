import React from 'react';
import Router, {Route, Redirect, Handler, DefaultRoute, NotFoundRoute, HistoryLocation} from 'react-router';
import App from './app/module.jsx';

var routes = (
  <Route handler={App}>

  </Route>
);

// For the dev tools
window.React = React;

Router.run(routes, Router.HistoryLocation, function (Handler, state) {
  React.render((
    <Handler {...state.params}/>
  ), document.getElementById("app"));
});
