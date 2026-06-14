import Link from 'next/link';
import { auth } from '@/auth';
import { MikuImage } from '@/components/miku-image';
import { ThemeToggle } from '@/components/theme-toggle';

export default async function HomePage() {
  const session = await auth();
  const primaryHref = session?.user ? '/dashboard?tab=calendar' : '/login';

  return (
    <main className="min-h-screen">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 py-5">
        <div className="flex items-center justify-between rounded-[2rem] border border-white/50 bg-white/70 px-4 py-3 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/70">
          <div className="text-lg font-black text-slate-900 dark:text-white">MikuBlob♪</div>
          <ThemeToggle />
        </div>

        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <div className="section-title">mobile pwa</div>
          <MikuImage className="mt-6 max-w-[220px]" priority />
          <h1 className="mt-6 text-4xl font-black tracking-tight text-slate-900 dark:text-white">MikuBlob</h1>
          <p className="mt-3 text-base text-slate-600 dark:text-slate-300">Track Learning. One Blob At A Time.</p>
          <p className="mt-5 max-w-sm text-sm leading-7 text-slate-500 dark:text-slate-400">
            Save what you watched, read, or studied today. Keep it small. Keep it findable.
          </p>
          <Link
            href={primaryHref}
            className="mt-8 w-full rounded-full bg-gradient-to-r from-teal-500 to-cyan-400 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-500/30"
          >
            Get Started
          </Link>
          {session?.user ? (
            <Link href="/dashboard?tab=calendar" className="mt-4 text-sm font-semibold text-teal-600 dark:text-teal-300">
              Open App
            </Link>
          ) : null}
        </div>
      </div>
    </main>
  );
}
