import type { Metadata } from 'next';
import { Ubuntu_Mono } from 'next/font/google';
import './globals.css';
import './monochrome.css';
import './generator.css';

const ubuntuMono = Ubuntu_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
});

export const metadata: Metadata = {
  title: 'K2 Swiss Poster Study',
  description: 'A matched-seed comparison of Krea 2 and seven Swiss poster LoRA experiments.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={ubuntuMono.className}>
      <body>{children}</body>
    </html>
  );
}
