// Page /login — Formulaire de connexion (Server Component avec Client Form)
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import LoginForm from "@/components/LoginForm";

export const metadata = {
  title: "Connexion — IBN SAP Dashboard",
  description: "Accès sécurisé au tableau de bord de suivi SAP d'IBN Group",
};

// Route bloquante
export const instant = false;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const session = await getSession();
  if (session) redirect("/");

  const { from } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-4">
      {/* Fond décoratif */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo / En-tête */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 shadow-lg shadow-blue-500/30">
            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">IBN SAP Dashboard</h1>
          <p className="mt-1 text-sm text-blue-200/70">
            IBN Group SARL — Suivi des incidents SAP
          </p>
        </div>

        {/* Carte de connexion */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-md">
          <h2 className="mb-6 text-center text-lg font-semibold text-white">
            Connexion à votre espace
          </h2>
          <LoginForm redirectTo={from ?? "/"} />
        </div>

        {/* Pied de page */}
        <p className="mt-6 text-center text-xs text-blue-200/40">
          Accès réservé au personnel autorisé d&apos;IBN Group SARL
        </p>
      </div>
    </main>
  );
}
