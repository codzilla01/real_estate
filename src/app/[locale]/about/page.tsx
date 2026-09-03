import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { setRequestLocale } from "next-intl/server";
import { fetchAgents } from "@/lib/data-service";
import { PageHeader } from "@/components/layout/page-header";
import { AgentsSection } from "@/components/home/agents-section";
import { StatsSection } from "@/components/home/stats-section";
import { CtaSection } from "@/components/home/cta-section";
import type { Lang } from "@/types";

interface AboutPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: AboutPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo" });
  return { title: t("aboutTitle"), description: t("homeDescription") };
}

export default async function AboutPage({ params }: AboutPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const lang = locale as Lang;
  const t = await getTranslations("about");

  const agents = await fetchAgents();

  return (
    <>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-gold">
              {t("storyTitle")}
            </p>
            <h2 className="text-2xl font-black sm:text-3xl">{t("storyTitle")}</h2>
            <p className="mt-4 leading-8 text-muted-foreground">{t("storyText")}</p>
          </div>
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-gold">
              {t("missionTitle")}
            </p>
            <h2 className="text-2xl font-black sm:text-3xl">{t("missionTitle")}</h2>
            <p className="mt-4 leading-8 text-muted-foreground">{t("missionText")}</p>
            <div className="mt-8">
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-gold">
                {t("visionTitle")}
              </p>
              <h2 className="text-2xl font-black sm:text-3xl">{t("visionTitle")}</h2>
              <p className="mt-4 leading-8 text-muted-foreground">{t("visionText")}</p>
            </div>
          </div>
        </div>

        <div className="mt-14">
          <h2 className="mb-5 text-xl font-bold">{t("valuesTitle")}</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="rounded-xl border border-gold/20 bg-gold/5 p-4 text-center text-sm font-semibold"
              >
                {t(`values.${i}`)}
              </div>
            ))}
          </div>
        </div>
      </section>

      <StatsSection properties={20} agents={agents.length} />
      <AgentsSection agents={agents} locale={lang} />
      <CtaSection />
    </>
  );
}
