import "@archetype-themes/scripts/config";

window.onpageshow = function (evt) {
  // Removes unload class when returning to page via history
  if (evt.persisted) {
    document.body.classList.remove("unloading");
    document.querySelectorAll(".cart__checkout").forEach((el) => {
      el.classList.remove("btn--loading");
    });
  }
};

// Used in Motion, Fetch, Gem and Expanse to fade between pages.
// initialize in theme.js with theme.pageTransitions();
theme.pageTransitions = function () {
  if (document.body.dataset.transitions === "true") {
    // Hack test to fix Safari page cache issue.
    // window.onpageshow doesn't always run when navigating
    // back to the page, so the unloading class remains, leaving
    // a white page. Setting a timeout to remove that class when leaving
    // the page actually finishes running when they come back.
    if (!!navigator.userAgent.match(/Version\/[\d\.]+.*Safari/)) {
      window.setTimeout(function () {
        document.body.classList.remove("unloading");
      }, 1200);
    }

    function hasExternalVideoUrl(href) {
      return (
        href.indexOf("youtube.com/watch") > -1 ||
        href.indexOf("youtu.be/") > -1 ||
        href.indexOf("player.vimeo.com/video/") > -1 ||
        href.indexOf("vimeo.com/") > -1
      );
    }

    function shouldSkipTransition(link, evt) {
      if (!link) return true;
      if (evt.metaKey || evt.ctrlKey || evt.shiftKey || evt.altKey) return true;
      if (evt.defaultPrevented) return true;
      if (link.classList.contains("js-no-transition")) return true;
      if (link.classList.contains("hero__slide-link")) return true;
      if (link.hasAttribute("download")) return true;
      if ((link.getAttribute("target") || "").toLowerCase() === "_blank") return true;

      var hrefAttr = link.getAttribute("href") || "";
      if (!hrefAttr || hrefAttr.indexOf("javascript:") === 0) return true;
      if (hrefAttr.indexOf("mailto:") === 0 || hrefAttr.indexOf("#") === 0) return true;
      if (hasExternalVideoUrl(hrefAttr)) return true;

      var destination = link.href;
      if (!destination) return true;

      try {
        var destinationUrl = new URL(destination, window.location.href);
        if (destinationUrl.origin !== window.location.origin) return true;
      } catch (error) {
        return true;
      }

      return false;
    }

    document.addEventListener("click", function (evt) {
      var link = evt.target.closest("a");
      if (!link) return;

      if (link.classList.contains("mobile-nav__link") && theme.NavDrawer && typeof theme.NavDrawer.close === "function") {
        theme.NavDrawer.close();
      }

      if (shouldSkipTransition(link, evt)) return;

      evt.preventDefault();
      document.body.classList.add("unloading");

      window.setTimeout(function () {
        window.location.href = link.href;
      }, 50);
    });
  }
};
