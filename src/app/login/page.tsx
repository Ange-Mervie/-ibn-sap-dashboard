import { redirect } from "next/navigation";
import Image from "next/image";
import { getSession } from "@/lib/auth";
import { getLocale } from "@/lib/locale";
import { t } from "@/lib/i18n";
import LoginForm from "@/components/LoginForm";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export const instant = false;

const STRIP = ["/banner/3.jpg", "/banner/5.jpg", "/banner/7.jpg"];

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
    <main className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <aside className="ibn-hero relative hidden flex-col justify-between overflow-hidden p-10 lg:flex">
        <Image src="/banner/4.jpg" alt="" fill priority sizes="50vw" className="object-cover opacity-25" />
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-white">
            <Image src="/IBN Logo.png" alt="IBN Group" width={44} height={44} className="object-contain" priority />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">IBN Group</p>
            <p className="text-[11px] text-blue-200/60">SAP Incident Tracking</p>
          </div>
        </div>

        <div className="relative z-10 max-w-md">
          <h1 className="text-balance text-[32px] font-semibold leading-tight tracking-tight text-white">
            {t(locale, "loginSubtitle")}
          </h1>
          <p className="mt-3 text-[13.5px] leading-relaxed text-slate-300">
            {t(locale, "footer")}
          </p>
          <div className="mt-8 flex gap-2">
            {STRIP.map((src) => (
              <div key={src} className="relative h-20 w-20 overflow-hidden rounded-lg ring-1 ring-inset ring-white/15">
                <Image src={src} alt="" fill sizes="80px" className="object-cover" />
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-[11px] text-blue-200/40">© 2025 IBN Group SARL</p>
      </aside>

      <section className="relative flex items-center justify-center bg-white px-5 py-12 sm:px-10">
        <div className="absolute right-4 top-4">
          <LanguageSwitcher locale={locale} />
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-[var(--ibn-border)] bg-white">
              <Image src="/IBN Logo.png" alt="IBN Group" width={40} height={40} className="object-contain" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--ibn-text-strong)]">IBN Group</p>
              <p className="text-[11px] text-[var(--ibn-text-muted)]">SAP Incident Tracking</p>
            </div>
          </div>

          <h2 className="text-[22px] font-semibold tracking-tight text-[var(--ibn-text-strong)]">
            {t(locale, "loginHeading")}
          </h2>
          <p className="mb-7 mt-1.5 text-[13px] text-[var(--ibn-text-muted)]">{t(locale, "loginSubtitle")}</p>

          <LoginForm redirectTo={from ?? "/"} locale={locale} />

          <p className="mt-8 text-center text-[11px] text-[var(--ibn-text-faint)]">{t(locale, "loginFooter")}</p>
        </div>
      </section>
    </main>
  );
}