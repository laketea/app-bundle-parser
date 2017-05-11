#app-bundle-parser

---

## useage
app bundle parser , support ios ipa & android apk file parse

## build

browserify index.js -s AppBundleInfo -o dist/app-bundle-parser.js

### After build, please find below function in app-bundle-parser.js, and manually insert below code

function typedArraySupport () {

  if (/Edge/.test(navigator.userAgent) || /MSIE/.test(navigator.userAgent)) {
      return false
  }

...
