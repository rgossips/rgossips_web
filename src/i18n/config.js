// i18n config — CLIENT-SAFE constants only.
//
// This file must not import next/headers or next-intl/server so it can be
// pulled into Client Components (e.g. the LanguageSwitcher). The server-side
// request config lives in ./request.js.
//
// To add a language:
//   1. Add its code here and a display name in `localeNames`.
//   2. Create messages/<code>.json (copy en.json and translate the values).
// That's it — the switcher and provider pick it up automatically.

export const locales = ["en"];
export const defaultLocale = "en";

// Human-readable names shown in the language switcher, in the language itself.
export const localeNames = {
  en: "English",
  // hi: "हिन्दी",
  // ta: "தமிழ்",
};
