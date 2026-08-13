(function initializeGarminFreemapUi() {
  "use strict";

  const tileUrlApi = globalThis.GarminFreemapTileUrl;

  if (!tileUrlApi) {
    return;
  }

  const CONTROL_ATTRIBUTE = "data-garmin-freemap-control";
  const ENABLE_EVENT = "garmin-freemap-extension:enable";
  const DISABLE_EVENT = "garmin-freemap-extension:disable";
  const FAILURE_EVENT = "garmin-freemap-extension:failure";
  const noticeTimers = new WeakMap();
  const guardedMaps = new WeakSet();
  const originalZoomControlAria = new WeakMap();
  const touchDistances = new WeakMap();
  let freemapEnabled = false;
  let pendingFreemapSwitch = null;
  let zoomRefreshFrame = null;

  function getSourceAttribute(image) {
    return image.getAttribute("src") || "";
  }

  function isRecognizedBaseTile(image) {
    const source = getSourceAttribute(image);
    return (
      source.startsWith(`${tileUrlApi.FREEMAP_TILE_BASE_URL}/`) ||
      tileUrlApi.translateGarminGoogleTileUrl(source) !== null
    );
  }

  function parseTileSource(source) {
    return (
      tileUrlApi.parseFreemapTileUrl(source) ||
      tileUrlApi.parseGarminGoogleTileUrl(source)
    );
  }

  function getMapZoom(mapContainer) {
    const zoomCounts = new Map();

    for (const image of mapContainer.querySelectorAll("img[src]")) {
      if (!image.classList.contains("leaflet-tile") && !image.closest(".leaflet-tile")) {
        continue;
      }

      const tile = parseTileSource(getSourceAttribute(image));

      if (tile) {
        zoomCounts.set(tile.zoom, (zoomCounts.get(tile.zoom) || 0) + 1);
      }
    }

    let currentZoom = null;
    let largestCount = 0;

    for (const [zoom, count] of zoomCounts) {
      if (count >= largestCount) {
        currentZoom = zoom;
        largestCount = count;
      }
    }

    return currentZoom;
  }

  function getZoomLimitMessage(direction) {
    return direction > 0
      ? `Freemap: maximálny zoom je ${tileUrlApi.FREEMAP_MAX_ZOOM}.`
      : `Freemap: minimálny zoom je ${tileUrlApi.FREEMAP_MIN_ZOOM}.`;
  }

  function isZoomBlocked(mapContainer, direction) {
    if (!freemapEnabled || direction === 0) {
      return false;
    }

    const zoom = getMapZoom(mapContainer);
    return (
      (direction > 0 && zoom !== null && zoom >= tileUrlApi.FREEMAP_MAX_ZOOM) ||
      (direction < 0 && zoom !== null && zoom <= tileUrlApi.FREEMAP_MIN_ZOOM)
    );
  }

  function blockZoomEvent(event, mapContainer, direction) {
    if (!isZoomBlocked(mapContainer, direction)) {
      return false;
    }

    event.preventDefault();
    event.stopImmediatePropagation();
    showNotice(getZoomLimitMessage(direction));
    updateMapZoomLimits(mapContainer);
    return true;
  }

  function setZoomControlLimited(control, limited) {
    if (!control) {
      return;
    }

    if (limited) {
      if (!originalZoomControlAria.has(control)) {
        originalZoomControlAria.set(control, control.getAttribute("aria-disabled"));
      }

      control.classList.add("garmin-freemap-zoom-limit");
      control.setAttribute("aria-disabled", "true");
      return;
    }

    control.classList.remove("garmin-freemap-zoom-limit");

    if (originalZoomControlAria.has(control)) {
      const originalValue = originalZoomControlAria.get(control);

      if (originalValue === null) {
        control.removeAttribute("aria-disabled");
      } else {
        control.setAttribute("aria-disabled", originalValue);
      }

      originalZoomControlAria.delete(control);
    }
  }

  function updateMapZoomLimits(mapContainer) {
    const zoom = getMapZoom(mapContainer);
    const atMaximum = (
      freemapEnabled && zoom !== null && zoom >= tileUrlApi.FREEMAP_MAX_ZOOM
    );
    const atMinimum = (
      freemapEnabled && zoom !== null && zoom <= tileUrlApi.FREEMAP_MIN_ZOOM
    );

    setZoomControlLimited(
      mapContainer.querySelector(".leaflet-control-zoom-in"),
      atMaximum
    );
    setZoomControlLimited(
      mapContainer.querySelector(".leaflet-control-zoom-out"),
      atMinimum
    );
  }

  function scheduleZoomLimitRefresh() {
    if (zoomRefreshFrame !== null) {
      return;
    }

    zoomRefreshFrame = requestAnimationFrame(() => {
      zoomRefreshFrame = null;

      for (const mapContainer of document.querySelectorAll(".leaflet-container")) {
        updateMapZoomLimits(mapContainer);
      }
    });
  }

  function getTouchDistance(event) {
    if (event.touches.length !== 2) {
      return null;
    }

    const [first, second] = event.touches;
    return Math.hypot(first.clientX - second.clientX, first.clientY - second.clientY);
  }

  function attachZoomBoundaryGuards(mapContainer) {
    if (guardedMaps.has(mapContainer)) {
      return;
    }

    guardedMaps.add(mapContainer);

    mapContainer.addEventListener("click", (event) => {
      if (!(event.target instanceof Element)) {
        return;
      }

      if (event.target.closest(".leaflet-control-zoom-in")) {
        blockZoomEvent(event, mapContainer, 1);
      } else if (event.target.closest(".leaflet-control-zoom-out")) {
        blockZoomEvent(event, mapContainer, -1);
      }
    }, true);

    mapContainer.addEventListener("wheel", (event) => {
      blockZoomEvent(event, mapContainer, Math.sign(-event.deltaY));
    }, { capture: true, passive: false });

    mapContainer.addEventListener("dblclick", (event) => {
      blockZoomEvent(event, mapContainer, event.shiftKey ? -1 : 1);
    }, true);

    mapContainer.addEventListener("keydown", (event) => {
      if (["+", "="].includes(event.key)) {
        blockZoomEvent(event, mapContainer, 1);
      } else if (["-", "_"].includes(event.key)) {
        blockZoomEvent(event, mapContainer, -1);
      }
    }, true);

    mapContainer.addEventListener("touchstart", (event) => {
      const distance = getTouchDistance(event);

      if (distance !== null) {
        touchDistances.set(mapContainer, distance);
      }
    }, { capture: true, passive: true });

    mapContainer.addEventListener("touchmove", (event) => {
      const distance = getTouchDistance(event);
      const previousDistance = touchDistances.get(mapContainer);

      if (distance === null || previousDistance === undefined) {
        return;
      }

      touchDistances.set(mapContainer, distance);
      blockZoomEvent(event, mapContainer, Math.sign(distance - previousDistance));
    }, { capture: true, passive: false });

    const clearTouchDistance = () => touchDistances.delete(mapContainer);
    mapContainer.addEventListener("touchend", clearTouchDistance, true);
    mapContainer.addEventListener("touchcancel", clearTouchDistance, true);
  }

  function cancelPendingFreemapSwitch() {
    if (!pendingFreemapSwitch) {
      return;
    }

    clearTimeout(pendingFreemapSwitch.timeoutId);
    pendingFreemapSwitch = null;
  }

  function failPendingFreemapSwitch() {
    cancelPendingFreemapSwitch();
    showNotice("Zoom sa nepodarilo nastaviť. Zostáva zapnutá Garmin mapa.");
    updateControls();
  }

  function advancePendingFreemapSwitch() {
    const pending = pendingFreemapSwitch;

    if (!pending || !pending.mapContainer.isConnected) {
      cancelPendingFreemapSwitch();
      return;
    }

    const zoom = getMapZoom(pending.mapContainer);

    if (zoom === null) {
      return;
    }

    if (zoom >= tileUrlApi.FREEMAP_MIN_ZOOM && zoom <= tileUrlApi.FREEMAP_MAX_ZOOM) {
      const targetZoom = pending.targetZoom;
      cancelPendingFreemapSwitch();
      setFreemapEnabled(
        true,
        `Freemap: zoom bol upravený na ${targetZoom}.`,
        true,
        pending.mapContainer
      );
      return;
    }

    if (pending.lastClickedZoom === zoom) {
      return;
    }

    const direction = zoom < tileUrlApi.FREEMAP_MIN_ZOOM ? 1 : -1;
    const selector = direction > 0
      ? ".leaflet-control-zoom-in"
      : ".leaflet-control-zoom-out";
    const zoomControl = pending.mapContainer.querySelector(selector);

    if (
      !zoomControl ||
      zoomControl.classList.contains("leaflet-disabled") ||
      zoomControl.getAttribute("aria-disabled") === "true"
    ) {
      failPendingFreemapSwitch();
      return;
    }

    pending.lastClickedZoom = zoom;
    zoomControl.click();

    // Niektoré Leaflet verzie zmenia dlaždice priamo počas click handlera.
    // Asynchrónne verzie pokračujú cez MutationObserver nižšie.
    advancePendingFreemapSwitch();
  }

  function beginFreemapSwitchAtSupportedZoom(mapContainer, currentZoom) {
    cancelPendingFreemapSwitch();

    const targetZoom = Math.min(
      tileUrlApi.FREEMAP_MAX_ZOOM,
      Math.max(tileUrlApi.FREEMAP_MIN_ZOOM, currentZoom)
    );
    const pending = {
      lastClickedZoom: null,
      mapContainer,
      targetZoom,
      timeoutId: null
    };

    pending.timeoutId = setTimeout(() => {
      if (pendingFreemapSwitch === pending) {
        failPendingFreemapSwitch();
      }
    }, 5_000);
    pendingFreemapSwitch = pending;

    showNotice(`Upravujem Garmin zoom na ${targetZoom} pre Freemap…`);
    advancePendingFreemapSwitch();
  }

  function setFreemapEnabled(
    nextEnabled,
    noticeMessage = "",
    notifyPage = true,
    requestedMap = null
  ) {
    if (!nextEnabled) {
      cancelPendingFreemapSwitch();
    }

    if (nextEnabled && requestedMap) {
      const zoom = getMapZoom(requestedMap);

      if (
        zoom !== null &&
        (zoom < tileUrlApi.FREEMAP_MIN_ZOOM || zoom > tileUrlApi.FREEMAP_MAX_ZOOM)
      ) {
        beginFreemapSwitchAtSupportedZoom(requestedMap, zoom);
        return;
      }
    }

    freemapEnabled = Boolean(nextEnabled);

    if (notifyPage) {
      document.dispatchEvent(new Event(freemapEnabled ? ENABLE_EVENT : DISABLE_EVENT));
    }

    updateControls();

    if (noticeMessage) {
      showNotice(noticeMessage);
    }
  }

  function createButton(mode, label, mapContainer) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "garmin-freemap-control__button";
    button.dataset.mode = mode;
    button.textContent = label;
    button.addEventListener("click", () => {
      setFreemapEnabled(mode === "freemap", "", true, mapContainer);
    });
    return button;
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

  function addMapControls(mapContainer) {
    if (mapContainer.querySelector(`:scope > [${CONTROL_ATTRIBUTE}]`)) {
      return;
    }

    const control = document.createElement("div");
    control.className = "garmin-freemap-control";
    control.setAttribute(CONTROL_ATTRIBUTE, "");
    control.setAttribute("role", "group");
    control.setAttribute("aria-label", "Mapový podklad");
    control.append(
      createButton("garmin", "Garmin", mapContainer),
      createButton("freemap", "Freemap", mapContainer)
    );

    const notice = document.createElement("div");
    notice.className = "garmin-freemap-notice";
    notice.setAttribute("aria-live", "polite");
    notice.hidden = true;

    stopMapInteractionEvents(control);
    mapContainer.append(control, notice, createAttribution());
    attachZoomBoundaryGuards(mapContainer);
    updateControls();
  }

  function attachControlsForTile(image) {
    if (!isRecognizedBaseTile(image)) {
      return;
    }

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

    for (const mapContainer of document.querySelectorAll(".leaflet-container")) {
      updateMapZoomLimits(mapContainer);
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

  function inspectNode(node) {
    if (!(node instanceof Element)) {
      return;
    }

    if (node instanceof HTMLImageElement) {
      attachControlsForTile(node);
    }

    for (const image of node.querySelectorAll("img[src]")) {
      attachControlsForTile(image);
    }
  }

  const observer = new MutationObserver((records) => {
    for (const record of records) {
      if (record.type === "attributes") {
        attachControlsForTile(record.target);
        continue;
      }

      for (const addedNode of record.addedNodes) {
        inspectNode(addedNode);
      }
    }

    scheduleZoomLimitRefresh();
    advancePendingFreemapSwitch();
  });

  document.addEventListener(FAILURE_EVENT, () => {
    setFreemapEnabled(
      false,
      "Freemap sa nepodarilo načítať. Obnovená bola Garmin mapa.",
      false
    );
  });

  observer.observe(document.documentElement, {
    attributeFilter: ["src"],
    attributes: true,
    childList: true,
    subtree: true
  });

  inspectNode(document.documentElement);
})();
