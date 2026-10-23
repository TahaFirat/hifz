'use client';
import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
export default function ThemeToggle() {
    const [light, setLight] = useState(false);
    useEffect(() => { setLight(document.documentElement.dataset.theme === 'light'); }, []);
    function toggle() { const next = !light; setLight(next); document.documentElement.dataset.theme = next ? 'light' : 'dark'; try {
        localStorage.setItem('hifz:theme', next ? 'light' : 'dark');
    }
    catch { } }
    return <button className="icon-button theme-toggle" aria-label={light ? 'Koyu tema' : 'Açık tema'} onClick={toggle}>{light ? <Moon size={19}/> : <Sun size={19}/>}</button>;
}
