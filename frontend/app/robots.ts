import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://www.khushihomeo.com';

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
