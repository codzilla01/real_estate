"use client";

import { useCallback, useEffect, useState } from "react";
import { uid } from "@/lib/utils";
import type { Favorite } from "@/types";

const KEY = "ama2_favorites";

function load(): Favorite[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Favorite[]) : [];
  } catch {
    return [];
  }
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);

  useEffect(() => {
    setFavorites(load());
  }, []);

  const persist = useCallback((next: Favorite[]) => {
    setFavorites(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    }
  }, []);

  const isFavorite = useCallback(
    (propertyId: string) => favorites.some((f) => f.propertyId === propertyId),
    [favorites],
  );

  const toggleFavorite = useCallback(
    (propertyId: string) => {
      setFavorites((current) => {
        const exists = current.some((f) => f.propertyId === propertyId);
        const next = exists
          ? current.filter((f) => f.propertyId !== propertyId)
          : [
              ...current,
              { id: uid("fav"), propertyId, createdAt: new Date().toISOString() },
            ];
        if (typeof window !== "undefined") {
          window.localStorage.setItem(KEY, JSON.stringify(next));
        }
        return next;
      });
    },
    [],
  );

  const removeFavorite = useCallback(
    (propertyId: string) => {
      setFavorites((current) => {
        const next = current.filter((f) => f.propertyId !== propertyId);
        if (typeof window !== "undefined") {
          window.localStorage.setItem(KEY, JSON.stringify(next));
        }
        return next;
      });
    },
    [],
  );

  const clearFavorites = useCallback(() => {
    setFavorites([]);
    if (typeof window !== "undefined") window.localStorage.removeItem(KEY);
  }, []);

  return {
    favorites,
    isFavorite,
    toggleFavorite,
    removeFavorite,
    clearFavorites,
    persist,
    count: favorites.length,
  };
}
