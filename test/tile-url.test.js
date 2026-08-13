"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  buildFreemapTileUrl,
  FREEMAP_MAX_ZOOM,
  FREEMAP_MIN_ZOOM,
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
    "https://outdoor.tiles.freemap.sk/12/2264/1404"
  );
});

test("prevedie pozorovanú dlaždicu z vyššieho zoomu", () => {
  assert.equal(
    translateGarminGoogleTileUrl(googleTileUrl(14, 9055, 5621)),
    "https://outdoor.tiles.freemap.sk/14/9055/5621"
  );
});

test("spracuje URL zakódovanú cez URLSearchParams", () => {
  const url = new URL("https://maps.googleapis.com/maps/vt");
  url.searchParams.set("key", "test-only");
  url.searchParams.set("pb", "!1m5!1m4!1i11!2i484!3i783!4i256!2m3!1e0");

  assert.equal(
    translateGarminGoogleTileUrl(url.href),
    "https://outdoor.tiles.freemap.sk/11/484/783"
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
  assert.equal(buildFreemapTileUrl(tile), "https://outdoor.tiles.freemap.sk/11/484/783");
});

test("historický parser odmietne neplatnú alebo neúplnú cestu", () => {
  assert.equal(parseLegacyGarminTilePath("L11/RXYZ/C000001E4.png"), null);
  assert.equal(parseLegacyGarminTilePath("L11/R0000030F.png"), null);
});

test("deklaruje serverom overený Freemap rozsah zoomu", () => {
  assert.equal(FREEMAP_MIN_ZOOM, 2);
  assert.equal(FREEMAP_MAX_ZOOM, 20);
});

test("prečíta Freemap URL bez prípony", () => {
  assert.deepEqual(parseFreemapTileUrl("https://outdoor.tiles.freemap.sk/20/579212/359684"), {
    zoom: 20,
    x: 579212,
    y: 359684,
    tileSize: 256
  });
  assert.equal(parseFreemapTileUrl("https://example.invalid/20/579212/359684"), null);
});
