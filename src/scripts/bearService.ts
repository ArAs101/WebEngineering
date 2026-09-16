import type { Bear, ParsedBear } from "./types";

const BASE_URL = "https://en.wikipedia.org/w/api.php";
const PAGE_TITLE = "List_of_ursids";
const PLACEHOLDER_IMAGE = new URL(
  "media/bear_placeholder.png", import.meta.url
).href;

function buildApiUrl(params: Record<string, string>): string {
  return BASE_URL + "?" + new URLSearchParams(params).toString();
}

async function fetchJson(
  params: Record<string, string>,
  errorContext: string
): Promise<unknown> {
  const response = await fetch(buildApiUrl(params));
  if (!response.ok) {
    throw new Error(`${errorContext} with status ${response.status}`);
  }

  const data: unknown = await response.json();
  return data;
}

function isRecord(
  value: unknown
): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function extractWikitext(data: unknown): string {
  if (!isRecord(data)) {
    throw new Error("Wikipedia response is not an object.");
  }

  const parse = data["parse"];

  if (!isRecord(parse)) {
    throw new Error("Wikipedia response does not contain parse data.");
  }

  const wikitext = parse["wikitext"];

  if (!isRecord(wikitext)) {
    throw new Error("Wikipedia response does not contain wikitext.");
  }

  const content = wikitext["*"];

  if (typeof content !== "string") {
    throw new Error("Wikipedia wikitext is not a string.");
  }

  return content;
}

function extractImageUrl(data: unknown): string {
  if (!isRecord(data)) {
    throw new Error("Image response is not an object.");
  }

  const query = data["query"];

  if (!isRecord(query)) {
    throw new Error("Image response does not contain query data.");
  }

  const pages = query["pages"];

  if (!isRecord(pages)) {
    throw new Error("Image response does not contain pages.");
  }

  const page = Object.values(pages)[0];

  if (!isRecord(page)) {
    throw new Error("Image response does not contain a valid page.");
  }

  const imageInfo = page["imageinfo"];

  if (!Array.isArray(imageInfo) || imageInfo.length === 0) {
    throw new Error("Image response does not contain imageinfo.");
  }

  const firstImageInfo = imageInfo[0];

  if (!isRecord(firstImageInfo)) {
    throw new Error("Invalid imageinfo entry.");
  }

  const url = firstImageInfo["url"];

  if (typeof url !== "string") {
    throw new Error("Image URL is missing or invalid.");
  }

  return url;
}

async function fetchImageUrl(fileName: string): Promise<string> {
  const imageParams = {
    action: "query",
    titles: "File:" + fileName,
    prop: "imageinfo",
    iiprop: "url",
    format: "json",
    origin: "*"
  };

  const data = await fetchJson(imageParams, "Image request failed");
  return extractImageUrl(data);
}

function canLoadImage(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(true);
    image.onerror = () => resolve(false);
    image.src = url;
  });
}

async function getImageOrPlaceholder(fileName: string | null): Promise<string> {
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
  } catch (error: unknown) {
    console.warn("Could not load image for " + fileName + ". Using placeholder.", error);
    return PLACEHOLDER_IMAGE;
  }
}

function parseBearRow(row: string): ParsedBear {
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
    imageFileName: imageMatch
      ? imageMatch[1].trim().replace('File:', '') : null
  };
}

async function extractBears(wikitext: string): Promise<Bear[]> {
  const rows = wikitext.split('{{Species table/row').slice(1);
  if (rows.length === 0) {
    throw new Error("No bear entries found in Wikipedia data.");
  }

  const bearPromises: Promise<Bear>[] = rows.map(
    async (row): Promise<Bear> => {
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

export async function loadBears(): Promise<Bear[]> {
  const params = {
    action: "parse",
    page: PAGE_TITLE,
    prop: "wikitext",
    section: "3",
    format: "json",
    origin: "*"
  };

  const data = await fetchJson(params, "Wikipedia request failed");
  const wikitext = extractWikitext(data);
  return extractBears(wikitext);
}