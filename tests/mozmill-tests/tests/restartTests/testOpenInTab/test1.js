/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Scriptish mozmill test suite.
 *
 * The Initial Developer of the Original Code is Erik Vold.
 * Portions created by the Initial Developer are Copyright (C) 2011
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Erik Vold <erikvvold@gmail.com> (original author)
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

Components.utils.import("resource://scriptish/utils/Scriptish_openInTab.js");

var tabs = require("../../../../../../mozmill-tests/lib/tabs");

var URL = "about:scriptish";

var setupModule = function(module) {
  module.controller = mozmill.getBrowserController();
}

var testOpenInTabDefaults = function() {
  var win = controller.window;

  tabs.closeAllTabs(controller);
  controller.assert(function() (tabs.getTabsWithURL(URL).length == 0));

  // Open about:scriptish and verify the page loaded
  var window = Scriptish_openInTab(URL);
  let tabBrowser = win.gBrowser;

  controller.waitFor(function() {
    return controller.tabs.activeTab.defaultView.location.href == URL;
  }, "wait for about:scriptish", 500, 100);

  window.close();
  controller.assert(function() (tabs.getTabsWithURL(URL).length == 0));
}

var testOpenInTabArgLoadInBackground = function() {
  var win = controller.window;

  tabs.closeAllTabs(controller);
  controller.assert(function() (tabs.getTabsWithURL(URL).length == 0));

  // Open about:scriptish and verify the page loaded
  var window = Scriptish_openInTab(URL, true);
  let tabBrowser = win.gBrowser;

  controller.waitFor(function() {
    return tabs.getTabsWithURL(URL).length == 1;
  }, "wait for about:scriptish", 500, 100);

  controller.assert(function() controller.tabs.activeTab.defaultView.location.href != URL);

  window.close();
  controller.assert(function() (tabs.getTabsWithURL(URL).length == 0));
}

var testOpenInTabArgReuse = function() {
  var win = controller.window;

  tabs.closeAllTabs(controller);
  controller.assert(function() (tabs.getTabsWithURL(URL).length == 0));

  // Open about:scriptish and verify the page loaded
  var window = Scriptish_openInTab(URL, false, true);
  let tabBrowser = win.gBrowser;

  // resuse should open a new tab when there is not one already, and focus on it
  controller.waitFor(function() {
    return controller.tabs.activeTab.defaultView.location.href == URL;
  }, "wait for about:scriptish", 500, 100);

  var window2 = Scriptish_openInTab(URL, false, true);
  // resuse should not open a new tab when there is one already, and focus on it
  controller.waitFor(function() {
    var win = controller.tabs.activeTab.defaultView;
    return window2 === win && window2 === window;
  }, "wait for about:scriptish again w/ reuse = true", 500, 100);

  window.close();
  controller.assert(function() (tabs.getTabsWithURL(URL).length == 0));
}
