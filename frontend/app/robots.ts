import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://healthcare-saas.vercel.app'; // Update with your actual domain

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/appointments/', '/patients/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
