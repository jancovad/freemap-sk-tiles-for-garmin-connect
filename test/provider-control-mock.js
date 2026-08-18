(function installProviderControlMock() {
  "use strict";

  const listbox = document.querySelector("#test-provider-listbox");
  const button = document.querySelector("#test-provider-button");
  const label = document.querySelector("#test-provider-label");
  const labels = {
    google: "Google Maps",
    here: "Here Maps",
    osm: "OpenStreetMap"
  };

  listbox.addEventListener("click", (event) => {
    const option = event.target.closest('[role="option"][data-value]');
    const value = option?.dataset.value;

    if (option?.parentElement !== listbox || !Object.hasOwn(labels, value)) {
      return;
    }

    for (const nativeOption of listbox.querySelectorAll(
      ':scope > [role="option"]:not([data-garmin-freemap-provider-option])'
    )) {
      const selected = nativeOption.dataset.value === value;
      nativeOption.setAttribute("aria-selected", String(selected));
      nativeOption.classList.toggle("provider-active", selected);
    }

    label.textContent = labels[value];
    button.setAttribute("aria-expanded", "false");
  });

  button.addEventListener("click", () => {
    const expanded = button.getAttribute("aria-expanded") === "true";
    button.setAttribute("aria-expanded", String(!expanded));
  });
})();
