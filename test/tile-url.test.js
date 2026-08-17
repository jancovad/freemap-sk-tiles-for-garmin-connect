"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  buildFreemapTileUrl,
  FREEMAP_MAX_ZOOM,
  FREEMAP_MIN_ZOOM,
  getFreemapPixelRatio,
  getFreemapRetinaSuffix,
  parseGarminGoogleTileUrl,
  parseFreemapTileUrl,
  parseLegacyGarminTilePath,
  translateGarminGoogleTileUrl
} = require("../src/tile-url.js");

function googleTileUrl(zoom, x, y, tileSize = 256) {
  const pb = `!1m5!1m4!1i${zoom}!2i${x}!3i${y}!4i${tileSize}!2m3!1e0!2sm!3i1`;
  return `https://maps.googleapis.com/maps/vt?pb=${pb}&key=test-only&token=test-only`;
}

test("prevedie pozorovanú dlaždicu z detailu aktivity", () => {
  const source = googleTileUrl(12, 2264, 1404);

  assert.deepEqual(parseGarminGoogleTileUrl(source), {
    zoom: 12,
    x: 2264,
    y: 1404,
    tileSize: 256
  });
  assert.equal(
    translateGarminGoogleTileUrl(source),
    "https://outdoor.tiles.freemap.sk/12/2264/1404?app=garmin-connect-ext"
  );
});

test("prevedie pozorovanú dlaždicu z vyššieho zoomu", () => {
  assert.equal(
    translateGarminGoogleTileUrl(googleTileUrl(14, 9055, 5621)),
    "https://outdoor.tiles.freemap.sk/14/9055/5621?app=garmin-connect-ext"
  );
});

test("spracuje URL zakódovanú cez URLSearchParams", () => {
  const url = new URL("https://maps.googleapis.com/maps/vt");
  url.searchParams.set("key", "test-only");
  url.searchParams.set("pb", "!1m5!1m4!1i11!2i484!3i783!4i256!2m3!1e0");

  assert.equal(
    translateGarminGoogleTileUrl(url.href),
    "https://outdoor.tiles.freemap.sk/11/484/783?app=garmin-connect-ext"
  );
});

test("odmietne inú doménu aj podobný parameter", () => {
  const source = googleTileUrl(12, 2264, 1404).replace(
    "maps.googleapis.com",
    "example.invalid"
  );

  assert.equal(parseGarminGoogleTileUrl(source), null);
});

test("odmietne nepozorovanú veľkosť dlaždice", () => {
  assert.equal(parseGarminGoogleTileUrl(googleTileUrl(12, 2264, 1404, 512)), null);
});

test("odmietne súradnice mimo Web Mercator rozsahu", () => {
  assert.equal(parseGarminGoogleTileUrl(googleTileUrl(3, 8, 2)), null);
  assert.equal(buildFreemapTileUrl({ zoom: 3, x: 2, y: 8 }), null);
});

test("historický hexadecimálny Garmin formát prevádza iba samostatný parser", () => {
  const tile = parseLegacyGarminTilePath("L11/R0000030F/C000001E4.png");

  assert.deepEqual(tile, { zoom: 11, x: 484, y: 783, tileSize: 256 });
  assert.equal(
    buildFreemapTileUrl(tile),
    "https://outdoor.tiles.freemap.sk/11/484/783?app=garmin-connect-ext"
  );
});

test("historický parser odmietne neplatnú alebo neúplnú cestu", () => {
  assert.equal(parseLegacyGarminTilePath("L11/RXYZ/C000001E4.png"), null);
  assert.equal(parseLegacyGarminTilePath("L11/R0000030F.png"), null);
});

test("deklaruje Freemap rozsah zoomu potvrdený prevádzkovateľom", () => {
  assert.equal(FREEMAP_MIN_ZOOM, 5);
  assert.equal(FREEMAP_MAX_ZOOM, 18);
  assert.equal(
    buildFreemapTileUrl({ zoom: 4, x: 8, y: 4, tileSize: 256 }),
    null
  );
  assert.equal(
    buildFreemapTileUrl({ zoom: 19, x: 289606, y: 179842, tileSize: 256 }),
    null
  );
  assert.equal(translateGarminGoogleTileUrl(googleTileUrl(19, 289606, 179842)), null);
});

test("vyberie retina príponu podľa devicePixelRatio", () => {
  assert.equal(getFreemapPixelRatio(1), 1);
  assert.equal(getFreemapPixelRatio(1.25), 2);
  assert.equal(getFreemapPixelRatio(2), 2);
  assert.equal(getFreemapPixelRatio(2.5), 3);
  assert.equal(getFreemapPixelRatio(3.25), 4);
  assert.equal(getFreemapPixelRatio(8), 4);
  assert.equal(getFreemapPixelRatio(Number.NaN), 1);
  assert.equal(getFreemapRetinaSuffix(1), "");
  assert.equal(getFreemapRetinaSuffix(1.25), "@2x");
  assert.equal(getFreemapRetinaSuffix(2.5), "@3x");
  assert.equal(getFreemapRetinaSuffix(4), "@4x");
});

test("vytvorí retina URL a identifikátor rozšírenia", () => {
  const source = googleTileUrl(14, 9055, 5621);

  assert.equal(
    translateGarminGoogleTileUrl(source, 1.5),
    "https://outdoor.tiles.freemap.sk/14/9055/5621@2x?app=garmin-connect-ext"
  );
  assert.equal(
    translateGarminGoogleTileUrl(source, 2.5),
    "https://outdoor.tiles.freemap.sk/14/9055/5621@3x?app=garmin-connect-ext"
  );
  assert.equal(
    translateGarminGoogleTileUrl(source, 5),
    "https://outdoor.tiles.freemap.sk/14/9055/5621@4x?app=garmin-connect-ext"
  );
});

test("prečíta Freemap URL s retina príponou a query parametrom", () => {
  assert.deepEqual(parseFreemapTileUrl(
    "https://outdoor.tiles.freemap.sk/18/144803/89921@3x?app=garmin-connect-ext"
  ), {
    pixelRatio: 3,
    zoom: 18,
    x: 144803,
    y: 89921,
    tileSize: 256
  });
  assert.equal(parseFreemapTileUrl("https://outdoor.tiles.freemap.sk/18/144803/89921@5x"), null);
  assert.equal(parseFreemapTileUrl("https://outdoor.tiles.freemap.sk/19/289606/179842"), null);
  assert.equal(parseFreemapTileUrl("https://tiles.freemap.sk/18/144803/89921"), null);
});
