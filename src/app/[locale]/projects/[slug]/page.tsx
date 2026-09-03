import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { setRequestLocale } from "next-intl/server";
import Image from "next/image";
import { Wallet, CalendarClock, Layers, MapPin } from "lucide-react";
import { fetchProjectBySlug, fetchProjects } from "@/lib/data-service";
import { l10n, formatPrice } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import type { Lang } from "@/types";

interface ProjectPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateStaticParams() {
  const projects = await fetchProjects();
  return ["ar", "en"].flatMap((locale) =>
    projects.map((p) => ({ locale, slug: p.slug })),
  );
}

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const project = await fetchProjectBySlug(slug);
  if (!project) return { title: "Project not found" };
  return {
    title: `${l10n(project.name, locale as Lang)} | Al Maktab Al Aqari`,
    description: l10n(project.description, locale as Lang),
    alternates: { canonical: `/${locale}/projects/${slug}` },
  };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const lang = locale as Lang;
  const t = await getTranslations("projects");

  const project = await fetchProjectBySlug(slug);
  if (!project) notFound();

  const settings = (await import("@/lib/seed-data")).getSeedData().settings;

  const amenityLabels: Record<string, { ar: string; en: string }> = {
    pool: { ar: "مسبح", en: "Pool" },
    gym: { ar: "نادي رياضي", en: "Gym" },
    parking: { ar: "مواقف", en: "Parking" },
    security: { ar: "حراسة", en: "Security" },
    balcony: { ar: "شرفة", en: "Balcony" },
    garden: { ar: "حديقة", en: "Garden" },
    beachAccess: { ar: "شاطئ", en: "Beach" },
    concierge: { ar: "كونسيرج", en: "Concierge" },
    smartHome: { ar: "منزل ذكي", en: "Smart Home" },
    centralAc: { ar: "تكييف مركزي", en: "Central AC" },
    elevator: { ar: "مصعد", en: "Elevator" },
    childrenPlayArea: { ar: "ألعاب أطفال", en: "Kids Play Area" },
    cityView: { ar: "إطلالة مدينة", en: "City View" },
    marinaView: { ar: "إطلالة مارينا", en: "Marina View" },
    seaView: { ar: "إطلالة بحرية", en: "Sea View" },
    spa: { ar: "سبا", en: "Spa" },
    bbqArea: { ar: "منطقة شواء", en: "BBQ Area" },
  };

  return (
    <>
      <PageHeader
        title={l10n(project.name, lang)}
        subtitle={project.developer}
        breadcrumb={[
          { label: t("title"), href: "/projects" },
          { label: l10n(project.name, lang) },
        ]}
      />

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_360px]">
          <div>
            {/* Gallery */}
            <div className="grid grid-cols-2 gap-3">
              {project.images.slice(0, 4).map((image, index) => (
                <div
                  key={image}
                  className={`relative overflow-hidden rounded-xl border border-border ${index === 0 ? "col-span-2 aspect-[16/8]" : "aspect-[16/10]"}`}
                >
                  <Image
                    src={image}
                    alt={l10n(project.name, lang)}
                    fill
                    sizes="(min-width: 1024px) 50vw, 100vw"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>

            <section className="mt-10">
              <h2 className="mb-4 text-xl font-bold">
                {lang === "ar" ? "عن المشروع" : "About the project"}
              </h2>
              <p className="leading-8 text-muted-foreground">
                {l10n(project.description, lang)}
              </p>
            </section>

            {project.amenities.length > 0 && (
              <section className="mt-10">
                <h2 className="mb-4 text-xl font-bold">{t("amenities")}</h2>
                <div className="flex flex-wrap gap-2">
                  {project.amenities.map((amenity) => (
                    <Badge key={amenity} variant="goldSoft" className="px-3 py-1.5">
                      {amenityLabels[amenity]?.[lang] ?? amenity}
                    </Badge>
                  ))}
                </div>
              </section>
            )}
          </div>

          <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-xl border border-gold/25 bg-card p-6 shadow-sm">
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 text-gold" aria-hidden="true" />
                {project.location}
              </p>
              <div className="mt-5 space-y-4">
                <div>
                  <p className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Wallet className="h-4 w-4 text-gold" aria-hidden="true" />
                    {t("startingPrice")}
                  </p>
                  <p className="mt-1 text-2xl font-black text-gradient-gold" dir="ltr">
                    {formatPrice(project.startingPrice, "AED", lang)}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 border-t border-border pt-4">
                  <div>
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CalendarClock className="h-3.5 w-3.5 text-gold" aria-hidden="true" />
                      {t("completionDate")}
                    </p>
                    <p className="mt-1 font-bold">{project.completionDate}</p>
                  </div>
                  <div>
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Layers className="h-3.5 w-3.5 text-gold" aria-hidden="true" />
                      {t("units")}
                    </p>
                    <p className="mt-1 font-bold">{project.units}</p>
                  </div>
                </div>
              </div>
              <div className="mt-6 space-y-2">
                <Link href="/contact">
                  <Button variant="gold" className="w-full">
                    {t("contactDeveloper")}
                  </Button>
                </Link>
                <Link href="/properties">
                  <Button variant="outline" className="w-full">
                    {t("availableUnits")}
                  </Button>
                </Link>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">
              <p className="font-bold text-foreground">{project.developer}</p>
              <p className="mt-1 text-xs">{settings.companyName.en}</p>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
