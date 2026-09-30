import type { Locale } from "./types";

type ShortMap = Record<Locale, string>;
type AriaMap = Record<Locale, string>;

export function initLanguageSwitch(options: {
  activeLocale: Locale;
  shortByLocale: ShortMap;
  ariaLabelByLocale: AriaMap;
}) {
  const { shortByLocale, ariaLabelByLocale } = options;
  const root = document.getElementById("lang-switch");
  const trigger = document.getElementById("lang-switch-trigger");
  const listbox = document.getElementById("lang-switch-listbox");
  const codeEl = root?.querySelector<HTMLElement>("[data-lang-code]");

  function isKnownLocale(loc: string | null | undefined): loc is Locale {
    return !!loc && Object.prototype.hasOwnProperty.call(shortByLocale, loc);
  }

  function currentLocale(): Locale {
    const api = window.visualspecLocale?.getLocale();
    if (api && isKnownLocale(api)) return api;
    return options.activeLocale;
  }

  function optionEls() {
    return listbox ? listbox.querySelectorAll<HTMLElement>(".lang-switch-option") : [];
  }

  function syncUi() {
    const current = currentLocale();
    if (codeEl) codeEl.textContent = shortByLocale[current] ?? shortByLocale.en ?? "EN";
    if (trigger && ariaLabelByLocale[current]) {
      trigger.setAttribute("aria-label", ariaLabelByLocale[current]);
    }
    optionEls().forEach((opt) => {
      const selected = opt.getAttribute("data-locale") === current;
      opt.setAttribute("aria-selected", selected ? "true" : "false");
      opt.classList.toggle("is-selected", selected);
    });
  }

  async function chooseLocale(locale: string | null) {
    if (!isKnownLocale(locale)) return;
    if (locale === currentLocale()) {
      closeList();
      return;
    }
    closeList();
    if (window.visualspecLocale) {
      await window.visualspecLocale.setLocale(locale);
    }
    syncUi();
  }

  function isOpen() {
    return trigger?.getAttribute("aria-expanded") === "true";
  }

  function openList() {
    if (!listbox || !trigger || !root) return;
    listbox.hidden = false;
    trigger.setAttribute("aria-expanded", "true");
    root.classList.add("is-open");
    const selected = listbox.querySelector<HTMLElement>(
      ".lang-switch-option[aria-selected='true']",
    );
    selected?.focus();
  }

  function closeList() {
    if (!listbox || !trigger || !root) return;
    listbox.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
    root.classList.remove("is-open");
  }

  function toggleList() {
    if (isOpen()) closeList();
    else openList();
  }

  function focusOption(delta: number) {
    if (!listbox) return;
    const opts = Array.from(optionEls());
    let idx = opts.findIndex((o) => o === document.activeElement);
    if (idx < 0) {
      idx = opts.findIndex((o) => o.getAttribute("aria-selected") === "true");
    }
    const next = (idx + delta + opts.length) % opts.length;
    opts[next]?.focus();
  }

  syncUi();
  window.addEventListener("visualspec-locale", () => syncUi());

  trigger?.addEventListener("click", () => toggleList());
  trigger?.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!isOpen()) openList();
      else focusOption(e.key === "ArrowDown" ? 1 : -1);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleList();
    }
  });

  listbox?.addEventListener("click", (e) => {
    const opt = (e.target as Element).closest(".lang-switch-option");
    if (!opt) return;
    void chooseLocale(opt.getAttribute("data-locale"));
  });

  listbox?.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      closeList();
      trigger?.focus();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      focusOption(1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      focusOption(-1);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const focused = document.activeElement;
      if (focused instanceof HTMLElement && focused.classList.contains("lang-switch-option")) {
        void chooseLocale(focused.getAttribute("data-locale"));
      }
    } else if (e.key === "Tab") {
      closeList();
    }
  });

  document.addEventListener("click", (e) => {
    if (!root || !isOpen()) return;
    if (!root.contains(e.target as Node)) closeList();
  });
}
