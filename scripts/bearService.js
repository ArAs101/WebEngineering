import { renderBears } from './bearView.js';

export function initBearData() {
    // Fetching bear data
    var baseUrl = "https://en.wikipedia.org/w/api.php";
    var title = "List_of_ursids";
    var placeholderImage = "media/bear_placeholder.jpg";

    var params = {
        action: "parse",
        page: title,
        prop: "wikitext",
        section: 3,
        format: "json",
        origin: "*"
    };

    function fetchImageUrl(fileName) {
        var imageParams = {
          action: "query",
          titles: "File:" + fileName,
          prop: "imageinfo",
          iiprop: "url",
          format: "json",
          origin: "*"
        };

        var url = baseUrl + "?" + new URLSearchParams(imageParams).toString();
        return fetch(url).then(function(res) {
          return res.json();
        }).then(function(data) {
          var pages = data.query.pages;
          var page = Object.values(pages)[0];
          return page.imageinfo[0].url;
        });
    }

    function extractBears(wikitext) {
      var rows = wikitext.split('{{Species table/row').slice(1); // Skip the first part before the first row
          var bearPromises = rows.map(function(row) {
            var nameMatch = row.match(/\|name=\[\[(.*?)\]\]/);
            var binomialMatch = row.match(/\|binomial=([^|\n]*)/);
            var imageMatch = row.match(/\|image=([^|\n]*)/);
            var rangeMatch = row.match(/\|range=([^|\n]*)/);

            if (nameMatch && binomialMatch && rangeMatch) {
              var bear = {
                  name: nameMatch[1].trim(),
                  binomial: binomialMatch[1].trim(),
                  range: rangeMatch[1].trim()
                };

              if (imageMatch) {
                var fileName = imageMatch[1].trim().replace('File:', '');

                return fetchImageUrl(fileName)
                .then(function(imageUrl) {
                  bear.image = imageUrl;
                  return bear;
                })
                .catch(function() {
                  bear.image = placeholderImage;
                  return bear;
                });
              };
              bear.image = placeholderImage;
              return Promise.resolve(bear);
            }
            return Promise.resolve(null);
          });

          return Promise.all(bearPromises)
          .then(function(bears) {
            return bears.filter(function(bear) {
              return bear !== null;
            });
          });
        };
      

      fetch(baseUrl + "?" + new URLSearchParams(params).toString())
        .then(function(res) {
          return res.json();
        })
        .then(function(data) {
          return extractBears(data.parse.wikitext['*']);
        })
        .then(function(bears) {
          renderBears(bears);
        });
}    