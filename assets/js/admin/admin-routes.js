var routes = angular.module('Routes', []);
routes.config(['$routeProvider', function ($routeProvider) {
        $routeProvider.
            when('/:model', {
            'templateUrl': '/html/admin/templates/model-list.html'
        }).
            when('/:model/details/:id', {
            'templateUrl': '/html/admin/templates/model-add-create.html'
        }).
            when('/:model/Create', {
            'templateUrl': '/html/admin/templates/model-add-create.html'
        }).
            when('/', {
            'redirectTo': '/Categories'
        }).
            otherwise({
            redirectTo: '/404'
        });
    }]);
