var EXPORTED_SYMBOLS = ["Scriptish"];
const Cu = Components.utils;
Cu.import("resource://scriptish/constants.js");
Cu.import("resource://scriptish/prefmanager.js");
Cu.import("resource://scriptish/logging.js");

function setStatus() (enabled = Scriptish_prefRoot.getValue("enabled", true));
function notifyStatusChg(aVal) (
    Scriptish.notify(null, "scriptish-enabled", {enabling: aVal}));

var ignoreEnable = false, enabled = setStatus();
Scriptish_prefRoot.watch("enabled", function() {
  if (ignoreEnable) return ignoreEnable = false;
  notifyStatusChg(setStatus());
});

var global = this;

// don't delay calling aCallback; keep script injection time consistent post load
function getConfig(aCallback) aCallback(global.config);

const Scriptish = {
  updateSecurely: Scriptish_prefRoot.getBoolValue("update.requireSecured"),
  notify: function(aSubject, aTopic, aData) {
    if (true === aData) {
      aData = {saved: true};
    } else if (null !== aData) {
      if (!aData) {
        aData = {saved: false};
      } else if (!aData.saved) {
        aData.saved = false;
      }
    }
    if (aData && aSubject) aData.id = aSubject.id;
    Services.obs.notifyObservers(null, aTopic, JSON.stringify(aData));
  },
  getConfig: function(aCallback) {
    if (!global.configQueue) {
      global.configQueue = [aCallback];
      var tools = {};
      Cu.import("resource://scriptish/config/config.js", tools);
      let cf = new tools.Config("scriptish_scripts");
      cf.load(function() {
        Scriptish_log("Scriptish config loaded"); // TODO: force & l10n
        global.config = cf;
        Scriptish.getConfig = getConfig;
        global.configQueue.forEach(function(f) f(cf));
        delete global["configQueue"];
      });
    } else {
      global.configQueue.push(aCallback);
    }
  },
  get enabled() enabled,
  set enabled(aVal) {
    ignoreEnable = true;
    enabled = !!aVal;
    notifyStatusChg(enabled);
    Scriptish_prefRoot.setValue("enabled", enabled);
  },
  openManager: function Scriptish_openManager() {
    var browserWin = Services.wm.getMostRecentWindow("navigator:browser");
    if (browserWin.BrowserOpenAddonsMgr)
      browserWin.BrowserOpenAddonsMgr("addons://list/userscript");
    else if (browserWin.toEM)
      browserWin.toEM("addons://list/userscript");
  },
  isGreasemonkeyable: function Scriptish_isGreasemonkeyable(aURL) {
    if (!aURL) return false;

    // if the url provide is not a valid url, then an error could be thrown
    try {
      var scheme = Services.io.extractScheme(aURL);
      if (!scheme) {
        return false;
      }
    } catch (e) {
      return false;
    }
    switch (scheme) {
      case "http":
      case "https":
        return Scriptish_prefRoot.getBoolValue("enabledSchemes.http", true);

      case "ftp":
      case "data":
        return Scriptish_prefRoot.getBoolValue("enabledSchemes." + scheme, true);

      case "about":
        // Always allow "about:blank".
        if (/^about:blank(?:[#?].*)?$/.test(aURL)) return true;
        // no break
      default:
        return Scriptish_prefRoot.getBoolValue("enabledSchemes." + scheme, false);
    }
  },
  getMostRecentWindow: function() Services.wm.getMostRecentWindow("navigator:browser"),
  getWindows: function() Services.wm.getEnumerator("navigator:browser")
}

// Watch for the required secure updates pref being modified
Scriptish_prefRoot.watch("update.requireSecured", function() {
  Scriptish.updateSecurely = Scriptish_prefRoot.getValue("update.requireSecured");
});
