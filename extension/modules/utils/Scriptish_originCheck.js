"use strict";

const EXPORTED_SYMBOLS = ["Scriptish_originCheck"];

const Cu = Components.utils;
Cu.import("resource://scriptish/constants.js");
lazyImport(this, "resource://scriptish/prefmanager.js", ["Scriptish_prefRoot"]);
lazyUtil(this, "popupNotification");
lazyUtil(this, "stringBundle");

const whitelist = [];
function updateWhitelist() {
  whitelist.length = 0;
  try {
    var list = JSON.parse(Scriptish_prefRoot.getValue("originCheck.whitelist"));
    for (var [,i] in Iterator(list)) {
      if (/^http/.test(i)) {
        whitelist.push(i);
      }
      else {
        whitelist.push("http://." + i + "/");
        whitelist.push("https://." + i + "/");
      }
    }
  }
  catch (ex) {
    Cu.reportError(ex);
  }
}
updateWhitelist();
Scriptish_prefRoot.watch("originCheck.whitelist", updateWhitelist);

function getTLD(u) {
  try {
    var u = u.cloneIgnoringRef();
    u.userPass = "";
    u.path = "";
    u.host = "." + Services.tld.getBaseDomain(u);
    return u.spec;
  }
  catch (ex) {
    if (u.host) {
      return u.host;
    }
    else {
      return u.path;
    }
  }
}

function Scriptish_originCheck(script, contentWindow, resourceURI, callback) {
  var sourceURI = Services.io.newURI(contentWindow.document.location, null, null);
  if (!(resourceURI instanceof Ci.nsIURI)) {
    resourceURI = Services.io.newURI(resourceURI, null, null);
  }

  // always allow data, as data is shipped with the user script
  if (resourceURI.scheme == "data") {
    if (callback) callback(true);
    return true;
  }

  // all insecure
  if (sourceURI.scheme != "https" && resourceURI.scheme != "https") {
    if (callback) callback(true);
    return true;
  }

  // secure document to insecure: deny
  if (sourceURI.scheme == "https" && resourceURI.scheme != "https") {
    if (callback) callback(false);
    return false;
  }

  // still possible:
  // secure/secure
  // insecure/secure

  var sourceTLD = getTLD(sourceURI);
  var resourceTLD = getTLD(resourceURI);

  // same origin
  if (sourceTLD == resourceTLD) {
    // same origin
    if (callback) callback(true);
    return true;
  }

  if (script.deniedOrigins[sourceTLD]
    && script.deniedOrigins[sourceTLD].indexOf(resourceTLD) != -1) {
    if (callback) callback(false);
    return false;
  }
  if (script.allowedOrigins[sourceTLD]
    && script.allowedOrigins[sourceTLD].indexOf(resourceTLD) != -1) {
    if (callback) callback(true);
    return true;
  }

  if (whitelist.indexOf(resourceTLD) != -1) {
    if (callback) callback(true);
    return true;
  }

  if (!callback) {
    return false;
  }

  // Ask the user
  Scriptish_popupNotification({
    contentWindow: contentWindow,
    force: true,
    immediately: true,
    id: "scriptish-origincheck-popup-notification" + resourceTLD,
    message: Scriptish_stringBundle(
      "originCheck.message",
      [script.name || script.id, resourceTLD]
      ),
    mainAction: {
      label: Scriptish_stringBundle("originCheck.alwaysAllow"),
      accessKey: Scriptish_stringBundle("originCheck.alwaysAllow.ak"),
      callback: function() {
        try {
          script.allowedOrigins[sourceTLD].push(resourceTLD);
        } catch (ex) {
          script.allowedOrigins[sourceTLD] = [resourceTLD];
        }
        Services.obs.notifyObservers(null, "scriptish-config-saved", null);
        callback(true);
      }
    },
    secondaryActions: [
      {
        label: Scriptish_stringBundle("originCheck.allowOnce"),
        accessKey: Scriptish_stringBundle("originCheck.allowOnce.ak"),
        callback: function() {
          callback(true);
        }
      },
      {
        label: Scriptish_stringBundle("originCheck.alwaysDeny"),
        accessKey: Scriptish_stringBundle("originCheck.alwaysDeny.ak"),
        callback: function() {
          try {
            script.deniedOrigins[sourceTLD].push(resourceTLD);
          } catch (ex) {
            script.deniedOrigins[sourceTLD] = [resourceTLD];
          }
          Services.obs.notifyObservers(null, "scriptish-config-saved", null);
          callback(false);
        }
      },
      {
        label: Scriptish_stringBundle("originCheck.denyOnce"),
        accessKey: Scriptish_stringBundle("originCheck.denyOnce.ak"),
        callback: function() {
          callback(false);
        }
      }
    ]
  });

  return undefined;
}
