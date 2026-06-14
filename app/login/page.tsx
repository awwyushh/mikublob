import Link from 'next/link';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { GitHubSignInButton, GoogleSignInButton } from '@/components/auth-buttons';
import { MikuImage } from '@/components/miku-image';
import { MikuMascot } from '@/components/miku-mascot';
import { ThemeToggle } from '@/components/theme-toggle';
import { signInWithGitHub, signInWithGoogle } from './actions';

export default async function LoginPage() {
  const session = await auth();

  if (session?.user) {
    redirect('/dashboard');
  }

  return (
    <main className="min-h-screen">
      <div className="page-shell py-6">
        <div className="glass soft-ring flex items-center justify-between rounded-4xl p-5 shadow-glow">
          <Link href="/" className="text-xl font-black text-slate-900 dark:text-white">
            MikuBlob♪
          </Link>
          <ThemeToggle />
        </div>
      </div>

      <div className="page-shell grid items-center gap-8 pb-12 pt-4 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="soft-card p-6 sm:p-8">
          <div className="section-title">log in</div>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-900 dark:text-white">
            keep your notes in one soft place
          </h1>
          <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
            Sign in, save what you studied today, and come back tomorrow. Nothing loud. Just your own line.
          </p>

          <div className="mt-6 space-y-3">
            <form action={signInWithGoogle}>
              <GoogleSignInButton />
            </form>
            <form action={signInWithGitHub}>
              <GitHubSignInButton />
            </form>
          </div>

          <div className="mt-6 rounded-[1.5rem] bg-teal-50/80 p-4 text-sm leading-6 text-slate-600 dark:bg-teal-950/30 dark:text-slate-300">
            MikuBlob saves your sign-in, then opens your dashboard. You can log out any time from your page.
          </div>

          <div className="mt-6">
            <Link href="/" className="text-sm font-semibold text-teal-600 dark:text-teal-300">
              back home
            </Link>
          </div>
        </div>

        <div className="glass soft-ring bg-grid rounded-[2.5rem] p-6 sm:p-8">
          <div className="grid items-center gap-6 sm:grid-cols-[0.95fr_1.05fr]">
            <MikuImage className="mx-auto max-w-[260px]" />
            <div className="space-y-4">
              <div className="pill inline-flex">gentle start</div>
              {[
                ['save today', 'A title, a tag, and a tiny note.'],
                ['find it later', 'Search by title, tag, or date.'],
                ['keep the line', 'Watch your quiet streak grow.']
              ].map(([title, text]) => (
                <div key={title} className="soft-card p-4">
                  <div className="font-semibold text-slate-900 dark:text-white">{title}</div>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
