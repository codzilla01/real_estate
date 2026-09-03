"use client";

import { useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Image from "next/image";
import type { Property } from "@/types";
import { formatPrice, l10n } from "@/lib/utils";
import { getPropertyCoverImage } from "@/lib/property-filters";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { propertyTypeLabel } from "@/components/property/property-status-badge";

const defaultCenter: [number, number] = [25.2048, 55.2708];

function createGoldIcon(active: boolean) {
  return L.divIcon({
    className: "",
    html: `<div style="
      width: ${active ? 34 : 28}px; height: ${active ? 34 : 28}px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      background: linear-gradient(135deg, #e9c95a, #b8860b);
      border: 2px solid #fff;
      box-shadow: 0 4px 14px rgba(0,0,0,.35);
      display:flex; align-items:center; justify-content:center;
    "><div style="width:10px;height:10px;border-radius:50%;background:#0a0a0a;transform:rotate(45deg);"></div></div>`,
    iconSize: active ? [34, 34] : [28, 28],
    iconAnchor: active ? [17, 30] : [14, 25],
    popupAnchor: [0, -28],
  });
}

interface MapViewProps {
  properties: Property[];
  center?: [number, number];
  zoom?: number;
  className?: string;
  activePropertyId?: string;
}

export function MapView({
  properties,
  center = defaultCenter,
  zoom = 11,
  className,
  activePropertyId,
}: MapViewProps) {
  const locale = useLocale() as "ar" | "en";

  const markers = useMemo(
    () =>
      properties.map((p) => ({
        id: p.id,
        position: [p.latitude, p.longitude] as [number, number],
        property: p,
      })),
    [properties],
  );

  const bounds = useMemo(() => {
    if (markers.length === 0) return undefined;
    const latLngs = markers.map((m) => m.position as L.LatLngExpression);
    return L.latLngBounds(latLngs);
  }, [markers]);

  return (
    <div dir="ltr" className={className}>
      <MapContainer
        center={center}
        zoom={zoom}
        bounds={bounds}
        scrollWheelZoom
        className="h-full w-full"
        style={{ minHeight: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            position={marker.position}
            icon={createGoldIcon(marker.id === activePropertyId)}
          >
            <Popup maxWidth={260}>
              <Link
                href={`/properties/${marker.property.slug}`}
                className="block w-[240px] overflow-hidden rounded-lg border border-border bg-card text-left"
              >
                <div className="relative h-[110px] w-full">
                  <Image
                    src={getPropertyCoverImage(marker.property.images)}
                    alt={l10n(marker.property.title, locale)}
                    fill
                    sizes="240px"
                    className="object-cover"
                  />
                </div>
                <div className="p-2.5">
                  <p className="text-[10px] font-semibold uppercase text-gold">
                    {propertyTypeLabel(marker.property.type, locale)}
                  </p>
                  <h4 className="truncate text-xs font-bold" dir="auto">
                    {l10n(marker.property.title, locale)}
                  </h4>
                  <p className="mt-1 text-sm font-black text-gold" dir="ltr">
                    {formatPrice(marker.property.price, marker.property.currency, locale)}
                  </p>
                </div>
              </Link>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
