class ContentFactory {
  public static createLesson(config: IContentConfig): Content {
    let lesson: Content;
    const videoUrl: string = config.videoUrl;
    const extension: string = videoUrl.toString().substr(videoUrl.toString().lastIndexOf("."), videoUrl.toString().length - 1);

    switch (extension) {
      case ".mp4":
        lesson = new VideoLesson(
          <HTMLVideoElement>config.htmlElement,
          config.videoUrl,
          config.posterImgUrl,
          config.onload,
          config.errorFunction
        );
        break;
      case ".html":
        lesson = new CaptivateHTMLVideo(
          <HTMLIFrameElement>config.htmlElement,
          config.videoUrl,
          config.onload,
          config.errorFunction
        );
        break;
      case ".xml":
        lesson = new SCORMLesson(
          <HTMLIFrameElement>config.htmlElement,
          config.videoUrl,
          config.standardElements,
          config.contentId,
          config.onload,
          config.errorFunction
        );
        break;
      case ".au":
        lesson = new AICCLesson(<HTMLIFrameElement>config.htmlElement,
          config.videoUrl, // which is the .au url
          config.contentId,
          config.userId,
          config.onload,
          config.errorFunction
        );
        break;
      default: throw `Extension ${extension} is not supported in our video player.`;
    }
    return lesson;
  }
}
abstract class Content {
  public posterImgUrl: string;
  public videoUrl: string;
  public htmlElement: HTMLVideoElement | HTMLIFrameElement;
  public errorFunction: (error: any) => void;
  public onload: () => void;
  constructor(
    htmlElement: HTMLElement,
    videoUrl: string,
    posterImgUrl?:
      string, onload?:
      () => void,
    errorFunction?: (error: any) => void
  ) {
    this.htmlElement = <HTMLIFrameElement | HTMLVideoElement>htmlElement;
    this.videoUrl = videoUrl;
    this.errorFunction = errorFunction;
    this.posterImgUrl = posterImgUrl;
    this.onload = onload;
  }
  abstract onEnd(callback: () => void): void;
  abstract load(): void;
  abstract unload(): void;
}
interface IContentConfig {
  htmlElement: HTMLElement;
  videoUrl: string;
  posterImgUrl: string;
  onload: () => void;
  errorFunction: () => void;
  standardElements?: object;
  contentId?: number;
  userId?: number;
}
interface INonPlayable {
  load: () => void;
  onload: (callback: () => void) => void;
}
interface IPlayable {
  duration: number;
  play: () => void;
  pause: () => void;
  getCurrentTime: () => number;
  isMuted: () => boolean;
  isPlaying: () => boolean;
  mute: () => void;
  unmute: () => void;
  onEnd: (callback: () => void) => void;
  onPlay: (callback: () => void) => void;
  onPause: (callback: () => void) => void;
  onTimeUpdate: (callback: () => void) => void;
  setCurrentTime: (time: number) => void;
}
class VideoLesson extends Content implements IPlayable {
  public duration: number;
  constructor(
    videoElement: HTMLVideoElement,
    videoUrl: string,
    posterImgUrl: string,
    onload?: () => void,
    errorFunction?: (error: any) => void
  ) {
    super(videoElement, videoUrl, posterImgUrl, onload, errorFunction);
    try {
      videoElement.getElementsByTagName("source")[0].src = videoUrl.toString();
      videoElement.setAttribute("src", videoUrl.toString());
      if (posterImgUrl) { videoElement.setAttribute("poster", posterImgUrl); }
      videoElement.onloadeddata = () => {
        this.duration = videoElement.duration;
        onload();
      };

      // if invalid source url
      videoElement.querySelector("source").onerror = event => {
        // checks if the video is destroyed. If it was destroyed, then obviously there shouldn't be a video element.
        if (event.srcElement.parentElement.dataset.destroyed === "true") { return; }

        console.warn("There was an error loading the video! \nIs the video URL correct: " +
          videoUrl + "? Regardless, this error is being ignored and the code is moving on.");
      };
    } catch (e) {
      errorFunction(e);
    }
  }
  public pause(): void { (<HTMLVideoElement>this.htmlElement).pause(); }
  public play(): void { (<HTMLVideoElement>this.htmlElement).play(); }
  public getCurrentTime(): number { return (<HTMLVideoElement>this.htmlElement).currentTime; }
  public mute(): void { (<HTMLVideoElement>this.htmlElement).volume = 0; }
  public unmute(): void { (<HTMLVideoElement>this.htmlElement).volume = 1; }
  public onTimeUpdate(callback: () => void): void { (<HTMLVideoElement>this.htmlElement).ontimeupdate = callback; }
  public load(): void { (<HTMLVideoElement>this.htmlElement).load(); }
  public isMuted(): boolean { return (<HTMLVideoElement>this.htmlElement).volume === 0; }
  public setCurrentTime(timeInSeconds: number): void { (<HTMLVideoElement>this.htmlElement).currentTime = timeInSeconds; }
  public onPlay(callback: () => void): void { (<HTMLVideoElement>this.htmlElement).onplay = callback; }
  public onPause(callback: () => void): void { (<HTMLVideoElement>this.htmlElement).onpause = callback; }
  public onEnd(callback: () => void): void { (<HTMLVideoElement>this.htmlElement).onended = callback; }
  public unload(): void {
    (<HTMLVideoElement>this.htmlElement).setAttribute("src", "");
    this.load();
  }
  public isPlaying(): boolean { return !(<HTMLVideoElement>this.htmlElement).paused; }
}
class CaptivateHTMLVideo extends Content implements IPlayable {

