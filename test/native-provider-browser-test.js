(async function runNativeProviderBrowserTests() {
  "use strict";

  const results = document.querySelector("#results");
  const summary = document.querySelector("#summary");
  const listbox = document.querySelector("#provider-listbox");
  const providerButton = document.querySelector("#provider-button");
  const nativeButtonLabel = document.querySelector("#provider-button-label");
  const mapTypeSection = document.querySelector("#map-type-section");
  const mapTypeSeparator = document.querySelector("#map-type-separator");
  const plannerListbox = document.querySelector("#planner-provider-listbox");
  const plannerMapTypeSection = document.querySelector("#planner-map-type-section");
  const mapFixture = document.querySelector("#native-map-fixture");
  const tile = mapFixture.querySelector("img");
  let passed = 0;
  let failed = 0;

  function equal(actual, expected) {
    if (actual !== expected) {
      throw new Error(`očakávané ${expected}, získané ${actual}`);
    }
  }

  function truthy(value, message) {
    if (!value) {
      throw new Error(message);
    }
  }

  function getFreemapOption() {
    return listbox.querySelector(':scope > [data-garmin-freemap-provider-option]');
  }

  async function flushDomChanges() {
    await new Promise((resolve) => setTimeout(resolve, 0));
    await new Promise((resolve) => requestAnimationFrame(() => resolve()));
  }

  async function test(name, assertion) {
    const item = document.createElement("li");

    try {
      await assertion();
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

  await flushDomChanges();

  await test("do Garmin listboxu sa pridá jediná voľba Freemap.sk", async () => {
    const option = getFreemapOption();
    truthy(option, "voľba Freemap.sk chýba");
    equal(option.dataset.value, "freemap");
    equal(option.textContent.trim(), "Freemap.sk");
    equal(listbox.querySelectorAll('[data-garmin-freemap-provider-option]').length, 1);
    equal(
      plannerListbox.querySelectorAll('[data-garmin-freemap-provider-option]').length,
      1
    );
  });

  await test("výber Freemap.sk v plánovači zmení podklad aj oba stavy", async () => {
    plannerListbox
      .querySelector('[data-garmin-freemap-provider-option] span')
      .click();
    await flushDomChanges();

    truthy(tile.src.startsWith("https://outdoor.tiles.freemap.sk/12/2264/1404"), "dlaždica sa neprepla");
    equal(getFreemapOption().getAttribute("aria-selected"), "true");
    equal(
      plannerListbox
        .querySelector('[data-garmin-freemap-provider-option]')
        .getAttribute("aria-selected"),
      "true"
    );
    equal(providerButton.querySelector('[data-garmin-freemap-provider-label]').textContent, "Freemap.sk");
    equal(nativeButtonLabel.hasAttribute("data-garmin-freemap-label-hidden"), true);
    equal(mapTypeSection.hasAttribute("data-garmin-freemap-map-type-hidden"), true);
    equal(mapTypeSeparator.hasAttribute("data-garmin-freemap-map-type-hidden"), true);
    equal(
      plannerMapTypeSection.hasAttribute("data-garmin-freemap-map-type-hidden"),
      true
    );
    equal(globalThis.GarminFreemapStorageMock.getPreferredMapMode(), "freemap");
  });

  await test("natívna voľba Here Maps obnoví Garmin režim bez zásahu do kliknutia", async () => {
    listbox.querySelector(':scope > [data-value="here"]').click();
    await flushDomChanges();

    equal(tile.src, "https://here.example.invalid/12/2264/1404");
    equal(nativeButtonLabel.textContent, "Here Maps");
    equal(providerButton.querySelector('[data-garmin-freemap-provider-label]'), null);
    equal(mapTypeSection.hasAttribute("data-garmin-freemap-map-type-hidden"), false);
    equal(mapTypeSeparator.hasAttribute("data-garmin-freemap-map-type-hidden"), false);
    equal(
      plannerMapTypeSection.hasAttribute("data-garmin-freemap-map-type-hidden"),
      false
    );
    equal(globalThis.GarminFreemapStorageMock.getPreferredMapMode(), "garmin");
  });

  await test("výber Freemap.sk z HERE najprv použije natívnu voľbu Google", async () => {
    getFreemapOption().click();
    await flushDomChanges();

    equal(globalThis.GarminNativeProviderMock.getGoogleSelectionCount(), 1);
    truthy(tile.src.startsWith("https://outdoor.tiles.freemap.sk/12/2264/1404"), "Google dlaždica sa nepreložila");
    equal(getFreemapOption().getAttribute("aria-selected"), "true");
    equal(globalThis.GarminFreemapStorageMock.getPreferredMapMode(), "freemap");
  });

  await test("React opätovné vykreslenie nevytvorí duplicitnú voľbu", async () => {
    getFreemapOption().remove();
    listbox.append(document.createElement("template"));
    await flushDomChanges();

    equal(listbox.querySelectorAll('[data-garmin-freemap-provider-option]').length, 1);
    equal(getFreemapOption().getAttribute("aria-selected"), "true");
  });

  await test("mapa je inicializovaná bez samostatného horného prepínača", async () => {
    equal(mapFixture.hasAttribute("data-garmin-freemap-map"), true);
    equal(mapFixture.querySelector('[data-garmin-freemap-control]'), null);
    equal(mapFixture.querySelector('button[data-mode]'), null);
  });

  summary.textContent = failed === 0
    ? `PASS: ${passed} testov, 0 chýb`
    : `FAIL: ${passed} testov, ${failed} chýb`;
  summary.dataset.status = failed === 0 ? "passed" : "failed";
})();
