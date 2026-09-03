import {
  Home,
  KeyRound,
  LineChart,
  TrendingUp,
  ShieldCheck,
  Megaphone,
} from "lucide-react";
import { getTranslations } from "next-intl/server";

export async function ServicesSection() {
  const t = await getTranslations("services");

  const services = [
    { icon: Home, title: t("buySellTitle"), desc: t("buySellDesc") },
    { icon: KeyRound, title: t("managementTitle"), desc: t("managementDesc") },
    { icon: LineChart, title: t("consultingTitle"), desc: t("consultingDesc") },
    { icon: TrendingUp, title: t("investmentTitle"), desc: t("investmentDesc") },
    { icon: ShieldCheck, title: t("valuationTitle"), desc: t("valuationDesc") },
    { icon: Megaphone, title: t("marketingTitle"), desc: t("marketingDesc") },
  ];

  return (
    <section className="border-y border-border/60 bg-card/50 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-gold">
            {t("subtitle")}
          </p>
          <h2 className="text-3xl font-black tracking-tight sm:text-4xl">{t("title")}</h2>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <div
              key={service.title}
              className="group rounded-xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-gold/40 hover:shadow-luxury"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gold/10 transition-colors group-hover:bg-gold-gradient">
                <service.icon className="h-6 w-6 text-gold transition-colors group-hover:text-black" aria-hidden="true" />
              </div>
              <h3 className="mb-2 font-bold">{service.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{service.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
