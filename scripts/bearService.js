const BASE_URL = "https://en.wikipedia.org/w/api.php";
const PAGE_TITLE = "List_of_ursids";
const PLACEHOLDER_IMAGE = "media/bear_placeholder.png";

function buildApiUrl(params) {
  return BASE_URL + "?" + new URLSearchParams(params).toString();
}

async function fetchJson(params, errorContext) {
  const response = await fetch(buildApiUrl(params));
  if (!response.ok) {
    throw new Error(errorContext + " with status " + response.status);
  }

  return response.json();
}

async function fetchImageUrl(fileName) {
  const imageParams = {
    action: "query",
    titles: "File:" + fileName,
    prop: "imageinfo",
    iiprop: "url",
    format: "json",
    origin: "*"
  };

  const data = await fetchJson(imageParams, "Image request failed");
  const pages = data.query?.pages;
  const page = pages ? Object.values(pages)[0] : null;
  if (!page?.imageinfo?.[0]?.url) {
    throw new Error("No image URL returned for " + fileName);
  }

  return page.imageinfo[0].url;
}

function canLoadImage(url) {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(true);
    image.onerror = () => resolve(false);
    image.src = url;
  });
}

async function getImageOrPlaceholder(fileName) {
  if (!fileName) {
    return PLACEHOLDER_IMAGE;
  }

  try {
    const imageUrl = await fetchImageUrl(fileName);
    const imageCanBeLoaded = await canLoadImage(imageUrl);
    if (!imageCanBeLoaded) {
      throw new Error("Image cannot be loaded: " + imageUrl);
    }

    return imageUrl;
  } catch (error) {
    console.warn("Could not load image for " + fileName + ". Using placeholder.", error);
    return PLACEHOLDER_IMAGE;
  }
}

function parseBearRow(row) {
  const nameMatch = row.match(/\|name=\[\[(.*?)\]\]/);
  const binomialMatch = row.match(/\|binomial=([^|\n]*)/);
  const imageMatch = row.match(/\|image=([^|\n]*)/);
  const rangeMatch = row.match(/\|range=([^|\n]*)/);
  if (!nameMatch || !binomialMatch || !rangeMatch) {
    throw new Error("Required bear information could not be extracted.");
  }

  return {
    name: nameMatch[1].trim(),
    binomial: binomialMatch[1].trim(),
    range: rangeMatch[1].trim(),
    imageFileName: imageMatch ? imageMatch[1].trim().replace('File:', '') : null
  };
}

async function extractBears(wikitext) {
  const rows = wikitext.split('{{Species table/row').slice(1);
  if (rows.length === 0) {
    throw new Error("No bear entries found in Wikipedia data.");
  }

  const bearPromises = rows.map(
    async (row) => {
      const {
        imageFileName, ...bear
      } = parseBearRow(row);
      const image =
        await getImageOrPlaceholder(imageFileName);
      return {
        ...bear, image
      };
    }
  );

  return Promise.all(bearPromises);
}

export async function loadBears() {
  const params = {
    action: "parse",
    page: PAGE_TITLE,
    prop: "wikitext",
    section: 3,
    format: "json",
    origin: "*"
  };

  const data = await fetchJson(params, "Wikipedia request failed");
  const wikitext = data.parse?.wikitext?.['*'];
  if (typeof wikitext !== 'string') {
    throw new Error("Wikipedia response did not contain the expected wikitext.");
  }

  return extractBears(wikitext);
}