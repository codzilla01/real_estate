import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export async function CtaSection() {
  const t = await getTranslations("home");

  return (
    <section className="relative overflow-hidden py-20">
      <div
        className="absolute inset-0 bg-gradient-to-br from-gold/15 via-transparent to-emerald-accent/10"
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">
        <h2 className="text-3xl font-black tracking-tight sm:text-4xl">{t("ctaTitle")}</h2>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">{t("ctaSubtitle")}</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/contact">
            <Button variant="gold" size="lg">
              {t("ctaButton")}
            </Button>
          </Link>
          <Link href="/properties">
            <Button variant="outline" size="lg">
              {t("exploreProperties")}
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
