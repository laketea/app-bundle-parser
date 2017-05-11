# app-bundle-parser

## usage
app bundle parser , support ios ipa & android apk file parse

## build
browserify index.js -s AppBundleInfo -o dist/app-bundle-parser.js

### After build, please find below function in app-bundle-parser.js, and manually insert below code

function typedArraySupport () {

  if (/Edge/.test(navigator.userAgent) || /MSIE/.test(navigator.userAgent)) {
      return false
  }

...

## example

```javascript

// import scripts
<script src="${path}/dist/zip.all.js"></script>
<script src="${path}/dist/png.js"></script>
<script src="${path}/dist/app-bundle-parser.js"></script>


<script>

// file is file object
AppBundleInfo.readApp(file).then(function(apk) {
    console.log(JSON.stringify(apk.app))
    console.log(JSON.stringify(apk.release))
}, function() {
    console.log("error");
});

// app props
// type, icon_url, iconBlob, name, package_name

// release props
// icon_url, udids, release_type, version, build, package_name, main_activity, min_sdk_version

</script>
```
