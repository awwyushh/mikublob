'use client';

import { useFormStatus } from 'react-dom';

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className="flex w-full items-center justify-center rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100 dark:hover:bg-slate-800"
      disabled={pending}
    >
      {pending ? 'Connecting…' : label}
    </button>
  );
}

export function GoogleSignInButton() {
  return <SubmitButton label="Continue with Google" />;
}

export function GitHubSignInButton() {
  return <SubmitButton label="Continue with GitHub" />;
}
