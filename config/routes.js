// jshint esversion: 6
const request = require("request");
const passport = require('./passport.js').passport;
let forwardUrl = null;
let authenticate = passport.authenticate('auth0', { failureRedirect: '/url-if-something-fails' });

const isAdmin = require('../api/policies/isAdmin');
const noCache = require('../api/policies/no-cache');
const requiresLogin = require('../api/policies/requiresLogin');

module.exports.routes = {
  /**
  * Route handler for the home page.
  */
  '/': function (req, res) {
    res.sendfile('assets/index.html');
  },
  /**
  * Part 2 of the Login. Auth0 sends users here with their retrieved information.
  */
  '/callback': [authenticate, function (req, res) {
    if (!req.user) {
      throw error("User not authenticated.");
    }
    if(sails.config.forwardUrl){
      res.redirect(sails.config.forwardUrl);
      sails.config.forwardUrl = '/'; // reset it.
    } else {
      res.redirect("/");
    }
  }],
  '/logout': (req, res) => {
    req.logOut();
    req.logout();
    res.clearCookie('sid', {path: '/'});
    req.session.destroy(function (err) {
      res.clearCookie('sid', {path: '/'});
      res.redirect('/'); //Inside a callback… bulletproof! (says some guy on the internet.)
    });
  },
  /**
  * Route for setting the forward URL after user signs in. The forward URL is
  * where the user is forwarded to after successful authentication. Ultimately,
  * this should be used to send the user back to their previous screen before
  * they tried to logged in.
  */
  '/setForwardUrl': function(req, res){
    if(req.query.url){
      sails.config.forwardUrl = req.query.url;
    }
    res.send(200, 'ok.');
  },
  /**
  * This just responds with a JSON object of the current user.
  * TODO: Make this also return the record ID of the user in our database.
  */
  '/user': [noCache, function (req, res) {
    if (req.isAuthenticated()) {
      sails.models.users.findOne({'IDPid': req.user.id}).exec(function(error, user){
        if(error) return sails.error(error);
        user.IDPData = req.user;
        res.json(user);
      });
    }
    else {
      res.send(204, 'No user data.');
    }
  }],
  /**
  * This is the route to the admin page. The admin page is the page used to
  * manage the data in the current database. The user must be an admin to
  * access this page
  */
  '/admin': [isAdmin, function (req, res) {
    res.sendfile('assets/admin.html');
  }],
  /**
  * For AWS's load balancer. The loadbalancer can use this route to check
  * if the instance is alive.
  */
  '/heartbeat': function (req, res) {
    res.write("I am alive.");
    res.end();
  },
  /**
  * Used for production on AWS. This route returns the EC2 instance ID.
  */
  '/instance': function (req, res) {
    let uri = "http://169.254.169.254/latest/meta-data/ami-id";
    request({
      uri: uri,
      method: "GET",
      timeout: 3000,
      followRedirect: true,
      maxRedirects: 10
    }, function (error, response, body) {
      if (error) {
        res.write('Error. Can\'t get ' + uri + '.');
        res.end();
        console.error('Error. Can\'t get ' + uri + '.');
      }
      else {
        res.write(JSON.stringify(body));
        res.end();
      }
    });
  }
};
