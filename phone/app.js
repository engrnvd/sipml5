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
        var agent = $scope.agent = {
            ext: '1103',
            name: 'Agent 3'
        };
        $scope.register = function () {
            sipml5.init({
                stackConfig: {
                    realm: '64.141.146.78',
                    impi: agent.ext,
                    impu: 'sip:' + agent.ext + '@64.141.146.78',
                    password: '1234pccw',
                    display_name: 'Advocate Three',
                    websocket_proxy_url: 'wss://64.141.146.78:8089/ws'
                }
            });
            sipml5.register();
        };

        sipml5.state.callerNumber = '13174444444';
        // $scope.$on('sipml-updated', function (updatedSip) {
        //     $scope.$apply(function () {
        //         angular.extend(sipml5, updatedSip);
        //     });
        // });
    }
})();