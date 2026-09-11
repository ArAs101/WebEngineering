import { renderBears, renderBearError } from './bearView.js';

export async function initBearData() {
  // Fetching bear data
  var baseUrl = "https://en.wikipedia.org/w/api.php";
  var title = "List_of_ursids";
  var placeholderImage = "media/bear_placeholder.png";

  var params = {
    action: "parse",
    page: title,
    prop: "wikitext",
    section: 3,
    format: "json",
    origin: "*"
  };

  async function fetchImageUrl(fileName) {
    var imageParams = {
      action: "query",
      titles: "File:" + fileName,
      prop: "imageinfo",
      iiprop: "url",
      format: "json",
      origin: "*"
    };

    var url = baseUrl + "?" + new URLSearchParams(imageParams).toString();
    var response = await fetch(url);

    if (!response.ok) {
      throw new Error("Image request failed with status " + response.status);
    }

    var data = await response.json();
    var pages = data.query?.pages;
    var page = pages ? Object.values(pages)[0] : null;

    if (!page?.imageinfo?.[0]?.url) {
      throw new Error("No image URL returned for " + fileName);
    }

    return page.imageinfo[0].url;
  }

  function canLoadImage(url) {
    return new Promise((resolve) => {
      var image = new Image();
      image.onload = () => resolve(true);
      image.onerror = () => resolve(false);
      image.src = url;
    });
  }

  async function getImageOrPlaceholder(imageMatch) {
    if (!imageMatch) {
      return placeholderImage;
    }

    var fileName = imageMatch[1].trim().replace('File:', '');

    try {
      var imageUrl = await fetchImageUrl(fileName);
      var imageCanBeLoaded = await canLoadImage(imageUrl);
      if (!imageCanBeLoaded) {
        throw new Error("Image cannot be loaded: " + imageUrl);
      }
      return imageUrl;
    } catch (error) {
      console.warn("Could not load image for " + fileName + ". Using placeholder.", error);
      return placeholderImage;
    }
  }

  async function extractBears(wikitext) {
    var rows = wikitext.split('{{Species table/row').slice(1);

    if (rows.length === 0) {
      throw new Error("No bear entries found in Wikipedia data.");
    }

    var bearPromises = rows.map(async (row) => {
      var nameMatch = row.match(/\|name=\[\[(.*?)\]\]/);
      var binomialMatch = row.match(/\|binomial=([^|\n]*)/);
      var imageMatch = row.match(/\|image=([^|\n]*)/);
      var rangeMatch = row.match(/\|range=([^|\n]*)/);

      if (!nameMatch || !binomialMatch || !rangeMatch) {
        throw new Error("Required bear information could not be extracted.");
      }

      return {
        name: nameMatch[1].trim(),
        binomial: binomialMatch[1].trim(),
        range: rangeMatch[1].trim(),
        image: await getImageOrPlaceholder(imageMatch)
      };
    });

    var bears = await Promise.all(bearPromises);
    return bears;
  }

  try {
    var url = baseUrl + "?" + new URLSearchParams(params).toString();
    var response = await fetch(url);

    if (!response.ok) {
      throw new Error("Wikipedia request failed with status " + response.status);
    }

    var data = await response.json();

    var wikitext = data.parse?.wikitext?.['*'];

    if (typeof wikitext !== 'string') {
      throw new Error("Wikipedia response did not contain the expected wikitext.");
    }

    var bears = await extractBears(wikitext);

    if (bears.length === 0) {
      throw new Error("Wikipedia returned no bear data.");
    }

    renderBears(bears);
  } catch (error) {
    console.error("Could not load bear data: ", error);
    renderBearError("Bear data could not be loaded. Please try again later.");
  }
}