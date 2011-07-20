var EXPORTED_SYMBOLS = ["Scriptish_getOwnerWindowForContentWindow"];
Components.utils.import("resource://scriptish/constants.js");
lazyUtil(this, "getBrowserForContentWindow");

function Scriptish_getOwnerWindowForContentWindow(aWin) {
  try {
    return Scriptish_getBrowserForContentWindow(aWin).ownerDocument.defaultView;
  }
  catch (ex) {
    return null;
  }
}
