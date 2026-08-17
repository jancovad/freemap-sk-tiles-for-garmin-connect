(function installGarminFreemapStorageMock() {
  "use strict";

  const initialMode = document.documentElement.dataset.preferredMapMode === "freemap"
    ? "freemap"
    : "garmin";
  const values = {
    preferredMapMode: initialMode
  };
  if (document.documentElement.hasAttribute("data-freemap-disclosure-accepted")) {
    values.freemapDisclosureAccepted = (
      document.documentElement.dataset.freemapDisclosureAccepted === "true"
    );
  }
  let readCount = 0;
  let removeCount = 0;
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
      },
      remove(keys, callback) {
        removeCount += 1;
        for (const key of Array.isArray(keys) ? keys : [keys]) {
          delete values[key];
        }
        callback?.();
      }
    }
  };
  globalThis.chrome = chromeApi;
  globalThis.GarminFreemapStorageMock = Object.freeze({
    hasObsoleteDisclosureValue: () => (
      Object.prototype.hasOwnProperty.call(values, "freemapDisclosureAccepted")
    ),
    getPreferredMapMode: () => values.preferredMapMode,
    getReadCount: () => readCount,
    getRemoveCount: () => removeCount,
    getWriteCount: () => writeCount
  });
})();
