var AppBundleInfo = {};

if (typeof exports !== 'undefined') {
    AppBundleInfo = exports;
}

(function() {


    var iosAppBundleInfo = require('./ios');
    var andriodAppBundleInfo = require("./android");

    var UNKNOWN = 'unknown',
        IOS = 'ios',
        ANDROID = 'android',
        defaultIcons = {
            ios: "",
            android: ""
        };

    window.apkReader = andriodAppBundleInfo;

    AppBundleInfo.readApk = function(file) {
        return andriodAppBundleInfo.getApkInfo(file);
    }

    AppBundleInfo.readIpa = function(file) {
        return iosAppBundleInfo.getIpaInfo(file);
    }

    AppBundleInfo.readApp = function(file, name) {
        if (/\.ipa$/.test(file.name || name)) {
            return _appInfoConvert(iosAppBundleInfo.getIpaInfo(file), IOS);
        } else {
            return _appInfoConvert(andriodAppBundleInfo.getApkInfo(file), ANDROID);
        }
    }

    AppBundleInfo.setDefaultIcons = function(icons) {
        $.extend(defaultIcons, icons);
    }

    AppBundleInfo.setUnknownString = function(str) {
        UNKNOWN = str;
    }

    function _appInfoConvert(promise, type) {
        var app = { desc: '' },
            release = {
                desc: '',
                file_size: '',
                file_name: '',
                download_url: '',
                icon_url: ''
            };

        return promise.then(function(appInfo) {

            var icon_url = appInfo.iconBlob ? window.URL.createObjectURL(appInfo.iconBlob) : defaultIcons[type];
            $.extend(appInfo, {
                get: getFieldValue
            });

            $.extend(app, {
                type: type,
                icon_url: icon_url,
                name: appInfo.get('CFBundleDisplayName', 'CFBundleName', 'label'),
                package_name: appInfo.get('CFBundleIdentifier', 'package'),
            });

            $.extend(release, {
                icon_url: icon_url,
                udids: appInfo.udids,
                release_type: appInfo.releaseType || '',
                version: appInfo.get('CFBundleShortVersionString', 'versionName'),
                build: appInfo.get('CFBundleVersion', 'versionCode'),
                package_name: appInfo.get('CFBundleIdentifier', 'package'),
                main_activity: appInfo.get('CFBundleResourceSpecification', 'mainActivity'),
                min_sdk_version: appInfo.get('MinimumOSVersion', 'minSdkVersion')
            });

            return {
                app: app,
                release: release,
                iconBlob: appInfo.iconBlob
            };

        });

        function getFieldValue() {
            var value,
                object = this,
                keys = Array.prototype.slice.call(arguments, 0);
            $.each(keys, function(index, key) {
                value = value || object[key];
            });
            return value || UNKNOWN;
        }
    }

}(AppBundleInfo));
