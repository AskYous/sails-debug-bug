// Toolbar controller
controllers.controller('toolbarsCtrl', function ($http, $scope, $rootScope, $location, $routeParams) {
  var ctrl = this;

  // Search stuff
  ctrl.search = null;
  ctrl.endSearch = function () { ctrl.search = null; };
  ctrl.initiateSearch = function () { ctrl.search = $routeParams.query || ''; };
  ctrl.showSearchBar = function () { return ctrl.search !== null; };
  ctrl.showPreSearchBar = function () { return ctrl.search === null; };
  ctrl.submit = function () {
    $location.url("search?query=" + ctrl.search);
    ctrl.endSearch();
  };
  $scope.$watch(function () {
    return document.querySelector('#searchBar:not(.ng-hide)');
  }, function (newVal, oldVal) {
    var wasHidden = newVal !== null;
    var isHidden = oldVal !== null;
    if (wasHidden && !isHidden) document.getElementById('search').focus();
  });
  ctrl.menu = {}; // Menu data
  // Function to handle when user clicks 'browse courses'
  ctrl.openMenu = function ($mdOpenMenu, $event) {

    // If categories hasn't been loaded yet
    if (!ctrl.categories) {
      // Load categories
      $http.get("/api/home/browseCourses").then(function (categories) {
        // Save categories
        ctrl.categories = categories.data;
        // Set the selected category to the first category.
        ctrl.menu.category = ctrl.categories[0];
        $mdOpenMenu($event);
      });
    }
    else {
      $mdOpenMenu($event);
    }
  };
  ctrl.openUserMenu = function ($mdOpenMenu, $event) {
    $mdOpenMenu($event);
  };
  // Sets the menu's selected category
  ctrl.setMenuCategory = function (c) {
    ctrl.menu.category = c;
  };
  ctrl.getCategoryUrl = function(category){
    return '#/Category/' + $rootScope.padNumber(category.id);
  };
  ctrl.toggleMobileMenu = function ($mdOpenMenu, $event) {
    $mdOpenMenu($event);
  };
  var lock = new Auth0Lock('IvsoTfbQJAieFsSB9ZKUGLykBHUaa5iU', 'mlgyshan.auth0.com');
  ctrl.signin = function () {
    var url = encodeURIComponent($location.absUrl());
    var port = '';
    if (location.port !== '')
    port = ":" + location.port;
    // Forward user back to where they are now
    if ($location.path() != '/login') {
      $http.get("/setForwardUrl?url=" + url).then(function (response) { return console.log(response); }, function (error) { return console.error(error); });
    }
    // Display the signin box
    lock.show({
      callbackURL: location.protocol + "//" + location.hostname + port + "/callback",
      responseType: 'code',
      authParams: {
        scope: 'openid email' // Learn about scopes: https://auth0.com/docs/scopes
      }
    });
  };
  ctrl.signout = function(){
    window.location = '/logout';
  };
  $rootScope.login = ctrl.signin; // make this function available to other controllers.
  // Get current user if logged in
  $http.get('/user').then(function (res) {
    if (res.status == 204) {
      ctrl.user = null;
    }
    else {
      ctrl.user = res.data;
      $rootScope.user = res.data;
    }
  });
});
