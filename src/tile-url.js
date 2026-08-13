(function initializeTileUrlApi(root, factory) {
  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
    return;
  }

  Object.defineProperty(root, "GarminFreemapTileUrl", {
    configurable: false,
    enumerable: false,
    value: api,
    writable: false
  });
})(typeof globalThis !== "undefined" ? globalThis : this, function createTileUrlApi() {
  "use strict";

  const FREEMAP_TILE_BASE_URL = "https://outdoor.tiles.freemap.sk";
  const FREEMAP_MIN_ZOOM = 2;
  const FREEMAP_MAX_ZOOM = 20;
  const GOOGLE_TILE_HOST = "maps.googleapis.com";
  const GOOGLE_TILE_PATH = "/maps/vt";
  const GOOGLE_PB_TILE_PATTERN = /!1m5!1m4!1i(\d+)!2i(\d+)!3i(\d+)!4i(\d+)(?=!|$)/;
  const LEGACY_TILE_PATTERN = /(?:^|\/)L(\d+)\/R([0-9a-f]+)\/C([0-9a-f]+)\.(?:png|jpe?g|webp)(?:$|[?#])/i;

  function isValidTileCoordinate(zoom, x, y) {
    if (![zoom, x, y].every(Number.isSafeInteger)) {
      return false;
    }

    if (zoom < 0 || zoom > 30) {
      return false;
    }

    const tilesPerAxis = 2 ** zoom;
    return x >= 0 && y >= 0 && x < tilesPerAxis && y < tilesPerAxis;
  }

  function parseGarminGoogleTileUrl(rawUrl) {
    let url;

    try {
      url = new URL(String(rawUrl));
    } catch {
      return null;
    }

    if (
      url.protocol !== "https:" ||
      url.hostname !== GOOGLE_TILE_HOST ||
      url.pathname !== GOOGLE_TILE_PATH
    ) {
      return null;
    }

    const packedParameters = url.searchParams.get("pb");
    const match = packedParameters && packedParameters.match(GOOGLE_PB_TILE_PATTERN);

    if (!match) {
      return null;
    }

    const zoom = Number.parseInt(match[1], 10);
    const x = Number.parseInt(match[2], 10);
    const y = Number.parseInt(match[3], 10);
    const tileSize = Number.parseInt(match[4], 10);

    if (tileSize !== 256 || !isValidTileCoordinate(zoom, x, y)) {
      return null;
    }

    return Object.freeze({ zoom, x, y, tileSize });
  }

  function parseLegacyGarminTilePath(rawPath) {
    const match = String(rawPath).match(LEGACY_TILE_PATTERN);

    if (!match) {
      return null;
    }

    const zoom = Number.parseInt(match[1], 10);
    const y = Number.parseInt(match[2], 16);
    const x = Number.parseInt(match[3], 16);

    if (!isValidTileCoordinate(zoom, x, y)) {
      return null;
    }

    return Object.freeze({ zoom, x, y, tileSize: 256 });
  }

  function buildFreemapTileUrl(tile) {
    if (!tile || !isValidTileCoordinate(tile.zoom, tile.x, tile.y)) {
      return null;
    }

    return `${FREEMAP_TILE_BASE_URL}/${tile.zoom}/${tile.x}/${tile.y}`;
  }

  function parseFreemapTileUrl(rawUrl) {
    let url;

    try {
      url = new URL(String(rawUrl));
    } catch {
      return null;
    }

    if (url.protocol !== "https:" || url.hostname !== "outdoor.tiles.freemap.sk") {
      return null;
    }

    const match = url.pathname.match(/^\/(\d+)\/(\d+)\/(\d+)\/?$/);

    if (!match) {
      return null;
    }

    const zoom = Number.parseInt(match[1], 10);
    const x = Number.parseInt(match[2], 10);
    const y = Number.parseInt(match[3], 10);

    if (!isValidTileCoordinate(zoom, x, y)) {
      return null;
    }

    return Object.freeze({ zoom, x, y, tileSize: 256 });
  }

  function translateGarminGoogleTileUrl(rawUrl) {
    const tile = parseGarminGoogleTileUrl(rawUrl);
    return tile ? buildFreemapTileUrl(tile) : null;
  }

  return Object.freeze({
    FREEMAP_MAX_ZOOM,
    FREEMAP_MIN_ZOOM,
    FREEMAP_TILE_BASE_URL,
    buildFreemapTileUrl,
    parseGarminGoogleTileUrl,
    parseFreemapTileUrl,
    parseLegacyGarminTilePath,
    translateGarminGoogleTileUrl
  });
});
