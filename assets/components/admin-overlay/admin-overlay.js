controllers.controller('adminOverlayCtrl', function ($scope, $rootScope, $element) {
  ctrl = this;
  ctrl.scopeId = $scope.$id;
  ctrl.visibilityLevel = $rootScope.visibilityLevels.filter(function(vl){
    return vl.id == ctrl.visibilityLevelId;
  })[0];
  ctrl.lightColor = getColor(false);
  ctrl.darkColor = getColor(true);
  ctrl.showOverlay = showOverlay();

  if(!ctrl.showOverlay){
    $element[0].style.display = 'none';
  }

  // Confirm or set the parent node has style position set to relative
  if($element[0].parentElement.style.position != 'relative'){
    $element[0].parentElement.style.position = 'relative';
  }

  /**
   * Determines whether the text should be dsiplayed.
   * @method showText
   * @return {Boolean} Whether the text should be displayed.
   */
  ctrl.showText = function(){
    if ($element[0].getClientRects().length === 0) return false;
    var width = $element[0].getClientRects()[0].width;
    var height = $element[0].getClientRects()[0].height;
    var acceptedMargin = 0.3;
    var minHeight = 100;
    var minWidth = 100;
    var ratio = width / height;

    if(width < minWidth || height < minHeight){
      return false;
    }

    if(ratio < (1 - acceptedMargin) || ratio > (1 + acceptedMargin)){
      return false;
    }

    return true;
  };

  /**
  * Determines whether to show the overlay.
  * @method showOverlay
  * @return {Boolean} Whether the visibility level is public
  */
  function showOverlay(){
    return ctrl.visibilityLevel.name.toLowerCase() != 'public';
  }

  /**
   * Creates a color string for CSS.
   * @param   {boolean} heavy Whether the color should be heavy or not.
   * @return  {string}  The color in rgba format.
   */
  function getColor(heavy){
    var opacity = heavy ? 0.6 : 0.3;
    return 'rgba(255, 0, 0, ' + opacity + ')'; // red
  }

});
