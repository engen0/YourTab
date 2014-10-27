/*global chrome */

(function () {
    'use strict';

    document.addEventListener('DOMContentLoaded', function () {
        // RIP the current tab
        document.getElementById('riptab').addEventListener('click', function () {
            chrome.tabs.query({ active: true, currentWindow: true }, function (tabsArr) {
                chrome.runtime.sendMessage({ action: 'riptabs', tabsArr: tabsArr });
            });
            window.close();
        });

        // RIP all tabs
        document.getElementById('ripalltab').addEventListener('click', function () {
            chrome.tabs.query({ currentWindow: true }, function (tabsArr) {
                chrome.runtime.sendMessage({ action: 'riptabs', tabsArr: tabsArr });
            });
            window.close();
        });
    });

})();