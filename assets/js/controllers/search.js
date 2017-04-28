function uppercaseFirstLetter(word) {
  return word[0].toUpperCase() + word.substring(1);
}

controllers.controller('searchCtrl', function ($http, $location, $routeParams, $rootScope) {
  var ctrl = this;
  ctrl.query = $routeParams.query; // The user's query
  ctrl.results = []; // The types of search results
  ctrl.filters = {}; // Filters that are on based on types checked by the user
  ctrl.numOfResults = 0;  // The number of search results.
  ctrl.resultLanguages = []; // The languages that are avaialble in the results
  ctrl.selectedLanguage = {}; // The selected language by the user.

  // Gets the url of a search result
  ctrl.getUrl = function (result) {
    var type = result.type;
    var id = result.value.id;
    var url = '#/';
    switch (type.toLowerCase()) {
      case 'courses':
        url += 'Subject/' + result.value.subject.id + '?course=' + id;
        break;
      case 'lessons':
        url += 'Subject/' + result.value.course.subject + '?lesson=' + result.value.id;
        break;
      default:
        url += type + '/' + id;
    }
    return url;
  };
  ctrl.onLanguageSelect = function () {
    // ctrl.selectedLanguage updated
    $rootScope.$broadcast('languageUpdated', ctrl.selectedLanguage.id);
  };

  (function init() {
    // If there is a query
    if (ctrl.query === undefined) return;
    (function setSearchStatus() {
      ctrl.status = 'searching';
    })();
    (function getSearchResults() {
      var uri = "api/search/find?query=" + encodeURI(ctrl.query);
      $http.get(uri).then(function (response) {
        var results = []; // The results from the query
        var types = [];   // The types of results

        (function updateRandomCtrlVars() {
          ctrl.status = 'success';
          ctrl.numOfResults = response.data.length;
          (function setLanguages() {
            response.data.forEach(function (searchResult) {
              var languages = [];
              var instanceKey = '';
              (function setInstanceKey() {
                switch (searchResult.type) {
                  case 'courses': {
                    instanceKey = 'courseInstances';
                    break;
                  }
                  case 'lessons': {
                    instanceKey = 'lessonInstances';
                    break;
                  }
                }
              })();
              (function setLauguages() {
                var instances = searchResult.value[instanceKey];
                instances.forEach(function (instance) {
                  var language = $rootScope.languages.filter(function (language) { return language.id == instance.language; })[0];
                  if (ctrl.resultLanguages.indexOf(language) == -1) ctrl.resultLanguages.push(language);
                });
              })();
            });
          })();
          (function setInitialLanguage() {
            ctrl.resultLanguages.filter(function (language) {
              if (language.name.toLowerCase() == 'english') {
                ctrl.selectedLanguage = language;
              }
            });
          })();
        })();
        (function setResults() {
          var typesOrder = ['categories', 'subjects', 'courses', 'lessons'];
          results = response.data.sort(function (a, b) {
            var isSameType = a.type == b.type;
            if (!isSameType) return typesOrder.indexOf(a.type) - typesOrder.indexOf(b.type);
            else {
              // a and b are same type at this point.
              var type = a.type;
              var isSameSubject;
              switch (type) {
                case 'categories':
                  return a.value.name.localeCompare(b.value.name);
                case 'lessons':
                  isSameSubject = a.value.course.subject.id == b.value.course.subject.id;
                  if (isSameSubject) {
                    var isSameCourse = a.value.course.id == b.value.course.id;
                    if (isSameCourse) {
                      return a.value.sequenceNumber - b.value.sequenceNumber; // QUESTION: sort by course seq number or name?
                    }
                    else {
                      return a.value.course.sequenceNumber - b.value.course.sequenceNumber;
                    }
                  }
                  else {
                    return a.value.course.subject.name.localeCompare(b.value.course.subject.name);
                  }
                  break;
                case 'courses':
                  isSameSubject = a.value.subject.id == b.value.subject.id;
                  if (isSameSubject) {
                    return a.value.sequenceNumber - b.value.sequenceNumber;
                  }
                  else {
                    return a.value.subject.name.localeCompare(b.value.subject.name);
                  }
                  break;
                default:
                  a.value.name.localeCompare(b.value.name);
              }
            }
          });
        })();
        (function setTypes() {
          results.forEach(function (result) {
            var type = uppercaseFirstLetter(result.type);
            if (types.indexOf(type) == -1) {
              types.push(type);
            }
          });
        })();
        (function setResultsInCtrl() {
          types.forEach(function (type) {
            var resultForCtrl = {
              'type': type,
              'show': false,
              'values': results.filter(function (result) {
                return uppercaseFirstLetter(result.type) == type;
              })
            };
            if (resultForCtrl.type == 'Lessons') resultForCtrl.show = true;
            ctrl.results.push(resultForCtrl);
          });
        })();
        (function setImageCaptions() {
          (function setLessonCaptions() {
            var courseIds = [];
            (function setCourseIds() {
              ctrl.results.filter(function (result) {
                return result.type == 'Lessons';
              }).forEach(function (result) {
                result.values.forEach(function (result) {
                  if (courseIds.indexOf(result.value.course.id) == -1) courseIds.push(result.value.course.id);
                });
              });
            })();
            var uri = '/api/search/courseLessonCount?courses=' + JSON.stringify(courseIds);
            var lessonResults = ctrl.results.filter(function (result) { return result.type == 'Lessons'; })[0];
            $http.get(uri).then(function (response) {
              response.data.forEach(function (courseLessonCount) {
                var courseId = courseLessonCount.courseId;
                var lessonCount = courseLessonCount.lessonCount;
                lessonResults.values.filter(function (lesson) { return lesson.value.course.id == courseId; }).forEach(function (lessonResult) {
                  lessonResult.thumbnailCaption = lessonResult.value.sequenceNumber;
                  lessonResult.ready = true;
                });
              });
            });
          })();
          (function setCourseCaptions() {
            var subjectIds = [];
            (function setSubjectIds() {
              ctrl.results.filter(function (result) {
                return result.type == 'Courses';
              }).forEach(function (result) {
                result.values.forEach(function (result) {
                  if (subjectIds.indexOf(result.value.subject.id) == -1) subjectIds.push(result.value.subject.id);
                });
              });
            })();
            var uri = '/api/search/subjectCourseCount?subjects=' + JSON.stringify(subjectIds);
            var courseResults = ctrl.results.filter(function (result) { return result.type == 'Courses'; })[0];
            $http.get(uri).then(function (response) {
              response.data.forEach(function (subjectCourseCount) {
                var subjectId = subjectCourseCount.subjectId;
                var courseCount = subjectCourseCount.courseCount;
                courseResults.values.filter(function (course) { return course.value.subject.id == subjectId; }).forEach(function (courseResult) {
                  courseResult.thumbnailCaption = courseResult.value.sequenceNumber + ' of ' + subjectCourseCount.courseCount;
                  courseResult.ready = true;
                });
              });
            });
          })();
        })();
      }, function (error) {
        ctrl.status = 'error';
      });
    })();
  })();
});
