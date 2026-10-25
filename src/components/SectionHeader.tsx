// ============================================================
// En-tête de section avec image de fond
// Chaque section (Vue d'ensemble, Suivi, Analyse) a la sienne
// Modifier `image` pour changer l'image de fond
// ============================================================

type SectionHeaderProps = {
  title: string;
  subtitle: string;
  image: string;
};

export default function SectionHeader({ title, subtitle, image }: SectionHeaderProps) {
  return (
    <div className="relative mb-8 overflow-hidden rounded-xl">
      {/* Image de fond */}
      <img
        src={image}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      {/* Voile sombre pour que le texte reste lisible */}
      <div className="absolute inset-0 bg-gradient-to-r from-zinc-900/85 via-zinc-900/60 to-zinc-900/30" />

      {/* Texte */}
      <div className="relative px-6 py-8 sm:px-10 sm:py-12">
        <h2 className="text-2xl font-bold text-white sm:text-3xl">{title}</h2>
        <p className="mt-2 max-w-xl text-sm text-zinc-300">{subtitle}</p>
      </div>
    </div>
  );
}
