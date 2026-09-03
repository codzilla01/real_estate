import { Award, Sparkles, Handshake, ShieldCheck } from "lucide-react";
import { getTranslations } from "next-intl/server";

export async function WhyUsSection() {
  const t = await getTranslations("home");

  const reasons = [
    { icon: Award, title: t("whyUs1Title"), desc: t("whyUs1Desc") },
    { icon: Sparkles, title: t("whyUs2Title"), desc: t("whyUs2Desc") },
    { icon: Handshake, title: t("whyUs3Title"), desc: t("whyUs3Desc") },
    { icon: ShieldCheck, title: t("whyUs4Title"), desc: t("whyUs4Desc") },
  ];

  return (
    <section className="relative overflow-hidden py-20">
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgb(212_175_55/0.08),transparent_55%)]"
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-gold">
              {t("whyUsSubtitle")}
            </p>
            <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
              {t("whyUsTitle")}
            </h2>
            <p className="mt-4 text-muted-foreground">{t("whyUsSubtitle")}</p>

            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {reasons.map((reason) => (
                <div
                  key={reason.title}
                  className="rounded-xl border border-border bg-card p-5 shadow-sm"
                >
                  <reason.icon className="mb-3 h-7 w-7 text-gold" aria-hidden="true" />
                  <h3 className="font-bold">{reason.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {reason.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-2xl border border-gold/20 shadow-luxury">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80"
                alt="Luxury villa with pool"
                className="aspect-[4/3] w-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="glass absolute -bottom-6 left-1/2 w-[85%] -translate-x-1/2 rounded-2xl p-5 text-center shadow-luxury rtl:left-auto rtl:right-1/2 rtl:translate-x-1/2">
              <p className="text-gradient-gold text-3xl font-black">500+</p>
              <p className="mt-1 text-sm font-medium text-muted-foreground">
                {t("statProperties")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
