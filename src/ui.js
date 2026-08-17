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
  const PREFERENCE_STORAGE_KEY = "preferredMapMode";
  const OBSOLETE_DISCLOSURE_STORAGE_KEY = "freemapDisclosureAccepted";
  const EXPECTED_ZOOM_TIMEOUT_MS = 5_000;
  const AUTOMATIC_ZOOM_POLL_MS = 100;
  const AUTOMATIC_ZOOM_RETRY_MS = 750;
  const AUTOMATIC_ZOOM_TIMEOUT_MS = 8_000;
  const noticeTimers = new WeakMap();
  const guardedMaps = new WeakSet();
  const originalZoomControlAria = new WeakMap();
  const touchDistances = new WeakMap();
  const expectedZoomStates = new WeakMap();
  let freemapEnabled = false;
  let pendingFreemapSwitch = null;
  let preferredMapMode = "garmin";
  let preferenceApplied = false;
  let preferenceLoaded = false;
  let zoomRefreshFrame = null;

  function getSourceAttribute(image) {
    return image.getAttribute("src") || "";
  }

  function isRecognizedBaseTile(image) {
    const source = getSourceAttribute(image);
    return (
      tileUrlApi.parseFreemapTileUrl(source) !== null ||
      tileUrlApi.parseGarminGoogleTileUrl(source) !== null
    );
  }

  function getPreferenceStorage() {
    return globalThis.chrome?.storage?.local || null;
  }

  function writeStoredValues(values) {
    const storage = getPreferenceStorage();

    if (!storage?.set) {
      return;
    }

    try {
      storage.set(values, () => {
        void globalThis.chrome?.runtime?.lastError;
      });
    } catch {
      // Neúspech uloženia nesmie ovplyvniť fungovanie mapy.
    }
  }

  function rememberPreference(mode) {
    preferredMapMode = mode;
    preferenceApplied = true;
    writeStoredValues({ [PREFERENCE_STORAGE_KEY]: mode });
  }

  function removeObsoleteDisclosureValue(storage, items) {
    if (
      items?.[OBSOLETE_DISCLOSURE_STORAGE_KEY] === null ||
      items?.[OBSOLETE_DISCLOSURE_STORAGE_KEY] === undefined ||
      !storage?.remove
    ) {
      return;
    }

    try {
      storage.remove(OBSOLETE_DISCLOSURE_STORAGE_KEY, () => {
        void globalThis.chrome?.runtime?.lastError;
      });
    } catch {
      // Migrácia starej hodnoty nesmie ovplyvniť fungovanie mapy.
    }
  }

  function applyStoredPreference(mapContainer) {
    if (!preferenceLoaded || preferenceApplied) {
      return;
    }

    preferenceApplied = true;

    if (preferredMapMode === "freemap") {
      setFreemapEnabled(true, "", true, mapContainer);
    }
  }

  function loadStoredPreference() {
    const storage = getPreferenceStorage();

    if (!storage?.get) {
      preferenceLoaded = true;
      return;
    }

    try {
      storage.get({
        [OBSOLETE_DISCLOSURE_STORAGE_KEY]: null,
        [PREFERENCE_STORAGE_KEY]: "garmin"
      }, (items) => {
        void globalThis.chrome?.runtime?.lastError;
        removeObsoleteDisclosureValue(storage, items);
        preferredMapMode = items?.[PREFERENCE_STORAGE_KEY] === "freemap"
          ? "freemap"
          : "garmin";
        preferenceLoaded = true;

        const control = document.querySelector(`[${CONTROL_ATTRIBUTE}]`);
        const mapContainer = control?.closest(".leaflet-container");

        if (mapContainer) {
          applyStoredPreference(mapContainer);
        }
      });
    } catch {
      preferenceLoaded = true;
    }
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

  function getExpectedZoomState(mapContainer) {
    const observedZoom = getMapZoom(mapContainer);
    const currentState = expectedZoomStates.get(mapContainer);
    const currentTime = Date.now();

    if (observedZoom === null) {
      if (
        currentState &&
        currentTime - currentState.updatedAt <= EXPECTED_ZOOM_TIMEOUT_MS
      ) {
        return currentState;
      }

      expectedZoomStates.delete(mapContainer);
      return null;
    }

    if (
      !currentState ||
      currentState.observedZoom !== observedZoom ||
      currentTime - currentState.updatedAt > EXPECTED_ZOOM_TIMEOUT_MS
    ) {
      const nextState = {
        expectedZoom: observedZoom,
        observedZoom,
        updatedAt: currentTime
      };
      expectedZoomStates.set(mapContainer, nextState);
      return nextState;
    }

    return currentState;
  }

  function getEffectiveMapZoom(mapContainer) {
    return getExpectedZoomState(mapContainer)?.expectedZoom ?? null;
  }

  function recordAllowedZoom(mapContainer, direction) {
    const state = getExpectedZoomState(mapContainer);

    if (!state) {
      return;
    }

    state.expectedZoom += direction;
    state.updatedAt = Date.now();
    updateMapZoomLimits(mapContainer);
  }

  function resetExpectedZoomStates() {
    for (const mapContainer of document.querySelectorAll(".leaflet-container")) {
      expectedZoomStates.delete(mapContainer);
    }
  }

  function isZoomBlocked(mapContainer, direction) {
    if (!freemapEnabled || direction === 0) {
      return false;
    }

    const zoom = getEffectiveMapZoom(mapContainer);
    return (
      (direction > 0 && zoom !== null && zoom >= tileUrlApi.FREEMAP_MAX_ZOOM) ||
      (direction < 0 && zoom !== null && zoom <= tileUrlApi.FREEMAP_MIN_ZOOM)
    );
  }

  function blockZoomEvent(event, mapContainer, direction) {
    if (!isZoomBlocked(mapContainer, direction)) {
      if (freemapEnabled && direction !== 0) {
        recordAllowedZoom(mapContainer, direction);
      }

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
    const zoom = freemapEnabled
      ? getEffectiveMapZoom(mapContainer)
      : getMapZoom(mapContainer);
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
    clearInterval(pendingFreemapSwitch.pollIntervalId);
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

    if (zoom === pending.targetZoom) {
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

    const currentTime = Date.now();

    if (
      pending.lastClickedZoom === zoom &&
      currentTime - pending.lastClickAt < AUTOMATIC_ZOOM_RETRY_MS
    ) {
      return;
    }

    const direction = zoom < pending.targetZoom ? 1 : -1;
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
    pending.lastClickAt = currentTime;
    zoomControl.click();

    // Niektoré Leaflet verzie zmenia dlaždice priamo počas click handlera.
    // Asynchrónne verzie pokračujú cez MutationObserver nižšie.
    advancePendingFreemapSwitch();
  }

  function beginFreemapSwitchAtSupportedZoom(mapContainer, currentZoom) {
    cancelPendingFreemapSwitch();

    // Automatické Garmin +/- kliknutia nesmú prechádzať cez ochranu hraníc
    // Freemap ani zdediť jej dočasne upravené aria atribúty.
    resetExpectedZoomStates();
    freemapEnabled = false;
    document.dispatchEvent(new Event(DISABLE_EVENT));
    updateControls();

    const targetZoom = Math.min(
      tileUrlApi.FREEMAP_MAX_ZOOM,
      Math.max(tileUrlApi.FREEMAP_MIN_ZOOM, currentZoom)
    );
    const pending = {
      lastClickAt: 0,
      lastClickedZoom: null,
      mapContainer,
      pollIntervalId: null,
      targetZoom,
      timeoutId: null
    };

    pending.timeoutId = setTimeout(() => {
      if (pendingFreemapSwitch === pending) {
        failPendingFreemapSwitch();
      }
    }, AUTOMATIC_ZOOM_TIMEOUT_MS);
    pending.pollIntervalId = setInterval(() => {
      if (pendingFreemapSwitch === pending) {
        advancePendingFreemapSwitch();
      }
    }, AUTOMATIC_ZOOM_POLL_MS);
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

    resetExpectedZoomStates();
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
      rememberPreference(mode);
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

  function createExternalLink(href, text) {
    const link = document.createElement("a");
    link.href = href;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = text;
    return link;
  }

  function createAttribution() {
    const attribution = document.createElement("div");
    attribution.className = "garmin-freemap-attribution";
    attribution.hidden = true;

    const freemapLink = createExternalLink(
      "https://www.freemap.sk/",
      "© Freemap Slovakia"
    );
    const osmLink = createExternalLink(
      "https://www.openstreetmap.org/copyright",
      "© prispievatelia OpenStreetMap, dáta ODbL"
    );
    const elevationLink = createExternalLink(
      "https://www.freemap.sk/",
      "Zdroje výškových dát"
    );

    attribution.append(
      freemapLink,
      document.createTextNode(" · "),
      osmLink,
      document.createTextNode(" · "),
      elevationLink
    );
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
    mapContainer.append(
      control,
      notice,
      createAttribution()
    );
    attachZoomBoundaryGuards(mapContainer);
    updateControls();
    applyStoredPreference(mapContainer);
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

  loadStoredPreference();
  inspectNode(document.documentElement);
})();
