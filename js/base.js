/**
 * Base search instance class intented to be extendted by all other search instances.
 * The child class must implement minimum the `search()` and `getResultItemsHtml()` methods.
 *
 * @author Gani Georgiev <gani.georgiev@gmail.com>
 */
class DSA_Base {
    /**
     * @param {Object} settings
     */
    constructor(settings = {}) {
        this.trottle                     = typeof settings.trottle != 'undefined' ? settings.trottle : 100,
        this.searchUrl                   = settings.searchUrl                   || '';
        this.baseDocsUrl                 = settings.baseDocsUrl                 || '';
        this.docsVersion                 = settings.docsVersion                 || '1.0';
        this.fallbackSearchUrl           = settings.fallbackSearchUrl           || 'https://www.google.bg/search?q=';
        this.inputId                     = settings.inputId                     || 'dsa_search_input';
        this.resultsContainerId          = settings.resultsContainerId          || 'dsa_search_results';
        this.resultsContainerActiveClass = settings.resultsContainerActiveClass || 'dsa-search-results-active';
        this.resultsItemClass            = settings.resultsItemClass            || 'dsa-search-result-item';
        this.resultsItemActiveClass      = settings.resultsItemActiveClass      || 'dsa-search-result-item-active';
        this.noResultsItemClass          = settings.noResultsItemClass          || 'dsa-search-results-missing';
        this.noResultsMessage            = settings.noResultsMessage            || 'No results found.';
        this.falbackSearchMessage        = settings.falbackSearchMessage        || 'Search with Google &#187;';

        this._searchXHR        = null;
        self._searchInput      = null;
        self._resultsContainer = null;

        this.init();
    }

    /**
     * Sends an ajax request.
     *
     * @param {String}        method
     * @param {String}        url
     * @param {Null|String}   [formData]
     * @param {Null|Function} [successCallback]
     * @param {Null|Function} [errorCallback]
     */
    send(method, url, formData, successCallback = null, errorCallback = null) {
        var self = this;

        if (self._searchXHR && self._searchXHR.readyState != 4) {
            self._searchXHR.abort();
        }

        // normalizing
        method          = method.toUpperCase();
        successCallback = successCallback || self.defaultSuccessCallback;
        errorCallback   = errorCallback   || self.defaultErrorCallback;

        self._searchXHR = new XMLHttpRequest();

        self._searchXHR.open(method, url, true);

        self._searchXHR.onload = function () {
            if (self._searchXHR.status >= 200 && self._searchXHR.status < 400) {
                try {
                    successCallback.call(self, JSON.parse(self._searchXHR.responseText));
                } catch (e) {
                    console.warn('DSA Send error: ', e);

                    errorCallback.call(self);
                }
            } else {
                errorCallback.call(self);
            }
        };

        self._searchXHR.onerror = function () {
            errorCallback.call(self);
        };

        if (method == 'POST') {
            self._searchXHR.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        }

        self._searchXHR.send(formData || null);
    }

    /**
     * Sends a POST ajax request.
     *
     * @param {String}        url
     * @param {Null|String}   [formData]
     * @param {Null|Function} [successCallback]
     * @param {Null|Function} [errorCallback]
     */
    sendPost(url, formData, successCallback = null, errorCallback = null) {
        return this.send('POST', url, formData, successCallback, errorCallback);
    }

    /**
     * Sends a GET ajax request.
     *
     * @param {String}        url
     * @param {Null|String}   [formData]
     * @param {Null|Function} [successCallback]
     * @param {Null|Function} [errorCallback]
     */
    sendGet(url, queryParams, successCallback = null, errorCallback = null) {
        url += (url.indexOf('?') !== -1 ? '&': '?') + queryParams;

        return this.send('GET', url, null, successCallback, errorCallback);
    }

