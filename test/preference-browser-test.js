(function testStoredFreemapPreference() {
  "use strict";

  const fixture = document.querySelector("#preference-map-fixture");
  const image = fixture.querySelector("img");
  const freemapButton = fixture.querySelector('button[data-mode="freemap"]');
  const attribution = fixture.querySelector(".garmin-freemap-attribution");
  const summary = document.querySelector("#summary");

  const passed = (
    image.getAttribute("src") === "https://tiles.freemap.sk/12/2264/1404@2x?app=garmin-connect-ext" &&
    freemapButton?.classList.contains("is-active") === true &&
    attribution?.hidden === false &&
    globalThis.GarminFreemapStorageMock.getDisclosureAccepted() === true &&
    globalThis.GarminFreemapStorageMock.getReadCount() === 1 &&
    globalThis.GarminFreemapStorageMock.getWriteCount() === 0
  );

  summary.dataset.status = passed ? "passed" : "failed";
  summary.textContent = passed
    ? "PASS: uložená preferencia Freemap sa automaticky obnovila"
    : "FAIL: uložená preferencia Freemap sa neobnovila";
  document.title = passed ? "PASS" : "FAIL";
})();
