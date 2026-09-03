"use client";

"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import type { Property } from "@/types";

const MapView = dynamic(
  () => import("@/components/maps/map-view").then((m) => m.MapView),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-muted/40">
        <Skeleton className="h-full w-full" />
      </div>
    ),
  },
);

export function MapWrapper(props: {
  properties: Property[];
  center?: [number, number];
  zoom?: number;
  className?: string;
  activePropertyId?: string;
}) {
  return <MapView {...props} />;
}
