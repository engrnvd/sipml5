(function () {
    'use strict';
    angular.module('myApp', [
        'pusher-angular',
        'toaster',
        'ui.bootstrap',
        'CustomAngular'
    ]).controller('MainController', MainController);
    function MainController($http, $scope, toaster, sipml5) {
        $scope.sipml5 = sipml5;
        sipml5.init({
            stackConfig: {
                realm: '64.141.146.78',
                impi: '1103',
                impu: 'sip:1103@64.141.146.78',
                password: '1234pccw',
                display_name: 'Advocate Three',
                websocket_proxy_url: 'wss://64.141.146.78:8089/ws'
            }
        });

        sipml5.state.callerNumber = '13174444444';
    }
})();