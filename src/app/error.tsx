"use client";

// État d'erreur : affiché si le fichier Excel est introuvable ou illisible
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4">
      <div className="max-w-md rounded-lg border border-red-200 bg-white p-6 text-center shadow-sm">
        <h2 className="text-lg font-bold text-red-700">Erreur de chargement des données</h2>
        <p className="mt-3 break-words text-sm text-zinc-600">{error.message}</p>
        <button
          onClick={reset}
          className="mt-5 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Réessayer
        </button>
      </div>
    </div>
  );
}
