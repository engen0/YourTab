;
(function ($) {
    'use strict';

    document.addEventListener('DOMContentLoaded', function () {
        chrome.storage.sync.get('options', function (storage) {
            var opts = storage.options || {};

            var deleteTabOnOpen = opts.deleteTabOnOpen || 'no';
            $('input[name="deleteTabOnOpen"][value="' + deleteTabOnOpen+ '"]').prop('checked', 'checked');

            var enableAltQ= opts.enableAltQ || 'no';
            $('input[name="enableAltQ"][value="' + enableAltQ + '"]').prop('checked', 'checked');
        });
    });

    document.getElementsByName('save')[0].addEventListener('click', function () {
        var deleteTabOnOpen = document.querySelector('input[name="deleteTabOnOpen"]:checked').value;
        var enableAltQ = document.querySelector('input[name="enableAltQ"]:checked').value;

        chrome.storage.sync.set({
            options: {
                deleteTabOnOpen: deleteTabOnOpen,
                enableAltQ: enableAltQ
            }
        }, function () {
            document.getElementById('saved').style.display = 'block';
            window.setTimeout(function () {
                document.getElementById('saved').style.display = 'none';
            }, 1000);
        });
    });

}(jQuery));
