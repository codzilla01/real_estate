"use client";

import { useState } from "react";
import { Phone, MessageCircle, CalendarCheck, MessageSquare, Heart } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Property } from "@/types";
import { cn, buildTelLink, buildWhatsAppLink } from "@/lib/utils";
import { useFavorites } from "@/hooks/use-favorites";
import { Button } from "@/components/ui/button";
import { LeadCaptureForm } from "@/components/property/lead-capture-form";

export function PropertyActions({
  property,
  agentName,
  agentPhone,
  whatsappNumber,
  whatsappMessage,
}: {
  property: Property;
  agentName?: string;
  agentPhone?: string;
  whatsappNumber: string;
  whatsappMessage: string;
}) {
  const t = useTranslations("property");
  const { isFavorite, toggleFavorite } = useFavorites();
  const [viewingOpen, setViewingOpen] = useState(false);
  const [inquiryOpen, setInquiryOpen] = useState(false);

  const favorite = isFavorite(property.id);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <Button variant="gold" size="lg" asChild>
          <a href={buildWhatsAppLink(whatsappNumber, whatsappMessage)} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            {t("whatsapp")}
          </a>
        </Button>
        <Button variant="outline" size="lg" asChild>
          <a href={buildTelLink(agentPhone ?? "+971501234567")}>
            <Phone className="h-4 w-4" aria-hidden="true" />
            {t("call")}
          </a>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button variant="darkGold" size="lg" onClick={() => setViewingOpen(true)}>
          <CalendarCheck className="h-4 w-4" aria-hidden="true" />
          {t("requestViewing")}
        </Button>
        <Button variant="secondary" size="lg" onClick={() => setInquiryOpen(true)}>
          <MessageSquare className="h-4 w-4" aria-hidden="true" />
          {t("sendInquiry")}
        </Button>
      </div>

      <Button
        variant="ghost"
        className={cn(
          "w-full border border-border",
          favorite && "border-gold/50 text-gold",
        )}
        onClick={() => toggleFavorite(property.id)}
      >
        <Heart className={cn("h-4 w-4", favorite && "fill-gold text-gold")} aria-hidden="true" />
        {favorite ? t("removeFavorite") : t("saveFavorite")}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        {agentName ? `${t("agent")}: ${agentName}` : ""}
      </p>

      <LeadCaptureForm
        property={property}
        mode="viewing"
        open={viewingOpen}
        onOpenChange={setViewingOpen}
      />
      <LeadCaptureForm
        property={property}
        mode="inquiry"
        open={inquiryOpen}
        onOpenChange={setInquiryOpen}
      />
    </div>
  );
}
