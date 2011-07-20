"use strict";

const EXPORTED_SYMBOLS = ["Scriptish_originCheck"];

const Cu = Components.utils;
Cu.import("resource://scriptish/constants.js");
lazyUtil(this, "popupNotification");
lazyUtil(this, "stringBundle");

function getTLD(u) {
  try {
    return Services.tld.getBaseDomain(u);
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

  // all insecure
  if (sourceURI.scheme != "https" && resourceURI.scheme != "https") {
    callback(true);
    return;
  }

  // secure document to insecure: deny
  if (sourceURI.scheme == "https" && resourceURI.scheme != "https") {
    callback(false);
    return;
  }

  // still possible:
  // secure/secure
  // insecure/secure

  var sourceTLD = getTLD(sourceURI);
  var resourceTLD = getTLD(resourceURI);

  // same origin
  if (sourceURI.scheme == resourceURI.scheme && sourceTLD == resourceTLD) {
    // same origin
    callback(true);
    return;
  }

  if (script.deniedOrigins.indexOf(resourceTLD) != -1) {
    callback(false);
    return;
  }
  if (script.allowedOrigins.indexOf(resourceTLD) != -1) {
    callback(true);
    return;
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
        script.allowedOrigins.push(resourceTLD);
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
          script.deniedOrigins.push(resourceTLD);
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
}
