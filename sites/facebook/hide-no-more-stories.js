// Facebook: hide body-level "No More Stories Found" banner when it appears
(function () {
  const PHRASE = "No More Stories Found";

  function hideMatches(body) {
    for (const el of body.children) {
      if (el.textContent && el.textContent.includes(PHRASE)) {
        el.style.setProperty("display", "none", "important");
      }
    }
  }

  function start(body) {
    hideMatches(body);
    new MutationObserver(() => hideMatches(body)).observe(body, {
      childList: true,
      subtree: false,
    });
  }

  if (document.body) {
    start(document.body);
  } else {
    document.addEventListener("DOMContentLoaded", () => start(document.body), {
      once: true,
    });
  }
})();