    /**
     * Takes care for the search elements initialization and event bindings.
     */
    init() {
        var self = this;

        self._searchInput      = document.getElementById(self.inputId);
        self._resultsContainer = document.getElementById(self.resultsContainerId);

        if (!self._searchInput) {
            console.warn('Search input #' + self.inputId + ' is missing.');
            return;
        }

        if (!self._resultsContainer) {
            console.warn('Results container #' + self.resultsContainerId + ' is missing.');
            return;
        }

        if (self._searchInput.dsaInited) {
            console.warn('Search input #' + self.inputId + ' is already inited.');
            return;
        }

        self._searchInput.dsaInited = true;

        // search
        var trottleTimeoutId = null;
        self._searchInput.addEventListener('input', function (e) {
            if (trottleTimeoutId) {
                clearTimeout(trottleTimeoutId);
            }

            trottleTimeoutId = setTimeout(() => {
                if (!this.value.length) {
                    self.hideResultsContainer();
                    return;
                }

                self.search(this.value);
            }, self.trottle);
        });

        // --- disable because it prevents mouse click on result item
        // // focusout
        // self._searchInput.addEventListener('blur', function (e) {
        //     self.hideResultsContainer();
        //     this.value = '';
        // });

        // keyboard nav
        self._searchInput.addEventListener('keydown', function (e) {
            if (e.which == 40) { // down
                e.preventDefault();

                self.highlightResult('next');
            } else if (e.which == 38) { // up
                e.preventDefault();

                self.highlightResult('prev');
            } else if (e.which == 13) { // enter
                e.preventDefault();

                self.selectHighlightedResult();
            }
        });
    }

    /**
     * Hides the search results container.
     *
     * @param {Boolean} clearInput
     */
    hideResultsContainer(clearInput = true) {
        this._resultsContainer.classList.remove(this.resultsContainerActiveClass);

        if (clearInput) {
            this._searchInput.value = '';
        }
    }

    /**
     * Shows the search results container.
     */
    showResultsContainer() {
        this._resultsContainer.classList.add(this.resultsContainerActiveClass);
    }

    /**
     * Returns the fallback search url string for `searchQuery`.
     *
     * @param  {String} searchQuery
     * @return {String}
     */
    getFallbackSearchLink(searchQuery) {
        return this.fallbackSearchUrl + encodeURIComponent(searchQuery);
    }

    /**
     * Highlights single search result item.
     *
     * @param {String} dir `prev` or 'next'
     */
    highlightResult(dir = 'prev') {
        var resultItems = document.getElementsByClassName(this.resultsItemClass);

        if (!resultItems || !resultItems.length) {
            return;
        }

        var activeItem = resultItems[0];

        for (let i = 0; i < resultItems.length; i++) {
            let item = resultItems[i];

            if (item.classList.contains(this.resultsItemActiveClass)) {
                item.classList.remove(this.resultsItemActiveClass);

                if (dir == 'prev') {
                    if (i > 0) {
                        activeItem = resultItems[i - 1];
                    } else {
                        activeItem = resultItems[resultItems.length - 1];
                    }
                } else {
                    if ((i + 1) < resultItems.length) {
                        activeItem = resultItems[i + 1];
                    } else {
                        activeItem = resultItems[0];
                    }
                }

                break;
            }
        }

        activeItem.classList.add(this.resultsItemActiveClass);

        // scroll if necessary
        var activeItemRect = activeItem.getBoundingClientRect();
        var visibleHeight = activeItemRect.height + activeItem.offsetTop;
        if (visibleHeight > (this._resultsContainer.offsetHeight + this._resultsContainer.scrollTop)) {
            this._resultsContainer.scrollTop = visibleHeight - this._resultsContainer.offsetHeight;
        } else if (activeItem.offsetTop < this._resultsContainer.scrollTop) {
            this._resultsContainer.scrollTop = activeItem.offsetTop;
        }
    }

    /**
     * "Clicks" the highlighted search result.
     */
    selectHighlightedResult() {
        var highlightedResultItem = document.getElementsByClassName(this.resultsItemActiveClass);

        if (!highlightedResultItem.length) {
            return;
        }

        highlightedResultItem[0].click();

        var event = new CustomEvent('searchResultSelected', {detail: highlightedResultItem});
        document.dispatchEvent(event);
    }

    /**
     * Represents and returns the results that should be appended to the `this._resultsContainer`
     *
     * @param  {Array} data
     * @return {String}
     */
    getResultItemsHtml(data) {
        return '';
    }

    /**
     * Performs a search request.
     *
     * @param {string} searchQuery
     */
    search(searchQuery) {
    }

    /**
     * Default search request succes callback.
     *
     * @param {Object} resp
     */
    defaultSuccessCallback(resp) {
        var resultItems = this.getResultItemsHtml(resp);

        if (resultItems) {
            this._resultsContainer.innerHTML = resultItems;

            this.showResultsContainer();
        } else {
            this.hideResultsContainer();
        }
    }

    /**
     * Default search request error callback.
     */
    defaultErrorCallback() {
    }
}
