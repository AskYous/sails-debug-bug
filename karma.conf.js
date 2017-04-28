// Karma configuration
// Generated on Tue Jul 19 2016 14:42:06 GMT-0700 (Pacific Daylight Time)

module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine'],


    // list of files / patterns to load in the browser
    files: [
      'node_modules/angular/angular.js',
      'node_modules/angular-material/angular-material.js',
      'node_modules/angular-aria/angular-aria.js',
      'node_modules/angular-messages/angular-messages.js',
      'node_modules/angular-route/angular-route.js',
      'node_modules/angular-animate/angular-animate.js',
      'node_modules/angular-mocks/angular-mocks.js',
      'https://ajax.googleapis.com/ajax/libs/angular_material/1.0.0/angular-material.min.js',
      'test/myJS/lock-9.1.min.js',
      'assets/js/classes/CRUD.js',
      'assets/js/classes/Action.js',
      'assets/js/classes/Analytic.js',
      'assets/js/classes/Analytics.js',
      'assets/js/classes/Playable.js',
      'assets/js/classes/PlayableVideo.js',
      'assets/js/app.js',
      'assets/js/directives.js',
      'assets/js/filters.js',
      'assets/js/routes.js',
      'assets/js/controllers/main.js',
      'assets/js/controllers/category.js',
      'assets/js/controllers/course.js',
      'assets/js/controllers/footer.js',
      'assets/js/controllers/home-carousel.js',
      'assets/js/controllers/home-middle.js',
      'assets/js/controllers/home-top.js',
      'assets/js/controllers/toolbar.js',
      'assets/js/controllers/video.js',
      'test/spec.js'
    ],


    // list of files to exclude
    exclude: [
    ],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
    },


    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress'],


    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['Chrome', 'Firefox'],


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: Infinity
  })
}
