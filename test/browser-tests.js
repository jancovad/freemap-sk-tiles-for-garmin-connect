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
      "https://outdoor.tiles.freemap.sk/12/2264/1404"
    );
  });

  test("vyšší zoom z14/x9055/y5621", () => {
    equal(
      api.translateGarminGoogleTileUrl(googleTileUrl(14, 9055, 5621)),
      "https://outdoor.tiles.freemap.sk/14/9055/5621"
    );
  });

  test("zakódovaný pb parameter", () => {
    const url = new URL("https://maps.googleapis.com/maps/vt");
    url.searchParams.set("pb", "!1m5!1m4!1i11!2i484!3i783!4i256!2m3!1e0");
    equal(
      api.translateGarminGoogleTileUrl(url.href),
      "https://outdoor.tiles.freemap.sk/11/484/783"
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
    equal(api.buildFreemapTileUrl(tile), "https://outdoor.tiles.freemap.sk/11/484/783");
  });

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
      "https://outdoor.tiles.freemap.sk/12/2264/1404"
    );
    equal(fixtureImages[0].getAttribute("referrerpolicy"), "no-referrer");
    equal(freemapButton.classList.contains("is-active"), true);
  });

  test("Freemap zobrazí povinnú atribúciu", () => {
    equal(attribution.hidden, false);
    equal(attribution.textContent.includes("Freemap Slovakia"), true);
    equal(attribution.textContent.includes("OpenStreetMap contributors"), true);
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
      "https://outdoor.tiles.freemap.sk/13/4528/2808"
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
  });

  summary.dataset.status = failed === 0 ? "passed" : "failed";
  summary.textContent = failed === 0
    ? `PASS: ${passed} testov, 0 chýb`
    : `FAIL: ${passed} úspešných, ${failed} chybných`;
  document.title = failed === 0 ? "PASS" : "FAIL";
})();
