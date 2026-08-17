(function runBrowserTests() {
  "use strict";

  const api = globalThis.GarminFreemapTileUrl;
  const results = document.querySelector("#results");
  const summary = document.querySelector("#summary");
  let passed = 0;
  let failed = 0;

  function googleTileUrl(zoom, x, y, tileSize = 256) {
    const pb = `!1m5!1m4!1i${zoom}!2i${x}!3i${y}!4i${tileSize}!2m3!1e0!2sm!3i1`;
    return `https://maps.googleapis.com/maps/vt?pb=${pb}&key=test-only&token=test-only`;
  }

  function test(name, assertion) {
    const item = document.createElement("li");

    try {
      assertion();
      passed += 1;
      item.dataset.status = "passed";
      item.textContent = `PASS: ${name}`;
    } catch (error) {
      failed += 1;
      item.dataset.status = "failed";
      item.textContent = `FAIL: ${name} – ${error.message}`;
    }

    results.append(item);
  }

  function equal(actual, expected) {
    if (actual !== expected) {
      throw new Error(`očakávané ${expected}, získané ${actual}`);
    }
  }

  test("detail aktivity z12/x2264/y1404", () => {
    equal(
      api.translateGarminGoogleTileUrl(googleTileUrl(12, 2264, 1404)),
      "https://outdoor.tiles.freemap.sk/12/2264/1404?app=garmin-connect-ext"
    );
  });

  test("vyšší zoom z14/x9055/y5621", () => {
    equal(
      api.translateGarminGoogleTileUrl(googleTileUrl(14, 9055, 5621)),
      "https://outdoor.tiles.freemap.sk/14/9055/5621?app=garmin-connect-ext"
    );
  });

  test("zakódovaný pb parameter", () => {
    const url = new URL("https://maps.googleapis.com/maps/vt");
    url.searchParams.set("pb", "!1m5!1m4!1i11!2i484!3i783!4i256!2m3!1e0");
    equal(
      api.translateGarminGoogleTileUrl(url.href),
      "https://outdoor.tiles.freemap.sk/11/484/783?app=garmin-connect-ext"
    );
  });

  test("iná doména sa odmietne", () => {
    equal(
      api.translateGarminGoogleTileUrl(
        googleTileUrl(12, 2264, 1404).replace("maps.googleapis.com", "example.invalid")
      ),
      null
    );
  });

  test("nepozorovaná veľkosť 512 sa odmietne", () => {
    equal(api.translateGarminGoogleTileUrl(googleTileUrl(12, 2264, 1404, 512)), null);
  });

  test("historický hex formát sa prevádza samostatne", () => {
    const tile = api.parseLegacyGarminTilePath("L11/R0000030F/C000001E4.png");
    equal(
      api.buildFreemapTileUrl(tile),
      "https://outdoor.tiles.freemap.sk/11/484/783?app=garmin-connect-ext"
    );
  });

  test("Freemap deklaruje potvrdený rozsah zoomu 5 až 18", () => {
    equal(api.FREEMAP_MIN_ZOOM, 5);
    equal(api.FREEMAP_MAX_ZOOM, 18);
    equal(
      api.parseFreemapTileUrl(
        "https://outdoor.tiles.freemap.sk/18/144803/89921@4x?app=garmin-connect-ext"
      ).zoom,
      18
    );
    equal(api.translateGarminGoogleTileUrl(googleTileUrl(4, 8, 4)), null);
    equal(api.translateGarminGoogleTileUrl(googleTileUrl(19, 289606, 179842)), null);
  });

  test("retina prípona používa strop 4× a zachováva app identifikátor", () => {
    equal(
      api.translateGarminGoogleTileUrl(googleTileUrl(14, 9055, 5621), 1.25),
      "https://outdoor.tiles.freemap.sk/14/9055/5621@2x?app=garmin-connect-ext"
    );
    equal(
      api.translateGarminGoogleTileUrl(googleTileUrl(14, 9055, 5621), 2.5),
      "https://outdoor.tiles.freemap.sk/14/9055/5621@3x?app=garmin-connect-ext"
    );
    equal(
      api.translateGarminGoogleTileUrl(googleTileUrl(14, 9055, 5621), 8),
      "https://outdoor.tiles.freemap.sk/14/9055/5621@4x?app=garmin-connect-ext"
    );
  });

  const retinaFixture = document.querySelector("#retina-map-fixture");
  const retinaImage = retinaFixture.querySelector("img");
  const retinaGarminButton = retinaFixture.querySelector('button[data-mode="garmin"]');
  const retinaFreemapButton = retinaFixture.querySelector('button[data-mode="freemap"]');

  Object.defineProperty(globalThis, "devicePixelRatio", {
    configurable: true,
    value: 3
  });
  retinaFreemapButton.click();

  test("klik Freemap bez modalu zapne retina podklad podľa displeja", () => {
    equal(retinaFixture.querySelector(".garmin-freemap-disclosure"), null);
    equal(globalThis.GarminFreemapStorageMock.getPreferredMapMode(), "freemap");
    equal(
      retinaImage.getAttribute("src"),
      "https://outdoor.tiles.freemap.sk/12/2264/1404@3x?app=garmin-connect-ext"
    );
  });

  retinaGarminButton.click();
  Object.defineProperty(globalThis, "devicePixelRatio", {
    configurable: true,
    value: 1
  });

  const outsideZoomFixture = document.querySelector("#outside-zoom-map-fixture");
  const outsideZoomImage = outsideZoomFixture.querySelector("img");
  const outsideZoomIn = outsideZoomFixture.querySelector(".leaflet-control-zoom-in");
  const outsideZoomOut = outsideZoomFixture.querySelector(".leaflet-control-zoom-out");
  const outsideGarminButton = outsideZoomFixture.querySelector('button[data-mode="garmin"]');
  const outsideFreemapButton = outsideZoomFixture.querySelector('button[data-mode="freemap"]');
  let automaticZoomInClicks = 0;
  let automaticZoomOutClicks = 0;

  outsideZoomOut.addEventListener("click", (event) => {
    event.preventDefault();
    automaticZoomOutClicks += 1;
    outsideZoomImage.src = googleTileUrl(18, 144803, 89921);
  });
  outsideZoomIn.addEventListener("click", (event) => {
    event.preventDefault();
    automaticZoomInClicks += 1;
    outsideZoomImage.src = googleTileUrl(5, 16, 8);
  });

  outsideFreemapButton.click();

  test("prepnutie z Garmin zoomu 19 najprv nastaví Freemap maximum 18", () => {
    equal(automaticZoomOutClicks, 1);
    equal(
      outsideZoomImage.getAttribute("src"),
      "https://outdoor.tiles.freemap.sk/18/144803/89921?app=garmin-connect-ext"
    );
    equal(outsideFreemapButton.classList.contains("is-active"), true);
  });

  outsideGarminButton.click();
  outsideZoomImage.src = googleTileUrl(4, 8, 4);
  outsideFreemapButton.click();

  test("prepnutie z Garmin zoomu 4 najprv nastaví Freemap minimum 5", () => {
    equal(automaticZoomInClicks, 1);
    equal(
      outsideZoomImage.getAttribute("src"),
      "https://outdoor.tiles.freemap.sk/5/16/8?app=garmin-connect-ext"
    );
    equal(outsideFreemapButton.classList.contains("is-active"), true);
  });

  outsideGarminButton.click();

  const fixture = document.querySelector("#map-fixture");
  const fixtureImages = [...fixture.querySelectorAll("img")];
  const originalSources = fixtureImages.map((image) => image.getAttribute("src"));
  const garminButton = fixture.querySelector('button[data-mode="garmin"]');
  const freemapButton = fixture.querySelector('button[data-mode="freemap"]');
  const attribution = fixture.querySelector(".garmin-freemap-attribution");
  const notice = fixture.querySelector(".garmin-freemap-notice");

  test("obsahový skript pridá prepínač s predvolenou Garmin mapou", () => {
    equal(Boolean(garminButton), true);
    equal(garminButton.classList.contains("is-active"), true);
    equal(attribution.hidden, true);
    equal(globalThis.GarminFreemapStorageMock.getReadCount(), 1);
    equal(globalThis.GarminFreemapStorageMock.getPreferredMapMode(), "garmin");
  });

  let mapClickCount = 0;
  fixture.addEventListener("click", () => {
    mapClickCount += 1;
  });
  freemapButton.click();

  test("klik na ovládanie neprebublá do mapy", () => {
    equal(mapClickCount, 0);
  });

  test("Freemap prepne iba zdroje dlaždíc a nastaví no-referrer", () => {
    equal(
      fixtureImages[0].getAttribute("src"),
      "https://outdoor.tiles.freemap.sk/12/2264/1404?app=garmin-connect-ext"
    );
    equal(fixtureImages[0].getAttribute("referrerpolicy"), "no-referrer");
    equal(freemapButton.classList.contains("is-active"), true);
  });

  test("Freemap zobrazí povinnú atribúciu", () => {
    const links = [...attribution.querySelectorAll("a")];
    equal(attribution.hidden, false);
    equal(attribution.textContent.includes("Freemap Slovakia"), true);
    equal(attribution.textContent.includes("prispievatelia OpenStreetMap"), true);
    equal(attribution.textContent.includes("dáta ODbL"), true);
    equal(attribution.textContent.includes("Zdroje výškových dát"), true);
    equal(links[0].href, "https://www.freemap.sk/");
    equal(links[1].href, "https://www.openstreetmap.org/copyright");
    equal(links[2].href, "https://www.freemap.sk/");
  });

  test("výber Freemap sa uloží iba ako lokálna preferencia", () => {
    equal(globalThis.GarminFreemapStorageMock.getPreferredMapMode(), "freemap");
    equal(globalThis.GarminFreemapStorageMock.getRemoveCount(), 0);
    equal(globalThis.GarminFreemapStorageMock.getWriteCount() > 0, true);
  });

  const activeOutsideFixture = document.querySelector("#active-outside-zoom-map-fixture");
  const activeOutsideImage = activeOutsideFixture.querySelector("img");
  const activeOutsideZoomOut = activeOutsideFixture.querySelector(
    ".leaflet-control-zoom-out"
  );
  const activeOutsideFreemapButton = activeOutsideFixture.querySelector(
    'button[data-mode="freemap"]'
  );
  let activeOutsideZoomOutClicks = 0;

  activeOutsideZoomOut.addEventListener("click", (event) => {
    event.preventDefault();
    activeOutsideZoomOutClicks += 1;
    activeOutsideImage.src = googleTileUrl(18, 144803, 89921);
  });
  activeOutsideFreemapButton.click();

  test("automatický návrat na zoom 18 obíde aktívnu Freemap ochranu", () => {
    equal(activeOutsideZoomOutClicks, 1);
    equal(
      activeOutsideImage.getAttribute("src"),
      "https://outdoor.tiles.freemap.sk/18/144803/89921?app=garmin-connect-ext"
    );
    equal(activeOutsideFreemapButton.classList.contains("is-active"), true);
  });

  const nearMaxZoomFixture = document.querySelector("#near-max-zoom-map-fixture");
  const nearMaxZoomIn = nearMaxZoomFixture.querySelector(".leaflet-control-zoom-in");
  nearMaxZoomFixture.querySelector('button[data-mode="freemap"]').click();

  test("rýchly zoom in z úrovne 17 neprekročí Freemap maximum", () => {
    const firstZoomIn = new WheelEvent("wheel", {
      bubbles: true,
      cancelable: true,
      deltaY: -100
    });
    const secondZoomIn = new WheelEvent("wheel", {
      bubbles: true,
      cancelable: true,
      deltaY: -100
    });

    nearMaxZoomFixture.dispatchEvent(firstZoomIn);
    nearMaxZoomFixture.dispatchEvent(secondZoomIn);
    equal(firstZoomIn.defaultPrevented, false);
    equal(secondZoomIn.defaultPrevented, true);
    equal(nearMaxZoomIn.getAttribute("aria-disabled"), "true");
  });

  const nearMinZoomFixture = document.querySelector("#near-min-zoom-map-fixture");
  const nearMinZoomOut = nearMinZoomFixture.querySelector(".leaflet-control-zoom-out");
  nearMinZoomFixture.querySelector('button[data-mode="freemap"]').click();

  test("rýchly zoom out z úrovne 6 neprekročí Freemap minimum", () => {
    const firstZoomOut = new WheelEvent("wheel", {
      bubbles: true,
      cancelable: true,
      deltaY: 100
    });
    const secondZoomOut = new WheelEvent("wheel", {
      bubbles: true,
      cancelable: true,
      deltaY: 100
    });

    nearMinZoomFixture.dispatchEvent(firstZoomOut);
    nearMinZoomFixture.dispatchEvent(secondZoomOut);
    equal(firstZoomOut.defaultPrevented, false);
    equal(secondZoomOut.defaultPrevented, true);
    equal(nearMinZoomOut.getAttribute("aria-disabled"), "true");
  });

  const maxZoomFixture = document.querySelector("#max-zoom-map-fixture");
  const maxZoomIn = maxZoomFixture.querySelector(".leaflet-control-zoom-in");
  const maxZoomOut = maxZoomFixture.querySelector(".leaflet-control-zoom-out");
  maxZoomFixture.querySelector('button[data-mode="freemap"]').click();

  test("na Freemap zoome 18 označí iba priblíženie ako nedostupné", () => {
    equal(maxZoomIn.getAttribute("aria-disabled"), "true");
    equal(maxZoomIn.classList.contains("garmin-freemap-zoom-limit"), true);
    equal(maxZoomOut.hasAttribute("aria-disabled"), false);
  });

  test("na Freemap zoome 18 zablokuje zoom in, ale povolí zoom out", () => {
    const zoomIn = new WheelEvent("wheel", {
      bubbles: true,
      cancelable: true,
      deltaY: -100
    });
    const zoomOut = new WheelEvent("wheel", {
      bubbles: true,
      cancelable: true,
      deltaY: 100
    });

    maxZoomFixture.dispatchEvent(zoomIn);
    maxZoomFixture.dispatchEvent(zoomOut);
    equal(zoomIn.defaultPrevented, true);
    equal(zoomOut.defaultPrevented, false);
  });

  const minZoomFixture = document.querySelector("#min-zoom-map-fixture");
  const minZoomIn = minZoomFixture.querySelector(".leaflet-control-zoom-in");
  const minZoomOut = minZoomFixture.querySelector(".leaflet-control-zoom-out");
  minZoomFixture.querySelector('button[data-mode="freemap"]').click();

  test("na Freemap zoome 5 označí iba oddialenie ako nedostupné", () => {
    equal(minZoomIn.hasAttribute("aria-disabled"), false);
    equal(minZoomOut.getAttribute("aria-disabled"), "true");
    equal(minZoomOut.classList.contains("garmin-freemap-zoom-limit"), true);
  });

  test("na Freemap zoome 5 zablokuje zoom out, ale povolí zoom in", () => {
    const zoomOut = new WheelEvent("wheel", {
      bubbles: true,
      cancelable: true,
      deltaY: 100
    });
    const zoomIn = new WheelEvent("wheel", {
      bubbles: true,
      cancelable: true,
      deltaY: -100
    });

    minZoomFixture.dispatchEvent(zoomOut);
    minZoomFixture.dispatchEvent(zoomIn);
    equal(zoomOut.defaultPrevented, true);
    equal(zoomIn.defaultPrevented, false);
  });

  let nativeMaxZoomClicks = 0;
  maxZoomIn.addEventListener("click", () => {
    nativeMaxZoomClicks += 1;
  });
  maxZoomIn.click();

  test("hraničné tlačidlo zoomu sa nedostane ku Garmin mape", () => {
    equal(nativeMaxZoomClicks, 0);
  });

  const clonedFreemapTile = fixtureImages[0].cloneNode(true);
  fixture.append(clonedFreemapTile);
  garminButton.click();

  test("Garmin prepínač obnoví aj klonované dlaždice a odstráni atribúty", () => {
    fixtureImages.forEach((image, index) => {
      equal(image.getAttribute("src"), originalSources[index]);
      equal(image.hasAttribute("referrerpolicy"), false);
      equal(image.hasAttribute("data-garmin-freemap-original-src"), false);
    });
    equal(clonedFreemapTile.getAttribute("src"), originalSources[0]);
    equal(clonedFreemapTile.hasAttribute("data-garmin-freemap-original-src"), false);
    equal(attribution.hidden, true);
    equal(maxZoomIn.hasAttribute("aria-disabled"), false);
    equal(minZoomOut.hasAttribute("aria-disabled"), false);
    equal(maxZoomIn.classList.contains("garmin-freemap-zoom-limit"), false);
    equal(minZoomOut.classList.contains("garmin-freemap-zoom-limit"), false);
    equal(globalThis.GarminFreemapStorageMock.getPreferredMapMode(), "garmin");
  });

  globalThis.GarminFreemapTestObserver.disconnect();
  freemapButton.click();

  const hiddenSourceWrapper = document.createElement("div");
  hiddenSourceWrapper.style.visibility = "hidden";
  const hiddenSourceTile = document.createElement("img");
  const lateTileOriginalSource = googleTileUrl(13, 4528, 2808);
  hiddenSourceTile.alt = "";
  hiddenSourceTile.src = lateTileOriginalSource;
  hiddenSourceWrapper.append(hiddenSourceTile);
  fixture.append(hiddenSourceWrapper);

  test("skrytý Google Mutant zdroj zostane nezmenený", () => {
    equal(hiddenSourceTile.getAttribute("src"), lateTileOriginalSource);
  });

  const lateTileWrapper = document.createElement("div");
  lateTileWrapper.className = "leaflet-tile";
  const lateTile = document.createElement("img");
  lateTile.alt = "";
  lateTileWrapper.append(lateTile);
  fixture.append(lateTileWrapper);
  lateTile.src = lateTileOriginalSource;

  test("synchrónny interceptor prepne viditeľnú Mutant kópiu", () => {
    equal(
      lateTile.getAttribute("src"),
      "https://outdoor.tiles.freemap.sk/13/4528/2808?app=garmin-connect-ext"
    );
  });

  globalThis.triggerGarminFreemapTestImageError(fixtureImages[0]);

  test("prvá chyba aktivuje istič a obnoví celú Garmin mapu", () => {
    fixtureImages.forEach((image, index) => {
      equal(image.getAttribute("src"), originalSources[index]);
    });
    equal(lateTile.getAttribute("src"), lateTileOriginalSource);
    equal(garminButton.classList.contains("is-active"), true);
    equal(attribution.hidden, true);
    equal(notice.hidden, false);
    equal(notice.textContent.includes("Obnovená bola Garmin mapa"), true);
    equal(globalThis.GarminFreemapStorageMock.getPreferredMapMode(), "freemap");
  });

  summary.dataset.status = failed === 0 ? "passed" : "failed";
  summary.textContent = failed === 0
    ? `PASS: ${passed} testov, 0 chýb`
    : `FAIL: ${passed} úspešných, ${failed} chybných`;
  document.title = failed === 0 ? "PASS" : "FAIL";
})();
