(function (m) {
    'use strict';
    var tabs = {},
        tabGroups,
        opts;

    // view-model
    tabs.vm = new function () {
        var vm = {};
        vm.init = function (tabGroups) {
            // list of tab groups
            var timeSort = function (tabGroups) {
                return tabGroups.sort(function (a, b) {
                    return b.id - a.id;
                });
            };

            vm.list = timeSort(tabGroups);
            vm.rmGroup = function (i) {
                vm.list.splice(i, 1);
                //tabGroups.splice(i, 1);
                saveTabGroups(vm.list);
            };

            vm.rmTab = function (i, ii) {
                if (vm.list[i].tabs.length == 1) {
                    vm.rmGroup(i);
                } else {
                    vm.list[i].tabs.splice(ii, 1);
                    saveTabGroups(vm.list);
                }
            };

            vm.update = function (newArr) {
                vm.list = timeSort(newArr);
                m.redraw();
            }
        };
        return vm;
    };

    function saveTabGroups(json) {
        chrome.storage.sync.set({tabGroups: json});
    }

    tabs.view = function () {
        if (tabs.vm.list.length === 0) {
            return m('p', 'No tab groups have been saved yet, or you deleted them all...');
        }

        // foreach tab group
        return tabs.vm.list.map(function (group, i) {
            // group
            return m('div.group', [
                m('div.group-title', [
                    m('span.delete-link', {
                        onclick: function () {
                            tabs.vm.rmGroup(i);
                        }
                    }),
                    m('span.group-amount', group.tabs.length + ' Tabs'),
                    ' ',
                    m('span.group-date', moment(new Date(group.id)).fromNow()),
                    ' ',
                    m('span.restore-all', {
                        onclick: function () {
                            if (opts.deleteTabOnOpen === 'yes') {
                                tabs.vm.rmGroup(i);
                            }
                            group.tabs.forEach(function () {
                                chrome.tabs.create({
                                    url: group.tabs[i].url
                                });
                            });
                        }
                    }, 'Restore group')
                ]),

                // foreach tab
                m('ul[draggable=true]',{
                //className   : item.dragOver ? 'dragOver' : '',
                //ondrop      : ctrl.drop( item, list, itemIndex ),
                //ondragleave : ctrl.off( item ),
                //ondragover  : ctrl.on( item ),
                //ondragstart : ctrl.start( item, list, itemIndex ),
                ondragstart : alert("yoyo")
                //key         : item.uid
            }, group.tabs.map(function (tab, ii) {
                    return m('li', [
                        m('span.delete-link', {
                            onclick: function () {
                                tabs.vm.rmTab(i, ii);
                            }
                        }),
                        m('img', {src: tab.favIconUrl, height: '16', width: '16'}),
                        ' ',
                        m('a.link', {
                            onclick: function () {
                                if (opts.deleteTabOnOpen === 'yes') {
                                    tabs.vm.rmTab(i, ii);
                                }
                            },
                            href: tab.url
                        }, tab.title)
                    ]);
                }))
            ]);
        });
    };

    chrome.storage.onChanged.addListener(function (changes, namespace) {
        if (changes.tabGroups != null) {
            tabs.vm.update(changes.tabGroups.newValue);
        }
    });

    chrome.storage.sync.get(function (storage) {
        tabGroups = storage.tabGroups || [];// tab groups
        opts = storage.options || {
                deleteTabOnOpen: 'no'
            };

        tabs.controller = function () {
            tabs.vm.init(tabGroups);
        };


        // init the app
        m.module(document.getElementById('groups'), {controller: tabs.controller, view: tabs.view});

    });

}(m));
