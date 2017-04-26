(function () {
    'use strict';
    angular.module('myApp', [
        'pusher-angular',
        'toaster',
        'ui.bootstrap',
        'CustomAngular'
    ]).controller('MainController', MainController);
    function MainController($http, $scope, toaster, sipml5) {
    }
})();