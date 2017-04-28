var app = angular.module('OnDemand', [
    'ngMaterial',
    'ngRoute',
    'Routes',
    'Controllers',
    'Filters',
    'Components',
]);
app.run(function ($rootScope, $http) {
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
    $rootScope.breadcrumbItems = {};
    /**
    * Sets the languages in the root scope. When called, it fetches the
    * languages and stores it in $rootScope.languages.
    * @param {Function} next Callback function to run after the languages are set.
    */
    $rootScope.setLanguages = function (next) {
        $rootScope.gettingLanguages = true;
        $http.get('/api/shared/languages').then(function (results) {
            $rootScope.languages = results.data;
            if (next)
                next();
        }, function (error) { return console.error(error); });
    };
    /**
    * Sets the visibility levels in the root scope. When called, it fetches the
    * visibility levels and stores it in $rootScope.visibilityLevels.
    * @param {Function} next Callback function to run after the visibility languages are set.
    */
    $rootScope.setVisibilityLevels = function (next) {
        $rootScope.gettingVisibilityLevels = true;
        $http.get('/api/shared/visibilityLevels').then(function (results) {
            $rootScope.visibilityLevels = results.data;
            if (next)
                next();
        }, function (error) { console.error(error); });
    };
    $rootScope.setUser = function (requireLogin, next) {
        $rootScope.gettingUser = true;
        $http.get('/user').then(function (response) {
            if (response.data === '') {
                // Then user is not signed in.
                if (requireLogin)
                    $rootScope.login();
            }
            else {
                if (next)
                    next();
                $rootScope.user = response.data;
            }
        }, function (error) { console.error(error); });
    };
    $rootScope.padNumber = function (number) {
        if (number === undefined || number === null)
            throw 'You must pass a number in the parameter!';
        var length = number.toString().length;
        var characters = 5;
        var paddedNumber = number.toString();
        while (paddedNumber.length < characters) {
            paddedNumber = '0' + paddedNumber;
        }
        return paddedNumber;
    };
    (function init() {
        if (!$rootScope.languages && !$rootScope.gettingLanguages) {
            $rootScope.setLanguages();
        }
        if (!$rootScope.visibilityLevels && !$rootScope.gettingVisibilityLevels) {
            $rootScope.setVisibilityLevels();
        }
    })();
});
//# sourceMappingURL=app.js.map