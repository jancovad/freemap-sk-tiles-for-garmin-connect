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
  let freemapEnabled = false;

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

  function setFreemapEnabled(nextEnabled, noticeMessage = "", notifyPage = true) {
    freemapEnabled = Boolean(nextEnabled);
    updateControls();

    if (notifyPage) {
      document.dispatchEvent(new Event(freemapEnabled ? ENABLE_EVENT : DISABLE_EVENT));
    }

    if (noticeMessage) {
      showNotice(noticeMessage);
    }
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
    control.append(createButton("garmin", "Garmin"), createButton("freemap", "Freemap"));

    const notice = document.createElement("div");
    notice.className = "garmin-freemap-notice";
    notice.setAttribute("aria-live", "polite");
    notice.hidden = true;

    stopMapInteractionEvents(control);
    mapContainer.append(control, notice, createAttribution());
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
