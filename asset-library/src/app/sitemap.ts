import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  // In a real app, you would dynamically generate URLs from a database here if they were public.
  // Since AssetLibrary is mostly authenticated, we only index public routes like the marketing page and login.
  
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://assetlibrary.demo";

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];
}
