/**
 * JSSEARCH object wrapper based on the original one
 * from http://www.yiiframework.com/doc-2.0/
 */
var DSA_YII_JSSEARCH = {
    /**
     * the actual words finally used to query (set by last search call)
     */
    queryWords: [],

    search: function(query) {
        var words = DSA_YII_JSSEARCH.tokenizeString(query);
        var result = {};

        DSA_YII_JSSEARCH.queryWords = words.map(function(i) { return i.t; });

        // do not search when no words given
        if (!words.length) {
            return result;
        }

        words = DSA_YII_JSSEARCH.completeWords(words);
        DSA_YII_JSSEARCH.queryWords = words.map(function(i) { return i.t; });
        result = DSA_YII_JSSEARCH.searchForWords(words);

        var res = [];
        for (var i in result) {
            res.push(result[i]);
        }
        res.sort(function(a,b) { return b.weight - a.weight; });

        return res;
    },

    searchForWords: function(words) {
        var result = {};
        words.forEach(function(word) {
            if (DSA_YII_JSSEARCH.index[word.t]) {
                DSA_YII_JSSEARCH.index[word.t].forEach(function(file) {
                    if (result[file.f]) {
                        result[file.f].weight *= file.w * word.w;
                    } else {
                        result[file.f] = {
                            file: DSA_YII_JSSEARCH.files[file.f],
                            weight: file.w * word.w
                        };
                    }
                });
            }
        });

        return result;
    },

    completeWords: function(words) {
        var result = [];

        words.forEach(function(word) {
            if (!DSA_YII_JSSEARCH.index[word.t] && word.t.length > 1) {
                // complete words that are not in the index
                for(var w in DSA_YII_JSSEARCH.index) {
                    if (w.substr(0, word.t.length) === word.t) {
                        result.push({t: w, w: 1});
                    }
                }
            } else {
                // keep existing words
                result.push(word);
            }
        });

        return result;
    },

    tokenizeString: function(string) {
        if (console) {
            console.log('Error: tokenizeString should have been overwritten by index JS file.')
        }

        return [{t: string, w: 1}];
    }
};
