'use client';

import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const root = document.documentElement;
    const initial = root.classList.contains('dark') ? 'dark' : 'light';
    setTheme(initial);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    const root = document.documentElement;
    root.classList.toggle('dark', next === 'dark');
    localStorage.setItem('mikublob-theme', next);
    setTheme(next);
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="glass soft-ring inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-slate-700 transition hover:scale-[1.02] dark:text-slate-100"
      aria-label="Toggle color theme"
    >
      <span>{theme === 'dark' ? '🌙' : '☀️'}</span>
      <span>{theme === 'dark' ? 'Dark' : 'Light'} Mode</span>
    </button>
  );
}
