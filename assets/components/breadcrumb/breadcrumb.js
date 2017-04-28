controllers.controller('breadcrumbCtrl', function ($location, $rootScope, $http) {
  // the controller object
  var ctrl = this;
  ctrl.page = $location.path().split('/')[1];
  ctrl.breadcrumbs = [
    { 'name': 'Home', 'url': '#/' },
  ];
  $rootScope.$on('categoryUpdated', function (event, newCategory) {
    if (typeof newCategory == 'number') {
      // Was given the id of the category instead
      $http.get("/api/Categories/" + newCategory).then(function (response) {
        ctrl.category = response.data;
        ctrl.updateBreadcrumb();
      });
    }
    else {
      ctrl.category = newCategory;
      ctrl.updateBreadcrumb();
    }
  });

  $rootScope.$watch(function() {
    return JSON.stringify($rootScope.breadcrumbItems);
  }, function(newVal, oldVal){
    if(newVal == oldVal) return;
    var items = JSON.parse(newVal);
    ctrl.subject = items.subject || { };
    ctrl.category = items.category || { };
    ctrl.updateBreadcrumb();
  });

  ctrl.updateBreadcrumb = function () {
    switch (ctrl.page) {
      case 'Subject':
      ctrl.breadcrumbs[2] = {
        'name': ctrl.subject.name,
        'url': "#/Subject/" + $rootScope.padNumber(ctrl.subject.id)
      };
      case 'Category':
      ctrl.breadcrumbs[1] = {
        'name': ctrl.category.name,
        'url': "#/Category/" + $rootScope.padNumber(ctrl.category.id)
      };
      default: { }
    }
  };
});
