import { getTranslations } from "next-intl/server";
import { SearchHero } from "@/components/search/search-hero";

export async function Hero() {
  const t = await getTranslations("hero");

  return (
    <section className="relative flex min-h-[92vh] items-center justify-center overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1920&q=80')",
        }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-background" aria-hidden="true" />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-28 text-center sm:px-6">
        <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-4 py-1.5 text-xs font-semibold text-gold-light backdrop-blur-sm">
          ✦ {t("badge")}
        </p>

        <h1 className="mx-auto max-w-4xl text-4xl font-black leading-tight text-white sm:text-5xl lg:text-6xl">
          {t("titleStart")}{" "}
          <span className="text-gradient-gold">{t("titleHighlight")}</span>{" "}
          {t("titleEnd")}
        </h1>

        <p className="mx-auto mt-5 max-w-2xl text-base font-light leading-relaxed text-white/80 sm:text-lg">
          {t("subtitle")}
        </p>

        <div className="mt-10">
          <SearchHero />
        </div>
      </div>

      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/50 animate-bounce"
        aria-hidden="true"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
    </section>
  );
}
