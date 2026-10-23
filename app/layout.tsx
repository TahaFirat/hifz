import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Hıfz — Sure & Dua Ezber Atölyesi', description: 'Kelime gizleme, zincirleme ezber ve ayet tekrarıyla sure ve dua çalışın.', manifest: '/manifest.webmanifest', icons: { icon: '/favicon.svg' } };
export default function RootLayout({ children }: {
    children: React.ReactNode;
}) { return <html lang="tr"><body>{children}</body></html>; }
