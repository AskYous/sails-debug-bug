var components = angular.module('Components', []);

components.component('subjectTile', {
  'templateUrl': '/components/subject-tile/subject-tile.html',
  'controller': 'subjectTileCtrl',
  'bindings': {
    'subject': '='
  }
});
components.component('contentRow', {
  'templateUrl': '/components/content-row/content-row.html',
  'bindings': {
    'contentType': '=',
    'content': '=',
    'thumbnailCaption': '='
  },
  'controller': function($http, $rootScope) {
    var ctrl = this;
    var singularNames = {
      'categories': 'category',
      'subjects': 'subject',
      'courses': 'course',
      'lessons': 'lesson'
    };
    var typeSingular = singularNames[ctrl.contentType.toLowerCase()];

    ctrl.url = null;
    ctrl.duration = null;
    ctrl.currentInstance = null;
    ctrl.content = ctrl.content; // for ternjs
    ctrl.contentType = ctrl.contentType; // for ternjs
    ctrl.imageCaption = ctrl.imageCaption; // for ternjs
    ctrl.instances = ctrl.content[typeSingular + 'Instances'];

    ctrl.changeInstance = function(instance){
      ctrl.currentInstance = instance;
      updateInstanceInfo();
    };
    ctrl.getDescription = function(instance){
      return instance.descriptionShort || instance.descriptionLong || ctrl.content.descriptionShort || ctrl.content.descriptionLong;
    };
    ctrl.getInstanceLanguage = function(instance) {
      return $rootScope.languages.filter(function(l) {
        return l.id == instance.language;
      })[0];
    };
    ctrl.getParentsForCurrentLessonInstance = function(){
      if(typeSingular != 'lesson') return;
      if(!ctrl.content.course.courseInstances) return;
      if(!ctrl.content.course.subject.subjectInstances) return;
      if(!ctrl.content.course.subject.category.categoryInstances) return;

      var courseInstance = ctrl.content.course.courseInstances.filter(function(instance){ return instance.language == ctrl.currentInstance.language; })[0];
      var subjectInstance = ctrl.content.course.subject.subjectInstances.filter(function(instance){ return instance.language == ctrl.currentInstance.language; })[0];
      var categoryInstance = ctrl.content.course.subject.category.categoryInstances.filter(function(instance){ return instance.language == ctrl.currentInstance.language; })[0];

      if(!courseInstance) courseInstance = ctrl.content.course.courseInstances[0];
      if(!subjectInstance) subjectInstance = ctrl.content.course.subject.subjectInstances[0];
      if(!categoryInstance) categoryInstance = ctrl.content.course.subject.category.categoryInstances[0];

      return {
        'courseInstance': courseInstance,
        'subjectInstance': subjectInstance,
        'categoryInstance': categoryInstance,
      };
    };

    $rootScope.$on('languageUpdated', function(event, updatedLanguageId){
      var instances = ctrl.instances.filter(function(instance){ return instance.language == updatedLanguageId; });
      if(instances.length == 1) ctrl.changeInstance(instances[0]);
    });

    (function setThumbnailUrl(){
      if(ctrl.content.course) {
        var course = ctrl.content.course;
        ctrl.thumbnailUrl =
          ctrl.content.course.thumbnailSmallUrl ||
          ctrl.content.course.thumbnailLargeUrl;
        if(!ctrl.thumbnailUrl){
          ctrl.thumbnailUrl =
          ctrl.content.course.subject.thumbnailSmallUrl ||
          ctrl.content.course.subject.thumbnailLargeUrl;
        }
      } else {
        ctrl.thumbnailUrl = ctrl.content.thumbnailSmallUrl || ctrl.content.thumbnailLargeUrl;
        if(!ctrl.thumbnailUrl) {
          if(ctrl.content.subject){
            ctrl.thumbnailUrl = ctrl.content.subject.thumbnailSmallUrl || ctrl.content.subject.thumbnailLargeUrl;
          }
        }
      }
    })();
    (function setCurrentInstance() {
      var englishInstances = ctrl.instances.filter(function(instance) {
        return instance.language == 1;
      });
      if (englishInstances.length > 0) {
        ctrl.currentInstance = englishInstances[0]; // default to english
      } else {
        ctrl.currentInstance = ctrl.instances[0]; // default to first one
      }
      updateInstanceInfo();
    })();
    (function setAdminOverlayText() {
      ctrl.adminOverlayText = $rootScope.visibilityLevels.filter(function(vl) {
        var visibilityLevel;
        if (typeof ctrl.currentInstance.visibilityLevel == 'object') {
          visibilityLevel = ctrl.currentInstance.visibilityLevel.id;
        } else {
          visibilityLevel = ctrl.currentInstance.visibilityLevel;
        }
        return vl.id == visibilityLevel;
      })[0].name;
    })();
    /**
     * Updates the info for the view that is not specific to the content, but
     * rather the content instance.
     * @method updateInstanceInfo
     */
    function updateInstanceInfo(){
      (function updateDuration(){
        var url = '/api/contentrow/instanceDuration?type=' + typeSingular + '&instance=' + ctrl.content.id + '&language=' + ctrl.currentInstance.language;
        $http.get(url).then(function(result){
          ctrl.duration = result.data;
        });
      })();
      (function updateUrl(){
        switch (typeSingular) {
          case 'category':
          ctrl.url = '/#/' + typeSingular + '/' + $rootScope.padNumber(ctrl.content.id);
          break;
          case 'subject':
          ctrl.url = '/#/Subject/' + $rootScope.padNumber(ctrl.content.id) + '?language=' + $rootScope.padNumber(ctrl.currentInstance.language);
          break;
          case 'course':
          ctrl.url = '/#/Subject/' + $rootScope.padNumber(ctrl.content.subject.id) + '?course=' + $rootScope.padNumber(ctrl.content.id) + '&language=' + $rootScope.padNumber(ctrl.currentInstance.language);
          break;
          case 'lesson':
          ctrl.url = '/#/Subject/' + $rootScope.padNumber(ctrl.content.course.subject.id) + '?lesson=' + $rootScope.padNumber(ctrl.content.id) + '&language=' + $rootScope.padNumber(ctrl.currentInstance.language);
          break;
          default:
          ctrl.url = '/#/' + typeSingular + '/' + $rootScope.padNumber(ctrl.currentInstance.id);
        }
      })();
      if(typeSingular == 'lesson'){
        (function updateParentInstances(){

          var course = ctrl.content.course;
          var subject = course.subject;
          var category = subject.category;
          var languageId = ctrl.currentInstance.language;

          var courseInstance;
          var subjectInstance;
          var categoryInstance;

          if(!course.courseInstances || !subject.subjectInstances || !category.categoryInstances) getDataFromServer();
          else {
            courseInstances = course.courseInstances.filter(function(instance){ return instance.language == languageId; });
            subjectInstances = subject.subjectInstances.filter(function(instance){ return instance.language == languageId; });

            // translating categories is not yet supported.
            // categoryInstances = category.categoryInstances.filter(function(instance){ return instance.language == languageId; });
            categoryInstances = category.categoryInstances.filter(function(instance){ return instance.name.toLowerCase() == 'english'; });


            if(courseInstances.length !== 1 || subjectInstances.length !== 1 || categoryInstances.length !== 1) getDataFromServer();
            // Else do nothing since the view can take care of the rest.
          }

          function getDataFromServer(){
            var url = ['/api/ContentRow/getParentInstances?course=', course.id, '&subject=', subject.id, '&category=', category.id, '&language=', languageId].join('');
            $http.get(url).then(function(response){
              if(response.data.courseInstance){
                if(!ctrl.content.course.courseInstances) ctrl.content.course.courseInstances = [response.data.courseInstance];
                else ctrl.content.course.courseInstances.push(response.data.courseInstance);
              }
              if(response.data.subjectInstance){
                if(!ctrl.content.course.subject.subjectInstances) ctrl.content.course.subject.subjectInstances = [response.data.subjectInstance];
                else ctrl.content.course.subject.subjectInstances.push(response.data.subjectInstance);
              }
              if(response.data.categoryInstance){
                if(!ctrl.content.course.subject.category.categoryInstances) ctrl.content.course.subject.category.categoryInstances = [response.data.categoryInstance];
                else ctrl.content.course.subject.category.categoryInstances.push(response.data.categoryInstance);
              }
            });
          }
        })();
      }
    }
  }
});
components.component('videoPlayer', {
  'templateUrl': '/components/video-player/video-player.html',
  'controller': 'videoPlayerCtrl',
  'bindings': {
    'url': '=',
    // The url of the video
    'poster': '=',
    // The poster image of the video
    'analyticsVideoId': '=',
    // The video id for analytics
    'shareUrl': '=',
    // The url when a user clicks share
    'feedbackUrl': '=',
    // The url when a user clicks feedback
    'fixedHeight': '=',
    // Whether to keep the video at a fixed height
    'skipping': '=',
    // Whether to show skipping buttons
    'standardElements': '=',
    // Standard elements for standard lessons (like scorm lessons)
  }
});
components.component('categoryTile', {
  'templateUrl': '/components/category-tile/category-tile.html',
  'controller': 'categoryTileCtrl',
  'bindings': {
    'category': '='
  }
});
components.component('breadcrumb', {
  'templateUrl': '/components/breadcrumb/breadcrumb.html',
  'controller': 'breadcrumbCtrl',
  'bindings': {
    'adminOverlayText': '=',
  }
});
components.component('adminOverlay', {
  'templateUrl': '/components/admin-overlay/admin-overlay.html',
  'controller': 'adminOverlayCtrl',
  'bindings': {
    'visibilityLevelId': '=',
    'fade': '='
  }
});
components.component('carousel', {
  'templateUrl': '/components/carousel/carousel.html',
  'controller': 'carouselCtrl',
  'bindings': {
    'carousel': '='
  }
});
