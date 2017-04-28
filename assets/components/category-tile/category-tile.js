controllers.controller('categoryTileCtrl', function ($http, $rootScope) {
  var ctrl = this;

  if(!$rootScope.visibilityLevels) $rootScope.getVisibilityLevels(afterVisibilityLevelsIsSet);
  else afterVisibilityLevelsIsSet();

  function afterVisibilityLevelsIsSet(){
    ctrl.visibilityLevel = $rootScope.visibilityLevels.filter(function(vl) {
      return vl.id == ctrl.category.visibilityLevel;
    })[0];
    ctrl.showAdminOverlay = ctrl.visibilityLevel.name.toLowerCase() != 'public';
    ctrl.adminOverlayText = ctrl.visibilityLevel.name;
    ctrl.url = '/#/Category/' + $rootScope.padNumber(ctrl.category.id);
  }

});
