import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'K2 Swiss Poster Study',
  description: 'A matched-seed comparison of Krea 2 and five Swiss poster LoRA experiments.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
