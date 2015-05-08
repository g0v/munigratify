require('babel/register');

var loopback = require('loopback'),
    boot = require('loopback-boot'),
    expressState = require('express-state'),
    app = module.exports = loopback();

// Passport configurators..
var loopbackPassport = require('loopback-component-passport');
var PassportConfigurator = loopbackPassport.PassportConfigurator;
var passportConfigurator = new PassportConfigurator(app);

// Catch all unhandled promise rejections and print error.
// Ref: https://iojs.org/api/process.html#process_event_unhandledrejection
//
process.on('unhandledRejection', function(reason, promise) {
  if (reason.stack) {
    // Error object, has stack info
    console.error('[Unhandled Rejection]', reason.stack);
  } else {
    console.error('[Unhandled Rejection] Reason:', reason);
  }
  console.error('[Unhandled Rejection] Promise:', promise);
});

/**
 * Flash messages for passport
 *
 * Setting the failureFlash option to true instructs Passport to flash an
 * error message using the message given by the strategy's verify callback,
 * if any. This is often the best approach, because the verify callback
 * can make the most accurate determination of why authentication failed.
 */
var flash = require('express-flash');

// attempt to build the providers/passport config
var config = {};
try {
	config = require('../providers.json');
} catch (err) {
	console.trace(err);
	process.exit(1); // fatal
}

// Bootstrap the application, configure models, datasources and middleware.
// Sub-apps like REST API are mounted via boot scripts./
//
// Middlewares should go to middleware.json.
// Docs: https://gist.github.com/bajtos/e7eaba736ff096916b71
//
boot(app, __dirname);
expressState.extend(app);

// The access token is only available after boot
app.use(loopback.token({
  model: app.models.accessToken
}));

app.use(loopback.cookieParser(app.get('cookieSecret')));
app.use(loopback.session({
	secret: 'kitty',
	saveUninitialized: true,
	resave: true
}));
passportConfigurator.init();

// We need flash messages to see passport errors
app.use(flash());

passportConfigurator.setupModels({
	userModel: app.models.user,
	userIdentityModel: app.models.userIdentity,
	userCredentialModel: app.models.userCredential
});
for (var s in config) {
	var c = config[s];
	c.session = c.session !== false;
	passportConfigurator.configureProvider(s, c);
}
var ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn;

app.get('/', function (req, res, next) {
  res.render('pages/index', {user:
    req.user,
    url: req.url
  });
});

app.get('/auth/account', ensureLoggedIn('/login'), function (req, res, next) {
  res.render('pages/loginProfiles', {
    user: req.user,
    url: req.url
  });
});

app.get('/link/account', ensureLoggedIn('/login'), function (req, res, next) {
  res.render('pages/linkedAccounts', {
    user: req.user,
    url: req.url
  });
});

app.get('/local', function (req, res, next){
  res.render('pages/local', {
    user: req.user,
    url: req.url
  });
});

app.get('/signup', function (req, res, next){
  res.render('pages/signup', {
    user: req.user,
    url: req.url
  });
});

app.post('/signup', function (req, res, next) {

  var User = app.models.user;

  var newUser = {};
  newUser.email = req.body.email.toLowerCase();
  newUser.username = req.body.username.trim();
  newUser.password = req.body.password;

  User.create(newUser, function (err, user) {
    if (err) {
      req.flash('error', err.message);
      return res.redirect('back');
    } else {
      // Passport exposes a login() function on req (also aliased as logIn())
      // that can be used to establish a login session. This function is
      // primarily used when users sign up, during which req.login() can
      // be invoked to log in the newly registered user.
      req.login(user, function (err) {
        if (err) {
          req.flash('error', err.message);
          return res.redirect('back');
        }
        return res.redirect('/auth/account');
      });
    }
  });
});

app.get('/login', function (req, res, next){
  res.render('pages/login', {
    user: req.user,
    url: req.url
   });
});

app.get('/link', function (req, res, next){
  res.render('pages/link', {
    user: req.user,
    url: req.url
  });
});

app.get('/auth/logout', function (req, res, next) {
  req.logout();
  res.redirect('/');
});

app.start = function() {
  // start the web server
  return app.listen(function() {
    app.emit('started');
    console.log('Web server listening at: %s', app.get('url'));
  });
};

// start the server if `$ node server.js`
if (require.main === module) {
  app.start();
}
