(function instrumentMutationObserver() {
  "use strict";

  const NativeMutationObserver = globalThis.MutationObserver;
  const nativeImageAddEventListener = HTMLImageElement.prototype.addEventListener;
  const imageErrorListeners = new WeakMap();

  HTMLImageElement.prototype.addEventListener = function addInstrumentedEventListener(
    type,
    listener,
    options
  ) {
    if (type === "error") {
      const listeners = imageErrorListeners.get(this) || [];
      listeners.push(listener);
      imageErrorListeners.set(this, listeners);
      return;
    }

    return nativeImageAddEventListener.call(this, type, listener, options);
  };

  globalThis.triggerGarminFreemapTestImageError = function triggerImageError(image) {
    for (const listener of imageErrorListeners.get(image) || []) {
      if (typeof listener === "function") {
        listener.call(image, { currentTarget: image });
      } else {
        listener.handleEvent({ currentTarget: image });
      }
    }
  };

  globalThis.MutationObserver = class TestMutationObserver {
    constructor(callback) {
      this.nativeObserver = new NativeMutationObserver(callback);
      globalThis.GarminFreemapTestObserver = this;
    }

    disconnect() {
      return this.nativeObserver.disconnect();
    }

    observe(target, options) {
      return this.nativeObserver.observe(target, options);
    }

    takeRecords() {
      return this.nativeObserver.takeRecords();
    }
  };
})();
