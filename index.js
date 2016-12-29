require.config({
  paths: {
    'jquery':'dependencies/jquery/dist/jquery',
    'bootstrap':'dependencies/bootstrap/dist/js/bootstrap',
    'angular': 'dependencies/angular/angular',
    'angular-sanitize':'dependencies/angular-sanitize/angular-sanitize',

    'angular-animate':'dependencies/angular-animate/angular-animate',
    'angular-ui-router': 'dependencies/angular-ui-router/release/angular-ui-router',
    'angularAMD': 'dependencies/angularAMD/angularAMD',
    'ngload':'dependencies/angularAMD/ngload',
    'angular-strap':'dependencies/angular-strap/dist/angular-strap',
    'angular-strap.tpl':'dependencies/angular-strap/dist/angular-strap.tpl',
    'muplayer/player':'lib/muplayer/player',
    'muplayer/core/engines/audioCore':'lib/muplayer/player',
    'nanoscroller':'lib/jquery.nanoscroller.min'
  },

  // Add angular modules that does not support AMD out of the box, put it in a shim
  shim: {
    'bootstrap':['jquery'],
    'angular':['jquery'],
    'angular-sanitize':['angular'],
    'angular-animate':['angular'],
    'angularAMD': [ 'angular' ],
    'ngload': [ 'angularAMD' ],

    'angular-strap':['bootstrap','angular'],
    'angular-strap.tpl':['angular-strap'],
    'angular-ui-router': [ 'angular' ]
  },

  // kick start application
  deps: ['app']
});
