import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { setRequestLocale } from "next-intl/server";
import { PageHeader } from "@/components/layout/page-header";
import { ServicesSection } from "@/components/home/services-section";
import { CtaSection } from "@/components/home/cta-section";

interface ServicesPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: ServicesPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo" });
  return { title: t("servicesTitle"), description: t("homeDescription") };
}

export default async function ServicesPage({ params }: ServicesPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("services");

  return (
    <>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <div className="py-10">
        <ServicesSection />
      </div>
      <CtaSection />
    </>
  );
}
