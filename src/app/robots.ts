import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/landing", "/how-it-works", "/auth/login", "/auth/register", "/legal"],
        disallow: ["/map", "/profile", "/wallet", "/history", "/reservations", "/admin", "/api/"],
      },
    ],
    sitemap: "https://www.swiftpark.fr/sitemap.xml",
  };
}
