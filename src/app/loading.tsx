// État de chargement pendant la préparation de la page
export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-blue-600" />
      <p className="mt-4 text-sm text-zinc-500">Chargement des données SAP...</p>
    </div>
  );
}
