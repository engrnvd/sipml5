(function () {
    if (!Array.isArray) {
        Array.isArray = function (arg) {
            return Object.prototype.toString.call(arg) === '[object Array]';
        };
    }

    angular.module('CustomAngular').factory('nvdStorage', nvdStorage);

    function nvdStorage() {
        var nvdStorage = {};

        nvdStorage.storage = function () {
            return window.localStorage;
        };

        nvdStorage.domain = function () {
            return window.location.hostname;
        };

        nvdStorage.makeKey = function (item) {
            return nvdStorage.domain() + '.' + item;
        };

        nvdStorage.get = function (item) {
            return JSON.parse(nvdStorage.storage().getItem(nvdStorage.makeKey(item)));
        };

        nvdStorage.set = function (item, value) {
            nvdStorage.storage().setItem(nvdStorage.makeKey(item), JSON.stringify(value));
        };

        nvdStorage.remove = function (item, value) {
            nvdStorage.storage().removeItem(nvdStorage.makeKey(item));
        };

        return nvdStorage;
    }
})();