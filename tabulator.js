//TODO password locked folders, open in incognito (?)
// TODO folder groups/folder thumbnail view / expandable list groups
// TODO  context instead of closing and reopening everything e.g. open all/ switch to
// TODO hotkey to add current page/ right click on tab and clicking/ hold shift and click or sth
// TODO sync with parse?? cloud sync across devices or in chrome -> chrome.storage.sync?
//TODO drag whole group? + grip icon so ppl know where to click and drag, drag and drop across groups
// TODO consume tabs that have been left open too long, categorize by time quantum??
// TODO share groups of tabs
// TODO quick jump with overlay/ popup, like AceJump

;
(function () {
    'use strict';
    function makeTabGroup(tabsArr) {
        var tabGroup = {
            date: new Date(),
            id: Date.now()
        };
        tabGroup.tabs = tabsArr;
        return tabGroup;
    }


    function saveTabGroup(tabGroup) {
        chrome.storage.sync.get('tabGroups', function (storage) {
            var newArr = [];

            if (storage.tabGroups) {
                newArr = storage.tabGroups;
            }
            newArr.push(tabGroup);

            chrome.storage.sync.set({tabGroups: newArr});
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
            chrome.tabs.create({url: chrome.extension.getURL('tabulator.html')});
        }
    }

    function saveTabs(tabsArr) {
        var tabGroup = makeTabGroup(tabsArr);
        getAllTabsAndThen(openOrGoToBackgroundPage);
        saveTabGroup(tabGroup);
        closeTabs(tabGroup.tabs);
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
            default:
                sendRes('nope');
                break;
        }
    });

    chrome.commands.onCommand.addListener(function (command) {
        console.log('Command:', command);
        switch (command) {
            case 'toggle-jump-index':
                console.log("Tab: " + getCurrentTab());
                break;
        }
    });

}());

// HELPERS
var getCurrentTab = function () {
    chrome.tabs.query({currentWindow: true, active: true}, function (tabs) {
        console.log(tabs[0]);
    });
};

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
    return tab.url.match(/chrome-extension:\/\/.+\/tabulator.html/i);
}

var debug = true;
