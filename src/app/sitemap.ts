import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site-config";
import {
  fetchAllProperties,
  fetchAgents,
  fetchLocations,
  fetchProjects,
} from "@/lib/data-service";

const LOCALES = ["ar", "en"] as const;
const STATIC_PATHS = [
  "",
  "/properties",
  "/buy",
  "/rent",
  "/agents",
  "/locations",
  "/projects",
  "/about",
  "/services",
  "/contact",
  "/favorites",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [properties, agents, locations, projects] = await Promise.all([
    fetchAllProperties({}),
    fetchAgents(),
    fetchLocations(),
    fetchProjects(),
  ]);

  const entries: MetadataRoute.Sitemap = [];

  for (const locale of LOCALES) {
    const base = `${siteConfig.url}/${locale}`;
    for (const path of STATIC_PATHS) {
      entries.push({
        url: `${base}${path}`,
        lastModified: new Date(),
        changeFrequency: path === "" ? "daily" : "weekly",
        priority: path === "" ? 1 : 0.8,
        alternates: {
          languages: {
            ar: `${siteConfig.url}/ar${path}`,
            en: `${siteConfig.url}/en${path}`,
          },
        },
      });
    }
    for (const p of properties) {
      entries.push({
        url: `${base}/properties/${p.slug}`,
        lastModified: new Date(p.updatedAt ?? p.createdAt),
        changeFrequency: "weekly",
        priority: 0.9,
        alternates: {
          languages: {
            ar: `${siteConfig.url}/ar/properties/${p.slug}`,
            en: `${siteConfig.url}/en/properties/${p.slug}`,
          },
        },
      });
    }
    for (const a of agents) {
      entries.push({
        url: `${base}/agents/${a.id}`,
        lastModified: new Date(a.createdAt ?? Date.now()),
        changeFrequency: "monthly",
        priority: 0.6,
        alternates: {
          languages: {
            ar: `${siteConfig.url}/ar/agents/${a.id}`,
            en: `${siteConfig.url}/en/agents/${a.id}`,
          },
        },
      });
    }
    for (const l of locations) {
      entries.push({
        url: `${base}/locations/${l.slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.7,
        alternates: {
          languages: {
            ar: `${siteConfig.url}/ar/locations/${l.slug}`,
            en: `${siteConfig.url}/en/locations/${l.slug}`,
          },
        },
      });
    }
    for (const pr of projects) {
      entries.push({
        url: `${base}/projects/${pr.slug}`,
        lastModified: new Date(),
        changeFrequency: "monthly",
        priority: 0.7,
        alternates: {
          languages: {
            ar: `${siteConfig.url}/ar/projects/${pr.slug}`,
            en: `${siteConfig.url}/en/projects/${pr.slug}`,
          },
        },
      });
    }
  }

  return entries;
}
