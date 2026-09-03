import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
  className?: string;
  children?: React.ReactNode;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
  className,
  children,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card/50 px-6 py-16 text-center",
        className,
      )}
    >
      {Icon ? (
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gold/10">
          <Icon className="h-8 w-8 text-gold" aria-hidden="true" />
        </div>
      ) : null}
      <h3 className="text-lg font-bold">{title}</h3>
      {description ? (
        <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      ) : null}
      {actionLabel ? (
        actionHref ? (
          <Button asChild variant="gold" className="mt-2">
            <a href={actionHref}>{actionLabel}</a>
          </Button>
        ) : (
          <Button variant="gold" className="mt-2" onClick={onAction}>
            {actionLabel}
          </Button>
        )
      ) : null}
      {children}
    </div>
  );
}
