/* Language: ?lang= in the URL wins, then the saved choice, then the browser language.
   Static text is written in English in index.html; elements carry their Russian copy in data-ru
   and their Kazakh copy in data-kk (falls back to Russian when a Kazakh string is missing). */
(() => {
  const LANGS = ["en", "ru", "kk"];
  const fromUrl = new URLSearchParams(location.search).get("lang");
  let lang = LANGS.includes(fromUrl) ? fromUrl : null;
  try {
    if (lang) localStorage.setItem("ab-lang", lang);
    else lang = localStorage.getItem("ab-lang");
  } catch { /* storage blocked: fall back to the browser language */ }
  if (!LANGS.includes(lang)) {
    const nav = navigator.language || "";
    lang = /^kk/i.test(nav) ? "kk" : /^ru/i.test(nav) ? "ru" : "en";
  }

  window.AB_LANG = lang;
  window.L = (en, ru, kk) => (lang === "kk" ? (kk === undefined ? ru : kk) : lang === "ru" ? ru : en);
  document.documentElement.lang = lang;

  if (lang !== "en") {
    const pick = (el, attr) => {
      const kk = el.getAttribute(`data-kk${attr}`);
      return lang === "kk" && kk !== null ? kk : el.getAttribute(`data-ru${attr}`);
    };
    document.querySelectorAll("[data-ru], [data-kk]").forEach((el) => {
      const text = pick(el, "");
      if (text !== null) el.innerHTML = text;
    });
    ["placeholder", "aria-label", "title", "content", "value"].forEach((attr) => {
      document.querySelectorAll(`[data-ru-${attr}], [data-kk-${attr}]`).forEach((el) => {
        const text = pick(el, `-${attr}`);
        if (text !== null) el.setAttribute(attr, text);
      });
    });
  }
  // Длинные тексты (политика, условия) пишутся отдельными блоками на каждом языке
  document.querySelectorAll("[data-only]").forEach((el) => { el.hidden = el.dataset.only !== lang; });
  document.querySelectorAll("[data-lang]").forEach((a) => {
    if (a.dataset.lang === lang) a.setAttribute("aria-current", "true");
  });
})();
