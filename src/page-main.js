(function initializeGarminFreemapPageBridge() {
  "use strict";

  const tileUrlApi = globalThis.GarminFreemapTileUrl;

  if (!tileUrlApi) {
    return;
  }

  const ENABLE_EVENT = "garmin-freemap-extension:enable";
  const DISABLE_EVENT = "garmin-freemap-extension:disable";
  const FAILURE_EVENT = "garmin-freemap-extension:failure";
  const ORIGINAL_SOURCE_ATTRIBUTE = "data-garmin-freemap-original-src";
  const TILE_ATTRIBUTE = "data-garmin-freemap-tile";
  const RESTORE_SWEEP_DELAYS_MS = [0, 50, 150, 350, 750, 1_500];
  const imageSourceDescriptor = Object.getOwnPropertyDescriptor(
    HTMLImageElement.prototype,
    "src"
  );
  const nativeSetAttribute = Element.prototype.setAttribute;
  const nativeGetAttribute = Element.prototype.getAttribute;
  const nativeRemoveAttribute = Element.prototype.removeAttribute;
  const originalTileAttributes = new WeakMap();
  const observedTileErrors = new WeakSet();
  let freemapEnabled = false;
  let patchInstalled = false;
  let restoreSweepTimers = [];

  function getAttribute(element, name) {
    return nativeGetAttribute.call(element, name);
  }

  function setAttribute(element, name, value) {
    nativeSetAttribute.call(element, name, value);
  }

  function removeAttribute(element, name) {
    nativeRemoveAttribute.call(element, name);
  }

  function rememberOriginalTile(image, originalSource) {
    const existing = originalTileAttributes.get(image);
    setAttribute(image, ORIGINAL_SOURCE_ATTRIBUTE, originalSource);

    if (existing) {
      existing.src = originalSource;
      return;
    }

    originalTileAttributes.set(image, {
      referrerPolicy: getAttribute(image, "referrerpolicy"),
      src: originalSource,
      srcset: getAttribute(image, "srcset")
    });
  }

  function restoreOptionalAttribute(image, name, value) {
    if (value === null) {
      removeAttribute(image, name);
    } else {
      setAttribute(image, name, value);
    }
  }

  function restoreTile(image) {
    const original = originalTileAttributes.get(image);
    const originalSource = original?.src || getAttribute(image, ORIGINAL_SOURCE_ATTRIBUTE);

    if (!originalSource) {
      return false;
    }

    if (original) {
      restoreOptionalAttribute(image, "srcset", original.srcset);
      restoreOptionalAttribute(image, "referrerpolicy", original.referrerPolicy);
    } else {
      removeAttribute(image, "srcset");
      removeAttribute(image, "referrerpolicy");
    }

    removeAttribute(image, TILE_ATTRIBUTE);
    removeAttribute(image, ORIGINAL_SOURCE_ATTRIBUTE);
    originalTileAttributes.delete(image);
    imageSourceDescriptor.set.call(image, originalSource);
    return true;
  }

  function restoreAllTiles() {
    if (!document.documentElement) {
      return;
    }

    const selector = [
      `img[${TILE_ATTRIBUTE}]`,
      `img[src^="${tileUrlApi.FREEMAP_TILE_BASE_URL}/"]`
    ].join(", ");

    for (const image of document.querySelectorAll(selector)) {
      restoreTile(image);
    }
  }

  function cancelRestoreSweeps() {
    for (const timer of restoreSweepTimers) {
      clearTimeout(timer);
    }

    restoreSweepTimers = [];
  }

  function scheduleRestoreSweeps() {
    cancelRestoreSweeps();
    restoreSweepTimers = RESTORE_SWEEP_DELAYS_MS.map((delay) =>
      window.setTimeout(() => {
        if (!freemapEnabled) {
          restoreAllTiles();
        }
      }, delay)
    );
  }

  function reportFailure() {
    setFreemapEnabled(false);
    document.dispatchEvent(new Event(FAILURE_EVENT));
  }

  function handleTileError(event) {
    const image = event.currentTarget;
    const failedSource = getAttribute(image, "src") || "";

    if (
      freemapEnabled &&
      failedSource.startsWith(`${tileUrlApi.FREEMAP_TILE_BASE_URL}/`)
    ) {
      reportFailure();
    }
  }

  function observeTileErrors(image) {
    if (observedTileErrors.has(image)) {
      return;
    }

    image.addEventListener("error", handleTileError);
    observedTileErrors.add(image);
  }

  function applyFreemapSource(image, originalSource, freemapSource) {
    rememberOriginalTile(image, originalSource);
    observeTileErrors(image);
    removeAttribute(image, "srcset");
    setAttribute(image, "referrerpolicy", "no-referrer");
    setAttribute(image, TILE_ATTRIBUTE, "");
    imageSourceDescriptor.set.call(image, freemapSource);
  }

  function interceptSource(image, rawSource) {
    if (!freemapEnabled) {
      return false;
    }

    const originalSource = String(rawSource);
    const freemapSource = tileUrlApi.translateGarminGoogleTileUrl(originalSource);

    if (!freemapSource) {
      return false;
    }

    applyFreemapSource(image, originalSource, freemapSource);
    return true;
  }

  function replaceExistingTiles() {
    if (!document.documentElement) {
      return;
    }

    for (const image of document.querySelectorAll("img[src]")) {
      const source = getAttribute(image, "src") || "";
      const freemapSource = tileUrlApi.translateGarminGoogleTileUrl(source);

      if (freemapSource) {
        applyFreemapSource(image, source, freemapSource);
      }
    }
  }

  function setFreemapEnabled(nextEnabled) {
    freemapEnabled = Boolean(nextEnabled);

    if (freemapEnabled) {
      cancelRestoreSweeps();
      replaceExistingTiles();
    } else {
      restoreAllTiles();
      scheduleRestoreSweeps();
    }
  }

  function installSynchronousSourcePatch() {
    if (!imageSourceDescriptor?.get || !imageSourceDescriptor?.set) {
      return false;
    }

    Object.defineProperty(HTMLImageElement.prototype, "src", {
      configurable: imageSourceDescriptor.configurable,
      enumerable: imageSourceDescriptor.enumerable,
      get: imageSourceDescriptor.get,
      set(value) {
        if (!interceptSource(this, value)) {
          imageSourceDescriptor.set.call(this, value);
        }
      }
    });

    Object.defineProperty(HTMLImageElement.prototype, "setAttribute", {
      configurable: true,
      enumerable: false,
      writable: true,
      value(name, value) {
        if (
          String(name).toLowerCase() === "src" &&
          interceptSource(this, value)
        ) {
          return;
        }

        nativeSetAttribute.call(this, name, value);
      }
    });

    return true;
  }

  try {
    patchInstalled = installSynchronousSourcePatch();
  } catch {
    patchInstalled = false;
  }

  document.addEventListener(ENABLE_EVENT, () => {
    if (!patchInstalled) {
      reportFailure();
      return;
    }

    setFreemapEnabled(true);
  });

  document.addEventListener(DISABLE_EVENT, () => setFreemapEnabled(false));
})();
