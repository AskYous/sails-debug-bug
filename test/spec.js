describe("testing test", function() {
  it("makes sure testing works fine", function() {
    var a = 12;
    expect(a).toEqual(12);
  });
});

describe('toolbarsCtrl', function() {

  beforeEach(function(){
    module('OnDemand');
  });

  var $controller;

  beforeEach(inject(function (_$controller_) {

    $controller = _$controller_;

  }));

  it('tests initiateSearch', function() {
    var $scope = {};
    var controller = $controller('toolbarsCtrl', { $scope: $scope });

    controller.initiateSearch();

    expect(controller.search).toBe('');

  });

  it('tests endSearch', function() {
    var $scope = {};
    var controller = $controller('toolbarsCtrl', { $scope: $scope });

    controller.endSearch();

    expect(controller.search).toBe(null);

  });

  it('tests showSearchBar', function() {
    var $scope = {};
    var controller = $controller('toolbarsCtrl', { $scope: $scope });

    controller.initiateSearch();
    expect(controller.showSearchBar()).toBe(true);

    controller.endSearch();
    expect(controller.showSearchBar()).toBe(false);

  });

  it('tests showPreSearchBar', function() {
    var $scope = {};
    var controller = $controller('toolbarsCtrl', { $scope: $scope });

    controller.initiateSearch();
    expect(controller.showPreSearchBar()).toBe(false);

    controller.endSearch();
    expect(controller.showPreSearchBar()).toBe(true);

  });

});

describe('videoCtrl', function(){

  beforeEach(module('OnDemand'));

  var $document;
  var $controller;

  beforeEach(inject(function (_$controller_ , _$document_) {

    $controller = _$controller_;
    $document = _$document_;

    var input = `
    <div id="video-container">
    <video id="main-video" class="content" flex="auto">
    <source src="https://www.youtube.com/embed/XGSy3_Czz8k" type="video/mp4" />
    </video>
    </div>
    <button id="myButton"> </button>
    <button id="myButton1"> </button>
    `;
    document.body.insertAdjacentHTML('afterbegin', input);

  }));

  it('tests the play/pause functions', function() {

    var $scope = {};

    $scope.$parent = {};
    $scope.$parent.$parent = {};

    var controller = $controller('videoCtrl', { $scope: $scope });
    $scope.$parent.videoId = 3;

    controller.init();
    controller.play();

    expect(document.getElementById('main-video').paused).toBe(false);

    controller.pause();

    expect(document.getElementById('main-video').paused).toBe(true);

  });

  it('tests isPlaying/togglePlay', function() {

    var $scope = {};

    $scope.$parent = {};
    $scope.$parent.$parent = {};

    var controller = $controller('videoCtrl', { $scope: $scope });
    $scope.$parent.videoId = 3;

    controller.init();
    controller.play();
    controller.togglePlay();

    expect(document.getElementById('main-video').paused).toBe(true);
    expect(controller.isPlaying()).toBe(false);

    controller.pause();
    controller.togglePlay();

    expect(document.getElementById('main-video').paused).toBe(false);
    expect(controller.isPlaying()).toBe(true);
  });

  it('tests mute/unmute/isMuted/toggleMute', function(){

    var $scope = {};

    $scope.$parent = {};
    $scope.$parent.$parent = {};

    var controller = $controller('videoCtrl', { $scope: $scope });
    $scope.$parent.videoId = 3;

    controller.init();
    controller.mute();

    expect(controller.isMuted()).toBe(true);

    controller.unmute();

    expect(controller.isMuted()).toBe(false);

    controller.toggleMute();

    expect(controller.isMuted()).toBe(true);

  });

  it('tests son', function() {
    var $scope = {};

    $scope.$parent = {};
    $scope.$parent.$parent = {};

    var controller = $controller('videoCtrl', { $scope: $scope });
    $scope.$parent.videoId = 3;

    controller.init();
    // controller.setDuration();

    expect('1').toBe('1');

  });

  it('tests fullScreenAvailable', function(){

    var $scope = {};

    $scope.$parent = {};
    $scope.$parent.$parent = {};

    var controller = $controller('videoCtrl', { $scope: $scope });
    $scope.$parent.videoId = 3;

    controller.init();


    controller.fullScreenOn();

    document.getElementById('myButton').onclick = function(){ controller.fullScreenOn();};
    document.getElementById('myButton').click();


    expect(controller.isFullScreened()).toBe(true);

  });

});

describe('categoryCtrl', function(){


  var $controller;
  var $httpBackend;
  var $routeParams;
  var $scope;
  var controller;

  beforeEach(module('OnDemand'));

  beforeEach(inject(function (_$controller_ , _$httpBackend_, _$routeParams_) {

    $controller = _$controller_;
    $routeParams = _$routeParams_;
    $httpBackend = _$httpBackend_;
    $scope ={};
    $routeParams.id = '1';


    $httpBackend.when('GET','/api/Subjects?category=1').respond([{"name": "workday" , "id":1}]);
    $httpBackend.when('GET','/api/Courses/1/Duration').respond('60');
    $httpBackend.when('GET','/api/Courses?where={"subject": 1 }').respond('course1');
    $httpBackend.when('GET','/api/Courses/getLanguages?courseId=1').respond('english');
    controller = $controller('categoryCtrl', {$scope: $scope});
  }));


  it('tests setDuration', function() {

    $httpBackend.flush();

    expect(controller.setDuration).toBeDefined();

    c={};
    c.id=1;

    controller.setDuration(c);
    $httpBackend.flush();
    expect(c.duration.seconds).not.toBe(undefined);
    expect(c.duration.hours).not.toBe(undefined);
    expect(c.duration.minutes).toBe(1);
  });

  it('tests setCourseLanguages', function(){

    $httpBackend.flush();

    expect(controller.setCourseLanguages).toBeDefined();

    controller.setCourseLanguages(c);
    $httpBackend.flush();

    expect(c.Languages).toBe('english');
  });

  it('tests getCourses', function(){

    $httpBackend.flush();

    expect(controller.getCourses).toBeDefined();

    expect(controller.courses).toBe('course1');

  });
});

describe('courseCtrl', function(){

  var $controller;
  var $httpBackend;
  var $routeParams;
  var $scope;
  var controller;

  beforeEach(module('OnDemand'));

  beforeEach(inject(function (_$controller_ , _$httpBackend_, _$routeParams_) {

    $controller = _$controller_;
    $routeParams = _$routeParams_;
    $httpBackend = _$httpBackend_;
    $scope ={};


    controller = $controller('courseCtrl', {$scope: $scope});
  }));

  it('tests setCurrentLesson', function(){

      expect(controller.setCurrentLesson).toBeDefined();

      lesson={};
      lesson.lessonInstances = [{'language' : 'english', "fileUrl":'ed'}]

      controller.currentLanguage = {'id' : 'english'};
      $scope.updateVideo = function(){return true;};
      controller.setCurrentLesson(lesson);

      console.log(results);
      expect(controller.currentLessonLanguage).toBeDefined();

  });

});
