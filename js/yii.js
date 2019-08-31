/**
 * Yii search instance class.
 * Use offline search via jssearch indexed data!
 *
 * @author Gani Georgiev <gani.georgiev@gmail.com>
 */
class DSA_Yii extends DSA_Base {
    /**
     * @inheritdoc
     */
    constructor(settings = {}) {
        settings.inputId     = settings.inputId     || 'dsa_yii_search_input';
        settings.baseDocsUrl = settings.baseDocsUrl || 'https://www.yiiframework.com/doc-2.0';
        settings.docsVersion = settings.docsVersion || '2.0';
        settings.searchUrl   = settings.searchUrl   || '';

        super(settings);
    }

    /**
     * @inheritdoc
     */
    search(searchQuery) {
        var data        = DSA_YII_JSSEARCH.search(searchQuery);
        var resultItems = this.getResultItemsHtml(data);

        if (resultItems) {
            this._resultsContainer.innerHTML = resultItems;
            this.showResultsContainer();
        } else {
            this.hideResultsContainer();
        }
    }

    /**
     * Resolves single result item's link.
     *
     * @param  {String} path
     * @return {String}
     */
    getLink(path = '') {
        var normalizedBaseUrl = this.baseDocsUrl.endsWith('/') ? this.baseDocsUrl.slice(0, -1) : this.baseDocsUrl;
        var normalizedPath    = path.startsWith('/') ? path.slice(0, -1) : path;

        return normalizedBaseUrl + '/' + normalizedPath;
    }

    /**
     * @inheritdoc
     */
    getResultItemsHtml(data) {
        var self = this;

        if (!data || !data.length) {
            return (
                '<a href="' + self.getFallbackSearchLink('Yii ' + self._searchInput.value) + '" class="' + self.resultsItemClass + ' ' + self.noResultsItemClass + '" target="_blank">' +
                    self.noResultsMessage + '&nbsp;' +
                    '<span class="dsa-search-result-accent">' + self.falbackSearchMessage +'</span>' +
                '</a>'
            );
        }

        var resultItems = '';

        for (let i in data) {
            let itemData = data[i].file || {};

            resultItems += '<a href="' + self.getLink(itemData.u.substr(3)) + '" class="' + self.resultsItemClass + '" target="_blank">';

            if (itemData.t) {
                resultItems += '<div class="dsa-search-result-title">' + itemData.t + '</div>';
            }

            if (itemData.d) {
                resultItems += '<div class="dsa-search-result-item-content">' + itemData.d + '</div>';
            }

            resultItems += '</a>';
        }

        return resultItems;
    }
}
