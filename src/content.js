(function initializeGarminFreemap() {
  "use strict";

  const tileUrlApi = globalThis.GarminFreemapTileUrl;

  if (!tileUrlApi) {
    return;
  }

  const CONTROL_ATTRIBUTE = "data-garmin-freemap-control";
  const TILE_ATTRIBUTE = "data-garmin-freemap-tile";
  const FAILURE_LIMIT = 3;
  const FAILURE_WINDOW_MS = 10_000;
  const RECONCILE_INTERVAL_MS = 250;
  const originalTileAttributes = new WeakMap();
  const observedTileErrors = new WeakSet();
  const failedFreemapUrls = new Set();
  const noticeTimers = new WeakMap();
  let freemapEnabled = false;
  let recentFailures = [];
  let reconcileTimer = null;

  function getSourceAttribute(image) {
    return image.getAttribute("src") || "";
  }

  function createButton(mode, label) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "garmin-freemap-control__button";
    button.dataset.mode = mode;
    button.textContent = label;
    button.addEventListener("click", () => setFreemapEnabled(mode === "freemap"));
    return button;
  }

  function createAttribution() {
    const attribution = document.createElement("div");
    attribution.className = "garmin-freemap-attribution";
    attribution.hidden = true;

    const freemapLink = document.createElement("a");
    freemapLink.href = "https://www.freemap.sk/";
    freemapLink.target = "_blank";
    freemapLink.rel = "noopener noreferrer";
    freemapLink.textContent = "© Freemap Slovakia";

    const osmLink = document.createElement("a");
    osmLink.href = "https://www.openstreetmap.org/copyright";
    osmLink.target = "_blank";
    osmLink.rel = "noopener noreferrer";
    osmLink.textContent = "© OpenStreetMap contributors";

    attribution.append(freemapLink, document.createTextNode(" · "), osmLink);
    stopMapInteractionEvents(attribution);
    return attribution;
  }

  function stopMapInteractionEvents(element) {
    for (const eventName of [
      "pointerdown",
      "mousedown",
      "mouseup",
      "click",
      "dblclick",
      "wheel",
      "touchstart",
      "touchend",
      "contextmenu"
    ]) {
      element.addEventListener(eventName, (event) => event.stopPropagation());
    }
  }

  function addMapControls(mapContainer) {
    if (mapContainer.querySelector(`:scope > [${CONTROL_ATTRIBUTE}]`)) {
      return;
    }

    const control = document.createElement("div");
    control.className = "garmin-freemap-control";
    control.setAttribute(CONTROL_ATTRIBUTE, "");
    control.setAttribute("role", "group");
    control.setAttribute("aria-label", "Mapový podklad");
    control.append(createButton("garmin", "Garmin"), createButton("freemap", "Freemap"));

    const notice = document.createElement("div");
    notice.className = "garmin-freemap-notice";
    notice.setAttribute("aria-live", "polite");
    notice.hidden = true;

    const attribution = createAttribution();

    stopMapInteractionEvents(control);

    mapContainer.append(control, notice, attribution);
    updateControls();
  }

  function attachControlsForTile(image) {
    const mapContainer = image.closest(".leaflet-container");

    if (mapContainer) {
      addMapControls(mapContainer);
    }
  }

  function updateControls() {
    for (const control of document.querySelectorAll(`[${CONTROL_ATTRIBUTE}]`)) {
      for (const button of control.querySelectorAll("button[data-mode]")) {
        const active = (button.dataset.mode === "freemap") === freemapEnabled;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-pressed", String(active));
      }
    }

    for (const attribution of document.querySelectorAll(".garmin-freemap-attribution")) {
      attribution.hidden = !freemapEnabled;
    }
  }

  function showNotice(message) {
    for (const notice of document.querySelectorAll(".garmin-freemap-notice")) {
      const oldTimer = noticeTimers.get(notice);
      if (oldTimer) {
        clearTimeout(oldTimer);
      }

      notice.textContent = message;
      notice.hidden = false;
      noticeTimers.set(
        notice,
        setTimeout(() => {
          notice.hidden = true;
          notice.textContent = "";
          noticeTimers.delete(notice);
        }, 6_000)
      );
    }
  }

  function rememberOriginalTile(image, originalSource) {
    const existing = originalTileAttributes.get(image);

    if (existing) {
      existing.src = originalSource;
      return existing;
    }

    const attributes = {
      referrerPolicy: image.getAttribute("referrerpolicy"),
      src: originalSource,
      srcset: image.getAttribute("srcset")
    };
    originalTileAttributes.set(image, attributes);
    return attributes;
  }

  function restoreOptionalAttribute(element, name, value) {
    if (value === null) {
      element.removeAttribute(name);
    } else {
      element.setAttribute(name, value);
    }
  }

  function restoreTile(image) {
    const original = originalTileAttributes.get(image);

    if (!original) {
      return;
    }

    restoreOptionalAttribute(image, "srcset", original.srcset);
    restoreOptionalAttribute(image, "referrerpolicy", original.referrerPolicy);
    image.removeAttribute(TILE_ATTRIBUTE);
    originalTileAttributes.delete(image);
    image.setAttribute("src", original.src);
  }

  function restoreAllTiles() {
    for (const image of document.querySelectorAll(`img[${TILE_ATTRIBUTE}]`)) {
      restoreTile(image);
    }
  }

  function recordFreemapFailure() {
    const now = Date.now();
    recentFailures = recentFailures.filter((timestamp) => now - timestamp <= FAILURE_WINDOW_MS);
    recentFailures.push(now);

    if (recentFailures.length >= FAILURE_LIMIT) {
      setFreemapEnabled(false, "Freemap sa nepodarilo načítať. Obnovená bola Garmin mapa.");
    }
  }

  function handleTileError(event) {
    const image = event.currentTarget;
    const failedUrl = getSourceAttribute(image);

    if (!freemapEnabled || !failedUrl.startsWith(`${tileUrlApi.FREEMAP_TILE_BASE_URL}/`)) {
      return;
    }

    failedFreemapUrls.add(failedUrl);
    restoreTile(image);
    recordFreemapFailure();
  }

  function replaceTileIfNeeded(image) {
    const originalSource = getSourceAttribute(image);
    const freemapUrl = tileUrlApi.translateGarminGoogleTileUrl(originalSource);

    if (!freemapUrl) {
      return;
    }

    attachControlsForTile(image);

    if (!freemapEnabled || failedFreemapUrls.has(freemapUrl)) {
      return;
    }

    rememberOriginalTile(image, originalSource);

    if (!observedTileErrors.has(image)) {
      image.addEventListener("error", handleTileError);
      observedTileErrors.add(image);
    }

    image.setAttribute(TILE_ATTRIBUTE, "");
    image.removeAttribute("srcset");
    image.setAttribute("referrerpolicy", "no-referrer");
    image.setAttribute("src", freemapUrl);
  }

  function inspectNode(node) {
    if (!(node instanceof Element)) {
      return;
    }

    if (node instanceof HTMLImageElement) {
      replaceTileIfNeeded(node);
    }

    for (const image of node.querySelectorAll("img[src]")) {
      replaceTileIfNeeded(image);
    }
  }

  function reconcileFreemapTiles() {
    if (!freemapEnabled) {
      return;
    }

    for (const image of document.querySelectorAll(".leaflet-container img[src]")) {
      replaceTileIfNeeded(image);
    }
  }

  function startReconciliation() {
    if (reconcileTimer !== null) {
      return;
    }

    reconcileTimer = window.setTimeout(() => {
      reconcileTimer = null;
      reconcileFreemapTiles();
      startReconciliation();
    }, RECONCILE_INTERVAL_MS);
  }

  function stopReconciliation() {
    if (reconcileTimer === null) {
      return;
    }

    clearTimeout(reconcileTimer);
    reconcileTimer = null;
  }

  function setFreemapEnabled(nextEnabled, noticeMessage = "") {
    freemapEnabled = Boolean(nextEnabled);
    recentFailures = [];

    if (freemapEnabled) {
      failedFreemapUrls.clear();
      inspectNode(document.documentElement);
      startReconciliation();
    } else {
      stopReconciliation();
      restoreAllTiles();
    }

    updateControls();

    if (noticeMessage) {
      showNotice(noticeMessage);
    }
  }

  const observer = new MutationObserver((records) => {
    for (const record of records) {
      if (record.type === "attributes") {
        replaceTileIfNeeded(record.target);
        continue;
      }

      for (const addedNode of record.addedNodes) {
        inspectNode(addedNode);
      }
    }
  });

  observer.observe(document.documentElement, {
    attributeFilter: ["src"],
    attributes: true,
    childList: true,
    subtree: true
  });

  inspectNode(document.documentElement);
})();
