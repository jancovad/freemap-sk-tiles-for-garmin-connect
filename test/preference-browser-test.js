(function testStoredFreemapPreference() {
  "use strict";

  const fixture = document.querySelector("#preference-map-fixture");
  const image = fixture.querySelector("img");
  const freemapButton = fixture.querySelector('button[data-mode="freemap"]');
  const attribution = fixture.querySelector(".garmin-freemap-attribution");
  const summary = document.querySelector("#summary");

  const passed = (
    image.getAttribute("src") === "https://outdoor.tiles.freemap.sk/12/2264/1404@2x?app=garmin-connect-ext" &&
    freemapButton?.classList.contains("is-active") === true &&
    attribution?.hidden === false &&
    globalThis.GarminFreemapStorageMock.hasObsoleteDisclosureValue() === false &&
    globalThis.GarminFreemapStorageMock.getReadCount() === 1 &&
    globalThis.GarminFreemapStorageMock.getRemoveCount() === 1 &&
    globalThis.GarminFreemapStorageMock.getWriteCount() === 0
  );

  summary.dataset.status = passed ? "passed" : "failed";
  summary.textContent = passed
    ? "PASS: preferencia sa obnovila a zastaraná hodnota bola odstránená"
    : "FAIL: uložená preferencia Freemap sa neobnovila";
  document.title = passed ? "PASS" : "FAIL";
})();
