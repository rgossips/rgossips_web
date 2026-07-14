import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { locales, defaultLocale } from "./config";

// next-intl "without i18n routing" setup: the active locale lives in a cookie
// (NEXT_LOCALE) instead of a URL prefix, so we don't have to move all 274
// pages under an app/[locale] segment. LanguageSwitcher writes the cookie;
// this runs on every request (Server + Client Components) and resolves the
// same locale + messages for both.
export default getRequestConfig(async () => {
  const store = await cookies();
  const cookieLocale = store.get("NEXT_LOCALE")?.value;
  const locale = locales.includes(cookieLocale) ? cookieLocale : defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
