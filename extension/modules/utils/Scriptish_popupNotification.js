
var EXPORTED_SYMBOLS = ["Scriptish_popupNotification"];
Components.utils.import("resource://scriptish/constants.js");
lazyImport(this, "resource://scriptish/scriptish.js", ["Scriptish"]);
lazyImport(this, "resource://scriptish/prefmanager.js", ["Scriptish_prefRoot"]);
lazyImport(this, "resource://scriptish/logging.js", ["Scriptish_log"]);
lazyUtil(this, "getBrowserForContentWindow");

function Scriptish_popupNotification(details) {
  if (!details.force &&
      !Scriptish_prefRoot.getValue("enabledNotifications.popup"))
    return Scriptish_log(details.message);

  var fn = function() {
      var browser;
      if (details.window) {
        browser = details.window.gBrowser.selectedBrowser;
      }
      else if (details.contentWindow) {
        browser = Scriptish_getBrowserForContentWindow(details.contentWindow);
      }
      else if (details.browser) {
        browser = details.browser;
      }
      else {
        browser = Scriptish.getMostRecentWindow().gBrowser.selectedBrowser;
      }
      browser.ownerDocument.defaultView.PopupNotifications.show(
        browser,
        details.id,
        details.message,
        "scriptish-notification-icon",
        details.mainAction,
        details.secondaryActions,
        details.options
      );
  };
  if (details.immediately) {
    fn();
  }
  else {
    timeout(fn);
  }
};
