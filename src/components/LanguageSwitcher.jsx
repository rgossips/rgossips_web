"use client";

import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { locales, localeNames } from "@/i18n/config";

// Language picker. Writes the chosen locale to the NEXT_LOCALE cookie (read by
// src/i18n/request.js) and refreshes so Server + Client Components re-render in
// the new language. Self-hides while only one locale is configured, so it's a
// no-op in the UI until a second language is added to src/i18n/config.js.
export default function LanguageSwitcher({ className = "" }) {
  const t = useTranslations("LanguageSwitcher");
  const locale = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (locales.length < 2) return null;

  const onChange = (e) => {
    const next = e.target.value;
    // 1 year, site-wide.
    document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=31536000; samesite=lax`;
    startTransition(() => router.refresh());
  };

  return (
    <label className={`inline-flex items-center gap-2 ${className}`}>
      <span className="sr-only">{t("label")}</span>
      <select
        value={locale}
        onChange={onChange}
        disabled={pending}
        aria-label={t("label")}
        className="text-sm rounded-lg border border-slate-300 bg-white px-2 py-1 text-slate-700 disabled:opacity-60 cursor-pointer"
      >
        {locales.map((l) => (
          <option key={l} value={l}>
            {localeNames[l] || l}
          </option>
        ))}
      </select>
    </label>
  );
}
