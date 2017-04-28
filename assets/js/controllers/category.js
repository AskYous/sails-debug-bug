controllers.controller('categoryCtrl', function ($location, $routeParams, $http, $rootScope) {
  var ctrl = this;
  ctrl.sortBy = 'name';
  $http.get('/api/categoryPage/getCategory?category=' + $routeParams.id).then(function(response){
    ctrl.category = response.data;
    if(ctrl.category.subjects.length == 1) location.href = '/#/Subject/' + ctrl.category.subjects[0].id;
    $rootScope.$broadcast('categoryUpdated', ctrl.category);
  });
  ctrl.sortOptions = [
    { 'name': 'Title', 'value': 'name' },
    { 'name': 'Newest', 'value': 'releasedAt' },
    { 'name': 'Most Viewed', 'value': 'views' },
  ];
});
