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
  const FREEMAP_APP_ID = "garmin-connect-ext";
  const FREEMAP_MIN_ZOOM = 5;
  const FREEMAP_MAX_ZOOM = 18;
  const FREEMAP_MAX_PIXEL_RATIO = 4;
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

  function getFreemapPixelRatio(devicePixelRatio = 1) {
    const ratio = Number(devicePixelRatio);

    if (!Number.isFinite(ratio) || ratio <= 1) {
      return 1;
    }

    return Math.min(FREEMAP_MAX_PIXEL_RATIO, Math.ceil(ratio));
  }

  function getFreemapRetinaSuffix(devicePixelRatio = 1) {
    const ratio = getFreemapPixelRatio(devicePixelRatio);
    return ratio === 1 ? "" : `@${ratio}x`;
  }

  function isSupportedFreemapZoom(zoom) {
    return zoom >= FREEMAP_MIN_ZOOM && zoom <= FREEMAP_MAX_ZOOM;
  }

  function buildFreemapTileUrl(tile, devicePixelRatio = 1) {
    if (
      !tile ||
      !isSupportedFreemapZoom(tile.zoom) ||
      !isValidTileCoordinate(tile.zoom, tile.x, tile.y)
    ) {
      return null;
    }

    const suffix = getFreemapRetinaSuffix(devicePixelRatio);
    return (
      `${FREEMAP_TILE_BASE_URL}/${tile.zoom}/${tile.x}/${tile.y}${suffix}` +
      `?app=${FREEMAP_APP_ID}`
    );
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

    const match = url.pathname.match(/^\/(\d+)\/(\d+)\/(\d+)(?:@([234])x)?\/?$/);

    if (!match) {
      return null;
    }

    const zoom = Number.parseInt(match[1], 10);
    const x = Number.parseInt(match[2], 10);
    const y = Number.parseInt(match[3], 10);
    const pixelRatio = match[4] ? Number.parseInt(match[4], 10) : 1;

    if (!isSupportedFreemapZoom(zoom) || !isValidTileCoordinate(zoom, x, y)) {
      return null;
    }

    return Object.freeze({ pixelRatio, zoom, x, y, tileSize: 256 });
  }

  function translateGarminGoogleTileUrl(rawUrl, devicePixelRatio = 1) {
    const tile = parseGarminGoogleTileUrl(rawUrl);
    return tile ? buildFreemapTileUrl(tile, devicePixelRatio) : null;
  }

  return Object.freeze({
    FREEMAP_APP_ID,
    FREEMAP_MAX_ZOOM,
    FREEMAP_MIN_ZOOM,
    FREEMAP_TILE_BASE_URL,
    buildFreemapTileUrl,
    getFreemapPixelRatio,
    getFreemapRetinaSuffix,
    parseGarminGoogleTileUrl,
    parseFreemapTileUrl,
    parseLegacyGarminTilePath,
    translateGarminGoogleTileUrl
  });
});
