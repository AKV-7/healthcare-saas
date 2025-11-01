import type { Metadata } from 'next';
import './globals.css';
import { Plus_Jakarta_Sans as FontSans } from 'next/font/google';

import { ThemeProvider } from '@/components/ThemeProvider';
import { cn } from '@/lib/utils';

const fontSans = FontSans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'Best Homeopathy Doctor in Moradabad - Khushi Homeopathic Clinic',
  description: 'Dr. M K Singh & Dr. Rajni Singh offer safe, natural, and effective homeopathic treatments in Moradabad. Book your appointment today for holistic care.',
  keywords: 'homeopathy doctor Moradabad, homeopathic clinic Moradabad, Dr M K Singh, Dr Rajni Singh, best homeopathy treatment, natural treatment Moradabad, holistic care',
  authors: [{ name: 'Khushi Homeopathic Clinic' }],
  openGraph: {
    title: 'Best Homeopathy Doctor in Moradabad - Khushi Homeopathic Clinic',
    description: 'Dr. M K Singh & Dr. Rajni Singh offer safe, natural, and effective homeopathic treatments in Moradabad. Book your appointment today for holistic care.',
    url: 'https://www.khushihomeo.com',
    siteName: 'Khushi Homeopathic Clinic',
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Best Homeopathy Doctor in Moradabad - Khushi Homeopathic Clinic',
    description: 'Dr. M K Singh & Dr. Rajni Singh offer safe, natural, and effective homeopathic treatments in Moradabad.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  icons: {
    icon: 'https://res.cloudinary.com/dgvs3l5yo/image/upload/v1751455263/healthcare/icons/healthcare/icons/khushi-homoeo-logo.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          'min-h-screen bg-white font-sans antialiased transition-colors duration-300',
          fontSans.variable
        )}
        suppressHydrationWarning
      >
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
