/**
 * Laravel search instance class.
 *
 * @author Gani Georgiev <gani.georgiev@gmail.com>
 */
class DSA_Laravel extends DSA_Base {
    /**
     * @inheritdoc
     */
    constructor(settings = {}) {
        settings.inputId     = settings.inputId     || 'dsa_laravel_search_input';
        settings.searchUrl   = settings.searchUrl   || 'https://8bb87i11de-dsn.algolia.net/1/indexes/docs/query?x-algolia-api-key=8e1d446d61fce359f69cd7c8b86a50de&x-algolia-application-id=8BB87I11DE&x-algolia-agent=Algolia%20for%20vanilla%20JavaScript%203.7.7';
        settings.baseDocsUrl = settings.baseDocsUrl || 'https://laravel.com/docs';
        settings.docsVersion = settings.docsVersion || '5.6';

        super(settings);
    }

    /**
     * @inheritdoc
     */
    search(searchQuery) {
        var searchData = '{"params":"query='+ encodeURIComponent(searchQuery) + '&hitsPerPage=5&tagFilters=%5B%22' + this.docsVersion + '%22%5D"}';

        this.sendPost(this.searchUrl, searchData);
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

        return normalizedBaseUrl + '/' + this.docsVersion + '/' + normalizedPath;
    }

    /**
     * @inheritdoc
     */
    getResultItemsHtml(data) {
        var self = this;

        if (!data.hits || !data.hits.length) {
            return (
                '<a href="' + self.getFallbackSearchLink('Laravel ' + self._searchInput.value) + '" class="' + self.resultsItemClass + ' ' + self.noResultsItemClass + '" target="_blank">' +
                    self.noResultsMessage + '&nbsp;' +
                    '<span class="dsa-search-result-accent">' + self.falbackSearchMessage +'</span>' +
                '</a>'
            );
        }

        var resultItems = '';

        for (let i in data.hits) {
            let link     = data.hits[i].link;
            let itemData = data.hits[i]._highlightResult;

            if (!itemData) {
                continue;
            }

            resultItems += '<a href="' + self.getLink(link) + '" class="' + self.resultsItemClass + '" target="_blank">';

            if (itemData.h1) {
                resultItems += '<div class="dsa-search-result-title">' + itemData.h1.value + '</div>';
            }

            resultItems += '<div class="dsa-search-result-item-sub-section">';
            if (itemData.h2) {
                resultItems += '<div class="dsa-search-result-h2"><span class="dsa-search-result-accent">#</span>&nbsp;' + itemData.h2.value + '</div>';
            }
            if (itemData.h3) {
                resultItems += '<div class="dsa-search-result-h2">&nbsp;&gt;&nbsp;' + itemData.h3.value + '</div>';
            }
            if (itemData.h4) {
                resultItems += '<div class="dsa-search-result-h2">&nbsp;&gt;&nbsp;' + itemData.h4.value + '</div>';
            }
            resultItems += '</div>';

            if (itemData.content) {
                resultItems += '<div class="dsa-search-result-item-content">' + itemData.content.value + '</div>';
            }

            resultItems += '</a>';
        }

        return resultItems;
    }
}