  private events = {
    "onPlay": () => { console.log("Playing."); },
    "onPause": () => { console.log("Paused."); },
    "onEnded": () => { console.log("Ended"); },
    "onTimeUpdate": () => { console.log("Time Changed"); }
  };
  private intervals = [];
  private ready = false;
  private initialVideoHeight: number;
  private initialVideoWidth: number;
  private initialIFrameWidth: number;
  private initialIFrameHeight: number;
  private mainContainer;
  public duration: number;

  constructor(htmlElement: HTMLIFrameElement, videoUrl: string, onload?: () => void, errorFunction?: (error: any) => void) {
    super(htmlElement, videoUrl, null, onload, errorFunction);
    htmlElement.src = videoUrl.toString();
    try {
      htmlElement.onload = () => htmlElement.contentWindow.addEventListener("moduleReadyEvent", () => {
        this.getCPAPIEventEmitter().addEventListener("CPAPI_MOVIESTART", () => { console.log("Movie started"); });
        this.getCPAPIEventEmitter().addEventListener("CPAPI_MOVIERESUME", () => this.events.onPlay());
        this.getCPAPIEventEmitter().addEventListener("CPAPI_MOVIEPAUSE", () => this.events.onPause());
        this.getCPAPIEventEmitter().addEventListener("CPAPI_MOVIESTOP", () => this.events.onEnded());
        (() => {
          try {
            let temp: any = htmlElement.contentWindow.document;
          } catch (e) {
            console.error(e);
            this.errorFunction(e);
          }
        })();
        this.duration = this.getCPAPIInterface().getDurationInSeconds();

        // set size
        const mainContainer: HTMLElement = htmlElement.contentDocument.getElementById("main_container");
        this.initialIFrameWidth = this.htmlElement.offsetWidth;
        this.initialIFrameHeight = this.htmlElement.offsetHeight;
        this.initialVideoWidth = mainContainer.getBoundingClientRect().width;
        this.initialVideoHeight = mainContainer.getBoundingClientRect().height;
        this.scaleVideo(this.initialIFrameWidth, this.initialIFrameHeight); // makes video not have white bars on side.
        htmlElement.contentWindow.onresize = () => this.setIFrameVisualSettings();
        onload(); // users onload function
        this.ready = true;
      });
    } catch (e) {
      console.error(e);
      errorFunction(e);
    }
  }
  private scaleVideo(width: number, height: number): void {
    const iframe: HTMLIFrameElement = <HTMLIFrameElement>this.htmlElement;
    let videoContainer: HTMLElement = iframe.contentDocument.getElementById("main_container");

    let currentSize: ClientRect = videoContainer.getBoundingClientRect();
    let currentWidth: number = currentSize.width;
    let currentHeight: number = currentSize.height;

    // get scale factors
    // scales to 1920 x 1080 when fullscreened! Good!
    let verScaleFactor: number = height / this.initialVideoHeight;
    let horScaleFactor: number = width / this.initialVideoWidth;

    // squeeze
    let innerPage: HTMLElement = iframe.contentDocument.getElementsByTagName("body")[0];
    innerPage.style.transform = "scale(" + horScaleFactor + ", " + verScaleFactor + ")";
    innerPage.style.transformOrigin = "top left";
    innerPage.style.margin = "0px";


    let html: HTMLHtmlElement = iframe.contentDocument.getElementsByTagName("html")[0];
    let body: HTMLBodyElement = iframe.contentDocument.getElementsByTagName("body")[0];
    html.style.overflow = "hidden";
    body.style.overflow = "visible";

    // take out white space
    videoContainer.style.top = "0px";
    videoContainer.style.left = "0px";
  }
  private setIFrameVisualSettings(): void {
    if (!this.ready) { return; }
    let parentWindow: Window = window;
    if (this.isFullScreened()) {

      // temporary fix.
      // when the user goes fullscreen mode, for some reason, the onresize function gets called twice,
      // and therefore this function gets called twice. The code below ends the first call.
      if (this.htmlElement.offsetWidth !== window.innerWidth) { return; }
      this.scaleVideo(parentWindow.innerWidth, parentWindow.innerHeight);
    } else {
      this.scaleVideo(this.initialIFrameWidth, this.initialIFrameHeight);
    }
  }
  private isFullScreened(): boolean {
    if (document.fullscreenElement) {
      if (document.fullscreenElement.id === "video-container") { return; }
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
  }
  private createInterval(intervalFunction: (...args: any[]) => void, time: number): number {
    let interval: number = window.setInterval(intervalFunction, time);
    this.intervals.push(interval);
    console.log("Created interval" + interval);
    return interval;
  }
  private getCPAPIEventEmitter(): any {
    if (this.htmlElement instanceof HTMLIFrameElement) {
      return this.htmlElement.contentWindow.cpAPIEventEmitter;
    }
  }
  private getCPAPIInterface(): any {
    if (this.htmlElement instanceof HTMLIFrameElement) {
      return this.htmlElement.contentWindow.cpAPIInterface;
    }
  }

  public play(): void {
    this.getCPAPIInterface().play();
  }
  public pause(): void {
    if (this.getCPAPIInterface().rdcmndPause || this.getCPAPIInterface().cpCmndPause) {
      console.warn("Attempting to pause an already paused video.");
    }
    this.getCPAPIInterface().pause();
  }
  public getCurrentTime(): number {
    if (!this.ready) { return 0; }
    let currentFrame: number = this.getCPAPIInterface().getCurrentFrame();
    let fps: number = this.getCPAPIInterface().getPlaySpeed();
    return currentFrame / fps;
  }
  public isMuted(): boolean {
    if (!this.ready) { return false; }
    return this.getCPAPIInterface().getVolume() === 0;
  }
  public isPlaying(): boolean {
    if (!this.ready) { return false; }
    return (<HTMLIFrameElement>this.htmlElement).contentWindow.cpCmndResume;
  }
  public mute(): void {
    this.getCPAPIInterface().setVolume(0);
  }
  public unmute(): void {
    this.getCPAPIInterface().setVolume(50);
  }
  public onEnd(callback: () => void): void {
    this.events.onEnded = callback;
  }
  public unload(): void {
    this.mute();
    this.pause();
    (<HTMLIFrameElement>this.htmlElement).contentDocument.querySelector("body").innerHTML = "";
    for (let i: number = 0; i < this.intervals.length; i++) {
      clearInterval(i);
    }
    this.ready = false;
  }
  public onPause(callback: () => void): void {
    this.events.onPause = callback;
  }
  public onPlay(callback: () => void): void {
    this.events.onPlay = callback;
  }
  public onTimeUpdate(callback: () => void): void {
    let previousTime: number = this.getCurrentTime();
    this.events.onTimeUpdate = callback;
    let onTimeUpdateInterval: number = this.createInterval(() => {
      try {
        let currentTime: number = this.getCurrentTime();
        if (currentTime !== previousTime) {
          this.events.onTimeUpdate();
          previousTime = currentTime;
        }
      } catch (e) {
        clearInterval(onTimeUpdateInterval);
        console.error(e);
        this.errorFunction(e);
      }
    }, 100);
  }
  public load(): void { return; }
  public setCurrentTime(timeInSeconds: number): void {
    this.getCPAPIInterface().navigateToTime(timeInSeconds * 1000);

    // fix stupid captigate glitch
    if (this.isPlaying()) { return; }
    console.log("Fixing Captivate glitch");
    let tries: number = 0;
    let maxTries: number = 10;
    let interval: number = window.setInterval(() => {
      if (tries++ === maxTries) {
        clearInterval(interval);
        return;
      }
      if (this.isPlaying()) {
        this.pause();
        setTimeout(() => this.events.onPause(), 100);
        clearInterval(interval);
      }
    }, 100);
  }
}
class SCORMLesson extends Content implements INonPlayable {
  private lessonId: number;
  private onLoadedDataFunctions: Array<() => void>;
  private scormAPI: any;
  private videoElement: HTMLIFrameElement;
  private events = {
    "onload": () => { console.log("Loaded."); },
    "onPlay": () => { console.log("Playing."); },
    "onPause": () => { console.log("Paused."); },
    "onEnded": () => { console.log("Ended."); },
    "onTimeUpdate": () => { console.log("Time updated."); }
  };
  private standardElements;

