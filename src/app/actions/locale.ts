"use server";

import { cookies } from "next/headers";
import { LOCALE_COOKIE, type Locale } from "@/lib/i18n";

export async function setLocale(locale: Locale): Promise<void> {
  const jar = await cookies();
  jar.set(LOCALE_COOKIE, locale, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });
}
