import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { GitHubSignInButton, GoogleSignInButton } from '@/components/auth-buttons';
import { MikuImage } from '@/components/miku-image';
import { ThemeToggle } from '@/components/theme-toggle';
import { signInWithGitHub, signInWithGoogle } from './actions';

export default async function LoginPage() {
  const session = await auth();

  if (session?.user) {
    redirect('/dashboard?tab=calendar');
  }

  return (
    <main className="min-h-screen">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 py-5">
        <div className="flex items-center justify-between rounded-[2rem] border border-white/50 bg-white/70 px-4 py-3 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/70">
          <Link href="/" className="text-lg font-black text-slate-900 dark:text-white">
            MikuBlob♪
          </Link>
          <ThemeToggle />
        </div>

        <div className="flex flex-1 flex-col justify-center">
          <div className="rounded-[2.5rem] border border-white/50 bg-white/80 p-6 shadow-[0_20px_60px_rgba(57,197,187,0.08)] dark:border-white/10 dark:bg-slate-900/75">
            <MikuImage className="mx-auto max-w-[170px]" />
            <div className="mt-4 text-center">
              <h1 className="text-3xl font-black text-slate-900 dark:text-white">Welcome!</h1>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Login to continue</p>
            </div>
            <div className="mt-6 space-y-3">
              <form action={signInWithGitHub}>
                <GitHubSignInButton />
              </form>
              <form action={signInWithGoogle}>
                <GoogleSignInButton />
              </form>
            </div>
            <div className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
              No account work needed. Your sign-in is your start.
            </div>
            <div className="mt-4 text-center">
              <Link href="/" className="text-sm font-semibold text-teal-600 dark:text-teal-300">
                Back
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
