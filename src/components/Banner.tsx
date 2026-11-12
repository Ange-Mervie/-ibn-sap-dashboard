"use client";

import Image from "next/image";

// Bande d'images défilantes en haut de chaque page.
// Pour changer les images : modifier le tableau `images` ci-dessous.
// Les images sont dans le dossier public/banner/

const images = [
  { src: "/banner/team.jpg", alt: "Équipe au travail" },
  { src: "/banner/server.jpg", alt: "Serveurs et infrastructure" },
  { src: "/banner/office.jpg", alt: "Bureau professionnel" },
  { src: "/banner/laptop.jpg", alt: "Développement informatique" },
  { src: "/banner/meeting.jpg", alt: "Réunion d'équipe" },
  { src: "/banner/data.jpg", alt: "Analyse de données" },
];

export default function Banner() {
  return (
    <div className="relative overflow-hidden bg-zinc-900 py-3">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-zinc-900 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-zinc-900 to-transparent" />

      <div className="banner-track">
        {[...images, ...images].map((img, index) => (
          <div
            key={`${img.src}-${index}`}
            className="relative h-24 w-40 shrink-0 overflow-hidden rounded-md sm:h-28 sm:w-48"
          >
            <Image
              src={img.src}
              alt={img.alt}
              fill
              sizes="(min-width: 640px) 192px, 160px"
              className="object-cover opacity-80 transition-opacity hover:opacity-100"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
