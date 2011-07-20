var EXPORTED_SYMBOLS = ["Scriptish_stringBundle"];
Components.utils.import("resource://scriptish/constants.js");
lazyImport(this, "resource://scriptish/prefmanager.js", ["Scriptish_prefRoot"]);

const defaultBundle = Services.strings.createBundle("chrome://scriptish/locale/scriptish.properties");
const engBundle = Services.strings.createBundle((function(){
  var tmp = Components.classes["@mozilla.org/chrome/chrome-registry;1"]
      .getService(Components.interfaces.nsIChromeRegistry)
      .convertChromeURL(
          NetUtil.newURI("chrome://scriptish/locale/scriptish.properties"))
      .spec.split("/");
  tmp[tmp.length - 2] = "en-US";
  return tmp.join("/")
})());

function getString(aBundle, aKey, aFormatValues) {
  if (aFormatValues) {
    return aBundle.formatStringFromName(aKey, aFormatValues, aFormatValues.length);
  }
  return aBundle.GetStringFromName(aKey);
}

function Scriptish_stringBundle(aKey, aFormatValues) {
  if (Scriptish_prefRoot.getValue("useDefaultLocale"))
    return getString(engBundle, aKey, aFormatValues);
  try {
    return getString(defaultBundle, aKey, aFormatValues)
        || getString(engBundle, aKey, aFormatValues);
  } catch (e) {
    return getString(engBundle, aKey, aFormatValues)
  }
}
