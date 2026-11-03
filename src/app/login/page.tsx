// Page /login — Formulaire de connexion (Server Component avec Client Form)
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import LoginForm from "@/components/LoginForm";
import Image from "next/image";

export const metadata = {
  title: "Connexion — Suivi des incidents SAP",
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
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-lg overflow-hidden">
            <Image src="/IBN Logo.png" alt="IBN Group" width={64} height={64} className="object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-white">IBN Group</h1>
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
