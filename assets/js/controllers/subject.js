// Controller for the subject page
/**
* Determines if a string ends with the given suffix.
* @param  {string} word   The word to check.
* @param  {string} suffix The suffix
* @return {Boolean}       Whether the given word ends with the given suffix;
*/
function endsWith(word, suffix) {
  return word.lastIndexOf(suffix) == word.length - suffix.length;
}

controllers.controller('subjectCtrl', function ($scope, $routeParams, $http, $sce, $location, $rootScope) {
  // The current controller instance.
  var ctrl = this;
  (function init() {
    // Log the user in if not logged in.
    if (!$rootScope.user) {
      $rootScope.setUser(true, setLanguages);
    }
    else {
      setLanguages();
    }

    function setLanguages() {
      // Set languages.
      if ($rootScope.languages) afterLanguagesAreSet();
      else $rootScope.setLanguages(afterLanguagesAreSet);
    }

    /**
    * This function is to be run after the languages have been set. Once they are
    * set, this function can run the rest of the main code for the controller.
    */
    function afterLanguagesAreSet() {

      /**
      * An array of the currently collapsed courses.
      * @type {Array}
      */
      ctrl.collapsedCourses = [];

      // An array of available language objects. This makes them accessable in the view.
      ctrl.languages = $rootScope.languages;

      // An array of reference types
      ctrl.referenceTypes = [];

      /**
      * The current language currently used in view.
      * @type {Object}
      */
      ctrl.currentLanguage = undefined;

      /**
      * The current subject for the view.
      * @type {Object}
      */
      ctrl.currentSubject = undefined;

      /**
      * The current lesson instance displayed in the view
      * @type {Object}
      */
      ctrl.currentLessonInstance = undefined;

      $http.get('/api/subjectPage/referenceTypes').then(function (response) {
        ctrl.referenceTypes = response.data;
      });

      // Get course, lessons, and lessons languages
      $http.get("/api/subjectPage/subject?id=" + $routeParams.subject).then(function (results) {

        ctrl.currentSubject = results.data;
        console.log('Subject', ctrl.currentSubject);

        (function setCurrentLanguage() {
          if ($routeParams.language) {
            ctrl.currentLanguage = ctrl.languages.filter(function (l) { return l.id == parseInt($routeParams.language); })[0]; // Set by url
          } else {
            ctrl.currentLanguage = ctrl.languages.filter(function (l) { return l.id == ctrl.currentSubject.subjectInstances[0].language; })[0]; // else set to first subjectInstance's language
          }
        })();
        (function setCurrentSubjectInstance() {
          ctrl.currentSubjectInstance = ctrl.currentSubject.subjectInstances.filter(function (s) {
            return s.language == ctrl.currentLanguage.id;
          })[0];
          console.log('Subject Instance', ctrl.currentSubjectInstance);
        })();
        (function setCurrentCategoryAndUpdateBreadcrum() {
          $http.get('/api/categories/' + ctrl.currentSubject.category).then(function (response) {
            ctrl.currentCategory = response.data;
            $rootScope.breadcrumbItems.category = ctrl.currentCategory;
            $rootScope.breadcrumbItems.subject = ctrl.currentSubject;
          });
        })();

        // Get Courses in current Subject and everything else
        $http.get("/api/subjectPage/coursesForSubject?subject=" + ctrl.currentSubject.id).then(function (results) {
          (function setCurrentSubjectsCourses() {
            ctrl.currentSubject.Courses = results.data;           // save courses
            console.log('Courses', ctrl.currentSubject.Courses);  // Log the courses
          })();
          var courseIds = []; // get course IDs (to build url query to get all lessons).
          ctrl.currentSubject.Courses.forEach(function (course) { return courseIds.push(course.id); });
          $http.get("/api/subjectPage/lessonsForCourses?courses=[" + courseIds + "]").then(function (results) {
            (function populateCoursesWithLessons() {
              results.data.forEach(function (lesson) {
                var parentCourse = ctrl.currentSubject.Courses.filter(function (course) { return course.id == lesson.course; })[0];
                if (!parentCourse.Lessons) parentCourse.Lessons = [];
                parentCourse.Lessons.push(lesson);
              });
            })();
            (function sortLesson() {
              ctrl.currentSubject.Courses.forEach(function (course) {
                course.Lessons = course.Lessons.sort(function (a, b) { return a.sequenceNumber > b.sequenceNumber ? 1 : 0; });
              });
            })();
            (function setCurrentLesson() {
              if ($routeParams.lesson) {
                ctrl.currentSubject.Courses.forEach(function (course) {
                  course.Lessons.forEach(function (l) {
                    if (l.id == $routeParams.lesson) {
                      (function collapseOtherCourses() {
                        ctrl.currentSubject.Courses.forEach(function (c) {
                          if (c.id != course.id) {
                            if (ctrl.collapsedCourses.indexOf(c.id) == -1) ctrl.collapsedCourses.push(c.id);
                          }
                        });
                      })();
                      ctrl.setCurrentLesson(l);
                    }
                  });
                });
              } else {
                var lessons = [];
                var unwatchedLessons = [];

                (function setLessons() {
                  ctrl.currentSubject.Courses.forEach(function (course) {
                    course.Lessons.forEach(function (lesson) {
                      lessons.push(lesson);
                    });
                  });
                })();
                (function setUnwatchedLessons() {
                  unwatchedLessons = lessons.filter(function (lesson) {
                    var lessonInstanceInCurrentLanguage = ctrl.getLessonInstance(lesson);
                    return !lessonInstanceInCurrentLanguage.watched; // get unwatched lessons
                  });
                })();

                if (unwatchedLessons.length > 0 && (unwatchedLessons.length < lessons.length)) {
                  ctrl.setCurrentLesson(unwatchedLessons[0]);
                } else {
                  ctrl.setCurrentLesson(lessons[0]);
                }
              }
            })();
            (function setCurrentLessonInstance() {
              ctrl.currentLessonInstance = ctrl.currentLesson.lessonInstances.filter(function (ll) { return ll.language == ctrl.currentLanguage.id; })[0];
              if (!ctrl.currentLessonInstance) {
                ctrl.setCurrentLanguageById(ctrl.currentLesson.lessonInstances[0].language); // set the language to the first lesson's first language
              }
              ctrl.currentLessonInstance.trustedFileUrl = $sce.trustAsResourceUrl(ctrl.currentLessonInstance.fileURL);
            })();
            (function setHighlightedCourseAndCollapseOthersIfNecesssary() {
              (function setHighlightedCourse() {
                if ($routeParams.course) {
                  ctrl.highlightedCourse = parseInt($routeParams.course);
                }
              })();
              (function collapseOtherCourses() {
                if (ctrl.highlightedCourse) {
                  ctrl.collapsedCourses = ctrl.currentSubject.Courses.filter(function (course) {
                    return course.id != ctrl.highlightedCourse;
                  }).map(function (course) {
                    return course.id;
                  });
                }
              })();
            })();
            (function setSettingsForVideoPlayer() {
              ctrl.videoSettings = ctrl.getVideoSettings();
            })();
            (function setReferencesPerLessonInstance() {
              var lessonInstanceIDs = []; // get course IDs (to build url query to get all lessons).
              ctrl.currentSubject.Courses.forEach(function (course) {
                course.Lessons.forEach(function (lesson) {
                  lesson.lessonInstances.forEach(function (li) {
                    lessonInstanceIDs.push(li.id);
                  });
                });
              });

              // Set lesson instance references
              $http.get('/api/subjectPage/referencesForLessonInstances?lessonInstances=[' + lessonInstanceIDs + ']').then(function (response) {
                ctrl.currentSubject.Courses.forEach(function (course) {
                  course.Lessons.forEach(function (lesson) {
                    lesson.lessonInstances.forEach(function (li) {
                      li.references = response.data.filter(function (reference) { return reference.lessonInstance == li.id; });
                    });
                  });
                });
              });
            })();
          }, function (error) { return console.error(error); });
        }, function (e) { return console.error(e); });
      });
    }
  })();
  /**
  * When called, it submits a pdf click statistic to the server.
  * @param  {number} lessonInstanceID The lesson instance id to attached the
  * PDF click event to.
  */
  ctrl.submitPdfClick = function (lessonInstanceID) {
    $http.post('/api/subjectPage/submit-PDF-click', {
      'lessonInstanceID': lessonInstanceID
    }).then(function (response) { return console.log('Submitted PDF Click'); }, function (error) { return console.error(error); });
  };
  ctrl.getReferenceTypeById = function (id) {
    return ctrl.referenceTypes.filter(function (r) { return r.id == id; })[0];
  };
  /**
  * Creates the yammer feed.
  */
  ctrl.initYammer = function () {
    var url = "https://www.flyhightraining.com/#/Subject/" + $routeParams.subject;
    if ($routeParams.language) {
      languageId = $routeParams.language;
      url += "?language=" + languageId;
    }


    document.getElementById('yammer-feed').innerHTML = '';

    yam.connect.embedFeed({
      container: '#yammer-feed',
      network: 'flextronics.com', // network permalink
      feedType: 'open-graph',
      feedId: "",
      objectProperties: {
        url: url // the url they're sharing
      }
    });
  };
  /**
  * Gets the instances of a course that are available in the currently set language
  * @param  {Object} course The course to get instances for.
  * @return {array}        An array of course instances.
  */
  ctrl.getCourseInstance = function (course) {
    return course.courseInstances.filter(function (instance) { return instance.language == ctrl.currentLanguage.id; })[0];
  };
  /**
  * Determines if a lesson is the currently displayed lesson.
  * @param  {Object}  lesson The lesson to check.
  * @return {Boolean}        Whether the given lesson is the currently displayed lesson.
  */
  ctrl.isCurrentLesson = function (lesson) {
    var isSame = ctrl.currentLesson === lesson;
    return isSame;
  };
  /**
  * Returns an array of a course instances of a course that support the current
  * language.
  * @param  {Object} course  The course to get instances for.
  * @return {Array}          The instances.
  */
  ctrl.getCourseInstance = function (course) {
    return course.courseInstances.filter(function (instance) { return instance.language == ctrl.currentLanguage.id; })[0];
  };
  /**
  * Returns a lesson instances of a lesson that support the current language.
  * @param  {Object} lesson   The lesson to get instanes for.
  * @return {LessonInstances} The instances.
  */
  ctrl.getLessonInstance = function (lesson) {
    return lesson.lessonInstances.filter(function (instance) { return instance.language == ctrl.currentLanguage.id; })[0];
  };
  /**
  * This function updates the view for the user. It takes a lesson and
  * (angular) updates the view, including the video player. It also
  * considers the user's currently selected language and selects the
  * lessonInstances for that language for the view to render. This was designed
  * to be a click event handler when the user clicks a lesson, as well as when
  * the page first loads.
  * @param lesson the lesson
  */
  ctrl.setCurrentLesson = function (lesson) {
    // update the current lesson
    ctrl.currentLesson = lesson;
    ctrl.currentCourse = ctrl.currentSubject.Courses.filter(function (course) { return course.id == ctrl.currentLesson.course; })[0];

    // set the current lesson language to the current language
    ctrl.currentLessonInstance = lesson.lessonInstances.filter(function (l) { return l.language == ctrl.currentLanguage.id; })[0];
    $rootScope.$broadcast('lessonInstanceUpdated', {
      'lessonInstance': ctrl.currentLessonInstance,
      'videoSettings': ctrl.getVideoSettings()
    });

    // tell angular to trust this url
    if (!ctrl.currentLessonInstance.fileURL) console.error('This lesson instance has no url!');
    if (!ctrl.currentLessonInstance.fileURL.$$unwrapTrustedValue) {
      ctrl.currentLessonInstance.trustedFileUrl = $sce.trustAsResourceUrl(ctrl.currentLessonInstance.fileURL);
    }

    // update url
    $location.search('lesson', ctrl.currentLesson.id);
    $location.search('language', ctrl.currentLanguage.id);
    ctrl.initYammer(); // refresh yammer
    ctrl.videoSettings = ctrl.getVideoSettings(ctrl.currentLessonInstance);
  };
  // Adds or removes a course from the expanded courses
  ctrl.toggleCourseAccordian = function (course) {
    if (ctrl.collapsedCourses.indexOf(course.id) == -1) {
      ctrl.collapsedCourses.push(course.id);
    }
    else {
      ctrl.collapsedCourses.splice(ctrl.collapsedCourses.indexOf(course.id), 1);
    }
  };
  // Determines if a course is expanded or not
  ctrl.isExpanded = function (course) {
    return ctrl.collapsedCourses.indexOf(course.id) == -1 && ctrl.courseSupported(course);
  };
  // Function to set the current language by id
  ctrl.setCurrentLanguageById = function (id) {
    ctrl.languages.forEach(function (l) {
      if (l.id == id) {
        ctrl.currentLanguage = l;
        return;
      }
    });

    // Update the subject instance
    ctrl.currentSubjectInstance = ctrl.currentSubject.subjectInstances.filter(function (s) { return s.language == id; })[0];

    // Change the current lesson too.
    // Also sets the current lesson.
    if (ctrl.currentLesson) {
      // NOTE: Playing the current selected lesson does not gaurauntee that
      // the lesson is available in the currently selected language

      // TODO: Find the first lesson that does support the currently
      // selected lesson and set that as the current lesson instead

      ctrl.setCurrentLesson(ctrl.currentLesson);
    }
  };
  /**
   * Determines whether the given course supports the current language.
   * @method courseSupported
   * @param  {Course}        course The course.
   * @return {Boolean}              Whether the course supports the current language.
   */
  ctrl.courseSupported = function (course) {
    var hasCourseInCurrentLanguage = false;
    // check if lesson supports current language
    course.courseInstances.forEach(function (instance) {
      var isSameLanguage = instance.language == ctrl.currentLanguage.id;
      if (isSameLanguage) {
        hasCourseInCurrentLanguage = instance.language == ctrl.currentLanguage.id;
        return false; // end the forEach loop
      }
    });
    return hasCourseInCurrentLanguage;
  };
  // Determines of the language is supported for a course. If there's no lessons under a language, it returns false.
  ctrl.hasLessonsInLanguage = function (language) {
    if (ctrl.currentSubject === undefined) return false;
    if (ctrl.currentSubject.Courses === undefined) return false;
    if (ctrl.currentSubject.Courses[0].Lessons === undefined) return false;

    var result = false;
    ctrl.currentSubject.Courses.forEach(function (course) {
      course.Lessons.forEach(function (lesson) {
        lesson.lessonInstances.forEach(function (instance) {
          if (instance.language == language.id)
            result = true;
        });
      });
    });
    return result;
  };
  // Function to set the language lesson of a lesson.
  ctrl.setLanguageLesson = function (lesson) {
    // if null, then lesson doesn't support current language.
    // if not null, then a lesson language with the current language was found.
    var languageLessons = lesson.lessonInstances.filter(function (ll) { return ll.language == ctrl.currentLanguage.id; });
    if (languageLessons.length) {
      lesson.currentLanguageLesson = languageLessons[0];
    }
    else {
      console.error('Lesson does not have a lesson language under the current language.');
    }
  };
  // Gets the duration of the course
  ctrl.getTotalDuration = function () {
    if (!ctrl.currentSubject) return 0;
    if (!ctrl.currentSubject.Courses) return 0;
    if (!ctrl.currentSubject.Courses[0].Lessons) return 0;
    var duration = 0;
    ctrl.currentSubject.Courses.forEach(function (course) {
      course.Lessons.forEach(function (lesson) {
        var lessonInstance = ctrl.getLessonInstance(lesson);
        if (lessonInstance) {
          duration += ctrl.getLessonInstance(lesson).duration;
        }
      });
    });
    return duration;
  };
  // Gets the video settings of the current lesson instance
  ctrl.getVideoSettings = function () {
    if (!ctrl.currentLessonInstance) return;
    if (!ctrl.currentCourse) return;
    var videoSettings = {};
    var posterImage = null;
    (function setPosterImage() {
      if (endsWith(ctrl.currentLessonInstance.fileURL, 'mp4')) {
        posterImage =
          ctrl.currentCourse.thumbnailLargeUrl ||
          ctrl.currentSubject.thumbnailLargeUrl ||
          ctrl.currentCourse.thumbnailSmallUrl ||
          ctrl.currentSubject.thumbnailSmallUrl;
      } else {
        posterImage = null;
      }
    })();
    videoSettings.analyticsVideoId = ctrl.currentLessonInstance.id;
    videoSettings.url = ctrl.currentLessonInstance.fileURL;
    videoSettings.poster = posterImage;
    videoSettings.shareUrl = ctrl.getLessonShareUrl();
    videoSettings.feedbackUrl = ctrl.getFeedbackUrl();
    videoSettings.fixedHeight = true;
    videoSettings.standardElements = {};
    (function setStandardElements() {
      var standardElements = {};
      var hasStandardElements = ctrl.currentLessonInstance.$standardLessonElements.length > 0;
      if (hasStandardElements) {
        standardElements = ctrl.currentLessonInstance.$standardLessonElements[0]; // the latest one.
      } else {
        (function setDefaultValues() {
          standardElements.lessonInstance = ctrl.currentLessonInstance.id;
          standardElements['cmi-core-student_name'] = $rootScope.user.name;
          standardElements['cmi-core-student_id'] = $rootScope.user.id;
          standardElements['cmi-core-lesson_location'] = 0;
          standardElements['cmi-suspend_data'] = '';
          standardElements['cmi-core-lesson_status'] = 'not attempted';
          standardElements['cmi-core-score-raw'] = 0;
        })();
      }
      videoSettings.standardElements = standardElements;
    })();
    return videoSettings;
  };
  // Gets the total number of lessons
  ctrl.totalNumOfLessons = function () {
    if (!ctrl.currentSubject) return 0;
    if (!ctrl.currentSubject.Courses) return 0;
    if (!ctrl.currentSubject.Courses[0].Lessons) return 0;

    var count = 0;
    ctrl.currentSubject.Courses.forEach(function (course) { return course.Lessons.forEach(function (lesson) { return count++; }); });
    return count;
  };
  // Gets the url for the current subject instance
  ctrl.getSubjectShareUrl = function () {
    if (!ctrl.currentLesson)
      return null;
    var url = location.origin + $location.path();
    return "mailto:?subject=" +
      encodeURIComponent(ctrl.currentSubjectInstance.name) + "&body=" +
      encodeURIComponent(
        "Check out " + ctrl.currentSubjectInstance.name +
        " on Fly High Training! \n\n " + location.origin + "/#" + $location.path() +
        "?language=" + ctrl.currentLanguage.id
      );
  };
  // Gets the share url for the current lesson instance
  ctrl.getLessonShareUrl = function () {
    var url = location.origin + '/#/Subject/' + ctrl.currentSubject.id + '?lesson=' + ctrl.currentLesson.id + '&language=' + ctrl.currentLanguage.id;
    return "mailto:?subject=" +
      encodeURIComponent(ctrl.currentLessonInstance.name) + "&body=" +
      encodeURIComponent("Check out " + ctrl.currentLessonInstance.name +
        " on Fly High Training! \n\n " + url
      );
  };
  // Gets the feedback url for the current lesson instance
  ctrl.getFeedbackUrl = function () {
    var mailto = 'Admin@FlyHighTraining.com';
    var subject = ctrl.currentSubject.name + ' Feedback: Lesson: ' + ctrl.currentLessonInstance.id + ' - ' + ctrl.currentLessonInstance.name;
    var body = 'Please describe the issue or question here: \n\n';

    return 'mailto:' + mailto + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
  };
});
