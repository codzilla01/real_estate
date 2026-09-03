import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { setRequestLocale } from "next-intl/server";
import { Hero } from "@/components/home/hero";
import { StatsSection } from "@/components/home/stats-section";
import { LocationsSection } from "@/components/home/locations-section";
import { ServicesSection } from "@/components/home/services-section";
import { WhyUsSection } from "@/components/home/why-us-section";
import { AgentsSection } from "@/components/home/agents-section";
import { TestimonialsSection } from "@/components/home/testimonials-section";
import { CtaSection } from "@/components/home/cta-section";
import { SectionHeading } from "@/components/home/section-heading";
import { PropertyGrid } from "@/components/property/property-grid";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { ArrowLeft } from "lucide-react";
import {
  fetchAgents,
  fetchAllProperties,
  fetchFeaturedProperties,
  fetchLocations,
  fetchNewProperties,
} from "@/lib/data-service";
import type { Lang } from "@/types";

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: HomePageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo" });
  return {
    title: t("homeTitle"),
    description: t("homeDescription"),
    alternates: {
      canonical: `/${locale}`,
      languages: {
        ar: "/ar",
        en: "/en",
      },
    },
  };
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");
  const tCommon = await getTranslations("common");

  const lang = locale as Lang;
  const [featured, fresh, all, agents, locations] = await Promise.all([
    fetchFeaturedProperties(6),
    fetchNewProperties(6),
    fetchAllProperties({ status: "available" }),
    fetchAgents(),
    fetchLocations(),
  ]);

  // Luxury collection: highest-priced available properties
  const luxury = [...all]
    .filter((p) => p.status === "available")
    .sort((a, b) => b.price - a.price)
    .slice(0, 6);

  return (
    <>
      <Hero />

      <StatsSection
        properties={all.length}
        agents={agents.length}
      />

      {/* Featured */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <SectionHeading
          eyebrow={t("featuredSubtitle")}
          title={t("featuredTitle")}
        />
        <div className="mt-10">
          <PropertyGrid properties={featured} />
        </div>
      </section>

      {/* New listings */}
      <section className="border-y border-border/60 bg-card/40 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeading
              eyebrow={t("newSubtitle")}
              title={t("newTitle")}
              align="start"
            />
            <Link href="/properties">
              <Button variant="outline">
                {tCommon("viewAll")}
                <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
              </Button>
            </Link>
          </div>
          <div className="mt-10">
            <PropertyGrid properties={fresh} />
          </div>
        </div>
      </section>

      {/* Luxury collection */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl border border-gold/25 bg-card p-8 shadow-luxury sm:p-12">
          <div
            className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgb(212_175_55/0.12),transparent_60%)]"
            aria-hidden="true"
          />
          <div className="relative">
            <SectionHeading
              eyebrow={t("luxurySubtitle")}
              title={t("luxuryTitle")}
            />
            <div className="mt-10">
              <PropertyGrid properties={luxury} />
            </div>
          </div>
        </div>
      </section>

      <LocationsSection locations={locations} locale={lang} />
      <ServicesSection />
      <WhyUsSection />
      <AgentsSection agents={agents} locale={lang} />
      <TestimonialsSection />
      <CtaSection />
    </>
  );
}
