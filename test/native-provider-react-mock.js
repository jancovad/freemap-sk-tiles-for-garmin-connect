(function installNativeProviderReactMock() {
  "use strict";

  const listbox = document.querySelector("#provider-listbox");
  const providerButton = document.querySelector("#provider-button");
  const providerButtonLabel = document.querySelector("#provider-button-label");
  const tile = document.querySelector("#native-map-fixture img");
  const providerLabels = {
    google: "Google Maps",
    here: "Here Maps",
    osm: "OpenStreetMap"
  };
  let googleSelectionCount = 0;

  function googleTileUrl() {
    return "https://maps.googleapis.com/maps/vt?pb=!1m5!1m4!1i12!2i2264!3i1404!4i256!2m3!1e0&key=test-only";
  }

  function selectProvider(value) {
    for (const option of listbox.querySelectorAll(':scope > [role="option"]')) {
      if (option.hasAttribute("data-garmin-freemap-provider-option")) {
        continue;
      }

      const selected = option.dataset.value === value;
      option.setAttribute("aria-selected", String(selected));
      option.classList.toggle("provider-active", selected);
    }

    providerButtonLabel.textContent = providerLabels[value];
    providerButton.setAttribute("aria-expanded", "false");

    if (value === "google") {
      googleSelectionCount += 1;
      tile.src = googleTileUrl();
    } else {
      tile.src = `https://${value}.example.invalid/12/2264/1404`;
    }
  }

  listbox.addEventListener("click", (event) => {
    const option = event.target.closest('[role="option"][data-value]');
    const value = option?.dataset.value;

    if (option?.parentElement === listbox && value && Object.hasOwn(providerLabels, value)) {
      selectProvider(value);
    }
  });

  providerButton.addEventListener("click", () => {
    const expanded = providerButton.getAttribute("aria-expanded") === "true";
    providerButton.setAttribute("aria-expanded", String(!expanded));
  });

  globalThis.GarminNativeProviderMock = Object.freeze({
    getGoogleSelectionCount: () => googleSelectionCount,
    selectProvider
  });
})();
