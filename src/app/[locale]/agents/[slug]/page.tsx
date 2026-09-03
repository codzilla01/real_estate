import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { setRequestLocale } from "next-intl/server";
import {
  Phone,
  MessageCircle,
  BadgeCheck,
  Languages,
  MapPin,
  Award,
  Briefcase,
} from "lucide-react";
import { fetchAgent, fetchAgents, fetchPropertiesByAgent } from "@/lib/data-service";
import { buildWhatsAppLink, formatCompact, l10n } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";
import { PropertyCard } from "@/components/property/property-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/site-config";
import type { Lang } from "@/types";

interface AgentPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

const LANGUAGE_LABELS: Record<string, string> = {
  ar: "العربية",
  en: "English",
  fr: "Français",
  ru: "Русский",
  de: "Deutsch",
  ur: "اردو",
};

export async function generateStaticParams() {
  const agents = await fetchAgents();
  return ["ar", "en"].flatMap((locale) =>
    agents.map((a) => ({ locale, slug: a.id })),
  );
}

export async function generateMetadata({
  params,
}: AgentPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const agent = await fetchAgent(slug);
  if (!agent) return { title: "Agent not found" };
  const t = await getTranslations({ locale, namespace: "seo" });
  const name = agent.name;
  return {
    title: `${name} | ${t("agentsTitle")}`,
    description: l10n(agent.bio, locale as Lang) || `${name} — ${t("homeDescription")}`,
    alternates: { canonical: `/${locale}/agents/${slug}` },
    openGraph: {
      title: name,
      description: l10n(agent.bio, locale as Lang) ?? "",
      images: agent.photo ? [{ url: agent.photo }] : undefined,
    },
  };
}

export default async function AgentPage({ params }: AgentPageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const lang = locale as Lang;
  const t = await getTranslations("agents");

  const agent = await fetchAgent(slug);
  if (!agent) notFound();

  const [properties] = await Promise.all([
    fetchPropertiesByAgent(agent.id),
  ]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: agent.name,
    jobTitle: lang === "ar" ? "مستشار عقاري" : "Real Estate Agent",
    telephone: agent.phone,
    email: agent.email,
    image: agent.photo,
    worksFor: {
      "@type": "Organization",
      name: siteConfig.name.en,
    },
    knowsLanguage: agent.languages,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PageHeader
        title={agent.name}
        subtitle={
          agent.experienceYears
            ? lang === "ar"
              ? `${agent.experienceYears}+ سنة خبرة في السوق العقاري`
              : `${agent.experienceYears}+ years of market experience`
            : t("subtitle")
        }
        breadcrumb={[{ label: t("title"), href: "/agents" }]}
      />

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[360px_1fr]">
          {/* Profile card */}
          <Card className="h-fit">
            <CardContent className="p-6">
              <div className="relative mx-auto h-40 w-40 overflow-hidden rounded-full border-2 border-gold/40 shadow-gold-glow">
                {agent.photo ? (
                  <Image
                    src={agent.photo}
                    alt={agent.name}
                    fill
                    sizes="160px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-muted text-5xl font-black text-gold">
                    {agent.name.slice(0, 1)}
                  </div>
                )}
              </div>

              <h1 className="mt-5 text-center text-2xl font-black">{agent.name}</h1>
              <div className="mt-2 flex justify-center">
                <Badge variant="gold" className="gap-1">
                  <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
                  {lang === "ar" ? "مستشار معتمد" : "Verified Agent"}
                </Badge>
              </div>

              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Briefcase className="h-4 w-4 text-gold" aria-hidden="true" />
                  <span>
                    {agent.experienceYears}+{" "}
                    {lang === "ar" ? "سنة خبرة" : "years experience"}
                  </span>
                </div>
                {agent.languages && agent.languages.length > 0 && (
                  <div className="flex items-center gap-3 text-sm">
                    <Languages className="h-4 w-4 text-gold" aria-hidden="true" />
                    <span>
                      {agent.languages
                        .map((l) => LANGUAGE_LABELS[l] ?? l)
                        .join(" · ")}
                    </span>
                  </div>
                )}
                {agent.areas && agent.areas.length > 0 && (
                  <div className="flex items-start gap-3 text-sm">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
                    <div className="flex flex-wrap gap-1.5">
                      {agent.areas.map((area) => (
                        <span
                          key={area}
                          className="rounded-full border border-border px-2.5 py-0.5 text-xs"
                        >
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {agent.specialties && agent.specialties.length > 0 && (
                  <div className="flex items-start gap-3 text-sm">
                    <Award className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
                    <div className="flex flex-wrap gap-1.5">
                      {agent.specialties.map((s) => (
                        <span
                          key={s}
                          className="rounded-full bg-gold/10 px-2.5 py-0.5 text-xs font-semibold text-gold"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 grid grid-cols-2 gap-2">
                <Button variant="outline" asChild>
                  <a href={`tel:${agent.phone}`}>
                    <Phone className="h-4 w-4" aria-hidden="true" />
                    {lang === "ar" ? "اتصال" : "Call"}
                  </a>
                </Button>
                <Button variant="gold" asChild>
                  <a
                    href={buildWhatsAppLink(
                      agent.whatsapp ?? agent.phone,
                      lang === "ar"
                        ? `مرحبًا، أرغب بالتواصل مع ${agent.name}`
                        : `Hello, I'd like to contact ${agent.name}`,
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle className="h-4 w-4" aria-hidden="true" />
                    WhatsApp
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Bio + listings */}
          <div className="space-y-8">
            {agent.bio && (
              <div className="prose prose-invert max-w-none">
                <p className="leading-8 text-muted-foreground">
                  {l10n(agent.bio, lang)}
                </p>
              </div>
            )}

            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-black">
                  {lang === "ar" ? "عقارات المستشار" : "Agent Listings"}
                </h2>
                <span className="rounded-full border border-border px-3 py-1 text-xs font-semibold">
                  {formatCompact(properties.length, lang)}
                </span>
              </div>
              {properties.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-sm text-muted-foreground">
                    {lang === "ar"
                      ? "لا توجد عقارات متاحة حاليًا"
                      : "No listings available right now"}
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {properties.map((property) => (
                    <PropertyCard key={property.id} property={property} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
