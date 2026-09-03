import type { Metadata } from "next";
import Image from "next/image";
import { Building2, CalendarClock, Layers, Wallet } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { setRequestLocale } from "next-intl/server";
import { fetchProjects } from "@/lib/data-service";
import { l10n, formatPrice } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import type { Lang } from "@/types";

interface ProjectsPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: ProjectsPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo" });
  return { title: t("projectsTitle"), description: t("homeDescription") };
}

export default async function ProjectsPage({ params }: ProjectsPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const lang = locale as Lang;
  const t = await getTranslations("projects");

  const projects = await fetchProjects();

  return (
    <>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card key={project.id} className="group overflow-hidden transition-all hover:-translate-y-1 hover:shadow-luxury hover:border-gold/40">
              <div className="relative aspect-[16/9] overflow-hidden">
                <Image
                  src={project.images[0] ?? ""}
                  alt={l10n(project.name, lang)}
                  fill
                  sizes="(min-width: 1024px) 33vw, 50vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 rounded-full bg-gold-gradient px-3 py-1 text-xs font-bold text-black">
                  {project.developer}
                </div>
              </div>
              <CardContent className="p-5">
                <h2 className="text-lg font-bold">{l10n(project.name, lang)}</h2>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Building2 className="h-3.5 w-3.5 text-gold" aria-hidden="true" />
                  {project.location}
                </p>
                <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
                  {l10n(project.description, lang)}
                </p>

                <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-4">
                  <div className="text-center">
                    <Wallet className="mx-auto h-4 w-4 text-gold" aria-hidden="true" />
                    <p className="mt-1 text-xs font-bold" dir="ltr">
                      {formatPrice(project.startingPrice, "AED", lang)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{t("startingPrice")}</p>
                  </div>
                  <div className="text-center">
                    <CalendarClock className="mx-auto h-4 w-4 text-gold" aria-hidden="true" />
                    <p className="mt-1 text-xs font-bold">{project.completionDate}</p>
                    <p className="text-[10px] text-muted-foreground">{t("completionDate")}</p>
                  </div>
                  <div className="text-center">
                    <Layers className="mx-auto h-4 w-4 text-gold" aria-hidden="true" />
                    <p className="mt-1 text-xs font-bold">{project.units}</p>
                    <p className="text-[10px] text-muted-foreground">{t("units")}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </>
  );
}
