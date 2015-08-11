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
        // Operations
        ctrl.tabGroups = TabGroups.list.sort(function (a, b) {
            return b.id - a.id;
        });
        ctrl.removeGroup = function (idx) {
            ctrl.tabGroups.splice(idx, 1);
        };
        ctrl.restoreAll = function (idx) {
            if (Options.deleteTabOnOpen === 'yes') {
                ctrl.removeGroup(idx);
            }
            var tabGroup = ctrl.tabGroups[idx];
            tabGroup.tabs.forEach(function () {
                chrome.tabs.create({
                    url: tabGroup.tabs[i].url
                });
            });
        };
        ctrl.save = function () {
            chrome.storage.sync.set({tabGroups: ctrl.tabGroups});
        };
        ctrl.moveItem = function (srcGroupIdx, srcItemIdx, toGroupIdx) {
            var srcGroup = ctrl.tabGroups[srcGroupIdx].tabs;
            var srcTab = srcGroup[srcItemIdx];
            ctrl.tabGroups[toGroupIdx].tabs.push(srcTab);
            if (srcGroup.length > 1) {
                srcGroup.splice(srcItemIdx, 1);
            } else {
                ctrl.removeGroup(srcGroupIdx);
            }
        };

        // Handlers
        ctrl.onDragLeave = function () {
            return function (event) {
                event.preventDefault();
                if (--dragCounter == 0 && (target = getDropzone(event.target)) != null) {
                    target.style.background = "";
                }
            }
        };
        ctrl.onDragEnter = function () {
            return function (event) {
                event.preventDefault();
                if (dragCounter++ < 1 && (target = getDropzone(event.target)) != null) {
                    target.style.background = 'rgb(238, 238, 238)';
                }
            };
        };
        ctrl.onDrop = function (groupIdx) {
            return function (event) {
                event.preventDefault();
                var target;
                if ((target = getDropzone(event.target)) != null) {
                    target.style.background = "";
                    var item;
                    while (item = dragged.pop()) {
                        if (item.groupIndex != groupIdx) {
                            ctrl.moveItem(item.groupIndex, item.itemIndex, groupIdx);
                        }
                    }
                    ctrl.save();
                }
                dragCounter = 0;
                dragged = [];
            };
        };
    };
    // probably more efficient to just set all children as dropzones
    function getDropzone(elem) {
        if (elem == null) {
            return null;
        }
        return elem.className == 'group' ? elem : getDropzone(elem.parentNode)
    }

    tabGroups.view = function (ctrl) {
        return ctrl.tabGroups.map(function (group, idx) {
            return m('div.group', {
                ondragenter: ctrl.onDragEnter(),
                ondragover: function (event) {
                    event.preventDefault()
                },
                ondragleave: ctrl.onDragLeave(),
                ondrop: ctrl.onDrop(idx)
            }, [
                m('div.group-title', [
                    m('span.delete-link', {
                        onclick: function () {
                            ctrl.removeGroup(idx);
                            ctrl.save();
                        }
                    }),
                    m('span.group-amount', group.tabs.length + ' Tabs'),
                    ' ',
                    m('span.group-date', moment(new Date(group.id)).fromNow()),
                    ' ',
                    m('span.restore-all', {
                        onclick: function () {
                            ctrl.restoreAll(idx);
                            ctrl.save();
                        }
                    }, 'Restore group')
                ]),
                m('ul', tabs.view(new tabs.controller(ctrl, group.tabs, idx))
                )
            ])
        });
    };

    // List of tabs in each Tab Group
    var tabs = {},
        dragged = [],
        dragCounter = 0;
    tabs.controller = function (mainCtrl, items, groupIdx) {
        var ctrl = this;
        ctrl.tabs = items;
        ctrl.removeTab = function (idx) {
            if (ctrl.tabs.length <= 1) {
                mainCtrl.removeGroup(groupIdx);
            } else {
                ctrl.tabs.splice(idx, 1);
            }
        };
        ctrl.save = function () {
            mainCtrl.save();
        };

        // Drag & drop
        ctrl.onDragStart = function (idx) {
            return function () {
                dragged.push({
                    itemIndex: idx,
                    groupIndex: groupIdx
                });
            };
        };
        ctrl.onDrop = function () {
            return function (event) {
                event.preventDefault();
                var target;
                if ((target = getDropzone(event.target)) != null) {
                    target.style.background = "";
                    var item;
                    while (item = dragged.pop()) {
                        if (item.groupIndex != groupIdx) {
                            mainCtrl.moveItem(item.groupIndex, item.itemIndex, groupIdx);
                        }
                    }
                    //ctrl.save();
                }
                dragCounter = 0;
                dragged = [];
            };
        };
    };
    tabs.view = function (ctrl) {
        return ctrl.tabs.map(function (tab, idx) {
            return m('li[draggable=true]', {
                ondragstart: ctrl.onDragStart(idx),
                ondrop: ctrl.onDrop()
            }, [
                m('span.delete-link', {
                    onclick: function () {
                        ctrl.removeTab(idx);
                        ctrl.save();
                    }
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
