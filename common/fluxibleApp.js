// Fluxible app instance

var Fluxible = require('fluxible');

var fluxibleApp = new Fluxible();

fluxibleApp.registerStore(require('./stores/MetaStore'));
fluxibleApp.registerStore(require('./stores/RouteStore'));

module.exports = fluxibleApp;
