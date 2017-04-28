var routes = angular.module('Routes', []);
routes.config(['$routeProvider', function ($routeProvider) {
  $routeProvider.
  when('/', {
    'templateUrl': '/html/home.html'
  }).
  when('/Category/:id', {
    'templateUrl': '/html/category.html',
    'reloadOnSearch': false
  }).
  when('/category/:id', {
    'templateUrl': '/html/category.html',
    'reloadOnSearch': false
  }).
  when('/categories/:id', {
    'templateUrl': '/html/category.html',
    'reloadOnSearch': false
  }).
  when('/subjects/:id', {
    'redirectTo': function (p) { return "/Subject/" + p.id; }
  }).
  when('/Subject/:subject', {
    'templateUrl': '/html/subject.html',
    'reloadOnSearch': false
  }).
  when('/subjects/:subject', {
    'redirectTo': function (p) { return "/Subject/" + p.course; }
  }).
  when('/Lesson/:id', {
    'redirectTo': function (params) {
      var newRoute = null;
      $.ajax({
        url: "api/Lessons/" + params.id,
        success: function (response) {
          console.log(response);
          newRoute = "/Course/" + response.course.id + "?lesson=" + params.id;
        },
        async: false
      });
      return newRoute;
    }
  }).
  when('/lessons/:id', {
    'redirectTo': function (p) { return "/Lesson/" + p.id; }
  }).
  when('/search', {
    'templateUrl': '/html/search.html'
  }).
  when('/login', {
    'templateUrl': '/html/login.html',
  });
}]);
