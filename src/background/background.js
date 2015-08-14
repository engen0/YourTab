// Nifty command line
//TODO password locked folders, only appears in incognito (?)
// TODO Shrink lists to names / expandable list groups
// TODO folder groups/folder thumbnail view
// TODO manage tabs by session e.g. save all the tabs now and change to another set of tabs/ merge the sessions
// TODO sync with parse?? cloud sync across devices
// TODO share groups of tabs / backup
// TODO quick jump with overlay/ popup, like AceJump (seems like it's undoable)

;
(function () {
    'use strict';
    function makeTabGroup(tabsArr) {
        var tabGroup = {
            date: new Date(),
            id: Date.now(),
            name: ''
        };
        // strip it to reduce size for chrome sync storage
        tabGroup.tabs = tabsArr.map(function (tab) {
            return {
                title: tab.title,
                url: tab.url,
                favIconUrl: tab.favIconUrl,
                id: tab.id
            }
        });
        return tabGroup;
    }


    function saveTabGroup(tabGroup) {

        chrome.storage.local.get('tabGroups', function (storage) {
            var newArr = [];
            if (storage.tabGroups) {
                newArr = storage.tabGroups;
            }
            newArr.push(tabGroup);
            // A better solution is to still use the async storage.sync api and set keys as
            // the tabgroup ids, but it's quite some work and not worth the time for now.
            // Unless there's demand for it it'll be kiv-ed
            chrome.storage.local.set({tabGroups: newArr});
        });

    }

    function closeTabs(tabsArr) {
        var tabsToClose = tabsArr.map(function (tab) {
            return tab.id
        });

        chrome.tabs.remove(tabsToClose, function () {
            if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError)
            }
        });
    }

    function openOrGoToBackgroundPage(tabsArr) {
        var extensionTabs = tabsArr.filter(function (tab) {
            return isOurTab(tab);
        }).map(function (tab) {
            return tab.id;
        });

        if (extensionTabs.length > 0) {
            chrome.tabs.update(extensionTabs[0], {'active': true})
        } else {
            chrome.tabs.create({url: chrome.extension.getURL('src/background/background.html')});
        }
    }

    function saveTabs(tabsArr) {
        var tabGroup = makeTabGroup(tabsArr);
        getAllTabsAndThen(openOrGoToBackgroundPage);
        try {
            saveTabGroup(tabGroup);
            closeTabs(tabGroup.tabs);
        } catch (e) {
            alert('There was an error while saving!');
            console.log(e);
        }
    }

    chrome.runtime.onMessage.addListener(function (req, sender, sendRes) {
        switch (req.action) {
            case 'save':
                saveTabs(req.tabsArr);
                sendRes('ok');
                break;
            case 'openbackgroundpage':
                sendRes('ok');
                getAllTabsAndThen(openOrGoToBackgroundPage);
                break;
            case 'save-current':
                chrome.tabs.query({currentWindow: true, active: true}, function (tabs) {
                    saveTabs(tabs)
                });
                break;
            default:
                sendRes('nope');
                break;
        }
    });
    var Options = {};
    chrome.storage.local.get('options', function (storage) {
        Options = storage.options || {};
        //messy way to migrate T_T
        if(!Options.migrateTo140815){
            chrome.storage.sync.get(function(syncStorage){
                Options.migrateTo140815 = true;
                chrome.storage.local.set({
                    tabGroups: syncStorage.tabGroups,
                    options: syncStorage.options
                })
            });
            chrome.storage.sync.clear(console.log('Successfully migrated to v140815'));
        }
    });

    chrome.commands.onCommand.addListener(function (command) {
        switch (command) {
            case 'save-current':
                var enableAltQ = Options.enableAltQ || 'no';
                if (enableAltQ === 'yes') {
                    chrome.tabs.query({currentWindow: true, active: true}, function (tabs) {
                        saveTabs(tabs)
                    });
                }
                break;
        }
    });
}());

// HELPERS
var getAllTabsAndThen = function (callback) {
    chrome.tabs.query({currentWindow: true}, function (tabsArr) {
        callback(tabsArr);
    })
};

var trace = curry(function (str, x) {
    if (debug) {
        console.log(str, x);
    }
    return x;
});

function chain() {
    var funcs = arguments,
        length = funcs.length;
    return function () {
        var idx = 0,
            result = funcs[idx].apply(this, arguments);
        while (idx++ < length - 1) {
            result = funcs[idx].call(this, result);
        }
        return result;
    };
}

function curry(fx) {
    var arity = fx.length;

    return function f1() {
        var args = Array.prototype.slice.call(arguments, 0);
        if (args.length >= arity) {
            return fx.apply(null, args);
        }
        else {
            return function f2() {
                var args2 = Array.prototype.slice.call(arguments, 0);
                return f1.apply(null, args.concat(args2));
            }
        }
    };
}

function isOurTab(tab) {
    return tab.url == chrome.extension.getURL('src/background/background.html');
}

var debug = true;
