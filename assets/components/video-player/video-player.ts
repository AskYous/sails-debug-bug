/// <reference path="../../js/controllers/main.ts" />

/**
 * Determines if a string ends with the given suffix.
 * @param  {string} word   The word to check.
 * @param  {string} suffix The suffix
 * @return {Boolean}       Whether the given word ends with the given suffix;
 */
function endsWith(word: string, suffix: string): boolean {
  "use strict";
  return word.lastIndexOf(suffix) === word.length - suffix.length;
}
controllers.controller("videoPlayerCtrl", function ctrl(
  $scope: angular.IScope,
  $interval: angular.IIntervalService,
  $http: angular.IHttpService,
  $rootScope: angular.IRootScopeService,
  $element: angular.IRootElementService
): void {
  const ctrl: any = this;
  let video: Content;
  ctrl.error = false; // a state variable that tells whether there is currently an error.
  ctrl.errorFunction = e => {
    ctrl.error = true;
    if (document.querySelector("iframe")) {
      document.querySelector("iframe").src = "";
    }
    console.error("\n" + e);
  };
  // create update function for parent controllers
  (() => {
    /**
     * Updates the video content to another video.
     * @param  {Object} settings  The settings for the video
     */
    ctrl.updateVideo = (settings: any) => {
      if (!ctrl.error) {
        if (video instanceof VideoLesson || video instanceof CaptivateHTMLVideo) {
          if (ctrl.began) { ctrl.submitAnalytics(); }
          if (video) { video.unload(); }
        }
      }
      ctrl.error = false;
      Object.keys(settings).forEach((key: string) => {
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
    $rootScope.$on("lessonInstanceUpdated", (event: angular.IAngularEvent, newVal: any) => {
      ctrl.updateVideo(newVal.videoSettings);
    });
  })();

  // create controller functions for view
  (() => {
    /**
     * Tells whether to use the video tag
     * @param  {string} url The URL of the video.
     * @return {Boolean} Whether to use the video tag.
     */
    ctrl.useVideoTag = () => {
      let url: string = ctrl.url;
      if (ctrl.error) { return false; }
      let videoTypes: string[] = ["mp4", "webm"];
      if (url) {
        let useVideoTag: boolean = false;
        for (let i: number = 0; i < videoTypes.length; i++) {
          useVideoTag = endsWith(url, "." + videoTypes[i]);
          if (useVideoTag) { break; }
        }
        return useVideoTag;
      } else {
        return false;
      }
    };

    /**
     * Tells whether to use the IFrame tag
     * @param  {string} url The URL of the video.
     * @return {bool} Whether to use the IFrame tag.
     */
    ctrl.useIFrameTag = () => {
      let url: string = ctrl.url;
      if (ctrl.error) { return false; }
      if (url) {
        return endsWith(url, ".html") || endsWith(url, "xml") || endsWith(url, ".au");
      } else {
        return false;
      }
    };
  })();
  ctrl.init = () => {
    // if the page redirect isn't complete, return. This init function should run again after the redirect is complete.
    if (document.querySelectorAll("video-player").length === 0) { return; }

    let videoElement: HTMLElement;
    // setVideoElement
    (() => {
      let query: string;
      if (ctrl.useVideoTag(ctrl.url)) { query = "video.main-video"; }
      if (ctrl.useIFrameTag(ctrl.url)) { query = "iframe.main-video"; }
      let videos: NodeListOf<HTMLElement> = <NodeListOf<HTMLElement>>document.querySelectorAll(query);
      if (videos.length === 0) { return null; }
      videoElement = videos.length > 1 ? videos[1] : videos[0];
    })();
    if (!videoElement) {
      console.log("No video element found. Perhaps the page is still loading. Returning.");
    }
    if (!ctrl.error) {
      ctrl.began = false; // represents whether the video began playing. Only turns true when the user plays the video.
      ctrl.videoHeight = null;
      // setCtrlFieldsAndFunctions
      (() => {
        ctrl.currentTime = 0;
        ctrl.scrubLeft = -1000; // cuz lynda.com said so
        ctrl.isDragging = false;
        /**
         * Skips the video forward.
         * @method skipForward
         */
        ctrl.skipForward = () => {
          if (video instanceof VideoLesson || video instanceof CaptivateHTMLVideo) {
            let currentTime: number = video.getCurrentTime();
            video.setCurrentTime(currentTime + 10);
          }
        };
        /**
         * Rewinds to zero.
         * @method rewindToZero
         */
        ctrl.rewindToZero = () => {
          if (video instanceof VideoLesson || video instanceof CaptivateHTMLVideo) {
            video.setCurrentTime(0);
          }
        };
        /**
         * Skips the video back.
         * @method skipForward
         */
        ctrl.skipBack = () => {
          if (video instanceof VideoLesson || video instanceof CaptivateHTMLVideo) {
            let currentTime: number = video.getCurrentTime();
            video.setCurrentTime(currentTime - 10);
          }
        };
        /**
         * If the init function was passed a analyticsVideoId, this function
         * initializes the analytics object. Technically, it just creates a
         * placeholder record in the db.
         * NOTE: This function must be called before using the analytics object.
         */
        ctrl.initAnalytics = () => {
          if (video instanceof VideoLesson || video instanceof CaptivateHTMLVideo) {
            if (ctrl.error) { return; }

            if (ctrl.analyticsVideoId) {
              console.log("Tracking video analytics for current video.");
            } else {
              return console.log("Not tracking video analytics for current video.");
            }

            ctrl.analytics = new Analytics(ctrl.analyticsVideoId, video.getCurrentTime());
            window.onbeforeunload = () => {
              if (ctrl.analytics) { ctrl.submitAnalytics(false); }
            };
          }
        };
        /**
         * Adds an analytic to the current list of analytics
         * @param {Action} action The action that happened.
         */
        ctrl.addAnalytics = (action: Action) => {
          if (video instanceof VideoLesson || video instanceof CaptivateHTMLVideo) {
            if (ctrl.error) { return; }
            if (!ctrl.analytics) { return; }

            let analytic: Analytic = new Analytic(action, new Date(), video.getCurrentTime());
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
        ctrl.submitAnalytics = (useAsync: boolean) => {
          if (!ctrl.analytics) { return; } // because not tracking analytics.
          if (ctrl.analytics.submitted) { return; } // because analytics have already been submitted.

          if (video instanceof VideoLesson || video instanceof CaptivateHTMLVideo) {
            ctrl.analytics.submitAnalytics(useAsync, video.getCurrentTime());
          }
        };
        ctrl.videoContainer = document.getElementById("video-container");
        const onLoadFunction: () => void = () => {
          let playerContainer: HTMLDivElement = <HTMLDivElement>$element[0].querySelector("div.player");
          // set fixed player height
          if (ctrl.fixedHeight) {
            if (!ctrl.videoHeight) {
              if (ctrl.useIFrameTag() && ctrl.url.endsWith("imsmanifest.xml")) {
                ctrl.videoHeight = 600;
              } else if (ctrl.useVideoTag()) {

                let videoElement: HTMLVideoElement = $element[0].querySelector("video");
                let videoHeight: number = videoElement.videoHeight;
                let videoWidth: number = videoElement.videoWidth;
                let playerContainerWidth: number = playerContainer.clientWidth;

                ctrl.videoHeight = (videoHeight * playerContainerWidth) / videoWidth;
              } else {
                ctrl.videoHeight = playerContainer.clientHeight;
              }
              (<HTMLElement>document.getElementsByClassName("player")[0]).style.height = ctrl.videoHeight + "px";
            }
          }
          if (video instanceof VideoLesson || video instanceof CaptivateHTMLVideo) {
            ctrl.duration = video.duration;
            ctrl.currentTime = 0;
            video.onTimeUpdate(() => {
              if (video instanceof VideoLesson || video instanceof CaptivateHTMLVideo) {
                let t: number = video.getCurrentTime();
                let d: number = video.duration;
                ctrl.scrubLeft = (t / d) * 100;
                ctrl.currentTime = t;
                $scope.$apply();
              }
            });
            // if user is logged in
            if ($rootScope.user) {
              $http.get("/user").then((results) => {
                let userId: number = (<any>results.data).id;

                // set the video current time where the user last left off
                if (ctrl.analyticsVideoId) {
                  const url: string =
                    "/api/VideoAnalytics?user=" +
                    userId + "&video=" + ctrl.analyticsVideoId +
                    "&sort=createdAt desc&limit=1";
                  $http.get(url).then((results) => {
                    if ((<any>results.data).length === 0) { return; }
                    let lastPlayBackLocation: number = (<any>results.data)[0].dropOffTime;
                    if (video instanceof VideoLesson || video instanceof CaptivateHTMLVideo) {
                      video.setCurrentTime(lastPlayBackLocation);
                    }
                  }, error => console.error(error));
                }

              }, (error) => console.error(error));
            }
          }
          $scope.$apply();
        };
        const contentConfig: IContentConfig = {
          htmlElement: videoElement,
          videoUrl: ctrl.url,
          posterImgUrl: ctrl.poster,
          onload: onLoadFunction,
          errorFunction: ctrl.errorFunction,
          contentId: ctrl.analyticsVideoId,
          standardElements: ctrl.standardElements,
        };
        if ($rootScope.user) {
          contentConfig.userId = $rootScope.user.id;
        }
        video = ContentFactory.createLesson(contentConfig);
        ctrl.usesPlayBar = video instanceof VideoLesson || video instanceof CaptivateHTMLVideo;
      })();
      // createVideoEventHandlers
      (() => {
        if (video instanceof VideoLesson || video instanceof CaptivateHTMLVideo) {
          video.load();
        }
        if (video instanceof VideoLesson || video instanceof CaptivateHTMLVideo) {
          video.onEnd(() => {
            $scope.$apply(); // tell angular to refresh scope.
            ctrl.submitAnalytics(false);
          });
        }
      })();
      // createVideoPlaybackControlFunctions
      (() => {
        // function to play the video
        ctrl.play = () => {
          if (video instanceof VideoLesson || video instanceof CaptivateHTMLVideo) {
            video.play();
            // tODO: Make this more efficient. Shouldn't run the if statement every time.
            // if video hasn't been played before in this session, than initialize analytic.
            if (!ctrl.began) {
              ctrl.began = true;
              ctrl.initAnalytics();
            } else {
              ctrl.addAnalytics(Action.played);
            }
          }
        };

        /**
         * Pauses the video.
         */
        ctrl.pause = () => {
          if (video instanceof VideoLesson || video instanceof CaptivateHTMLVideo) {
            video.pause();
            ctrl.addAnalytics(Action.paused);
          }
        };

        /**
         * Tells whether the video is current in the playing state.
         * @return {Boolean} [description]
         */
        ctrl.isPlaying = () => {
          if (video instanceof VideoLesson || video instanceof CaptivateHTMLVideo) {
            return video.isPlaying();
          }
        };

        /**
         * Toggles the video to play or pause.
         */
        ctrl.togglePlay = () => {
          if (ctrl.isPlaying()) {
            ctrl.pause();
          } else {
            ctrl.play();
          }
        };

        /**
         * Mutes the video
         */
        ctrl.mute = () => {
          ctrl.addAnalytics(Action.muted);
          if (video instanceof VideoLesson || video instanceof CaptivateHTMLVideo) {
            video.mute();
          }
        };

        /**
         * Function to unmute the video
         */
        ctrl.unmute = () => {
          ctrl.addAnalytics(Action.unmuted);
          if (video instanceof VideoLesson || video instanceof CaptivateHTMLVideo) {
            video.unmute();
          }
        };

        /**
         * Function to tell if video is muted
         */
        ctrl.isMuted = () => {
          if (video instanceof VideoLesson || video instanceof CaptivateHTMLVideo) {
            return video.isMuted();
          }
        };

        /**
         * Function to toggle mute
         */
        ctrl.toggleMute = () => {
          if (ctrl.isMuted()) {
            ctrl.unmute();
          } else {
            ctrl.mute();
          }
        };

        /**
         * Function to tell if full screen mode is supported
         */
        ctrl.fullScreenAvailable = () => {
          return document.fullscreenEnabled ||
            document.msFullscreenEnabled ||
            document.mozFullScreenEnabled ||
            document.webkitFullscreenEnabled;
        };

        /**
         * Function to launch fullscreen mode
         */
        ctrl.fullScreenOn = () => {
          let v: HTMLElement = <HTMLElement>$element[0].getElementsByClassName("video-container")[0];

          if (v.requestFullscreen) { v.requestFullscreen(); }
          if (v.mozRequestFullScreen) { v.mozRequestFullScreen(); }
          if (v.webkitRequestFullScreen) { v.webkitRequestFullScreen(); }
          if (v.webkitRequestFullscreen) { v.webkitRequestFullscreen(); }
          if (v.msRequestFullscreen) {
            v.msRequestFullscreen();
          } else {
            console.error("Fullscreen not available in this browser");
          }
        };

        /**
         * Function to turn fullscreen mode off
         */
        ctrl.fullScreenOff = () => {
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
        ctrl.isFullScreened = () => {
          if (document.fullscreenElement) {
            if (document.fullscreenElement.id === "video-container") { return true; }
          }
          if (document.webkitFullscreenElement) {
            if (document.webkitFullscreenElement.id === "video-container") { return true; }
          }
          if (document.msFullscreenElement) {
            if (document.msFullscreenElement.id === "video-container") { return true; }
          }
          if (document.mozFullScreenElement) {
            if (document.mozFullScreenElement.id === "video-container") { return true; }
          }
          if (document.webkitFullscreenElement) {
            if (document.webkitFullscreenElement.id === "video-container") { return true; }
          }
          return false;
        };

        /**
         * Function to toggle full screen mode on the video.
         */
        ctrl.toggleFullScreen = () => {
          if (!ctrl.isFullScreened()) {
            ctrl.fullScreenOn();
          } else {
            ctrl.fullScreenOff();
          }
        };

        /**
         * Seek video
         */
        ctrl.seek = ($event) => {
          let width: number = document.getElementById("progress-bar").offsetWidth;
          let position: number = $event.offsetX;
          let percentage: number = position / width;
          if (video instanceof VideoLesson || video instanceof CaptivateHTMLVideo) {
            video.setCurrentTime(video.duration * percentage);
          }
        };
      })();
      // createMouseEventsForVideoProgressBar
      (() => {
        /**
         * Handles the mouse move event over the video controls.
         * @param  {event} $event The event that took place.
         */
        ctrl.mousemove = ($event) => {
          if (ctrl.isDragging) {
            ctrl.seek($event);
          }
        };

        /**
         * Handles the mouse up event over the video controls.
         * @param  {event} $event The event that took place.
         */
        ctrl.mouseup = ($event) => {
          ctrl.isDragging = false;
          ctrl.seek($event);
          ctrl.addAnalytics(Action.endedSeek);
        };

        /**
         * Handles the mouse down event over the video controls.
         * @param  {event} $event The event that took place.
         */
        ctrl.mousedown = ($event) => {
          ctrl.addAnalytics(Action.startedSeek);
          ctrl.isDragging = true;
          ctrl.seek($event);
        };

        /**
         * Handles the mouse leave event over the video controls.
         * @param  {event} $event The event that took place.
         */
        ctrl.mouseleave = ($event) => {
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
        ctrl.mouseenter = ($event) => {
          if (ctrl.isDragging) {
            ctrl.isDragging = false;
            ctrl.seek($event);
          }
        };
      })();
      // setFullScreenEventHandler
      (() => {
        // event handler for when video is fullscreenEnabled
        let fullScreenChanged: (event: any) => void = (event) => {
          let isFullScreened: boolean = ctrl.isFullScreened();
          let vcStyle: CSSStyleDeclaration = (<HTMLElement>$element[0].getElementsByClassName("video-container")[0]).style;
          let player: HTMLElement = <HTMLElement>$element[0].getElementsByClassName("player")[0];
          if (isFullScreened) {
            // force full screen
            vcStyle.width = "100%";
            vcStyle.height = "100%";
            player.style.height = "100%";
          } else {
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
      (() => {
        if (ctrl.fixedHeight) {
          if (ctrl.useIFrameTag()) {
            (<HTMLElement>$element[0].getElementsByClassName("player")[0]).style.height = "600px";
            // because iframe lessons usually adapt their size to the starting height
          }
        }
      })();
      // set onDestroyed event handler
      (() => {
        // when user leaves page
        $scope.$on("$destroy", () => {
          console.log("User left page");
          if (ctrl.began) { ctrl.submitAnalytics(); }
          if (ctrl.video) { video.unload(); }
          video.htmlElement.setAttribute("data-destroyed", "true");
        });
      })();
    }
  };
});
