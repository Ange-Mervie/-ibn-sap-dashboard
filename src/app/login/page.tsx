import { redirect } from "next/navigation";
import Image from "next/image";
import { getSession } from "@/lib/auth";
import { getLocale } from "@/lib/locale";
import { t } from "@/lib/i18n";
import LoginForm from "@/components/LoginForm";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export const instant = false;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const session = await getSession();
  if (session) redirect("/");

  const { from } = await searchParams;
  const locale = await getLocale();

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-4">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="mb-4 flex justify-end">
          <LanguageSwitcher locale={locale} />
        </div>
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-lg">
            <Image src="/IBN Logo.png" alt="IBN Group" width={64} height={64} className="object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-white">{t(locale, "appName")}</h1>
          <p className="mt-1 text-sm text-blue-200/70">{t(locale, "loginSubtitle")}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-md">
          <h2 className="mb-6 text-center text-lg font-semibold text-white">{t(locale, "loginHeading")}</h2>
          <LoginForm redirectTo={from ?? "/"} locale={locale} />
        </div>

        <p className="mt-6 text-center text-xs text-blue-200/40">{t(locale, "loginFooter")}</p>
      </div>
    </main>
  );
}