  constructor(htmlElement: HTMLIFrameElement,
    videoUrl: string,
    standardElements: any,
    lessonId: number,
    onload?: () => void,
    errorFunction?: (error: () => void) => void
  ) {
    super(htmlElement, videoUrl, null, onload, errorFunction);
    this.lessonId = lessonId;
    this.onLoadedDataFunctions = [];
    this.scormAPI = {};
    this.videoElement = htmlElement;
    this.standardElements = standardElements;

    this.events.onload = onload;

    $.get(videoUrl.toString(), result => {
      const relativePath: string = videoUrl.toString().replace("imsmanifest.xml", "");
      const playbackUrl: string = result.getElementsByTagName("resource")[0].getAttribute("href");
      htmlElement.src = relativePath + playbackUrl;

      // set scorm api
      (() => {

        /**
         * The Initialize method indicates to the LMS that the content would like
         * to begin a communication session. All SCOs must call Initialize before
         * performing any other communication. The LMS returns a boolean indicating
         * the success or failure of the initialization. Typically, LMS's don't
         * need to do a lot of initialization and will always return "true".
         * @method LMSInitialize
         * @return {string} a boolean (in string form) indicating the success or failure of the initialization.
         */
        this.scormAPI.LMSInitialize = () => {
          this.onLoadedDataFunctions.forEach(callback => callback());
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
        this.scormAPI.LMSGetValue = element => {
          element = element.split(".").join("-");
          console.log("The LMS is getting " + element + ". Returning ", this.standardElements[element]);
          if (this.standardElements[element] === undefined) { return console.error("Missing value for SCORM lesson: ", element); }
          return this.standardElements[element];
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
        this.scormAPI.LMSSetValue = (element, value) => {
          element = element.split(".").join("-");
          console.log("The LMS is setting " + element + " to " + value);
          // runEventHandlers
          (() => {
            if (value === "cmi.core.lesson_location") {
              // i think this means the person progressed through the lesson
              this.events.onTimeUpdate();
            }
          })();
          // save standard elements locally.
          (() => {
            this.standardElements[element] = value;
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
        this.scormAPI.LMSCommit = () => {
          $.post("/api/subjectPage/setStandardLessonElement", this.standardElements).then((response) => {
            this.standardElements = response; // prevents the SCO from saving multiple times.
            console.log("Successfuly saved standardElements", response);
          },
            (error: any) => console.error(error)
          );
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
        this.scormAPI.LMSGetLastError = () => {
          // console.warn('The SCO is trying to get LastError. Return 0 for now. 0 means no error.');
          return 0; // 0 means nothing's wrong.
        };
        /**
         * [LMSGetLastErrorString description]
         *
         * @method LMSGetLastErrorString
         * @return {string}
         */
        this.scormAPI.LMSGetLastErrorString = () => {
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
        this.scormAPI.LMSGetErrorString = errorCode => {
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
        this.scormAPI.LMSGetDiagnostic = errCode => {
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
        this.scormAPI.LMSFinish = () => {
          alert("Finished!");
          this.events.onEnded();
        };
      })();

      window.API = this.scormAPI;
      this.events.onload();
    });
  }
  public load(): void {
    return; // because unload is done automatically I think.
    // tODO: Test changing lesson. Does the next lesson load, or does this function have to make it load?
  }
  public unload(): void {
    return; // because unload is done automatically I think.
    // tODO: Test changing lesson. Does the next lesson load, or does this function have to make it load?
  }
  public onEnd(callback: () => void): void {
    this.events.onEnded = callback;
  }
}
/**
 * Assignable units are specific to titles you are preparing for LMS integration (AICC and SCORM titles). An assignable unit is the largest
 * unit of organization in an AICC and SCORM-published title. Assignable units cannot contain other assignable units, but they can contain
 * chapters, sections, tests, and/or pages.
 *
 * @interface IAICCAssignableUnit
 */
interface IAICCAssignableUnit {
  /**
   * A system assigned, unique, Course Element identifier. The exporting system for the course structure
   * generates this unique identifier for every Course Element. (cmi001v4.pdf, 2. 3.4.1, p. 120)
   *
   * @type {string}
   * @memberOf IAICCAssignableUnit
   */
  system_id: string;
  /**
   * Assignable units (AU’s) may be categorized. Course Elements.Type
   * identifies a developer-defined category of assignable unit. These are
   * determined by the designer/developer of the assignable unit. (cmi001v4.pdf , s. 3.4.5,  p. 122)
   *
   * @type {string}
   * @memberOf IAICCAssignableUnit
   */
  type: string;
  /**
   * The string of characters needed to successfully launch an executable
   * program in the Microsoft Windows operating environment. Environment
   * variables may be embedded in the command line (cmi001v4.pdf , s. 3.4.6,  p. 123)
   *
   * @type {string}
   * @memberOf IAICCAssignableUnit
   */
  command_line: string;
  /**
   * The fully qualified name of the file containing the most critical content of
   * the assignable unit (an assignable unit may require several files). The
   * purpose of this field is to enable the CMI to locate the primary file
   * needed to launch an AU. (cmi001v4.pdf , s. 3.4.7,  p. 123)
   *
   * @type {string}
   * @memberOf IAICCAssignableUnit
   */
  file_name: string;
  /**
   * The maximum possible value for Core.Score.Raw that the assignable
   * unit will return. The AU designer determines this value. (cmi001v4.pdf , s. 3.4.9,  p. 124)
   *
   * @type {number}
   * @memberOf IAICCAssignableUnit
   */
  max_score: number;
  /**
   * This element defines a score level at which an AU is considered
   * mastered. (cmi001v4.pdf , s. 3.4.8,  p. 124)
   *
   * @type {number}
   * @memberOf IAICCAssignableUnit
   */
  mastery_score: number;
  /**
   * The amount of time the student is allowed to have in the current AU
   * session. See Student Data.Max Time Limit Action for the AU's
   * expected response to exceeding this time limit. (cmi001v4.pdf , s. 3.4.10,  p. 125)
   *
   * @type {string}
   * @memberOf IAICCAssignableUnit
   */
  max_time_allowed: string;
  /**
   * Indicates to the AU what actions to perform when the Student Data.Max
   * Time Allowed time limit is exceeded for the AU session. (cmi001v4.pdf , s. 3.4.11,  p. 125)
   *
   * @type {string}
   * @memberOf IAICCAssignableUnit
   */
  time_limit_action: string;
  /**
   * Authoring system (or development tools) used to create the assignable
   * unit. This information is provided by the course developer (cmi001v4.pdf , s. 3.4.12,  p. 126)
   *
   * @type {string}
   * @memberOf IAICCAssignableUnit
   */
  system_vendor: string;
  /**
   * Documentation not found or confusing. See cmi001v4.pdf , s. 3.4.13,  p. 126.
   *
   * @type {string}
   * @memberOf IAICCAssignableUnit
   */
  core_vendor: string;
  /**
   * AU-specific launch parameters for web-based AU's. Additional
   * name/value parameters that must be appended to the "URL Command
   * line" (See sections 6.3) at AU launch time. (cmi001v4.pdf , s. 3.4.14,  p. 126)
   *
   * @type {string}
   * @memberOf IAICCAssignableUnit
   */
  web_launch: string;
  /**
   * A string of characters sent to the CMI system that enables the CMI
   * system to authenticate an assignable unit. This authentication is
   * independent of any user authentication that the CMI system uses. (cmi001v4.pdf , s. 3.4.15,  p. 127)
   *
   * @type {string}
   * @memberOf IAICCAssignableUnit
   */
  au_password: string;
}
class AICCLesson extends Content implements INonPlayable {
  private events = {
    "onload": () => { console.log("Loaded."); },
    "onPlay": () => { console.log("Playing."); },
    "onPause": () => { console.log("Paused."); },
    "onEnded": () => { console.log("Ended."); },
    "onTimeUpdate": () => { console.log("Time updated."); }
  };
  /**
   * The Launch URL is dynamically created by the CMI in order to launch the AU. The structure of the launch URL is as follows: `{URL to
   * Assignable Unit}?{CMI generated query string}`. The (CMI generated) query string is separated from the Assignable Unit’s URL by "?"
   * (Question mark). The URL to the AU is the value of Course `Elements.Filename` corresponding to the AU in the course structure (see
   * section 3.4.7). The query string is composed of name/value pairs (i.e. name=value) separated by ampersands ("&"s). All values are
   * url-encoded (see section 6.4.1.1) and must be url-decoded prior to interpretation. The value of Course Elements.Web Launch Parameters
   * is appended to the CMI generated querystring.
   *
   * @private
   * @type {string}
   * @memberOf AICCLesson
   */
  private launchUrl: string;
  constructor(htmlElement: HTMLIFrameElement,
    videoUrl: string,
    contentId: number,
    userId: number,
    onload?: () => void,
    errorFunction?: (error: () => void) => void
  ) {
    super(htmlElement, videoUrl, null, onload, errorFunction);
    const assignableUnitFileURL: string = videoUrl;
    $.get(videoUrl).then(response => {
      const aiccData: IAICCAssignableUnit = this.csvToJSONAICCAssignableUnit(response)[0]; // take the first one?????
      this.launchUrl = this.getLaunchUrl(
        aiccData.file_name,
        contentId.toString(),
        location.host + "/api/SubjectPage/aiccURL"
      );
      htmlElement.addEventListener("load", () => { this.events.onload(); });
      htmlElement.setAttribute("src", this.launchUrl);
    }, error => {
      throw error;
    });
    this.events.onload();
  }
  public onEnd(callback: () => void): void { this.events.onEnded = callback; }
  public load(): void { return; /* i think it automatically loads; */ }
  public unload(): void { return; /* because unload is done automatically I think. Needs to be tested. */ }
  /**
   * Takes out the first and last quotes of a string
   * @param text The text to fix.
   * @return The fixed text
   */
  private removeFirstAndLastQuote(text: string): string {
    const length: number = text.length;
    if (text[0] === `"`) { text = text.slice(1); }
    if (text[length - 1] === `"`) { text = text.slice(text.length - 1); }
    return text;
  }
  /**
   * This will parse a delimited string into an array of
   * arrays. The default delimiter is the comma, but this
   * can be overriden in the second argument.
   * @param strData
   * @param strDelimiter
   * @return an array of an array of values
   */
  private CSVToArray(strData: string, strDelimiter?: string): any[][] {
    // check to see if the delimiter is defined. If not,
    // then default to comma.
    strDelimiter = (strDelimiter || ",");
    // create a regular expression to parse the CSV values.
    let strMatchedValue: any;
    let objPattern: RegExp = new RegExp(
      (
        // delimiters.
        "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +
        // quoted fields.
        "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +
        // standard fields.
        "([^\"\\" + strDelimiter + "\\r\\n]*))"
      ),
      "gi"
    );
    // create an array to hold our data. Give the array
    // a default empty first row.
    let arrData: Array<Array<any>> = [[]];
    // create an array to hold our individual pattern
    // matching groups.
    let arrMatches: any[] = null;
    // keep looping over the regular expression matches
    // until we can no longer find a match.
    while (arrMatches = objPattern.exec(strData)) {
      // get the delimiter that was found.
      let strMatchedDelimiter: any = arrMatches[1];
      // check to see if the given delimiter has a length
      // (is not the start of string) and if it matches
      // field delimiter. If id does not, then we know
      // that this delimiter is a row delimiter.
      if (
        strMatchedDelimiter.length &&
        (strMatchedDelimiter !== strDelimiter)
      ) {
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
        strMatchedValue = arrMatches[2].replace(
          new RegExp("\"\"", "g"),
          "\""
        );
      } else {
        // we found a non-quoted value.
        strMatchedValue = arrMatches[3];
      }
      // now that we have our value string, let's add
      // it to the data array.
      arrData[arrData.length - 1].push(strMatchedValue);
    }
    // return the parsed data.
    return (arrData);
  }
  /**
   * Converts a CSV string to a json object
   * @param csv the csv to parse
   */
  private csvToJSONAICCAssignableUnit(csv: string): IAICCAssignableUnit[] {
    const toJSON: IAICCAssignableUnit[] = [];
    const csvRows: any[][] = this.CSVToArray(csv);
    const columnHeaders: string[] = csvRows[0];
    for (let rowNumber: number = 1; rowNumber < csvRows.length; rowNumber++) {
      const currentRowAsArray: any[] = csvRows[rowNumber];
      let currentRowAsJSON: any = {};
      for (let colNumber: number = 0; colNumber < columnHeaders.length; colNumber++) {
        const currentColumn: string = columnHeaders[colNumber];
        currentRowAsJSON[currentColumn] = currentRowAsArray[colNumber];
      }
      toJSON.push(currentRowAsJSON);
    }
    return toJSON;
  }
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
  private getLaunchUrl(assignableUnitUrl: string, aicc_sid: string, aicc_url: string, otherParameters?: string): string {
    let launchUrl: string = assignableUnitUrl;
    const isRelativeUrl: boolean = assignableUnitUrl.indexOf("http://") !== 0 && assignableUnitUrl.indexOf("https://") !== 0;
    if (isRelativeUrl) {
      const temp: string[] = this.videoUrl.split("/");
      const endFile: string = temp[temp.length - 1];
      const preUrl: string = this.videoUrl.replace(endFile, "");
      launchUrl = preUrl + assignableUnitUrl;
    }

    launchUrl += "?";
    launchUrl += `aicc_sid=${encodeURIComponent(aicc_sid)}`;
    launchUrl += `&aicc_url=${encodeURIComponent(aicc_url)}`;

    if (otherParameters) {
      assignableUnitUrl += otherParameters;
    }

    return launchUrl;
  }
}