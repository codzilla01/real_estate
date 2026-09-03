import { Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  compact?: boolean;
}

export function Logo({ className, compact = false }: LogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold-gradient shadow-[0_4px_16px_-4px_rgb(212_175_55/0.7)]">
        <Building2 className="h-5 w-5 text-black" aria-hidden="true" />
      </span>
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="text-gradient-gold text-lg font-black tracking-tight">
            المكتب العقاري
          </span>
          <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Al Maktab Al Aqari
          </span>
        </span>
      )}
    </span>
  );
}
