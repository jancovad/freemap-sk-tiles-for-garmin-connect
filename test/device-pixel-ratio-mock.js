(function installDevicePixelRatioMock() {
  "use strict";

  const configuredRatio = Number.parseFloat(
    document.documentElement.dataset.devicePixelRatio || "1"
  );
  const ratio = Number.isFinite(configuredRatio) && configuredRatio > 0
    ? configuredRatio
    : 1;

  Object.defineProperty(globalThis, "devicePixelRatio", {
    configurable: true,
    value: ratio
  });
})();
