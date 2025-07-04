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
  title: 'Khushi Homoeopathic Clinic',
  description:
    'Khushi Homoeopathic Clinic - Natural and effective homeopathic treatments, patient registration, appointment scheduling, and more.',
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
