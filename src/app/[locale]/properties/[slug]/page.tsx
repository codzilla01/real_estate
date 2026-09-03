import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { setRequestLocale } from "next-intl/server";
import {
  BedDouble,
  Bath,
  Car,
  Ruler,
  Calendar,
  Sofa,
  MapPin,
  Share2,
} from "lucide-react";
import {
  fetchAgent,
  fetchPropertyBySlug,
  fetchRelatedProperties,
} from "@/lib/data-service";
import { formatPrice, l10n, propertyWhatsAppMessage, buildWhatsAppLink, buildTelLink } from "@/lib/utils";
import { PropertyGallery } from "@/components/property/property-gallery";
import { PropertyGrid } from "@/components/property/property-grid";
import { PropertyActions } from "@/components/property/property-actions";
import { MapWrapper } from "@/components/maps/map-wrapper";
import { PageHeader } from "@/components/layout/page-header";
import { SectionHeading } from "@/components/home/section-heading";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { propertyTypeLabel, PropertyStatusBadge } from "@/components/property/property-status-badge";
import { siteConfig } from "@/lib/site-config";
import type { Lang, Property } from "@/types";

interface PropertyDetailPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({
  params,
}: PropertyDetailPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const lang = locale as Lang;
  const property = await fetchPropertyBySlug(slug);
  if (!property) return { title: "Property not found" };

  const title = l10n(property.seoTitle ?? property.title, lang);
  const description =
    l10n(property.seoDescription, lang)?.slice(0, 160) ??
    l10n(property.description, lang).slice(0, 160);
  const cover = property.images.find((i) => i.isCover)?.url ?? property.images[0]?.url ?? siteConfig.ogImage;

  return {
    title,
    description,
    alternates: { canonical: `/${locale}/properties/${slug}` },
    openGraph: {
      title,
      description,
      type: "website",
      images: [{ url: cover, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [cover],
    },
  };
}

function buildJsonLd(property: Property, lang: Lang, agentName?: string) {
  const cover = property.images.find((i) => i.isCover)?.url ?? property.images[0]?.url;
  return {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: l10n(property.title, lang),
    description: l10n(property.description, lang).slice(0, 500),
    url: `${siteConfig.url}/${lang}/properties/${property.slug}`,
    image: cover ? [cover] : undefined,
    offers: {
      "@type": "Offer",
      price: property.price,
      priceCurrency: property.currency,
      availability: property.status === "available" ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: property.city,
      addressRegion: "Dubai",
      addressCountry: "AE",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: property.latitude,
      longitude: property.longitude,
    },
    numberOfRooms: property.bedrooms,
    numberOfBathroomsTotal: property.bathrooms,
    floorSize: {
      "@type": "QuantitativeValue",
      value: property.area,
      unitCode: "MTK",
    },
    ...(agentName
      ? {
          seller: {
            "@type": "RealEstateAgent",
            name: agentName,
          },
        }
      : {}),
  };
}

export default async function PropertyDetailPage({ params }: PropertyDetailPageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const lang = locale as Lang;
  const t = await getTranslations("property");
  const tProperties = await getTranslations("properties");

  const property = await fetchPropertyBySlug(slug);
  if (!property) notFound();

  const [agent, related] = await Promise.all([
    property.agentId ? fetchAgent(property.agentId) : Promise.resolve(null),
    fetchRelatedProperties(property),
  ]);

  const amenities = property.amenities;

  const specs: Array<{ icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>; label: string; value: string }> = [    { icon: Ruler, label: t("area"), value: `${property.area.toLocaleString(lang === "ar" ? "ar-AE" : "en-US")} م²` },
    { icon: BedDouble, label: t("bedrooms"), value: String(property.bedrooms) },
    { icon: Bath, label: t("bathrooms"), value: String(property.bathrooms) },
    { icon: Car, label: t("parking"), value: String(property.parking) },
    { icon: Calendar, label: t("yearBuilt"), value: String(property.yearBuilt ?? "—") },
    { icon: Sofa, label: t("furnished"), value: property.furnished ? t("furnishedYes") : t("furnishedNo") },
  ];

  const amenityLabels: Record<string, { ar: string; en: string }> = {
    pool: { ar: "مسبح", en: "Swimming Pool" },
    gym: { ar: "نادي رياضي", en: "Gym" },
    parking: { ar: "مواقف سيارات", en: "Parking" },
    security: { ar: "حراسة 24/7", en: "24/7 Security" },
    balcony: { ar: "شرفة", en: "Balcony" },
    garden: { ar: "حديقة خاصة", en: "Private Garden" },
    beachAccess: { ar: "إطلالة بحرية", en: "Beach Access" },
    concierge: { ar: "خدمة كونسيرج", en: "Concierge" },
    smartHome: { ar: "منزل ذكي", en: "Smart Home" },
    centralAc: { ar: "تكييف مركزي", en: "Central AC" },
    elevator: { ar: "مصعد", en: "Elevator" },
    childrenPlayArea: { ar: "منطقة ألعاب أطفال", en: "Kids Play Area" },
    shoppingMall: { ar: "قريب من المول", en: "Near Mall" },
    waterfront: { ar: "واجهة مائية", en: "Waterfront" },
    marinaView: { ar: "إطلالة مارينا", en: "Marina View" },
    cityView: { ar: "إطلالة المدينة", en: "City View" },
    seaView: { ar: "إطلالة بحرية", en: "Sea View" },
    maidRoom: { ar: "غرفة خادمة", en: "Maid's Room" },
    studyRoom: { ar: "غرفة دراسة", en: "Study Room" },
    cinema: { ar: "سينما منزلية", en: "Home Cinema" },
    spa: { ar: "سبا", en: "Spa" },
    sauna: { ar: "ساونا", en: "Sauna" },
    bbqArea: { ar: "منطقة شواء", en: "BBQ Area" },
    roofTerrace: { ar: "تراس سطحي", en: "Roof Terrace" },
    storage: { ar: "غرفة تخزين", en: "Storage Room" },
  };

  const whatsappMessage = propertyWhatsAppMessage(l10n(property.title, lang), lang);
  const whatsappNumber = agent?.whatsapp ?? agent?.phone ?? "+971501234567";

  const jsonLd = buildJsonLd(property, lang, agent?.name);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <PageHeader
        title={l10n(property.title, lang)}
        subtitle={`${propertyTypeLabel(property.type, lang)} · ${lang === "ar" ? (property.dealType === "sale" ? "بيع" : "إيجار") : property.dealType === "sale" ? "Sale" : "Rent"}`}
        breadcrumb={[
          { label: tProperties("breadcrumb"), href: "/properties" },
          { label: l10n(property.title, lang) },
        ]}
      />

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_380px]">
          {/* Main column */}
          <div className="min-w-0">
            <PropertyGallery images={property.images} title={l10n(property.title, lang)} />

            {/* Price + badges */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <p className="text-3xl font-black text-gradient-gold" dir="ltr">
                    {formatPrice(property.price, property.currency, lang)}
                  </p>
                  {property.dealType === "rent" && (
                    <span className="text-sm text-muted-foreground">
                      {lang === "ar" ? "/ سنويًا" : "/ year"}
                    </span>
                  )}
                </div>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 text-gold" aria-hidden="true" />
                  {property.areaName ?? property.city}
                  {property.address ? ` — ${property.address}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {property.featured && (
                  <Badge variant="gold">{lang === "ar" ? "مميز" : "Featured"}</Badge>
                )}
                <PropertyStatusBadge status={property.status} locale={lang} />
              </div>
            </div>

            {/* Specs */}
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {specs.map((spec) => (
                <Card key={spec.label} className="p-3 text-center">
                  <CardContent className="flex flex-col items-center gap-1 p-0">
                    <spec.icon className="h-5 w-5 text-gold" aria-hidden={true} />
                    <span className="text-sm font-bold">{spec.value}</span>
                    <span className="text-[11px] text-muted-foreground">{spec.label}</span>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Description */}
            <section className="mt-10" aria-labelledby="description-heading">
              <h2 id="description-heading" className="mb-4 text-xl font-bold">
                {t("description")}
              </h2>
              <p className="whitespace-pre-line leading-8 text-muted-foreground">
                {l10n(property.description, lang)}
              </p>
            </section>

            {/* Features */}
            {property.features && property.features.length > 0 && (
              <section className="mt-10" aria-labelledby="features-heading">
                <h2 id="features-heading" className="mb-4 text-xl font-bold">
                  {t("features")}
                </h2>
                <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {property.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="h-1.5 w-1.5 rounded-full bg-gold" aria-hidden="true" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Amenities */}
            {amenities.length > 0 && (
              <section className="mt-10" aria-labelledby="amenities-heading">
                <h2 id="amenities-heading" className="mb-4 text-xl font-bold">
                  {t("amenities")}
                </h2>
                <div className="flex flex-wrap gap-2">
                  {amenities.map((amenity) => (
                    <Badge key={amenity} variant="goldSoft" className="px-3 py-1.5">
                      {amenityLabels[amenity]?.[lang] ?? amenity}
                    </Badge>
                  ))}
                </div>
              </section>
            )}

            {/* Map */}
            <section className="mt-10" aria-labelledby="map-heading">
              <h2 id="map-heading" className="mb-4 text-xl font-bold">
                {t("location")}
              </h2>
              <div className="h-[380px] overflow-hidden rounded-xl border border-border">
                <MapWrapper properties={[property]} zoom={13} className="h-full w-full" />
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
            {/* Actions */}
            <PropertyActions
              property={property}
              agentName={agent?.name}
              agentPhone={agent?.phone}
              whatsappNumber={whatsappNumber}
              whatsappMessage={whatsappMessage}
            />

            {/* Agent card */}
            {agent && (
              <Card>
                <CardContent className="p-5">
                  <p className="mb-4 text-sm font-bold text-muted-foreground">{t("agent")}</p>
                  <div className="flex items-center gap-4">
                    {agent.photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={agent.photo}
                        alt={agent.name}
                        className="h-16 w-16 rounded-full border-2 border-gold/40 object-cover"
                      />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-xl font-black text-gold">
                        {agent.name.slice(0, 1)}
                      </div>
                    )}
                    <div>
                      <p className="font-bold">{agent.name}</p>
                      <p className="text-xs text-muted-foreground" dir="ltr">
                        {agent.phone}
                      </p>
                    </div>
                  </div>
                  <Separator className="my-4" />
                  <div className="space-y-2">
                    <a
                      href={buildTelLink(agent.phone)}
                      className="flex w-full items-center justify-center gap-2 rounded-lg border border-border py-2.5 text-sm font-semibold transition-colors hover:border-gold hover:text-gold"
                    >
                      {t("agentPhone")}
                    </a>
                    <a
                      href={buildWhatsAppLink(whatsappNumber, whatsappMessage)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#25D366] py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                    >
                      {t("agentWhatsapp")}
                    </a>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Share */}
            <Card>
              <CardContent className="p-5">
                <p className="mb-3 flex items-center gap-2 text-sm font-bold text-muted-foreground">
                  <Share2 className="h-4 w-4" aria-hidden="true" />
                  {t("share")}
                </p>
                <div className="flex flex-wrap gap-2">
                  <a
                    href={buildWhatsAppLink(whatsappNumber, `${whatsappMessage} ${siteConfig.url}/${lang}/properties/${property.slug}`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-full bg-[#25D366]/15 px-3 py-1.5 text-xs font-semibold text-[#25D366] transition-colors hover:bg-[#25D366] hover:text-white"
                  >
                    {t("shareWhatsapp")}
                  </a>
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`${siteConfig.url}/${lang}/properties/${property.slug}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-full bg-[#1877F2]/15 px-3 py-1.5 text-xs font-semibold text-[#1877F2] transition-colors hover:bg-[#1877F2] hover:text-white"
                  >
                    {t("shareFacebook")}
                  </a>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <section className="mt-16" aria-labelledby="related-heading">
            <SectionHeading
              eyebrow={tProperties("subtitle")}
              title={tProperties("related")}
            />
            <div className="mt-8">
              <PropertyGrid properties={related} />
            </div>
          </section>
        )}
      </div>
    </>
  );
}
