// ============================================================
// En-tête de section IBN — bannière navy avec identité visuelle
// Modifier `image` pour changer l'image de fond
// ============================================================

type SectionHeaderProps = {
  title: string;
  subtitle: string;
  image?: string;
};

export default function SectionHeader({ title, subtitle, image }: SectionHeaderProps) {
  return (
    <div className="relative mb-8 overflow-hidden rounded-2xl bg-[#0a1f44] shadow-sm">
      {image ? (
        <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-r from-[#060f24]/95 via-[#0a1f44]/80 to-[#0b2545]/70" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/60 to-transparent" />
      <div className="relative px-6 py-8 sm:px-10 sm:py-12">
        <h2 className="text-2xl font-bold text-white sm:text-3xl">{title}</h2>
        <p className="mt-2 max-w-xl text-sm text-slate-300">{subtitle}</p>
      </div>
    </div>
  );
}
