(function initializeGarminFreemapUi() {
  "use strict";

  const tileUrlApi = globalThis.GarminFreemapTileUrl;

  if (!tileUrlApi) {
    return;
  }

  const CONTROL_ATTRIBUTE = "data-garmin-freemap-control";
  const DISCLOSURE_ATTRIBUTE = "data-garmin-freemap-disclosure";
  const ENABLE_EVENT = "garmin-freemap-extension:enable";
  const DISABLE_EVENT = "garmin-freemap-extension:disable";
  const FAILURE_EVENT = "garmin-freemap-extension:failure";
  const PREFERENCE_STORAGE_KEY = "preferredMapMode";
  const DISCLOSURE_STORAGE_KEY = "freemapDisclosureAccepted";
  const noticeTimers = new WeakMap();
  const guardedMaps = new WeakSet();
  const originalZoomControlAria = new WeakMap();
  const touchDistances = new WeakMap();
  let freemapEnabled = false;
  let disclosureAccepted = false;
  let disclosureIdSequence = 0;
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

  function rememberDisclosureAcceptance() {
    disclosureAccepted = true;
    preferredMapMode = "freemap";
    preferenceApplied = true;
    writeStoredValues({
      [DISCLOSURE_STORAGE_KEY]: true,
      [PREFERENCE_STORAGE_KEY]: "freemap"
    });
  }

  function applyStoredPreference(mapContainer) {
    if (!preferenceLoaded || preferenceApplied) {
      return;
    }

    preferenceApplied = true;

    if (preferredMapMode === "freemap" && disclosureAccepted) {
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
        [DISCLOSURE_STORAGE_KEY]: false,
        [PREFERENCE_STORAGE_KEY]: "garmin"
      }, (items) => {
        void globalThis.chrome?.runtime?.lastError;
        disclosureAccepted = items?.[DISCLOSURE_STORAGE_KEY] === true;
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
      if (mode === "freemap" && !disclosureAccepted) {
        showFreemapDisclosure(mapContainer, button);
        return;
      }

      closeFreemapDisclosure(mapContainer);
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

  function closeFreemapDisclosure(mapContainer, returnFocusTo = null) {
    const disclosure = mapContainer.querySelector(
      `:scope > [${DISCLOSURE_ATTRIBUTE}]`
    );

    if (!disclosure || disclosure.hidden) {
      return;
    }

    disclosure.hidden = true;
    returnFocusTo?.focus();
  }

  function showFreemapDisclosure(mapContainer, returnFocusTo) {
    const disclosure = mapContainer.querySelector(
      `:scope > [${DISCLOSURE_ATTRIBUTE}]`
    );

    if (!disclosure) {
      return;
    }

    disclosure.hidden = false;
    disclosure.dataset.returnFocus = returnFocusTo?.dataset.mode || "freemap";
    disclosure.querySelector('[data-action="accept"]')?.focus();
  }

  function createExternalLink(href, text) {
    const link = document.createElement("a");
    link.href = href;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = text;
    return link;
  }

  function createDisclosure(mapContainer) {
    const disclosure = document.createElement("div");
    disclosure.className = "garmin-freemap-disclosure";
    disclosure.setAttribute(DISCLOSURE_ATTRIBUTE, "");
    disclosure.hidden = true;

    const dialog = document.createElement("div");
    dialog.className = "garmin-freemap-disclosure__dialog";
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");

    disclosureIdSequence += 1;
    const titleId = `garmin-freemap-disclosure-title-${disclosureIdSequence}`;
    dialog.setAttribute("aria-labelledby", titleId);

    const title = document.createElement("h2");
    title.id = titleId;
    title.textContent = "Pred zapnutím Freemap";

    const dataNotice = document.createElement("p");
    dataNotice.textContent = (
      "Na zobrazenie podkladu prehliadač odošle serveru Freemap Slovakia " +
      "súradnice viditeľných dlaždíc, statický identifikátor rozšírenia a " +
      "bežné sieťové údaje, napríklad IP adresu."
    );

    const privacyNotice = document.createElement("p");
    privacyNotice.textContent = (
      "Rozšírenie neposiela Garmin účet, trasu ani URL stránky. Súhlas sa " +
      "uloží iba lokálne v Chrome. "
    );
    privacyNotice.append(
      createExternalLink(
        "https://github.com/jancovad/freemap-sk-tiles-for-garmin-connect/blob/main/PRIVACY.md",
        "Zásady ochrany súkromia"
      )
    );

    const actions = document.createElement("div");
    actions.className = "garmin-freemap-disclosure__actions";

    const cancelButton = document.createElement("button");
    cancelButton.type = "button";
    cancelButton.className = "garmin-freemap-disclosure__button";
    cancelButton.dataset.action = "cancel";
    cancelButton.textContent = "Zrušiť";
    cancelButton.addEventListener("click", () => {
      const returnFocusTo = mapContainer.querySelector(
        'button[data-mode="freemap"]'
      );
      closeFreemapDisclosure(mapContainer, returnFocusTo);
    });

    const acceptButton = document.createElement("button");
    acceptButton.type = "button";
    acceptButton.className = (
      "garmin-freemap-disclosure__button " +
      "garmin-freemap-disclosure__button--primary"
    );
    acceptButton.dataset.action = "accept";
    acceptButton.textContent = "Súhlasím a zapnúť Freemap";
    acceptButton.addEventListener("click", () => {
      rememberDisclosureAcceptance();
      closeFreemapDisclosure(mapContainer);
      setFreemapEnabled(true, "", true, mapContainer);
    });

    actions.append(cancelButton, acceptButton);
    dialog.append(title, dataNotice, privacyNotice, actions);
    disclosure.append(dialog);
    disclosure.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        cancelButton.click();
      }
    });
    stopMapInteractionEvents(disclosure);
    return disclosure;
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
      createAttribution(),
      createDisclosure(mapContainer)
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
