(function installGarminFreemapStorageMock() {
  "use strict";

  const initialMode = document.documentElement.dataset.preferredMapMode === "freemap"
    ? "freemap"
    : "garmin";
  const values = { preferredMapMode: initialMode };
  let readCount = 0;
  let writeCount = 0;

  const chromeApi = globalThis.chrome || {};
  chromeApi.runtime = chromeApi.runtime || {};
  chromeApi.storage = {
    local: {
      get(defaults, callback) {
        readCount += 1;
        callback({ ...defaults, ...values });
      },
      set(items, callback) {
        writeCount += 1;
        Object.assign(values, items);
        callback?.();
      }
    }
  };
  globalThis.chrome = chromeApi;
  globalThis.GarminFreemapStorageMock = Object.freeze({
    getPreferredMapMode: () => values.preferredMapMode,
    getReadCount: () => readCount,
    getWriteCount: () => writeCount
  });
})();
