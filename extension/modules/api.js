var EXPORTED_SYMBOLS = ["GM_API", "GM_apiSafeCallback"];

const Cu = Components.utils;
Cu.import("resource://scriptish/constants.js");

lazyImport(this, "resource://scriptish/logging.js", ["Scriptish_logError", "Scriptish_logScriptError"]);
lazyImport(this, "resource://scriptish/utils/Scriptish_alert.js", ["Scriptish_alert"]);

lazyUtil(this, "cryptoHash");
lazyUtil(this, "notification");
lazyUtil(this, "openInTab");
lazyUtil(this, "originCheck");
lazyUtil(this, "stringBundle");

lazyImport(this, "resource://scriptish/api/GM_ScriptStorage.js", ["GM_ScriptStorage"]);
lazyImport(this, "resource://scriptish/api/GM_xmlhttpRequester.js", ["GM_xmlhttpRequester"]);
lazyImport(this, "resource://scriptish/api/GM_Resources.js", ["GM_Resources"]);
lazyImport(this, "resource://scriptish/api/GM_setClipboard.js", ["GM_setClipboard"]);

const moduleFilename = Components.stack.filename;
const NS_XHTML = "http://www.w3.org/1999/xhtml";
const DOLITTLE = function(){};

// Examines the stack to determine if an API should be callable.
function GM_apiLeakCheck(apiName) {
  let stack = Components.stack;

  do {
    // Valid stack frames for GM api calls are: native and js when coming from
    // chrome:// URLs and any file name listed in _apiAcceptedFiles.
    if (2 == stack.language &&
        stack.filename != moduleFilename &&
        stack.filename != Services.scriptish.filename &&
        stack.filename.substr(0, 6) != "chrome") {
      Scriptish_logError(new Error(
          Scriptish_stringBundle("error.api.unsafeAccess") + ": " + apiName));
      return false;
    }
  } while (stack = stack.caller);
  return true;
}

function GM_apiOriginCheck(aScript, aContentWindow, aResourceURI) {
  if (!Scriptish_originCheck(aScript, aContentWindow, aResourceURI)) {
    Scriptish_logScriptError(
      new Error("Origin-checks prevent loading of resource: " + aResourceURI),
      aScript,
      aScript.fileURL,
      aScript.id
      );
    return false;
  }
  return true;
}

function GM_apiSafeCallback(aWindow, aScript, aThis, aCb, aArgs) {
  // Pop back onto browser scope and call event handler.
  // Have to use nested function here otherwise aCallback.apply can point to
  // window.setTimeout, which can be abused to get increased privileges.
  new XPCNativeWrapper(aWindow, "setTimeout()").setTimeout(function() {
    try {
      aCb.apply(aThis, aArgs);
    }
    catch (ex) {
      Scriptish_logScriptError(ex, aWindow, aScript.fileURL, aScript.id);
    }
  }, 0);
}

