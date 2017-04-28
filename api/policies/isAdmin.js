module.exports = function isAdmin(req, res, next) {
  // Check if authenticated
  if (!req.isAuthenticated()) {
    sails.config.forwardUrl = req.url;
    return res.redirect('/#/login');
  }

  sails.models.users.findOne({'IDPid': req.user.id})
  .populate('role')
  .exec(function(err, user){
    if(err) {
      sails.error('That user doesn\'t exist in our database.');
      return res.send(500);
    }

      if(user.role.name.toLowerCase() == 'admin'){
        next(); // at this point, the user is an admin.
      } else {
        return res.send(403); // User is not an admin.
      }

  });
};
