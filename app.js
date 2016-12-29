
/* App Module */
define(
  ['angularAMD','angular-sanitize','angular-animate','angular-strap.tpl',
    'angular-ui-router','common/service','common/directive'], function (angularAMD) {
  'use strict';
  var app = angular.module('sm.demo', ['ngAnimate', 'mgcrea.ngStrap','ui.router']);

  app.config(['$stateProvider', '$urlRouterProvider', '$httpProvider', function ($stateProvider, $urlRouterProvider, $httpProvider) {

    $stateProvider
      .state('main', angularAMD.route({
        url: '/main',
        templateUrl: 'main/main.html',
        controllerUrl: 'main/main_ctrl'
      }));

    // Else
    $urlRouterProvider
      .otherwise('/main');

    $httpProvider.defaults.useXDomain = true;
    delete $httpProvider.defaults.headers.common['X-Requested-With'];
  }]);

  return angularAMD.bootstrap(app);
});
