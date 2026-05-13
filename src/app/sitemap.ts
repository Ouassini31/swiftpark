import type { MetadataRoute } from "next";

const BASE = "https://www.swiftpark.fr";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${BASE}/`,             lastModified: new Date(), changeFrequency: "weekly",  priority: 1.0 },
    { url: `${BASE}/landing`,      lastModified: new Date(), changeFrequency: "weekly",  priority: 0.9 },
    { url: `${BASE}/how-it-works`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/auth/register`,lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/auth/login`,   lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/legal`,        lastModified: new Date(), changeFrequency: "yearly",  priority: 0.3 },
  ];
}
