controllers.controller('carouselCtrl', function ($interval, $element) {
  var ctrl = this;

  ctrl.interval = null;
  ctrl.isMoving = false;

  ctrl.startScroll = function (direction) {
    if (ctrl.isMoving) return; // it's already moving.
    var scrollable = $element[0].getElementsByClassName('cards')[0];
    var startTime = new Date().getTime(); // in milliseconds
    var duration = 500; // milliseconds
    var speed = 10;

    ctrl.isMoving = true;
    ctrl.interval = $interval(function () {
      // If it's been long enough
      if (new Date().getTime() > startTime + duration) {
        ctrl.stopScroll(); // stop the carousel
      }
      else {
        var oldScrollPosition = scrollable.scrollLeft;
        scrollable.scrollLeft += speed * direction;
        (function fadeButtonsIfNeeded(){
          var atStart = scrollable.scrollLeft === 0;
          var atEnd = scrollable.scrollLeft == oldScrollPosition && scrollable.scrollLeft !== 0;
          var rightButton = $element[0].getElementsByClassName('right-button')[0];
          var leftButton = $element[0].getElementsByClassName('left-button')[0];
          if(atStart){
            leftButton.style.opacity = 0;
          }
          if(atEnd){
            rightButton.style.opacity = 0;
          }
          if(!atStart && !atEnd){
            leftButton.style.opacity = 1;
            rightButton.style.opacity = 1;
          }
        })();
      }
    }, 1);
  };
  ctrl.stopScroll = function () {
    ctrl.isMoving = false;
    $interval.cancel(ctrl.interval);
  };

});
