/// <reference path="../../js/controllers/main.ts" />
/**
 * Determines if a string ends with the given suffix.
 * @param  {string} word   The word to check.
 * @param  {string} suffix The suffix
 * @return {Boolean}       Whether the given word ends with the given suffix;
 */
function endsWith(word, suffix) {
    "use strict";
    return word.lastIndexOf(suffix) === word.length - suffix.length;
}
controllers.controller("videoPlayerCtrl", function ctrl($scope, $interval, $http, $rootScope, $element) {
    var ctrl = this;
    var video;
    ctrl.error = false; // a state variable that tells whether there is currently an error.
    ctrl.errorFunction = function (e) {
        ctrl.error = true;
        if (document.querySelector("iframe")) {
            document.querySelector("iframe").src = "";
        }
        console.error("\n" + e);
    };
    // create update function for parent controllers
    (function () {
        /**
         * Updates the video content to another video.
         * @param  {Object} settings  The settings for the video
         */
        ctrl.updateVideo = function (settings) {
            if (!ctrl.error) {
                if (video instanceof VideoLesson || video instanceof CaptivateHTMLVideo) {
                    if (ctrl.began) {
                        ctrl.submitAnalytics();
                    }
                    if (video) {
                        video.unload();
                    }
                }
            }
            ctrl.error = false;
            Object.keys(settings).forEach(function (key) {
                ctrl[key] = settings[key];
            });
            ctrl.init();
        };
        /**
         * Give the parent scope ability to update the video.
         * Two $parent calls were made since an ng-if was used, and that creates another child scope.
         * @type {Function}
         */
        $scope.$parent.$parent.updateVideo = ctrl.updateVideo;
        $rootScope.$on("lessonInstanceUpdated", function (event, newVal) {
            ctrl.updateVideo(newVal.videoSettings);
        });
    })();
    // create controller functions for view
    (function () {
        /**
         * Tells whether to use the video tag
         * @param  {string} url The URL of the video.
         * @return {Boolean} Whether to use the video tag.
         */
        ctrl.useVideoTag = function () {
            var url = ctrl.url;
            if (ctrl.error) {
                return false;
            }
            var videoTypes = ["mp4", "webm"];
            if (url) {
                var useVideoTag = false;
                for (var i = 0; i < videoTypes.length; i++) {
                    useVideoTag = endsWith(url, "." + videoTypes[i]);
                    if (useVideoTag) {
                        break;
                    }
                }
                return useVideoTag;
            }
            else {
                return false;
            }
        };
        /**
         * Tells whether to use the IFrame tag
         * @param  {string} url The URL of the video.
         * @return {bool} Whether to use the IFrame tag.
         */
        ctrl.useIFrameTag = function () {
            var url = ctrl.url;
            if (ctrl.error) {
                return false;
            }
            if (url) {
                return endsWith(url, ".html") || endsWith(url, "xml") || endsWith(url, ".au");
            }
            else {
                return false;
            }
        };
    })();
    ctrl.init = function () {
        // if the page redirect isn't complete, return. This init function should run again after the redirect is complete.
        if (document.querySelectorAll("video-player").length === 0) {
            return;
        }
        var videoElement;
        // setVideoElement
        (function () {
            var query;
            if (ctrl.useVideoTag(ctrl.url)) {
                query = "video.main-video";
            }
            if (ctrl.useIFrameTag(ctrl.url)) {
                query = "iframe.main-video";
            }
            var videos = document.querySelectorAll(query);
            if (videos.length === 0) {
                return null;
            }
            videoElement = videos.length > 1 ? videos[1] : videos[0];
        })();
        if (!videoElement) {
            console.log("No video element found. Perhaps the page is still loading. Returning.");
        }
        if (!ctrl.error) {
            ctrl.began = false; // represents whether the video began playing. Only turns true when the user plays the video.
            ctrl.videoHeight = null;
            // setCtrlFieldsAndFunctions
            (function () {
                ctrl.currentTime = 0;
                ctrl.scrubLeft = -1000; // cuz lynda.com said so
                ctrl.isDragging = false;
                /**
                 * Skips the video forward.
                 * @method skipForward
                 */
                ctrl.skipForward = function () {
                    if (video instanceof VideoLesson || video instanceof CaptivateHTMLVideo) {
                        var currentTime = video.getCurrentTime();
                        video.setCurrentTime(currentTime + 10);
                    }
                };
                /**
                 * Rewinds to zero.
                 * @method rewindToZero
                 */
                ctrl.rewindToZero = function () {
                    if (video instanceof VideoLesson || video instanceof CaptivateHTMLVideo) {
                        video.setCurrentTime(0);
                    }
                };
                /**
                 * Skips the video back.
                 * @method skipForward
                 */
                ctrl.skipBack = function () {
                    if (video instanceof VideoLesson || video instanceof CaptivateHTMLVideo) {
                        var currentTime = video.getCurrentTime();
                        video.setCurrentTime(currentTime - 10);
                    }
                };
                /**
                 * If the init function was passed a analyticsVideoId, this function
                 * initializes the analytics object. Technically, it just creates a
                 * placeholder record in the db.
                 * NOTE: This function must be called before using the analytics object.
                 */
                ctrl.initAnalytics = function () {
                    if (video instanceof VideoLesson || video instanceof CaptivateHTMLVideo) {
                        if (ctrl.error) {
                            return;
                        }
                        if (ctrl.analyticsVideoId) {
                            console.log("Tracking video analytics for current video.");
                        }
                        else {
                            return console.log("Not tracking video analytics for current video.");
                        }
                        ctrl.analytics = new Analytics(ctrl.analyticsVideoId, video.getCurrentTime());
                        window.onbeforeunload = function () {
                            if (ctrl.analytics) {
                                ctrl.submitAnalytics(false);
                            }
                        };
                    }
                };
                /**
                 * Adds an analytic to the current list of analytics
                 * @param {Action} action The action that happened.
                 */
                ctrl.addAnalytics = function (action) {
                    if (video instanceof VideoLesson || video instanceof CaptivateHTMLVideo) {
                        if (ctrl.error) {
                            return;
                        }
                        if (!ctrl.analytics) {
                            return;
                        }
                        var analytic = new Analytic(action, new Date(), video.getCurrentTime());
                        analytic.action = action;
                        analytic.timestamp = new Date();
                        analytic.videoTime = video.getCurrentTime();
                        ctrl.analytics.addAnalytic(analytic);
                        ctrl.analytics.logAnalytics();
                    }
                };
                /**
                 * Checks if analytics are to be tracked, then submits the analytics to the
                 * server if it is.
                 * @param  {Boolean} useAsync Whether to submit it asynchronously or not.
                 */
                ctrl.submitAnalytics = function (useAsync) {
                    if (!ctrl.analytics) {
                        return;
                    } // because not tracking analytics.
                    if (ctrl.analytics.submitted) {
                        return;
                    } // because analytics have already been submitted.
                    if (video instanceof VideoLesson || video instanceof CaptivateHTMLVideo) {
                        ctrl.analytics.submitAnalytics(useAsync, video.getCurrentTime());
                    }
                };
                ctrl.videoContainer = document.getElementById("video-container");
                var onLoadFunction = function () {
                    var playerContainer = $element[0].querySelector("div.player");
                    // set fixed player height
                    if (ctrl.fixedHeight) {
                        if (!ctrl.videoHeight) {
                            if (ctrl.useIFrameTag() && ctrl.url.endsWith("imsmanifest.xml")) {
                                ctrl.videoHeight = 600;
                            }
                            else if (ctrl.useVideoTag()) {
                                var videoElement_1 = $element[0].querySelector("video");
                                var videoHeight = videoElement_1.videoHeight;
                                var videoWidth = videoElement_1.videoWidth;
                                var playerContainerWidth = playerContainer.clientWidth;
                                ctrl.videoHeight = (videoHeight * playerContainerWidth) / videoWidth;
                            }
                            else {
                                ctrl.videoHeight = playerContainer.clientHeight;
                            }
                            document.getElementsByClassName("player")[0].style.height = ctrl.videoHeight + "px";
                        }
                    }
                    if (video instanceof VideoLesson || video instanceof CaptivateHTMLVideo) {
                        ctrl.duration = video.duration;
                        ctrl.currentTime = 0;
                        video.onTimeUpdate(function () {
                            if (video instanceof VideoLesson || video instanceof CaptivateHTMLVideo) {
                                var t = video.getCurrentTime();
                                var d = video.duration;
                                ctrl.scrubLeft = (t / d) * 100;
                                ctrl.currentTime = t;
                                $scope.$apply();
                            }
                        });
                        // if user is logged in
                        if ($rootScope.user) {
                            $http.get("/user").then(function (results) {
                                var userId = results.data.id;
                                // set the video current time where the user last left off
                                if (ctrl.analyticsVideoId) {
                                    var url = "/api/VideoAnalytics?user=" +
                                        userId + "&video=" + ctrl.analyticsVideoId +
                                        "&sort=createdAt desc&limit=1";
                                    $http.get(url).then(function (results) {
                                        if (results.data.length === 0) {
                                            return;
                                        }
                                        var lastPlayBackLocation = results.data[0].dropOffTime;
                                        if (video instanceof VideoLesson || video instanceof CaptivateHTMLVideo) {
                                            video.setCurrentTime(lastPlayBackLocation);
                                        }
                                    }, function (error) { return console.error(error); });
                                }
                            }, function (error) { return console.error(error); });
                        }
                    }
                    $scope.$apply();
                };
                var contentConfig = {
                    htmlElement: videoElement,
                    videoUrl: ctrl.url,
                    posterImgUrl: ctrl.poster,
                    onload: onLoadFunction,
                    errorFunction: ctrl.errorFunction,
                    contentId: ctrl.analyticsVideoId,
                    standardElements: ctrl.standardElements
                };
                if ($rootScope.user) {
                    contentConfig.userId = $rootScope.user.id;
                }
                video = ContentFactory.createLesson(contentConfig);
                ctrl.usesPlayBar = video instanceof VideoLesson || video instanceof CaptivateHTMLVideo;
            })();
            // createVideoEventHandlers
            (function () {
                if (video instanceof VideoLesson || video instanceof CaptivateHTMLVideo) {
                    video.load();
                }
                if (video instanceof VideoLesson || video instanceof CaptivateHTMLVideo) {
                    video.onEnd(function () {
                        $scope.$apply(); // tell angular to refresh scope.
                        ctrl.submitAnalytics(false);
                    });
                }
            })();
            // createVideoPlaybackControlFunctions
            (function () {
                // function to play the video
                ctrl.play = function () {
                    if (video instanceof VideoLesson || video instanceof CaptivateHTMLVideo) {
                        video.play();
                        // tODO: Make this more efficient. Shouldn't run the if statement every time.
                        // if video hasn't been played before in this session, than initialize analytic.
                        if (!ctrl.began) {
                            ctrl.began = true;
                            ctrl.initAnalytics();
                        }
                        else {
                            ctrl.addAnalytics(Action.played);
                        }
                    }
                };
                /**
                 * Pauses the video.
                 */
                ctrl.pause = function () {
                    if (video instanceof VideoLesson || video instanceof CaptivateHTMLVideo) {
                        video.pause();
                        ctrl.addAnalytics(Action.paused);
                    }
                };
                /**
                 * Tells whether the video is current in the playing state.
                 * @return {Boolean} [description]
                 */
                ctrl.isPlaying = function () {
                    if (video instanceof VideoLesson || video instanceof CaptivateHTMLVideo) {
                        return video.isPlaying();
                    }
                };
                /**
                 * Toggles the video to play or pause.
                 */
                ctrl.togglePlay = function () {
                    if (ctrl.isPlaying()) {
                        ctrl.pause();
                    }
                    else {
                        ctrl.play();
                    }
                };
                /**
                 * Mutes the video
                 */
                ctrl.mute = function () {
                    ctrl.addAnalytics(Action.muted);
                    if (video instanceof VideoLesson || video instanceof CaptivateHTMLVideo) {
                        video.mute();
                    }
                };
                /**
                 * Function to unmute the video
                 */
                ctrl.unmute = function () {
                    ctrl.addAnalytics(Action.unmuted);
                    if (video instanceof VideoLesson || video instanceof CaptivateHTMLVideo) {
                        video.unmute();
                    }
                };
                /**
                 * Function to tell if video is muted
                 */
                ctrl.isMuted = function () {
                    if (video instanceof VideoLesson || video instanceof CaptivateHTMLVideo) {
                        return video.isMuted();
                    }
                };
                /**
                 * Function to toggle mute
                 */
                ctrl.toggleMute = function () {
                    if (ctrl.isMuted()) {
                        ctrl.unmute();
                    }
                    else {
                        ctrl.mute();
                    }
                };
                /**
                 * Function to tell if full screen mode is supported
                 */
                ctrl.fullScreenAvailable = function () {
                    return document.fullscreenEnabled ||
                        document.msFullscreenEnabled ||
                        document.mozFullScreenEnabled ||
                        document.webkitFullscreenEnabled;
                };
                /**
                 * Function to launch fullscreen mode
                 */
                ctrl.fullScreenOn = function () {
                    var v = $element[0].getElementsByClassName("video-container")[0];
                    if (v.requestFullscreen) {
                        v.requestFullscreen();
                    }
                    if (v.mozRequestFullScreen) {
                        v.mozRequestFullScreen();
                    }
                    if (v.webkitRequestFullScreen) {
                        v.webkitRequestFullScreen();
                    }
                    if (v.webkitRequestFullscreen) {
                        v.webkitRequestFullscreen();
                    }
                    if (v.msRequestFullscreen) {
                        v.msRequestFullscreen();
                    }
                    else {
                        console.error("Fullscreen not available in this browser");
                    }
                };
                /**
                 * Function to turn fullscreen mode off
                 */
                ctrl.fullScreenOff = function () {
                    if (document.webkitExitFullscreen) {
                        document.webkitExitFullscreen();
                    }
                    if (document.mozCancelFullScreen) {
                        document.mozCancelFullScreen();
                    }
                    if (document.msExitFullscreen) {
                        document.msExitFullscreen();
                    }
                    if (document.exitFullscreen) {
                        document.exitFullscreen();
                    }
                };
                /**
                 * Function to tell if the video is in fullscreen mode
                 */
                ctrl.isFullScreened = function () {
                    if (document.fullscreenElement) {
                        if (document.fullscreenElement.id === "video-container") {
                            return true;
                        }
                    }
                    if (document.webkitFullscreenElement) {
                        if (document.webkitFullscreenElement.id === "video-container") {
                            return true;
                        }
                    }
                    if (document.msFullscreenElement) {
                        if (document.msFullscreenElement.id === "video-container") {
                            return true;
                        }
                    }
                    if (document.mozFullScreenElement) {
                        if (document.mozFullScreenElement.id === "video-container") {
                            return true;
                        }
                    }
                    if (document.webkitFullscreenElement) {
                        if (document.webkitFullscreenElement.id === "video-container") {
                            return true;
                        }
                    }
                    return false;
                };
                /**
                 * Function to toggle full screen mode on the video.
                 */
                ctrl.toggleFullScreen = function () {
                    if (!ctrl.isFullScreened()) {
                        ctrl.fullScreenOn();
                    }
                    else {
                        ctrl.fullScreenOff();
                    }
                };
                /**
                 * Seek video
                 */
                ctrl.seek = function ($event) {
                    var width = document.getElementById("progress-bar").offsetWidth;
                    var position = $event.offsetX;
                    var percentage = position / width;
                    if (video instanceof VideoLesson || video instanceof CaptivateHTMLVideo) {
                        video.setCurrentTime(video.duration * percentage);
                    }
                };
            })();
            // createMouseEventsForVideoProgressBar
            (function () {
                /**
                 * Handles the mouse move event over the video controls.
                 * @param  {event} $event The event that took place.
                 */
                ctrl.mousemove = function ($event) {
                    if (ctrl.isDragging) {
                        ctrl.seek($event);
                    }
                };
                /**
                 * Handles the mouse up event over the video controls.
                 * @param  {event} $event The event that took place.
                 */
                ctrl.mouseup = function ($event) {
                    ctrl.isDragging = false;
                    ctrl.seek($event);
                    ctrl.addAnalytics(Action.endedSeek);
                };
                /**
                 * Handles the mouse down event over the video controls.
                 * @param  {event} $event The event that took place.
                 */
                ctrl.mousedown = function ($event) {
                    ctrl.addAnalytics(Action.startedSeek);
                    ctrl.isDragging = true;
                    ctrl.seek($event);
                };
                /**
                 * Handles the mouse leave event over the video controls.
                 * @param  {event} $event The event that took place.
                 */
                ctrl.mouseleave = function ($event) {
                    if (ctrl.isDragging) {
                        ctrl.isDragging = false;
                        ctrl.seek($event);
                        ctrl.addAnalytics(Action.endedSeek);
                    }
                };
                /**
                 * Handles the mouse enter event over the video controls.
                 * @param  {event} $event The event that took place.
                 */
                ctrl.mouseenter = function ($event) {
                    if (ctrl.isDragging) {
                        ctrl.isDragging = false;
                        ctrl.seek($event);
                    }
                };
            })();
            // setFullScreenEventHandler
            (function () {
                // event handler for when video is fullscreenEnabled
                var fullScreenChanged = function (event) {
                    var isFullScreened = ctrl.isFullScreened();
                    var vcStyle = $element[0].getElementsByClassName("video-container")[0].style;
                    var player = $element[0].getElementsByClassName("player")[0];
                    if (isFullScreened) {
                        // force full screen
                        vcStyle.width = "100%";
                        vcStyle.height = "100%";
                        player.style.height = "100%";
                    }
                    else {
                        // reset the heights
                        vcStyle.width = "";
                        vcStyle.height = "";
                        player.style.height = ctrl.videoHeight + "px";
                    }
                };
                document.fullscreenchange = fullScreenChanged;
                document.MSFullscreenChange = fullScreenChanged;
                document.onmozfullscreenchange = fullScreenChanged;
                document.onwebkitfullscreenchange = fullScreenChanged;
            })();
            // set height.
            (function () {
                if (ctrl.fixedHeight) {
                    if (ctrl.useIFrameTag()) {
                        $element[0].getElementsByClassName("player")[0].style.height = "600px";
                        // because iframe lessons usually adapt their size to the starting height
                    }
                }
            })();
            // set onDestroyed event handler
            (function () {
                // when user leaves page
                $scope.$on("$destroy", function () {
                    console.log("User left page");
                    if (ctrl.began) {
                        ctrl.submitAnalytics();
                    }
                    if (ctrl.video) {
                        video.unload();
                    }
                    video.htmlElement.setAttribute("data-destroyed", "true");
                });
            })();
        }
    };
});
//# sourceMappingURL=video-player.js.map