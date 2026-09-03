import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { setRequestLocale } from "next-intl/server";
import { MapPin, Phone, Mail, MessageCircle, Clock } from "lucide-react";
import { getSeedData } from "@/lib/seed-data";
import { l10n, buildWhatsAppLink } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";
import { ContactForm } from "@/components/forms/contact-form";
import type { Lang } from "@/types";

interface ContactPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: ContactPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo" });
  return { title: t("contactTitle"), description: t("homeDescription") };
}

export default async function ContactPage({ params }: ContactPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const lang = locale as Lang;
  const t = await getTranslations("contact");

  const settings = getSeedData().settings;

  return (
    <>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_380px]">
          <ContactForm />

          <aside className="space-y-5">
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <h2 className="mb-5 flex items-center gap-2 font-bold">
                <MapPin className="h-5 w-5 text-gold" aria-hidden="true" />
                {t("infoTitle")}
              </h2>
              <ul className="space-y-4 text-sm">
                <li className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
                  <span className="text-muted-foreground">{l10n(settings.address, lang)}</span>
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
                  <a href={`tel:${settings.phone}`} className="text-muted-foreground hover:text-gold" dir="ltr">
                    {settings.phone}
                  </a>
                </li>
                <li className="flex items-center gap-3">
                  <Mail className="h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
                  <a href={`mailto:${settings.email}`} className="text-muted-foreground hover:text-gold" dir="ltr">
                    {settings.email}
                  </a>
                </li>
                <li className="flex items-center gap-3">
                  <MessageCircle className="h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
                  <a
                    href={buildWhatsAppLink(settings.whatsapp, lang === "ar" ? "مرحبًا، أود الاستفسار عن خدماتكم" : "Hello, I'd like to ask about your services")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-gold"
                    dir="ltr"
                  >
                    {settings.whatsapp}
                  </a>
                </li>
              </ul>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 font-bold">
                <Clock className="h-5 w-5 text-gold" aria-hidden="true" />
                {t("hoursTitle")}
              </h2>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>{t("hoursWeek")}</li>
                <li>{t("hoursFriday")}</li>
              </ul>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
