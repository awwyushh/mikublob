'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

declare global {
  interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  }

  interface Navigator {
    standalone?: boolean;
  }
}

export function PwaInstallToast() {
  const pathname = usePathname();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

    if (isStandalone || sessionStorage.getItem('mikublob-install-dismissed') === '1') {
      return;
    }

    const ua = window.navigator.userAgent.toLowerCase();
    const iosDevice = /iphone|ipad|ipod/.test(ua);
    const safariBrowser = /safari/.test(ua) && !/crios|fxios/.test(ua);

    if (iosDevice && safariBrowser) {
      setIsIos(true);
      setIsVisible(true);
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const dismissToast = () => {
    sessionStorage.setItem('mikublob-install-dismissed', '1');
    setIsVisible(false);
  };

  const handleInstall = async () => {
    if (!deferredPrompt) {
      dismissToast();
      return;
    }

    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;

    if (choice.outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsVisible(false);
      return;
    }

    setIsVisible(true);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className={`pointer-events-none fixed inset-x-0 z-50 flex justify-center px-4 ${pathname?.startsWith('/dashboard') ? 'bottom-24' : 'bottom-4'}`}>
      <div className="glass soft-ring pointer-events-auto w-full max-w-md rounded-3xl p-4 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-slate-900 dark:text-white">Install MikuBlob</div>
            <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
              {isIos
                ? 'Add it from Safari using Share → Add to Home Screen.'
                : 'Install the app for faster access and a cleaner full-screen experience.'}
            </p>
          </div>
          <button
            type="button"
            onClick={dismissToast}
            className="rounded-full px-2 py-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            aria-label="Dismiss install prompt"
          >
            ✕
          </button>
        </div>
        <div className="mt-4 flex gap-3">
          {!isIos ? (
            <button
              type="button"
              onClick={handleInstall}
              className="rounded-full bg-gradient-to-r from-teal-500 to-cyan-400 px-4 py-2 text-sm font-semibold text-white"
            >
              Install App
            </button>
          ) : null}
          <button
            type="button"
            onClick={dismissToast}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
