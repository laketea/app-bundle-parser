(function() {

    var apkReader = {};

    (function(apkReader) {
        var getFileMap = function(blob) {
            var deferred = $.Deferred();
            zip.createReader(new zip.BlobReader(blob), function(reader) {
                var fileMap = {};
                reader.getEntries(function(entries) {
                    entries.forEach(function(entry) {
                        fileMap[entry.filename] = entry;
                    });
                    deferred.resolve(reader, fileMap);
                });
            }, function(error) {
                deferred.reject(error)
            });
            return deferred.promise();
        };

        var getManifest = function(fileEntry) {
            var deferred = $.Deferred();
            var ManifestParser = require('adbkit-apkreader/lib/apkreader/parser/manifest.js');
            fileEntry.getData(new zip.BlobWriter(), function(blob) {
                var reader = new FileReader();
                reader.onload = function() {
                    var result;
                    try {
                        var buffer = new Buffer(new Int8Array(reader.result));
                        var parser = new ManifestParser(buffer);
                        result = parser.parse();
                    } catch (e) {
                        deferred.reject(e);
                    }
                    deferred.resolve(result);
                };
                reader.onerror = function(e) {
                    deferred.reject(e);
                };
                reader.readAsArrayBuffer(blob);
            });
            return deferred.promise();
        };

        var getResourceTable = function(fileEntry) {
            var deferred = $.Deferred();
            var ApkResourceFinder = require("./resource.js");

            fileEntry.getData(new zip.BlobWriter(), function(blob) {
                var reader = new FileReader();
                reader.onload = function() {
                    var buffer, fileMap;
                    try {
                        buffer = new Buffer(new Uint8Array(reader.result));
                        fileMap = ApkResourceFinder.getResourceTable(buffer);
                    } catch (e) {
                        deferred.reject(e);
                    }
                    deferred.resolve(fileMap);
                };
                reader.onerror = function(e) {
                    deferred.reject(e);
                };
                reader.readAsArrayBuffer(blob);
            });

            return deferred;
        };

        var getIconBlob = function(info, fileMap) {
            var deferred = $.Deferred();
            var iconEntry = fileMap[info.icon];

            if (iconEntry) {
                iconEntry.getData(new zip.BlobWriter(), function(blob) {
                    info.iconBlob = blob;
                    deferred.resolve(info);
                });
            } else {
                deferred.resolve(info);
            }

            return deferred.promise();
        };

        var extractInfo = function(manifest, resMap) {
            var info = {},
                txtResId = null;

            if (manifest.application['label']) {
                if (manifest.application['label'].indexOf('resourceId') > -1) {
                    txtResId = manifest.application['label'].replace('resourceId:0x', '');
                    txtResId = txtResId.toUpperCase();

                    if (txtResId && resMap['@' + txtResId]) {
                        info.label = resMap['@' + txtResId][0];
                    }
                } else {
                    // Possible that the label field is already a name string
                    info.label = manifest.application['label'];
                }
            }

            info.minSdkVersion = '';
            info.versionCode = manifest['versionCode'];
            if (manifest['versionName']) {
                if (manifest['versionName'].indexOf('resourceId') > -1) {
                    txtResId = manifest['versionName'].replace('resourceId:0x', '');
                    txtResId = txtResId.toUpperCase();

                    if (txtResId && resMap['@' + txtResId]) {
                        info.versionName = resMap['@' + txtResId][0];
                    }
                } else {
                    // Possible that the name field is already a name string
                    info.versionName = manifest['versionName'];
                }
            }

            if (manifest.application.launcherActivities && manifest.application.launcherActivities.length) {
                info.mainActivity = manifest.application.launcherActivities[0].name;
            }

            info.package = manifest['package'];

            var iconResId = '';

            if (manifest.application['icon']) {
                iconResId = manifest.application['icon'].replace('resourceId:0x', '');
                iconResId = iconResId.toUpperCase();
                var icons = resMap['@' + iconResId] || [];
                //筛选出最大尺寸的icon eg: mdpi,hdpi,xhdpi,
                //首先根据文件名长度逆向排序，名字最长的一般是尺寸最大的icon，然后取出包含hdpi字符串的第一个icon
                info.icon = icons.sort(function(a, b) {
                    return a.length < b.length
                }).filter(function(icon) {
                    return icon.indexOf('hdpi') != -1;
                })[0] || icons[0];
            }

            if (manifest['usesSdk']) {
                info.minSdkVersion = manifest['usesSdk'].minSdkVersion;
            }

            return info;
        };

        apkReader.getApkInfo = function(blob) {
            var deferred = $.Deferred();
            getFileMap(blob).done(function(reader, fileMap) {
                var manifestEntry = fileMap['AndroidManifest.xml'];
                var resEntry = fileMap['resources.arsc'];
                if (!manifestEntry || !resEntry) {
                    deferred.reject("文件解析失败!");
                    return;
                }
                $.when(getManifest(manifestEntry), getResourceTable(resEntry))
                    .then(function done(manifest, resMap) {
                        var info = extractInfo(manifest, resMap);
                        return getIconBlob(info, fileMap);
                    }, function fail(err) {
                        deferred.reject(err);
                        reader.close();
                    })
                    .done(function(info) {
                        deferred.resolve(info);
                    })
                    .fail(function(err) {
                        deferred.reject(err);
                    })
                    .always(function() {
                        reader.close();
                    });
            }).fail(function(error) {
                deferred.reject(error);
            });
            return deferred.promise();
        };
    })(apkReader);

    module.exports = apkReader;

}).call(this);
