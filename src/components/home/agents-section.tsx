import Image from "next/image";
import { Phone, MessageCircle } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Agent } from "@/types";
import { buildWhatsAppLink, l10n } from "@/lib/utils";

export async function AgentsSection({
  agents,
  locale,
}: {
  agents: Agent[];
  locale: "ar" | "en";
}) {
  const t = await getTranslations("home");

  return (
    <section className="border-y border-border/60 bg-card/50 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-gold">
            {t("agentsSubtitle")}
          </p>
          <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
            {t("agentsTitle")}
          </h2>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {agents.slice(0, 4).map((agent) => (
            <div
              key={agent.id}
              className="group rounded-xl border border-border bg-card p-6 text-center shadow-sm transition-all hover:border-gold/40 hover:shadow-luxury"
            >
              <div className="relative mx-auto h-24 w-24 overflow-hidden rounded-full border-2 border-gold/40">
                {agent.photo ? (
                  <Image
                    src={agent.photo}
                    alt={agent.name}
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-muted text-2xl font-black text-gold">
                    {agent.name.slice(0, 1)}
                  </div>
                )}
              </div>
              <h3 className="mt-4 font-bold">{agent.name}</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {agent.experienceYears} {locale === "ar" ? "سنة خبرة" : "years experience"}
              </p>
              <p className="mt-2 line-clamp-2 min-h-[2.5rem] text-xs leading-relaxed text-muted-foreground">
                {l10n(agent.bio, locale)}
              </p>
              <div className="mt-4 flex justify-center gap-2">
                <a
                  href={`tel:${agent.phone}`}
                  aria-label={locale === "ar" ? "اتصال" : "Call"}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border transition-colors hover:border-gold hover:text-gold"
                >
                  <Phone className="h-4 w-4" aria-hidden="true" />
                </a>
                <a
                  href={buildWhatsAppLink(agent.whatsapp ?? agent.phone, locale === "ar" ? `مرحبًا، أرغب بالتواصل مع ${agent.name}` : `Hello, I'd like to contact ${agent.name}`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-[#25D366]/15 text-[#25D366] transition-colors hover:bg-[#25D366] hover:text-white"
                >
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                </a>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/agents"
            className="inline-flex items-center gap-2 text-sm font-bold text-gold transition-colors hover:text-gold-light"
          >
            {locale === "ar" ? "تعرف على فريقنا الكامل" : "Meet our full team"}
            <span aria-hidden="true">←</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
