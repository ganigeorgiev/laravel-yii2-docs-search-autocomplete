/**
 * Main entry handler that takes care for the actual search box injection and events registering.
 *
 * @author Gani Georgiev <gani.georgiev@gmail.com>
 */
;(function () {
    var keys = {
        'enter': 13,
        'esc':   27,
        'up':    38,
        'down':  40,
        'l':     76,
        'y':     89
    };

    var options = {
        yiiShortcut:        '1',
        yiiDocsVersion:     '2.0',
        laravelShortcut:    '1',
        laravelDocsVersion: '5.6'
    };

    var closeTimeoutId = null;

    // inject search box markup
    document.body.insertAdjacentHTML('beforeend', (`
        <div id="dsa_search_bar_wrapper" class="dsa-search-bar-wrapper">
            <div id="dsa_search_bar_overlay" class="dsa-search-bar-overlay"></div>

            <div id="dsa_search_bar" class="dsa-search-bar-laravel">
                <div class="dsa-search-controls-wrapper">
                    <div class="dsa-search-select-wrapper">
                        <select class="dsa-search-select" id="dsa_search_input_select">
                            <option value="yii">Yii 2</option>
                            <option value="laravel">Laravel</option>
                        </select>
                    </div>

                    <input type="text" class="dsa-search-input dsa-search-input-active" id="dsa_laravel_search_input" placeholder="Search..." autocomplete="off" spellcheck="false">
                    <input style="display: none;" type="text" class="dsa-search-input" id="dsa_yii_search_input" placeholder="Search..." autocomplete="off" spellcheck="false">
                </div>
                <div id="dsa_search_results" class="dsa-search-results"></div>
            </div>
        </div>
    `));

    // common cached selectors
    var searchBarWrapperActiveClass  = 'dsa-search-bar-wrapper-active';
    var searchBarWrapperClosingClass = 'dsa-search-bar-wrapper-closing';
    var laravelBarClass              = 'dsa-search-bar-laravel';
    var yiiBarClass                  = 'dsa-search-bar-yii';
    var searchBarWrapper             = document.getElementById('dsa_search_bar_wrapper');
    var searchBarOverlay             = document.getElementById('dsa_search_bar_overlay');
    var searchBar                    = document.getElementById('dsa_search_bar');
    var searchInputSelect            = document.getElementById('dsa_search_input_select');

    // Laravel search instance
    var laravel = new DSA_Laravel({
        docsVersion: options.laravelDocsVersion
    });

    // Yii search instance
    var yii = new DSA_Yii();

    // Options handlers
    // ---------------------------------------------------------------
    // Takes care for updating the `options` variable
    function updateOptions(newOptions = {}) {
        if (typeof newOptions !== 'object') {
            return;
        }

        options = Object.assign({}, options, newOptions);

        yii.docsVersion     = options.yiiDocsVersion;
        laravel.docsVersion = options.laravelDocsVersion;

        bindShortcuts();
    }

    // Load stored user preferences
    function loadOptionsFromStorage() {
        if (chrome && chrome.storage && chrome.storage.sync) {
            chrome.storage.sync.get([
                'yiiShortcut',
                'yiiDocsVersion',
                'laravelShortcut',
                'laravelDocsVersion'
            ], function (props) {
                updateOptions(props);
            });
        }
    }

    // Event handler for registering the search box shortcuts (@see `bindShortcuts()`)
    function handleShortcuts(e) {
        if (typeof e === 'undefined') {
            return;
        }

        // open yii
        if (
            (options.yiiShortcut == 1 && e.which == keys.y && e.altKey === false && e.ctrlKey === true && e.shiftKey === false) ||
            (options.yiiShortcut == 2 && e.which == keys.y && e.altKey === false && e.ctrlKey === true && e.shiftKey === true)
        ) {
            e.preventDefault();

            showSearch('yii');

            return false;
        }

        // open laravel
        if (
            (options.laravelShortcut == 1 && e.which == keys.l && e.altKey === false && e.ctrlKey === true && e.shiftKey === false) ||
            (options.laravelShortcut == 2 && e.which == keys.l && e.altKey === false && e.ctrlKey === true && e.shiftKey === true)
        ) {
            e.preventDefault();

            showSearch('laravel');

            return false;
        }

        // close
        if (e.which == keys.esc) {
            e.preventDefault();

            hideSearch();

            return false;
        }
    }

    // Shortcuts bind event handler
    function bindShortcuts() {
        // remove previously attached events
        document.removeEventListener('keydown', handleShortcuts, false);

        // register new events
        document.addEventListener('keydown', handleShortcuts, false);
    }

    // Basic search box handlers and event bindings
    // ---------------------------------------------------------------
    // Change active search instance
    function changeSearch(type) {
        laravel.hideResultsContainer();
        yii.hideResultsContainer();

        if (searchInputSelect.value != type) {
            searchInputSelect.value = type;
        }

        if (type == 'yii') { // yii
            laravel._searchInput.style.display = 'none';
            yii._searchInput.style.display = '';
            yii._searchInput.focus();

            searchBar.classList.remove(laravelBarClass);
            searchBar.classList.add(yiiBarClass);
        } else { // laravel
            yii._searchInput.style.display = 'none';
            laravel._searchInput.style.display = '';
            laravel._searchInput.focus();

            searchBar.classList.add(laravelBarClass);
            searchBar.classList.remove(yiiBarClass);
        }
    }

    // Shows and change the active search instance
    function showSearch(type = 'laravel') {
        if (closeTimeoutId) {
            clearTimeout(closeTimeoutId);
        }

        searchBarWrapper.classList.remove(searchBarWrapperClosingClass);
        searchBarWrapper.classList.add(searchBarWrapperActiveClass);

        changeSearch(type);
    }

    // Hide the active search instance
    function hideSearch() {
        searchBarWrapper.classList.add(searchBarWrapperClosingClass);

        if (closeTimeoutId) {
            clearTimeout(closeTimeoutId);
        }

        closeTimeoutId = setTimeout(function () {
            searchBarWrapper.classList.remove(searchBarWrapperActiveClass);
            searchBarWrapper.classList.remove(searchBarWrapperClosingClass);
        }, 400);
    }

    // Hide on overlay click
    searchBarOverlay.addEventListener('click', function (e) {
        e.preventDefault();

        hideSearch();
    });

    // Hide on tab change
    window.addEventListener('blur', function (e) {
        hideSearch();
    });

    // Reload options on tab focus
    window.addEventListener('focus', function (e) {
        loadOptionsFromStorage();
    });

    // Change active search instance on select change
    searchInputSelect.addEventListener('change', function (e) {
        changeSearch(this.value);
    });

    // Listen for option changes
    if (chrome && chrome.runtime && chrome.runtime.onMessage) {
        chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
            updateOptions(msg);
        });
    }

    // Init default search instance
    changeSearch();

    // load stored user preferences
    loadOptionsFromStorage();

    // Bind visibility shortcuts
    bindShortcuts();
})();
