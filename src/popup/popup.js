;
(function () {
    'use strict';

    // all tabs
    document.getElementById('save-all').addEventListener('click', function () {
        chrome.tabs.query({currentWindow: true}, function (tabsArr) {
            var currentTab = tabsArr.filter(function (tab) {
                return tab.active;
            })[0];
            chrome.tabs.sendMessage(currentTab.id, {action: 'create-modal', tabsArr: tabsArr});
            window.close();
        });
    });

    // open background page
    document.getElementById('open-background-page').addEventListener('click', function () {
        chrome.runtime.sendMessage({action: 'openbackgroundpage'}, function (res) {
            if (res === 'ok') {
                window.close();
            }
        });
    });

}());
