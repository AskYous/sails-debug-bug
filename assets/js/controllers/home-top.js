// Controller for the top part of the home page
controllers.controller('topCtrl', function ($scope, $http) {
  var ctrl = this;

  ctrl.videoSettings = {
    'url': 'https://s3-us-west-2.amazonaws.com/ondemand-assets/Mike+McNamara++Connected+Conversations++Flex.mp4',
    'poster': '/images/FlyHighThumbnail-Globe_Yellow.jpg'
  };

  $http.get('/api/home/categories').then(function (results) {
    ctrl.tiles = results.data;
  }, function (error) {
    console.error(error);
  });

});
