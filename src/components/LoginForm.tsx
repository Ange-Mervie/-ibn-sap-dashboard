"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { t, type Locale } from "@/lib/i18n";

export default function LoginForm({ redirectTo, locale = "fr" }: { redirectTo: string; locale?: Locale }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        const safeRedirect = redirectTo.startsWith("/") && !redirectTo.startsWith("//") && !redirectTo.includes("\\")
          ? redirectTo
          : "/";
        router.push(safeRedirect);
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? (locale === "fr" ? "Erreur de connexion. Veuillez réessayer." : "Login failed. Please try again."));
      }
    } catch {
      setError(locale === "fr" ? "Impossible de joindre le serveur. Vérifiez votre connexion." : "Unable to reach the server. Check your connection.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} data-login-form className="space-y-5">
      <div>
        <label htmlFor="login-email" className="ibn-label">
          {t(locale, "loginEmail")}
        </label>
        <input
          id="login-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={locale === "fr" ? "votre@email.com" : "you@example.com"}
          className="ibn-input py-2.5"
        />
      </div>

      <div>
        <label htmlFor="login-password" className="ibn-label">
          {t(locale, "loginPassword")}
        </label>
        <div className="relative">
          <input
            id="login-password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="ibn-input py-2.5 pr-10"
          />
          <button
            type="button"
            aria-label={showPassword ? (locale === "fr" ? "Masquer le mot de passe" : "Hide password") : (locale === "fr" ? "Afficher le mot de passe" : "Show password")}
            onClick={() => setShowPassword((v) => !v)}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 transition hover:text-slate-600"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          data-login-error
          className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-[12.5px] text-red-700"
        >
          {error}
        </div>
      )}

      <button
        id="login-submit"
        type="submit"
        disabled={loading}
        className="ibn-btn ibn-btn-primary w-full py-2.5"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 size={15} className="animate-spin" />
            {t(locale, "loginLoading")}
          </span>
        ) : (
          t(locale, "loginSubmit")
        )}
      </button>
    </form>
  );
}