var React = require('react'),
    Router = require('react-router'),
    Route = Router.Route,
    DefaultRoute = Router.DefaultRoute,
    NotFoundRoute = Router.NotFoundRoute,

    App = require('./App.jsx'),
    About = require('./About.jsx'),
    Governer = require('./Governer.jsx'),
    PromiseDetail = require('./Promise.jsx'),
    Home = require('./Home.jsx');

module.exports = (
  <Route name="app" handler={App} path="/">
    <Route name="about" handler={About} />
    <Route name="governer" path="/governer/:name" handler={Governer} />
    <Route name="promise" path="/promise/:id" handler={PromiseDetail} />
    <DefaultRoute handler={Home} />
  </Route>
);