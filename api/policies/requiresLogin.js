module.exports = function requiresLogin(req, res, next) {
  if (!req.isAuthenticated()) {
    return res.redirect('/#/login');
  }
  next();
}
