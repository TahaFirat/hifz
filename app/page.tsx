'use client';
import { useEffect, useState } from 'react';
import { ArrowRight, BookOpen, HandHeart, Moon } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import LearningHome from '@/components/LearningHome';
import { allSelections, basics, prayerCatalog } from '@/lib/hifz/catalog';
import { lessonRange } from '@/lib/hifz/study';
export default function Home() {
    const [last, setLast] = useState<{
        key: string;
        name: string;
        category: string;
        range: [number, number];
    } | null>(null);
    useEffect(() => { try {
        const saved = JSON.parse(localStorage.getItem('hifz:last-lesson:v1') || 'null');
        const list = saved?.category === 'all' ? allSelections : saved?.category === 'prayers' ? prayerCatalog : basics;
        const item = list.find(c => c.key === saved?.key);
        if (item)
            setLast({ key: item.key, name: item.name, category: saved.category === 'all' || saved.category === 'prayers' ? saved.category : 'basics', range: lessonRange(saved.range?.[0], saved.range?.[1], item) });
    }
    catch { } }, []);
    return <div className="home-page">
  <header className="home-header"><a className="brand" href="/">hıfz<span>.</span></a><ThemeToggle /></header>
  <main className="home-content">
   <div className="home-mark" aria-hidden="true">۞</div>
   <h1>Ezber atölyesi</h1>
   <LearningHome />
   {last && <a className="resume-link" href={`/calis?kategori=${last.category}&icerik=${encodeURIComponent(last.key)}&baslangic=${last.range[0]}&bitis=${last.range[1]}`}><span>Devam et <strong>{last.name}</strong></span><ArrowRight size={19}/></a>}
   <div className="entry-grid">
    {[{ category: 'basics', name: 'Sureler', Icon: Moon }, { category: 'prayers', name: 'Dualar', Icon: HandHeart }, { category: 'all', name: '114 Sure', Icon: BookOpen }].map(({ category, name, Icon }) => <a className="entry-card" key={category} href={`/calis?kategori=${category}`}><Icon size={25} strokeWidth={1.4}/><span>{name}</span><ArrowRight size={19}/></a>)}
   </div>
   <div className="quick-links"><a href="/calis?icerik=s1">Fâtiha</a><span>·</span><a href="/calis?icerik=k255">Âyetel Kürsî</a><span>·</span><a href="/calis?kategori=all&icerik=all36">Yâsîn</a></div>
  </main>
 </div>;
}
