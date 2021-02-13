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
        settings.searchUrl   = settings.searchUrl   || 'https://bh4d9od16a-dsn.algolia.net/1/indexes/laravel/query?x-algolia-agent=Algolia%20for%20JavaScript%20(4.6.0)%3B%20Browser%20(lite)&x-algolia-api-key=7dc4fe97e150304d1bf34f5043f178c4&x-algolia-application-id=BH4D9OD16A';
        settings.docsVersion = settings.docsVersion || 'master';

        super(settings);
    }

    /**
     * @inheritdoc
     */
    search(searchQuery) {
        let searchData = {
            'query': encodeURIComponent(searchQuery),
            'hitsPerPage': 5,
            'facetFilters': ['version:' + this.docsVersion]
        };

        this.sendPost(this.searchUrl, JSON.stringify(searchData));
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
            let url       = data.hits[i].url;
            let content   = data.hits[i]._highlightResult?.content;
            let matchData = data.hits[i]._highlightResult?.hierarchy_camel?.[0] || data.hits[i]._highlightResult?.hierarchy;

            if (!matchData) {
                continue;
            }

            resultItems += '<a href="' + url + '" class="' + self.resultsItemClass + '" target="_blank">';

            if (matchData.lvl0) {
                resultItems += '<div class="dsa-search-result-title">' + matchData.lvl0.value + '</div>';
            }

            resultItems += '<div class="dsa-search-result-item-sub-section">';
            if (matchData.lvl1) {
                resultItems += '<div class="dsa-search-result-h2"><span class="dsa-search-result-accent">#</span>&nbsp;' + matchData.lvl1.value + '</div>';
            }
            if (matchData.lvl2) {
                resultItems += '<div class="dsa-search-result-h2">&nbsp;&gt;&nbsp;' + matchData.lvl2.value + '</div>';
            }
            if (matchData.lvl3) {
                resultItems += '<div class="dsa-search-result-h2">&nbsp;&gt;&nbsp;' + matchData.lvl3.value + '</div>';
            }
            resultItems += '</div>';

            if (content) {
                resultItems += '<div class="dsa-search-result-item-content">' + content.value + '</div>';
            }

            resultItems += '</a>';
        }

        return resultItems;
    }
}
