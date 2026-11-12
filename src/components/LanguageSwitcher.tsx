"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setLocale } from "@/app/actions/locale";
import type { Locale } from "@/lib/i18n";

export default function LanguageSwitcher({
  locale,
  className = "",
}: {
  locale: Locale;
  className?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function change(next: Locale) {
    if (next === locale) return;
    startTransition(async () => {
      await setLocale(next);
      router.refresh();
    });
  }

  return (
    <div className={`inline-flex items-center rounded-md border border-zinc-300 bg-white p-0.5 text-xs ${className}`} aria-label="Language">
      <button
        type="button"
        onClick={() => change("fr")}
        disabled={pending}
        className={`rounded px-2 py-1 font-medium ${locale === "fr" ? "bg-blue-600 text-white" : "text-zinc-700 hover:bg-zinc-100"}`}
      >
        FR
      </button>
      <button
        type="button"
        onClick={() => change("en")}
        disabled={pending}
        className={`rounded px-2 py-1 font-medium ${locale === "en" ? "bg-blue-600 text-white" : "text-zinc-700 hover:bg-zinc-100"}`}
      >
        EN
      </button>
    </div>
  );
}
