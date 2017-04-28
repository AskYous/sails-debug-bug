// an Analytic

// analytic Class
var Analytic = (function () {
    function Analytic(action, timestamp, videoTime) {
        this.action = action;       // the action that took place
        this.timestamp = timestamp; // when the action took place
        this.videoTime = videoTime; // what part of the video the action took place
    }
    return Analytic;
}());
