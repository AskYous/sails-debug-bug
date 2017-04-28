/* jshint esversion: 6 */
var passport = require('passport');
var Auth0Strategy = require('passport-auth0');
let callbackUrl;

(function getCallbackUrl() {
  const environment = process.env.NODE_ENV;

  // If dev environment
  if (!environment || environment == 'development') {
    let local = {};
    try {
      local = require('./local').port;
    } catch (e) {
      local = {};
    }

    const development = require('./env/development.js');
    let port;

    // Get port number
    if (local.port) port = local.port;
    else port = development.port;

    // Create callback url
    if (port == 80) callbackUrl = 'localhost/callback';
    else callbackUrl = `http://localhost:${port}/callback`;

    // Production environment
  } else {
    // callbackUrl = 'http://www.flyhightraining.com/callback';
    callbackUrl = 'https://www.flyhightraining.com/callback';
  }

})();

// Configuration for Auth0
var config = {
  domain: 'mlgyshan.auth0.com',
  clientID: 'IvsoTfbQJAieFsSB9ZKUGLykBHUaa5iU',
  clientSecret: 'L6jRFd6wbnliiQ5A0Yync8hNFekZ5WeyDk_ZqA9n7UIfKpMALVFKF6d582qJNfr2',
  callbackURL: callbackUrl
};

// Tell Auth0 how to verify user (and make sure the user's not hacking)
// accessToken is the token to call Auth0 API (not needed in the most cases)
// extraParams.id_token has the JSON Web Token
// profile has all the information from the user
var verify = function (accessToken, refreshToken, extraParams, profile, done) {
  // console.log(profile);
  done(null, profile);
};

// Bootstrap authentication strategy
var strategy = new Auth0Strategy(config, verify);

// Tell passport to use this authentication method
passport.use(strategy);

// This is not a best practice, but we want to keep things simple for now - says Auth0
passport.serializeUser(function (user, done) {
  done(null, user);

  // Add the user to the database if not already in.
  var storedUser = null;
  Users.findOne({
    "IDPid": user.id
  }).exec(function (err, finn) {
    if (err) console.error(err);
    else if (!finn) {
      console.log('Creating user');
      Users.create({
        'IDPid': user.id,
        'name': user.name.givenName + " " + user.name.familyName,
        'email': user.emails[0].value
      }).exec(function (err, created) {
        if (err) console.error('Error creating user.', err);
        else console.log('Created user', created);
      });
    }
  });
});

passport.deserializeUser(function (user, done) {
  done(null, user);
});

module.exports.passport = passport;