function GM_API(aScript, aURL, aWinID, aSafeWin, aUnsafeContentWin, aChromeWin) {
  var document = aSafeWin.document;
  var _xmlhttpRequester = null;
  var _storage = null;
  var _resources = null;
  var _logger = null;
  var menuCmdIDs = [];
  var Scriptish_BrowserUI = aChromeWin.Scriptish_BrowserUI;
  var windowID = aWinID;

  var lazyLoaders = {};
  XPCOMUtils.defineLazyGetter(lazyLoaders, "xmlhttpRequester", function() {
    return new GM_xmlhttpRequester(aSafeWin, aUnsafeContentWin, aURL, aScript);
  });
  XPCOMUtils.defineLazyGetter(lazyLoaders, "storage", function() {
    return new GM_ScriptStorage(aScript);
  });
  XPCOMUtils.defineLazyGetter(lazyLoaders, "resources", function() {
    return new GM_Resources(aScript);
  });

  this.GM_safeHTMLParser = function GM_safeHTMLParser(aHTMLStr) {
    if (!GM_apiLeakCheck("GM_safeHTMLParser")) return;
    let doc = document.implementation.createDocument(NS_XHTML, "html", null);
    let body = document.createElementNS(NS_XHTML, "body");
    doc.documentElement.appendChild(body);
    body.appendChild(Services.suhtml.parseFragment(aHTMLStr, false, null, body));
    return doc;
  }

  this.GM_notification =
      function GM_notification(aMsg, aTitle, aIcon, aCallback) {
    if (!GM_apiLeakCheck("GM_notification")) return;
    if (typeof aTitle != "string") aTitle = aScript.name;
    if (typeof aIcon != "string") aIcon = aScript.iconURL;
    var callback = null;
    if (typeof aCallback == "function")
      callback = function() GM_apiSafeCallback(aSafeWin, aScript, null, aCallback);
    Scriptish_notification(aMsg, aTitle, aIcon, callback);
  }

  this.GM_setValue = function GM_setValue() {
    if (!GM_apiLeakCheck("GM_setValue")) return;
    return lazyLoaders.storage.setValue.apply(lazyLoaders.storage, arguments);
  }
  this.GM_getValue = function GM_getValue() {
    if (!GM_apiLeakCheck("GM_getValue")) return;
    return lazyLoaders.storage.getValue.apply(lazyLoaders.storage, arguments);
  }
  this.GM_deleteValue = function GM_deleteValue() {
    if (!GM_apiLeakCheck("GM_deleteValue")) return;
    return lazyLoaders.storage.deleteValue.apply(lazyLoaders.storage, arguments);
  }
  this.GM_listValues = function GM_listValues() {
    if (!GM_apiLeakCheck("GM_listValues")) return;
    return lazyLoaders.storage.listValues.apply(lazyLoaders.storage, arguments);
  }

  this.GM_getResourceURL = function GM_getResourceURL(name) {
    if (!GM_apiLeakCheck("GM_getResourceURL")) return;
    var res = lazyLoaders.resources.get(name);
    if (res.downloadURL && !GM_apiOriginCheck(aScript, aSafeWin, res.downloadURL)) return;
    return res.dataContent;
  }
  this.GM_getResourceText = function GM_getResourceText(name) {
    if (!GM_apiLeakCheck("GM_getResourceText")) return;
    var res = lazyLoaders.resources.get(name);
    if (res.downloadURL && !GM_apiOriginCheck(aScript, aSafeWin, res.downloadURL)) return;
    return res.textContent;
  }

  this.GM_getMetadata = function(aKey, aLocalVal) {
    let key = aKey.toLowerCase().trim();
    if (aLocalVal) {
      switch (key) {
      case "id":
      case "name":
      case "namespace":
      case "creator":
      case "author":
      case "description":
      case "version":
      case "jsversion":
      case "delay":
      case "noframes":
        return aScript[key];
      case "homepage":
      case "homepageurl":
        return aScript.homepageURL;
      case "updateurl":
        return aScript.updateURL;
      case "contributor":
      case "include":
      case "exclude":
      case "screenshot":
        return aScript[key + "s"];
      case "match":
        return aScript[key + "es"];
      }
    }

    return aScript.getScriptHeader(key);
  }

  this.GM_openInTab = function GM_openInTab(aURL, aLoadInBackground, aReuse) {
    if (!GM_apiLeakCheck("GM_openInTab")) return;
    return Scriptish_openInTab(aURL, aLoadInBackground, aReuse, aChromeWin);
  }

  this.GM_xmlhttpRequest = function GM_xmlhttpRequest() {
    if (!GM_apiLeakCheck("GM_xmlhttpRequest")) return;
    let xhr = lazyLoaders.xmlhttpRequester;
    return xhr.contentStartRequest.apply(xhr, arguments);
  }

  if (aSafeWin !== aSafeWin.top) {
    this.GM_unregisterMenuCommand = this.GM_registerMenuCommand
        = this.GM_disableMenuCommand = this.GM_enableMenuCommand = DOLITTLE;
  } else {
    this.GM_registerMenuCommand = function GM_registerMenuCommand(
        aCmdName, aCmdFunc, aAccelKey, aAccelModifiers, aAccessKey) {
      if (!GM_apiLeakCheck("GM_registerMenuCommand")) return;
      var uuid = Scriptish_BrowserUI.registerMenuCommand({
        name: aCmdName,
        accelKey: aAccelKey,
        accelModifiers: aAccelModifiers,
        accessKey: aAccessKey,
        doCommand: aCmdFunc,
        winID: windowID});
      menuCmdIDs.push(uuid);
      return uuid;
    }

    this.GM_unregisterMenuCommand = function GM_unregisterMenuCommand(aUUID) {
      var i = menuCmdIDs.indexOf(aUUID);
      if (!~i) return false; // check the uuid is for a cmd made by the same script
      menuCmdIDs.splice(i, 1);
      return Scriptish_BrowserUI.unregisterMenuCommand(aUUID, windowID);
    }

    this.GM_enableMenuCommand = function GM_enableMenuCommand(aUUID) {
      var i = menuCmdIDs.indexOf(aUUID);
      if (!~i) return false; // check the uuid is for a cmd made by the same script
      return Scriptish_BrowserUI.enableMenuCommand(aUUID, windowID);
    }

    this.GM_disableMenuCommand = function GM_disableMenuCommand(aUUID) {
      var i = menuCmdIDs.indexOf(aUUID);
      if (!~i) return false; // check the uuid is for a cmd made by the same script
      return Scriptish_BrowserUI.disableMenuCommand(aUUID, windowID);
    }
  }

  this.GM_cryptoHash = function GM_cryptoHash() {
    if (!GM_apiLeakCheck("GM_cryptoHash")) return;
    return Scriptish_cryptoHash.apply(null, arguments);
  }

  //temp solution for #422
  let scriptName = aScript.name || aScript.id;
  this.alert = function alert(aMsg) {
    Scriptish_alert(aMsg, scriptName);
  }

}

GM_API.prototype.GM_generateUUID = function GM_generateUUID() (
    Services.uuid.generateUUID().toString());

GM_API.prototype.GM_setClipboard = function GM_setClipboard() {
  if (!GM_apiLeakCheck("GM_setClipboard")) return;
  GM_setClipboard.apply(null, arguments);
}
