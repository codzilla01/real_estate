import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { setRequestLocale } from "next-intl/server";
import { Phone, MessageCircle, BadgeCheck } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { fetchAgents, fetchAllProperties } from "@/lib/data-service";
import { buildWhatsAppLink, l10n } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import type { Lang } from "@/types";

interface AgentsPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: AgentsPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo" });
  return { title: t("agentsTitle"), description: t("homeDescription") };
}

export default async function AgentsPage({ params }: AgentsPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const lang = locale as Lang;
  const t = await getTranslations("agents");

  const [agents, properties] = await Promise.all([
    fetchAgents(),
    fetchAllProperties({ status: "available" }),
  ]);

  const countByAgent = properties.reduce<Record<string, number>>((acc, p) => {
    if (p.agentId) acc[p.agentId] = (acc[p.agentId] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className="group relative rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-gold/40 hover:shadow-luxury"
            >
              <div className="flex items-start gap-4">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-gold/40">
                  {agent.photo ? (
                    <Image src={agent.photo} alt={agent.name} fill sizes="80px" className="object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-muted text-2xl font-black text-gold">
                      {agent.name.slice(0, 1)}
                    </div>
                  )}
                </div>
                <div>
                  <h2 className="flex items-center gap-1.5 font-bold">
                    <Link href={`/agents/${agent.id}`} className="transition-colors hover:text-gold">
                      {agent.name}
                    </Link>
                    {agent.experienceYears >= 10 && (
                      <BadgeCheck className="h-4 w-4 text-gold" aria-label="Verified" />
                    )}
                  </h2>
                  <p className="mt-0.5 text-xs text-muted-foreground" dir="ltr">
                    {agent.phone}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Badge variant="goldSoft">
                      {t("experience")}: {agent.experienceYears}
                    </Badge>
                    <Badge variant="muted">
                      {countByAgent[agent.id] ?? 0} {t("properties")}
                    </Badge>
                  </div>
                </div>
              </div>

              <p className="mt-4 line-clamp-3 min-h-[4rem] text-sm leading-relaxed text-muted-foreground">
                {l10n(agent.bio, lang)}
              </p>

              {agent.areas && agent.areas.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {agent.areas.slice(0, 4).map((area) => (
                    <span key={area} className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] text-muted-foreground">
                      {area}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-5 flex gap-2">
                <a
                  href={`tel:${agent.phone}`}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border py-2 text-sm font-semibold transition-colors hover:border-gold hover:text-gold"
                >
                  <Phone className="h-4 w-4" aria-hidden="true" />
                  {t("contactAgent")}
                </a>
                <a
                  href={buildWhatsAppLink(
                    agent.whatsapp ?? agent.phone,
                    lang === "ar" ? `مرحبًا، أرغب بالتواصل مع ${agent.name}` : `Hello, I'd like to contact ${agent.name}`,
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-11 items-center justify-center rounded-lg bg-[#25D366] text-white transition-opacity hover:opacity-90"
                  aria-label="WhatsApp"
                >
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                </a>
              </div>

              <div className="mt-3 flex items-center justify-center gap-4 text-xs font-semibold text-gold hover:text-gold-light">
                {countByAgent[agent.id] ? (
                  <Link
                    href={`/properties?agentId=${agent.id}`}
                    className="transition-colors hover:text-gold-light"
                  >
                    {t("viewProperties")} ←
                  </Link>
                ) : null}
                <Link
                  href={`/agents/${agent.id}`}
                  className="transition-colors hover:text-gold-light"
                >
                  {lang === "ar" ? "الملف الشخصي" : "View profile"} ←
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
