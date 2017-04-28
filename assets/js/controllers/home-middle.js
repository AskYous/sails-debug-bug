// Controller for the middle part of the home page
controllers.controller('middleCtrl', function ($scope, $rootScope, $http) {
  var ctrl = this;
  var numOfCrslItems = 10;
  ctrl.carousels = [{
    'title': 'Featured Subjects',
    'items': [],
  }, {
    'title': 'Resources',
    'urlTarget': '_blank',
    'items': [{
      'name': 'Knowledge Network',
      'url': 'https://knvideos.flextronics.com/knowledgenetwork/',
      'img': '/images/resources/KN-no-text-lg.png'
    }, {
      'name': 'FlexU',
      'url': 'http://intranet.flextronics.com/asp/flextalent_sso.asp',
      'img': '/images/resources/flex-u.jpg'
    }, {
      'name': 'FlexWiki',
      'url': 'http://wiki.flextronics.com/',
      'img': '/images/resources/flex-wiki.png'
    }, {
      'name': 'IT Knowledgebase',
      'url': 'https://flextronics.service-now.com/eui2/index.do',
      'img': '/images/resources/service-now.jpg'
    }, {
      'name': 'Yammer',
      'url': 'https://www.yammer.com/flextronics.com/',
      'img': '/images/resources/yammer.png'
    }, {
      'name': 'SharePoint',
      'url': 'https://flextronics365.sharepoint.com',
      'img': '/images/resources/sharepoint-2013.png'
    }]
  }];
  $http.get("/api/home/newSubjects").then(function (response) {
    response.data.forEach(function (item) {
      var visibilityLevel = $rootScope.visibilityLevels.filter(function(vl) {
        return vl.id == item.visibilityLevel;
      })[0];
      ctrl.carousels[0].items.push({
        'name': item.name,
        'img': item.thumbnailSmallUrl,
        'url': "#/Subject/" + item.id,
        'visibilityLevel': visibilityLevel, // for admin overlay
      });
    });
  }, function (error) {
    console.error(error);
  });
});
