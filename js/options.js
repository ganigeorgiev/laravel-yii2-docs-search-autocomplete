/**
 * JS for the options panel
 *
 * @author Gani Georgiev <gani.georgiev@gmail.com>
 */
 document.addEventListener('DOMContentLoaded', function () {
    var saveTimeoutId = null;
    var defaultOptions = {
        yiiShortcut:        '1',
        laravelShortcut:    '1',
        laravelDocsVersion: '5.6'
    };

    // common selectors
    var statusBox  = document.getElementById('status_box');
    var saveButton = document.getElementById('save_options');

    // yii selectors
    var yiiShortcutSelect = document.getElementById('yii_shortcut');

    // laravel selectors
    var laravelShortcutSelect    = document.getElementById('laravel_shortcut');
    var laravelDocsVersionSelect = document.getElementById('laravel_docs_version');

    // saves options to chrome.storage
    function saveOptions() {
        var data = {
            yiiShortcut:        yiiShortcutSelect.value,
            laravelShortcut:    laravelShortcutSelect.value,
            laravelDocsVersion: laravelDocsVersionSelect.value
        };

        chrome.storage.sync.set({
            yiiShortcut:        data.yiiShortcut,
            laravelShortcut:    data.laravelShortcut,
            laravelDocsVersion: data.laravelDocsVersion
        }, function () {
            // update status to let user know options were saved.
            statusBox.classList.remove('hidden');
            statusBox.innerHTML = 'Successfully saved options.';

            // notify all tabs for the change
            if (chrome.tabs) {
                chrome.tabs.getSelected(function (tab) {
                    tab = tab || {};
                    chrome.tabs.sendMessage(tab.id, data);
                });
            }

            // reset status
            if (saveTimeoutId) {
                clearTimeout(saveTimeoutId);
            }
            saveTimeoutId = setTimeout(function () {
                statusBox.innerHTML = '';
                statusBox.classList.add('hidden');
            }, 3000);
        });
    }

    // load options using the preferences stored in chrome.storage
    function loadOptionsFromStorage() {
        chrome.storage.sync.get([
            'yiiShortcut',
            'yiiDocsVersion',
            'laravelShortcut',
            'laravelDocsVersion'
        ], function (props) {
            var data = Object.assign({}, defaultOptions, props || {})

            yiiShortcutSelect.value        = data.yiiShortcut;
            laravelShortcutSelect.value    = data.laravelShortcut;
            laravelDocsVersionSelect.value = data.laravelDocsVersion;
        });
    }

    loadOptionsFromStorage();

    saveButton.addEventListener('click', function () {
        saveOptions();
    });
}, false);
