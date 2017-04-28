var filters = angular.module('Filters', []);

filters.filter("trustUrl", ['$sce', function ($sce) {
  return function (recordingUrl) {
    return $sce.trustAsResourceUrl(recordingUrl);
  };
}]);

filters.filter('timeDisplay', function ($filter) {
  return function (time) {
    if (time === undefined) return '0m 0s';
    var date = new Date(0, 0, 0, 0, 0, time, 0);
    var minutes = date.getMinutes().toString();
    var seconds = date.getSeconds().toString();
    var hours = date.getHours().toString();
    var timeDisplay = seconds + 's';
    if (minutes != '0') {
      timeDisplay = minutes + 'm ' + timeDisplay;
    }
    if (hours != '0') {
      timeDisplay = hours + 'h ' + timeDisplay;
    }
    return timeDisplay;
  };
});

filters.filter('timeDisplayFriendly', function ($filter) {
  return function (time) {
    if (time === undefined) return '00:00';
    var date = new Date(0, 0, 0, 0, 0, time, 0);
    var minutes = date.getMinutes().toString();
    var seconds = date.getSeconds().toString();
    var hours = date.getHours().toString();
    // Padding to make it double digits (0 -> 00)
    if (minutes.toString().length == 1)
    minutes = '0' + minutes;
    if (seconds.toString().length == 1)
    seconds = '0' + seconds;
    if (hours != '0') {
      if (hours.toString().length == 1)
      hours = '0' + hours;
    }
    var timeDisplay = minutes + ":" + seconds;
    if (hours != '0') {
      timeDisplay = hours + ":" + timeDisplay;
    }
    return timeDisplay;
  };
});
