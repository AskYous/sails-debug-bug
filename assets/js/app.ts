var app = angular.module('OnDemand', [
  'ngMaterial',   // Material Design UI Framework. This is never used in JS Code so it can be mentally ignored.
  'ngRoute',      // A module used to handling routing
  'Routes',       // routes.ts Another module used to handle routing
  'Controllers',  // controllers/main.ts Controllers used throughout the project. See controllers.ts
  'Filters',      // filters.ts Filters used throughtout the project. Used mainly for a fix to a problem in angular about URLs. Can be mentally ignored for now.
  'Components',   // components.ts Components the project. See components.ts.
]);

app.run(function ($rootScope: angular.IRootScopeService, $http: angular.IHttpService) {
  /**
  * Whether the root scope is currently getting languages or not.
  * @type {Boolean}
  */
  $rootScope.gettingLanguages = false;
  $rootScope.gettingVisibilityLevels = false;
  $rootScope.gettingUser = false;
  /**
  * The items of the breadcrumb used by the breadcrumb component
  * @type {Object}
  */
  $rootScope.breadcrumbItems = { };
  /**
  * Sets the languages in the root scope. When called, it fetches the
  * languages and stores it in $rootScope.languages.
  * @param {Function} next Callback function to run after the languages are set.
  */
  $rootScope.setLanguages = function(next){
    $rootScope.gettingLanguages = true;
    $http.get('/api/shared/languages').then(function (results) {
      $rootScope.languages = results.data;
      if (next) next();
    }, function (error) { return console.error(error); });
  };
  /**
  * Sets the visibility levels in the root scope. When called, it fetches the
  * visibility levels and stores it in $rootScope.visibilityLevels.
  * @param {Function} next Callback function to run after the visibility languages are set.
  */
  $rootScope.setVisibilityLevels = function(next){
    $rootScope.gettingVisibilityLevels = true;
    $http.get('/api/shared/visibilityLevels').then(function(results){
      $rootScope.visibilityLevels = results.data;
      if(next) next();
    }, function(error) { console.error(error); });
  };
  $rootScope.setUser = function(requireLogin, next){
    $rootScope.gettingUser = true;
    $http.get('/user').then(function(response){
      if(response.data === ''){
        // Then user is not signed in.
        if(requireLogin) $rootScope.login();
      } else {
        if(next) next();
        $rootScope.user = response.data;
      }
    }, function(error){ console.error(error); });
  };
  $rootScope.padNumber = function(number){
    if(number === undefined || number === null) throw 'You must pass a number in the parameter!';
    var length = number.toString().length;
    var characters = 5;
    var paddedNumber = number.toString();
    while(paddedNumber.length < characters){
      paddedNumber = '0' + paddedNumber;
    }
    return paddedNumber;
  };
  (function init(){
    if (!$rootScope.languages && !$rootScope.gettingLanguages) {
      $rootScope.setLanguages();
    }
    if (!$rootScope.visibilityLevels && !$rootScope.gettingVisibilityLevels) {
      $rootScope.setVisibilityLevels();
    }
  })();
});

