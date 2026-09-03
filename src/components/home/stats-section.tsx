"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";
import { useTranslations } from "next-intl";

function Counter({ value, suffix = "+" }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const duration = 1400;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * value));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value]);

  return (
    <span ref={ref} dir="ltr">
      {display.toLocaleString("en-US")}
      {suffix}
    </span>
  );
}

export function StatsSection({
  properties,
  agents,
}: {
  properties: number;
  agents: number;
}) {
  const t = useTranslations("home");

  const stats = [
    { value: properties + 480, label: t("statProperties") },
    { value: agents + 12, label: t("statAgents") },
    { value: 850, label: t("statClients") },
    { value: 15, label: t("statYears") },
  ];

  return (
    <section className="border-y border-border/60 bg-card/60">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-12 sm:px-6 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="text-center">
            <p className="text-gradient-gold text-4xl font-black sm:text-5xl">
              <Counter value={stat.value} />
            </p>
            <p className="mt-2 text-sm font-medium text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
