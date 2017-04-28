var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var ContentFactory = (function () {
    function ContentFactory() {
    }
    ContentFactory.createLesson = function (config) {
        var lesson;
        var videoUrl = config.videoUrl;
        var extension = videoUrl.toString().substr(videoUrl.toString().lastIndexOf("."), videoUrl.toString().length - 1);
        switch (extension) {
            case ".mp4":
                lesson = new VideoLesson(config.htmlElement, config.videoUrl, config.posterImgUrl, config.onload, config.errorFunction);
                break;
            case ".html":
                lesson = new CaptivateHTMLVideo(config.htmlElement, config.videoUrl, config.onload, config.errorFunction);
                break;
            case ".xml":
                lesson = new SCORMLesson(config.htmlElement, config.videoUrl, config.standardElements, config.contentId, config.onload, config.errorFunction);
                break;
            case ".au":
                lesson = new AICCLesson(config.htmlElement, config.videoUrl, // which is the .au url
                config.contentId, config.userId, config.onload, config.errorFunction);
                break;
            default: throw "Extension " + extension + " is not supported in our video player.";
        }
        return lesson;
    };
    return ContentFactory;
}());
var Content = (function () {
    function Content(htmlElement, videoUrl, posterImgUrl, onload, errorFunction) {
        this.htmlElement = htmlElement;
        this.videoUrl = videoUrl;
        this.errorFunction = errorFunction;
        this.posterImgUrl = posterImgUrl;
        this.onload = onload;
    }
    return Content;
}());
var VideoLesson = (function (_super) {
    __extends(VideoLesson, _super);
    function VideoLesson(videoElement, videoUrl, posterImgUrl, onload, errorFunction) {
        var _this = _super.call(this, videoElement, videoUrl, posterImgUrl, onload, errorFunction) || this;
        try {
            videoElement.getElementsByTagName("source")[0].src = videoUrl.toString();
            videoElement.setAttribute("src", videoUrl.toString());
            if (posterImgUrl) {
                videoElement.setAttribute("poster", posterImgUrl);
            }
            videoElement.onloadeddata = function () {
                _this.duration = videoElement.duration;
                onload();
            };
            // if invalid source url
            videoElement.querySelector("source").onerror = function (event) {
                // checks if the video is destroyed. If it was destroyed, then obviously there shouldn't be a video element.
                if (event.srcElement.parentElement.dataset.destroyed === "true") {
                    return;
                }
                console.warn("There was an error loading the video! \nIs the video URL correct: " +
                    videoUrl + "? Regardless, this error is being ignored and the code is moving on.");
            };
        }
        catch (e) {
            errorFunction(e);
        }
        return _this;
    }
    VideoLesson.prototype.pause = function () { this.htmlElement.pause(); };
    VideoLesson.prototype.play = function () { this.htmlElement.play(); };
    VideoLesson.prototype.getCurrentTime = function () { return this.htmlElement.currentTime; };
    VideoLesson.prototype.mute = function () { this.htmlElement.volume = 0; };
    VideoLesson.prototype.unmute = function () { this.htmlElement.volume = 1; };
    VideoLesson.prototype.onTimeUpdate = function (callback) { this.htmlElement.ontimeupdate = callback; };
    VideoLesson.prototype.load = function () { this.htmlElement.load(); };
    VideoLesson.prototype.isMuted = function () { return this.htmlElement.volume === 0; };
    VideoLesson.prototype.setCurrentTime = function (timeInSeconds) { this.htmlElement.currentTime = timeInSeconds; };
    VideoLesson.prototype.onPlay = function (callback) { this.htmlElement.onplay = callback; };
    VideoLesson.prototype.onPause = function (callback) { this.htmlElement.onpause = callback; };
    VideoLesson.prototype.onEnd = function (callback) { this.htmlElement.onended = callback; };
    VideoLesson.prototype.unload = function () {
        this.htmlElement.setAttribute("src", "");
        this.load();
    };
    VideoLesson.prototype.isPlaying = function () { return !this.htmlElement.paused; };
    return VideoLesson;
}(Content));
var CaptivateHTMLVideo = (function (_super) {
    __extends(CaptivateHTMLVideo, _super);
    function CaptivateHTMLVideo(htmlElement, videoUrl, onload, errorFunction) {
        var _this = _super.call(this, htmlElement, videoUrl, null, onload, errorFunction) || this;
        _this.events = {
            "onPlay": function () { console.log("Playing."); },
            "onPause": function () { console.log("Paused."); },
            "onEnded": function () { console.log("Ended"); },
            "onTimeUpdate": function () { console.log("Time Changed"); }
        };
        _this.intervals = [];
        _this.ready = false;
        htmlElement.src = videoUrl.toString();
        try {
            htmlElement.onload = function () { return htmlElement.contentWindow.addEventListener("moduleReadyEvent", function () {
                _this.getCPAPIEventEmitter().addEventListener("CPAPI_MOVIESTART", function () { console.log("Movie started"); });
                _this.getCPAPIEventEmitter().addEventListener("CPAPI_MOVIERESUME", function () { return _this.events.onPlay(); });
                _this.getCPAPIEventEmitter().addEventListener("CPAPI_MOVIEPAUSE", function () { return _this.events.onPause(); });
                _this.getCPAPIEventEmitter().addEventListener("CPAPI_MOVIESTOP", function () { return _this.events.onEnded(); });
                (function () {
                    try {
                        var temp = htmlElement.contentWindow.document;
                    }
                    catch (e) {
                        console.error(e);
                        _this.errorFunction(e);
                    }
                })();
                _this.duration = _this.getCPAPIInterface().getDurationInSeconds();
                // set size
                var mainContainer = htmlElement.contentDocument.getElementById("main_container");
                _this.initialIFrameWidth = _this.htmlElement.offsetWidth;
                _this.initialIFrameHeight = _this.htmlElement.offsetHeight;
                _this.initialVideoWidth = mainContainer.getBoundingClientRect().width;
                _this.initialVideoHeight = mainContainer.getBoundingClientRect().height;
                _this.scaleVideo(_this.initialIFrameWidth, _this.initialIFrameHeight); // makes video not have white bars on side.
                htmlElement.contentWindow.onresize = function () { return _this.setIFrameVisualSettings(); };
                onload(); // users onload function
                _this.ready = true;
            }); };
        }
        catch (e) {
            console.error(e);
            errorFunction(e);
        }
        return _this;
    }
    CaptivateHTMLVideo.prototype.scaleVideo = function (width, height) {
        var iframe = this.htmlElement;
        var videoContainer = iframe.contentDocument.getElementById("main_container");
        var currentSize = videoContainer.getBoundingClientRect();
        var currentWidth = currentSize.width;
        var currentHeight = currentSize.height;
        // get scale factors
        // scales to 1920 x 1080 when fullscreened! Good!
        var verScaleFactor = height / this.initialVideoHeight;
        var horScaleFactor = width / this.initialVideoWidth;
        // squeeze
        var innerPage = iframe.contentDocument.getElementsByTagName("body")[0];
        innerPage.style.transform = "scale(" + horScaleFactor + ", " + verScaleFactor + ")";
        innerPage.style.transformOrigin = "top left";
        innerPage.style.margin = "0px";
        var html = iframe.contentDocument.getElementsByTagName("html")[0];
        var body = iframe.contentDocument.getElementsByTagName("body")[0];
        html.style.overflow = "hidden";
        body.style.overflow = "visible";
        // take out white space
        videoContainer.style.top = "0px";
        videoContainer.style.left = "0px";
    };
    CaptivateHTMLVideo.prototype.setIFrameVisualSettings = function () {
        if (!this.ready) {
            return;
        }
        var parentWindow = window;
        if (this.isFullScreened()) {
            // temporary fix.
            // when the user goes fullscreen mode, for some reason, the onresize function gets called twice,
            // and therefore this function gets called twice. The code below ends the first call.
            if (this.htmlElement.offsetWidth !== window.innerWidth) {
                return;
            }
            this.scaleVideo(parentWindow.innerWidth, parentWindow.innerHeight);
        }
        else {
            this.scaleVideo(this.initialIFrameWidth, this.initialIFrameHeight);
        }
    };
    CaptivateHTMLVideo.prototype.isFullScreened = function () {
        if (document.fullscreenElement) {
            if (document.fullscreenElement.id === "video-container") {
                return;
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
    CaptivateHTMLVideo.prototype.createInterval = function (intervalFunction, time) {
        var interval = window.setInterval(intervalFunction, time);
        this.intervals.push(interval);
        console.log("Created interval" + interval);
        return interval;
    };
    CaptivateHTMLVideo.prototype.getCPAPIEventEmitter = function () {
        if (this.htmlElement instanceof HTMLIFrameElement) {
            return this.htmlElement.contentWindow.cpAPIEventEmitter;
        }
    };
    CaptivateHTMLVideo.prototype.getCPAPIInterface = function () {
        if (this.htmlElement instanceof HTMLIFrameElement) {
            return this.htmlElement.contentWindow.cpAPIInterface;
        }
    };
    CaptivateHTMLVideo.prototype.play = function () {
        this.getCPAPIInterface().play();
    };
    CaptivateHTMLVideo.prototype.pause = function () {
        if (this.getCPAPIInterface().rdcmndPause || this.getCPAPIInterface().cpCmndPause) {
            console.warn("Attempting to pause an already paused video.");
        }
        this.getCPAPIInterface().pause();
    };
    CaptivateHTMLVideo.prototype.getCurrentTime = function () {
        if (!this.ready) {
            return 0;
        }
        var currentFrame = this.getCPAPIInterface().getCurrentFrame();
        var fps = this.getCPAPIInterface().getPlaySpeed();
        return currentFrame / fps;
    };
    CaptivateHTMLVideo.prototype.isMuted = function () {
        if (!this.ready) {
            return false;
        }
        return this.getCPAPIInterface().getVolume() === 0;
    };
    CaptivateHTMLVideo.prototype.isPlaying = function () {
        if (!this.ready) {
            return false;
        }
        return this.htmlElement.contentWindow.cpCmndResume;
    };
    CaptivateHTMLVideo.prototype.mute = function () {
        this.getCPAPIInterface().setVolume(0);
    };
    CaptivateHTMLVideo.prototype.unmute = function () {
        this.getCPAPIInterface().setVolume(50);
    };
    CaptivateHTMLVideo.prototype.onEnd = function (callback) {
        this.events.onEnded = callback;
    };
    CaptivateHTMLVideo.prototype.unload = function () {
        this.mute();
        this.pause();
        this.htmlElement.contentDocument.querySelector("body").innerHTML = "";
        for (var i = 0; i < this.intervals.length; i++) {
            clearInterval(i);
        }
        this.ready = false;
    };
    CaptivateHTMLVideo.prototype.onPause = function (callback) {
        this.events.onPause = callback;
    };
    CaptivateHTMLVideo.prototype.onPlay = function (callback) {
        this.events.onPlay = callback;
    };
    CaptivateHTMLVideo.prototype.onTimeUpdate = function (callback) {
        var _this = this;
        var previousTime = this.getCurrentTime();
        this.events.onTimeUpdate = callback;
        var onTimeUpdateInterval = this.createInterval(function () {
            try {
                var currentTime = _this.getCurrentTime();
                if (currentTime !== previousTime) {
                    _this.events.onTimeUpdate();
                    previousTime = currentTime;
                }
            }
            catch (e) {
                clearInterval(onTimeUpdateInterval);
                console.error(e);
                _this.errorFunction(e);
            }
        }, 100);
    };
    CaptivateHTMLVideo.prototype.load = function () { return; };
    CaptivateHTMLVideo.prototype.setCurrentTime = function (timeInSeconds) {
        var _this = this;
        this.getCPAPIInterface().navigateToTime(timeInSeconds * 1000);
        // fix stupid captigate glitch
        if (this.isPlaying()) {
            return;
        }
        console.log("Fixing Captivate glitch");
        var tries = 0;
        var maxTries = 10;
        var interval = window.setInterval(function () {
            if (tries++ === maxTries) {
                clearInterval(interval);
                return;
            }
            if (_this.isPlaying()) {
                _this.pause();
                setTimeout(function () { return _this.events.onPause(); }, 100);
                clearInterval(interval);
            }
        }, 100);
    };
    return CaptivateHTMLVideo;
}(Content));
var SCORMLesson = (function (_super) {
    __extends(SCORMLesson, _super);
    function SCORMLesson(htmlElement, videoUrl, standardElements, lessonId, onload, errorFunction) {
        var _this = _super.call(this, htmlElement, videoUrl, null, onload, errorFunction) || this;
        _this.events = {
            "onload": function () { console.log("Loaded."); },
            "onPlay": function () { console.log("Playing."); },
            "onPause": function () { console.log("Paused."); },
            "onEnded": function () { console.log("Ended."); },
            "onTimeUpdate": function () { console.log("Time updated."); }
        };
        _this.lessonId = lessonId;
        _this.onLoadedDataFunctions = [];
        _this.scormAPI = {};
        _this.videoElement = htmlElement;
        _this.standardElements = standardElements;
        _this.events.onload = onload;
        $.get(videoUrl.toString(), function (result) {
            var relativePath = videoUrl.toString().replace("imsmanifest.xml", "");
            var playbackUrl = result.getElementsByTagName("resource")[0].getAttribute("href");
            htmlElement.src = relativePath + playbackUrl;
            // set scorm api
            (function () {
                /**
                 * The Initialize method indicates to the LMS that the content would like
                 * to begin a communication session. All SCOs must call Initialize before
                 * performing any other communication. The LMS returns a boolean indicating
                 * the success or failure of the initialization. Typically, LMS's don't
                 * need to do a lot of initialization and will always return "true".
                 * @method LMSInitialize
                 * @return {string} a boolean (in string form) indicating the success or failure of the initialization.
                 */
                _this.scormAPI.LMSInitialize = function () {
                    _this.onLoadedDataFunctions.forEach(function (callback) { return callback(); });
                    return "true"; // lets the LMS know we've finished our initialization steps.
                };
                /**
                 * The GetValue method allows a SCO to retrieve data from the LMS. The
                 * data that is always retrieved is one of the defined SCORM data model
                 * elements. Each of these data model elements holds a different piece of
                 * data. Some of the data model elements have values initialized by the
                 * LMS which speak to the circumstances under which the SCO is being
                 * launched. Other values are initialized by the SCO through calls to
                 * SetValue. If the call to GetValue returns an empty string, it is
                 * possible that an error occurred and the GetLastError method should be
                 * invoked to check for problems.
                 *
                 * @method LMSGetValue
                 * @param  {CMIElement} value The value to retrieve
                 * @return {string}           The returned value.
                 */
                _this.scormAPI.LMSGetValue = function (element) {
                    element = element.split(".").join("-");
                    console.log("The LMS is getting " + element + ". Returning ", _this.standardElements[element]);
                    if (_this.standardElements[element] === undefined) {
                        return console.error("Missing value for SCORM lesson: ", element);
                    }
                    return _this.standardElements[element];
                };
                /**
                 * The SetValue method allows the SCO to persist data to the LMS. The
                 * data is always stored in one of the defined SCORM data model elements.
                 * Some data model elements are constrained to having values in a limited
                 * vocabulary (for instance, status might be “completed” or “passed”),
                 * others are constrained to being a specific data type (for instance,
                 * score must always be a number) while others allow the SCO to persist
                 * free text data with no semantic meaning. The SetValue call returns a
                 * boolean indicating the success or failure of the call.
                 *
                 * @method LMSSetValue
                 * @param  {CMIElement} element [description]
                 * @param  {string}     value   [description]
                 * @return {string}     A boolean (in string form) of the success of
                 * setting the value
                 */
                _this.scormAPI.LMSSetValue = function (element, value) {
                    element = element.split(".").join("-");
                    console.log("The LMS is setting " + element + " to " + value);
                    // runEventHandlers
                    (function () {
                        if (value === "cmi.core.lesson_location") {
                            // i think this means the person progressed through the lesson
                            _this.events.onTimeUpdate();
                        }
                    })();
                    // save standard elements locally.
                    (function () {
                        _this.standardElements[element] = value;
                    })();
                    return "true";
                };
                /**
                 * The Commit method signals to the LMS that a significant chuck of data
                 * has been saved and that it should ensure the data is properly
                 * persisted. There are no requirements for how the LMS should implement
                 * the Commit method, it is simply an informative signal. Some LMS’s will
                 * make a round trip to the server for every call to Commit to ensure that
                 * all data is persisted. While intuitive, this implementation strategy
                 * can lead to scalability problems. Take care not to call Commit
                 * excessively so as not to overburden these LMS’s.
                 * @method LMSCommit
                 * @return {string}   Idk... the success of this function call?
                 */
                _this.scormAPI.LMSCommit = function () {
                    $.post("/api/subjectPage/setStandardLessonElement", _this.standardElements).then(function (response) {
                        _this.standardElements = response; // prevents the SCO from saving multiple times.
                        console.log("Successfuly saved standardElements", response);
                    }, function (error) { return console.error(error); });
                    return "true";
                };
                /**
                 * The GetLastError method checks to see if the last SCORM API call caused
                 * an error. If so, this method returns an error number that corresponds
                 * to a defined set of possible errors. Some error numbers represent
                 * perfectly legitimate situations (such as 403 – Data Model Element Not
                 * Initialized). SCO authors should take care to only flag legitimately
                 * unexpected errors to the user. The complete list of error codes can be
                 * found in the SCORM run-time reference chart.
                 *
                 * @method LMSGetLastError
                 * @return {CMIErrorCode}   an error number that corresponds to a defined
                 * set of possible errors
                 */
                _this.scormAPI.LMSGetLastError = function () {
                    // console.warn('The SCO is trying to get LastError. Return 0 for now. 0 means no error.');
                    return 0; // 0 means nothing's wrong.
                };
                /**
                 * [LMSGetLastErrorString description]
                 *
                 * @method LMSGetLastErrorString
                 * @return {string}
                 */
                _this.scormAPI.LMSGetLastErrorString = function () {
                    console.warn("The SCO is trying to get LastErrorString, what ever that means. Owell.");
                };
                /**
                 * Given a particular error number (usually the error number returned from
                 * GetLastError), the GetErrorString method will return a textual
                 * description of what the error code means. For instance, in SCORM 2004,
                 * passing error number “406″ will return a string saying “Data Model
                 * Element Type Mismatch” to indicate that the result of the previous call
                 * (likely a SetValue) failed because the data being stored was not in the
                 * correct format.
                 *
                 * @method LMSGetErrorString
                 * @param  {CMIErrorCode} errorCode [description]
                 * @return {string}
                 */
                _this.scormAPI.LMSGetErrorString = function (errorCode) {
                    console.warn("The SCO is trying to get ErrorString, what ever that means. Owell.");
                };
                /**
                 * The GetDiagnostic method allows the LMS to return detailed information
                 * about the prior error that can be useful in diagnosing the problem. For
                 * instance the diagnostic information for the “406″ error mentioned above
                 * might be “The value ‘zero’ is not allowed for cmi.score.raw. The
                 * cmi.score.raw element must contain a valid number represented only as
                 * digits”.
                 *
                 * @method LMSGetDiagnostic
                 * @param  {CMIErrorCode}   errCode [description]
                 * @return {string}         Detailed information about the prior error
                 * that can be useful in diagnosing the problem
                 */
                _this.scormAPI.LMSGetDiagnostic = function (errCode) {
                    console.warn("The SCO is trying to get ErrorDiagnostic, what ever that means. Owell.");
                };
                /**
                 * The Terminate method indicates to the LMS that the content is done
                 * communicating. All SCOs must call Terminate. Calling Terminate doesn’t
                 * necessarily indicate that the user is done with the SCO, technically it
                 * only indicates the the SCO is done communicating. In practice however,
                 * content will be more compatible and usable if Terminate is only called
                 * when the content can be taken away from the user. Since Terminate is
                 * required to always be called, no matter how the learner exits the SCO,
                 * it is wise to place a call to Terminate in the onunload event of a SCO.
                 * The boolean value returned by the LMS often indicates whether or not
                 * SCO data was successfully persisted to the server.
                 * @method LMSFinish
                 * @return {string} Boolean (in string form) indicating whether or not SCO data was successfully persisted to the server
                 */
                _this.scormAPI.LMSFinish = function () {
                    alert("Finished!");
                    _this.events.onEnded();
                };
            })();
            window.API = _this.scormAPI;
            _this.events.onload();
        });
        return _this;
    }
    SCORMLesson.prototype.load = function () {
        return; // because unload is done automatically I think.
        // tODO: Test changing lesson. Does the next lesson load, or does this function have to make it load?
    };
    SCORMLesson.prototype.unload = function () {
        return; // because unload is done automatically I think.
        // tODO: Test changing lesson. Does the next lesson load, or does this function have to make it load?
    };
    SCORMLesson.prototype.onEnd = function (callback) {
        this.events.onEnded = callback;
    };
    return SCORMLesson;
}(Content));
var AICCLesson = (function (_super) {
    __extends(AICCLesson, _super);
    function AICCLesson(htmlElement, videoUrl, contentId, userId, onload, errorFunction) {
        var _this = _super.call(this, htmlElement, videoUrl, null, onload, errorFunction) || this;
        _this.events = {
            "onload": function () { console.log("Loaded."); },
            "onPlay": function () { console.log("Playing."); },
            "onPause": function () { console.log("Paused."); },
            "onEnded": function () { console.log("Ended."); },
            "onTimeUpdate": function () { console.log("Time updated."); }
        };
        var assignableUnitFileURL = videoUrl;
        $.get(videoUrl).then(function (response) {
            var aiccData = _this.csvToJSONAICCAssignableUnit(response)[0]; // take the first one?????
            _this.launchUrl = _this.getLaunchUrl(aiccData.file_name, contentId.toString(), location.host + "/api/SubjectPage/aiccURL");
            htmlElement.addEventListener("load", function () { _this.events.onload(); });
            htmlElement.setAttribute("src", _this.launchUrl);
        }, function (error) {
            throw error;
        });
        _this.events.onload();
        return _this;
    }
    AICCLesson.prototype.onEnd = function (callback) { this.events.onEnded = callback; };
    AICCLesson.prototype.load = function () { return; /* i think it automatically loads; */ };
    AICCLesson.prototype.unload = function () { return; /* because unload is done automatically I think. Needs to be tested. */ };
    /**
     * Takes out the first and last quotes of a string
     * @param text The text to fix.
     * @return The fixed text
     */
    AICCLesson.prototype.removeFirstAndLastQuote = function (text) {
        var length = text.length;
        if (text[0] === "\"") {
            text = text.slice(1);
        }
        if (text[length - 1] === "\"") {
            text = text.slice(text.length - 1);
        }
        return text;
    };
    /**
     * This will parse a delimited string into an array of
     * arrays. The default delimiter is the comma, but this
     * can be overriden in the second argument.
     * @param strData
     * @param strDelimiter
     * @return an array of an array of values
     */
    AICCLesson.prototype.CSVToArray = function (strData, strDelimiter) {
        // check to see if the delimiter is defined. If not,
        // then default to comma.
        strDelimiter = (strDelimiter || ",");
        // create a regular expression to parse the CSV values.
        var strMatchedValue;
        var objPattern = new RegExp((
        // delimiters.
        "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +
            // quoted fields.
            "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +
            // standard fields.
            "([^\"\\" + strDelimiter + "\\r\\n]*))"), "gi");
        // create an array to hold our data. Give the array
        // a default empty first row.
        var arrData = [[]];
        // create an array to hold our individual pattern
        // matching groups.
        var arrMatches = null;
        // keep looping over the regular expression matches
        // until we can no longer find a match.
        while (arrMatches = objPattern.exec(strData)) {
            // get the delimiter that was found.
            var strMatchedDelimiter = arrMatches[1];
            // check to see if the given delimiter has a length
            // (is not the start of string) and if it matches
            // field delimiter. If id does not, then we know
            // that this delimiter is a row delimiter.
            if (strMatchedDelimiter.length &&
                (strMatchedDelimiter !== strDelimiter)) {
                // since we have reached a new row of data,
                // add an empty row to our data array.
                arrData.push([]);
            }
            // now that we have our delimiter out of the way,
            // let's check to see which kind of value we
            // captured (quoted or unquoted).
            if (arrMatches[2]) {
                // we found a quoted value. When we capture
                // this value, unescape any double quotes.
                strMatchedValue = arrMatches[2].replace(new RegExp("\"\"", "g"), "\"");
            }
            else {
                // we found a non-quoted value.
                strMatchedValue = arrMatches[3];
            }
            // now that we have our value string, let's add
            // it to the data array.
            arrData[arrData.length - 1].push(strMatchedValue);
        }
        // return the parsed data.
        return (arrData);
    };
    /**
     * Converts a CSV string to a json object
     * @param csv the csv to parse
     */
    AICCLesson.prototype.csvToJSONAICCAssignableUnit = function (csv) {
        var toJSON = [];
        var csvRows = this.CSVToArray(csv);
        var columnHeaders = csvRows[0];
        for (var rowNumber = 1; rowNumber < csvRows.length; rowNumber++) {
            var currentRowAsArray = csvRows[rowNumber];
            var currentRowAsJSON = {};
            for (var colNumber = 0; colNumber < columnHeaders.length; colNumber++) {
                var currentColumn = columnHeaders[colNumber];
                currentRowAsJSON[currentColumn] = currentRowAsArray[colNumber];
            }
            toJSON.push(currentRowAsJSON);
        }
        return toJSON;
    };
    /**
     * Creates an AICC launchUrl
     *
     * @private
     * @param {string} assignableUnitUrl The url of the assignable unit. I think this is the HTML file url of the assignable unit.
     * @param {string} aicc_sid A string generated by the CMI (prior to AU launch) that uniquely identifies the AU session among all other
     * active AU sessions. The Assignable Unit uses this value to identify its session when making requests to the CMI system.
     * @param {string} aicc_url The URL where the AU is to send its HACP request messages.
     * @param {string} otherParameters
     *
     * @memberOf AICCLesson
     */
    AICCLesson.prototype.getLaunchUrl = function (assignableUnitUrl, aicc_sid, aicc_url, otherParameters) {
        var launchUrl = assignableUnitUrl;
        var isRelativeUrl = assignableUnitUrl.indexOf("http://") !== 0 && assignableUnitUrl.indexOf("https://") !== 0;
        if (isRelativeUrl) {
            var temp = this.videoUrl.split("/");
            var endFile = temp[temp.length - 1];
            var preUrl = this.videoUrl.replace(endFile, "");
            launchUrl = preUrl + assignableUnitUrl;
        }
        launchUrl += "?";
        launchUrl += "aicc_sid=" + encodeURIComponent(aicc_sid);
        launchUrl += "&aicc_url=" + encodeURIComponent(aicc_url);
        if (otherParameters) {
            assignableUnitUrl += otherParameters;
        }
        return launchUrl;
    };
    return AICCLesson;
}(Content));
//# sourceMappingURL=Classes.js.map