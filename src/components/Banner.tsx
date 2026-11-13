"use client";

import Image from "next/image";

const GALLERY = [
  { src: "/banner/3.jpg", alt: "Équipe IBN" },
  { src: "/banner/4.jpg", alt: "Poste de travail" },
  { src: "/banner/5.jpg", alt: "Réunion" },
  { src: "/banner/6.jpg", alt: "Infrastructure" },
  { src: "/banner/7.jpg", alt: "Support SAP" },
];

export type HeroMeta = { label: string; value: string };

export default function Banner({
  title,
  subtitle,
  meta = [],
}: {
  title: string;
  subtitle: string;
  meta?: HeroMeta[];
}) {
  return (
    <section className="ibn-hero" aria-label="En-tête">
      <Image
        src="/banner/2.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover opacity-30"
      />
      <div className="relative z-10 mx-auto flex max-w-[1440px] flex-col gap-8 px-4 py-8 lg:flex-row lg:items-end lg:justify-between lg:px-8 lg:py-10">
        <div className="min-w-0">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-blue-300/80">
            IBN Group · SAP Support
          </p>
          <h2 className="mt-2 text-balance text-2xl font-semibold tracking-tight text-white sm:text-[28px]">
            {title}
          </h2>
          <p className="mt-2 max-w-2xl text-pretty text-[13.5px] leading-relaxed text-slate-300">
            {subtitle}
          </p>

          {meta.length > 0 && (
            <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-3">
              {meta.map((m) => (
                <div key={m.label}>
                  <dt className="text-[10.5px] font-medium uppercase tracking-wider text-blue-200/50">
                    {m.label}
                  </dt>
                  <dd className="mt-0.5 text-sm font-semibold text-white">{m.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>

        <div className="hidden shrink-0 gap-2 lg:grid lg:grid-cols-5">
          {GALLERY.map((img, i) => (
            <div
              key={img.src}
              className={`relative h-16 w-14 overflow-hidden rounded-lg ring-1 ring-inset ring-white/15 xl:h-20 xl:w-16 ${
                i === 0 ? "lg:translate-y-2" : ""
              }`}
            >
              <Image src={img.src} alt={img.alt} fill sizes="80px" className="object-cover" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}