// HTTP Class
var http = (function () {
  function http() {
    this.post = function (url, data) { };
  }
  return http;
}());

// Analytics Class
var Analytics = (function () {

  function Analytics(video, time) {
    var _this = this;
    this.submitted = false; // tells whether the stats were submitted. Does not include initial submission.
    this.video = video;
    this.$http = angular.injector(["ng"]).get("$http");

    this.analytics = [];
    this.analytics.push(new Analytic(Action.played, new Date(), time));

    // Submit initial analytic
    var initAnalytic = new Analytic(Action.played, new Date(), 0);
    initAnalytic.video = this.video;
    this.$http.post("/api/VideoAnalytics/InitAnalytic", initAnalytic).then(function (response) {
      console.log('Analytic ID:', response.data);
      _this.id = response.data;
    }, function (err) {
      console.error(err);
    });

  }

  /**
  * Adds an analytic to the current list of analytics
  */
  Analytics.prototype.addAnalytic = function (analytic) {
    this.analytics.push(analytic);
    this.logAnalytics();
  };

  /**
  * Function to set video duration
  */
  Analytics.prototype.setVideoDuration = function (duration) {
    this.videoDuration = duration;
  };

  /**
  * Logs the current analytics to the console
  */
  Analytics.prototype.logAnalytics = function () {
    var analytics = [];
    analytics = JSON.parse(JSON.stringify(this.analytics));
    analytics.forEach(function (a) { a.action = Action[a.action]; });
    if (console.table)
      console.table(analytics);
  };

  /**
  * Submits the analytics to the database
  */
  Analytics.prototype.submitAnalytics = function (async, finalVideoLocation) {
    var _this = this;
    if (this.submitted)
      throw "Error. Analytics already submitted.";
    if (this.getLastAnalytic().action != Action.paused && (finalVideoLocation === null || finalVideoLocation === undefined)) {
      throw "Error: Either the last analytic must be a 'pause' action or a final video location must be set";
    }
    if (this.getLastAnalytic().action != Action.paused) {
      var analytic = new Analytic(Action.paused, new Date(), finalVideoLocation);
      this.analytics.push(analytic);
    }
    var uri = "/api/VideoAnalytics/SubmitAnalytics";
    var analytics = {
      'id': this.id,
      'dropOffTime': this.getDropOffTime(),
      'video': this.video,
      'playStateDuration': this.getPlayStateDuration()
    };
    console.log('Submitting analytics to server.', analytics);
    if (!async) {
      var http_1 = new XMLHttpRequest();
      http_1.onreadystatechange = function (_) {
        if (http_1.readyState == 4 && http_1.status == 200) {
          _this.submitted = true;
          console.log('Analytics submitted.');
        }
      };
      http_1.open('POST', uri, false);
      http_1.setRequestHeader('Content-type', 'application/json;charset=UTF-8');
      http_1.send(JSON.stringify(analytics));
    }
    else {
      this.$http.post(uri, analytics).then(function (response) {
        _this.submitted = true;
        console.log('Analytics submitted.');
      }, function (err) { return console.error(err); });
    }
  };

  /**
  * Gets how long the video was in the play state for.
  */
  Analytics.prototype.getPlayStateDuration = function () {
    this.assertLastAnalyticIsPause();
    var playStateDuration = 0;

    // Only get play and paused events.
    var trimmed = this.analytics.filter(function (a) { return a.action == Action.paused || a.action == Action.played; });

    // Calculate
    for (var i = 1; i < trimmed.length; i += 2) {
      var played = trimmed[i].timestamp;
      var paused = trimmed[i - 1].timestamp;
      var difference = new Date(played.getTime() - paused.getTime());
      playStateDuration += difference.getTime() / 1000;
    }
    return playStateDuration;
  };

  Analytics.prototype.getDropOffTime = function () {
    this.assertLastAnalyticIsPause();
    return this.getLastAnalytic().videoTime;
  };

  Analytics.prototype.assertLastAnalyticIsPause = function () {
    // Confirm the last action is a 'Paused'
    var lastAction = this.analytics[this.analytics.length - 1].action;
    if (lastAction != Action.paused) {
      throw "Error: The last action in the analytics array must be a pause action. It is currently '" + Action[lastAction] + "'.";
    }
  };

  Analytics.prototype.getLastAnalytic = function () {
    return this.analytics[this.analytics.length - 1];
  };

  return Analytics;
}());
