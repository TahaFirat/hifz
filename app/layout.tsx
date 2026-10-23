import type { Metadata } from 'next';
import './globals.css';
import './responsive.css';
export const metadata: Metadata = { title: 'Hıfz — Sure & Dua Ezber Atölyesi', description: 'Kelime gizleme, zincirleme ezber ve ayet tekrarıyla sure ve dua çalışın.', manifest: '/manifest.webmanifest', icons: { icon: '/favicon.svg' } };
export default function RootLayout({ children }: {
    children: React.ReactNode;
}) { return <html lang="tr" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: "try{document.documentElement.dataset.theme=localStorage.getItem('hifz:theme')==='light'?'light':'dark'}catch{}" }}/></head><body>{children}</body></html>; }
