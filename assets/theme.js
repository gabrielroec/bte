/*
@license
  Expanse by Archetype Themes (https://archetypethemes.co)
  Access unminified JS in assets/theme.js

  Use this event listener to run your own JS outside of this file.
  Documentation - https://archetypethemes.co/blogs/expanse/javascript-events-for-developers

  document.addEventListener('page:loaded', function() {
    // Page has loaded and theme assets are ready
  });
*/

if (console && console.log) {
  console.log(
    "Expanse theme (" +
      theme.settings.themeVersion +
      ") by ARCHΞTYPE | Learn more at https://archetypethemes.co"
  );
}

(function () {
  "use strict";

  if (
    window.Shopify &&
    window.Shopify.theme &&
    navigator &&
    navigator.sendBeacon &&
    window.Shopify.designMode
  ) {
    navigator.sendBeacon(
      "https://api.archetypethemes.co/api/beacon",
      new URLSearchParams({
        shop: window.Shopify.shop,
        themeName:
          window.theme &&
          window.theme.settings &&
          `${window.theme.settings.themeName} v${window.theme.settings.themeVersion}`,
        role: window.Shopify.theme.role,
        route: window.location.pathname,
        themeId: window.Shopify.theme.id,
        themeStoreId: window.Shopify.theme.theme_store_id || 0,
        isThemeEditor: !!window.Shopify.designMode,
      })
    );
  }

  /*============================================================================
    Things that don't require DOM to be ready
  ==============================================================================*/

  /*============================================================================
    Things that require DOM to be ready
  ==============================================================================*/
  function DOMready(callback) {
    if (document.readyState != "loading") callback();
    else document.addEventListener("DOMContentLoaded", callback);
  }

  DOMready(function () {
    document.dispatchEvent(new CustomEvent("page:loaded"));
  });
})();
