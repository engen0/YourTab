chrome.storage.sync.get(function (storage) {
    init(storage);
});

var TabGroups = {},
    Options;

function init(storage) {
    TabGroups.list = storage.tabGroups || [];// tab groups
    Options = storage.options || {
            deleteTabOnOpen: 'no'
        };

    // Tab Groups
    var tabGroups = {};
    tabGroups.controller = function () {
        var ctrl = this;
        ctrl.tabGroups = TabGroups.list.sort(function (a, b) {
            return b.id - a.id;
        });
        ctrl.removeGroup = function (idx) {
            return function () {
                ctrl.tabGroups.splice(idx, 1);
                ctrl.save();
            }
        };
        ctrl.restoreAll = function (idx) {
            return function () {
                if (Options.deleteTabOnOpen === 'yes') {
                    ctrl.removeGroup(idx);
                }
                var tabGroup = ctrl.tabGroups[idx];
                tabGroup.tabs.forEach(function () {
                    chrome.tabs.create({
                        url: tabGroup.tabs[i].url
                    });
                });
            }
        };
        ctrl.save = function () {
            chrome.storage.sync.set({tabGroups: ctrl.tabGroups});
        }
    };
    tabGroups.view = function (ctrl) {
        return ctrl.tabGroups.map(function (group, idx) {
            return m('div.group', [
                m('div.group-title', [
                    m('span.delete-link', {
                        onclick: ctrl.removeGroup(idx)
                    }),
                    m('span.group-amount', group.tabs.length + ' Tabs'),
                    ' ',
                    m('span.group-date', moment(new Date(group.id)).fromNow()),
                    ' ',
                    m('span.restore-all', {
                        onclick: ctrl.restoreAll(idx)
                    }, 'Restore group')
                ]),
                m('ul[draggable=true]', {
                        //className   : item.dragOver ? 'dragOver' : '',
                        //ondrop      : ctrl.drop( item, list, itemIndex ),
                        //ondragleave : ctrl.off( item ),
                        //ondragover  : ctrl.on( item ),
                        //ondragstart : ctrl.start( item, list, itemIndex ),
                        ondragstart: console.log('Drag start')
                        //key         : item.uid
                    }, tabs.view(new tabs.controller(ctrl, group.tabs, idx))
                )
            ])
        });
    };

    // List of tabs in each Tab Group
    var tabs = {};
    tabs.controller = function (mainCtrl, items, groupIdx) {
        var ctrl = this;
        ctrl.tabs = items;
        ctrl.removeTab = function (idx) {
            return function () {
                if (ctrl.tabs.length <= 1) {
                    mainCtrl.removeGroup(groupIdx)
                } else {
                    // TODO check if this updates the group.tabs that was passed in.
                    ctrl.tabs.splice(idx, 1);
                    mainCtrl.save();
                }
            };
        };
    };
    tabs.view = function (ctrl) {
        return ctrl.tabs.map(function (tab, idx) {
            return m('li', [
                m('span.delete-link', {
                    onclick: ctrl.removeTab(idx)
                }),
                m('img', {src: tab.favIconUrl, height: '16', width: '16'}),
                ' ',
                m('a.link', {
                    onclick: function () {
                        if (Options.deleteTabOnOpen === 'yes') {
                            ctrl.removeTab(idx);
                        }
                    },
                    href: tab.url
                }, tab.title)
            ]);
        })
    };

    chrome.storage.onChanged.addListener(function (changes, namespace) {
        if (changes.tabGroups != null) {
            TabGroups.list = changes.tabGroups.newValue;
            m.redraw();
        }
    });

    m.module(document.getElementById('groups'), {controller: tabGroups.controller, view: tabGroups.view});
}
