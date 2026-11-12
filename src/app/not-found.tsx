export const instant = false;

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4">
      <div className="max-w-md rounded-lg border border-zinc-200 bg-white p-6 text-center shadow-sm">
        <h2 className="text-lg font-bold text-zinc-900">Page introuvable</h2>
        <p className="mt-3 text-sm text-zinc-600">La page demandée n’existe pas ou n’est plus disponible.</p>
      </div>
    </div>
  );
}
