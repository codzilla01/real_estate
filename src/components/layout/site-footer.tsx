import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/layout/logo";
import { getSeedData } from "@/lib/seed-data";
import { l10n } from "@/lib/utils";
import { MapPin, Phone, Mail, Clock } from "lucide-react";

export async function SiteFooter({ locale }: { locale: "ar" | "en" }) {
  const t = await getTranslations("footer");
  const settings = getSeedData().settings;
  const locations = getSeedData().locations.slice(0, 5);

  const socials = settings.social ?? {};

  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <Logo />
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {t("aboutText")}
            </p>
            <div className="mt-4 flex gap-2">
              {socials.facebook && (
                <a
                  href={socials.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border transition-colors hover:border-gold hover:text-gold"
                >
                  <span className="text-sm font-bold">f</span>
                </a>
              )}
              {socials.instagram && (
                <a
                  href={socials.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border transition-colors hover:border-gold hover:text-gold"
                >
                  <span className="text-sm font-bold">◎</span>
                </a>
              )}
              {socials.twitter && (
                <a
                  href={socials.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="X (Twitter)"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border transition-colors hover:border-gold hover:text-gold"
                >
                  <span className="text-sm font-bold">𝕏</span>
                </a>
              )}
              {socials.linkedin && (
                <a
                  href={socials.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border transition-colors hover:border-gold hover:text-gold"
                >
                  <span className="text-sm font-bold">in</span>
                </a>
              )}
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-gold">
              {t("quickLinks")}
            </h3>
            <ul className="space-y-2.5 text-sm">
              {([
                { href: "/properties", label: locale === "ar" ? "العقارات" : "Properties" },
                { href: "/buy", label: locale === "ar" ? "شراء" : "Buy" },
                { href: "/rent", label: locale === "ar" ? "إيجار" : "Rent" },
                { href: "/projects", label: locale === "ar" ? "المشاريع" : "Projects" },
                { href: "/agents", label: locale === "ar" ? "الوسطاء" : "Agents" },
                { href: "/contact", label: locale === "ar" ? "اتصل بنا" : "Contact" },
              ] as const).map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-muted-foreground transition-colors hover:text-gold"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-gold">
              {t("popularAreas")}
            </h3>
            <ul className="space-y-2.5 text-sm">
              {locations.map((loc) => (
                <li key={loc.id}>
                  <Link
                    href={`/locations/${loc.slug}`}
                    className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-gold"
                  >
                    <MapPin className="h-3.5 w-3.5 text-gold/60" aria-hidden="true" />
                    {l10n(loc.name, locale)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-gold">
              {t("contactTitle")}
            </h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold/60" aria-hidden="true" />
                {l10n(settings.address, locale)}
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 shrink-0 text-gold/60" aria-hidden="true" />
                <a href={`tel:${settings.phone}`} className="hover:text-gold" dir="ltr">
                  {settings.phone}
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 shrink-0 text-gold/60" aria-hidden="true" />
                <a href={`mailto:${settings.email}`} className="hover:text-gold" dir="ltr">
                  {settings.email}
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-gold/60" aria-hidden="true" />
                <span>
                  {locale === "ar" ? "السبت - الخميس: 9ص - 6م" : "Sat - Thu: 9AM - 6PM"}
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row">
          <p>
            © {new Date().getFullYear()} {l10n(settings.companyName, locale)}. {t("rights")}.
          </p>
          <p className="flex items-center gap-1">
            {locale === "ar" ? "صُنع بشغف في الإمارات" : "Crafted with passion in the UAE"}
          </p>
        </div>
      </div>
    </footer>
  );
}
