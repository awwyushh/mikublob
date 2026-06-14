'use client';

import { useFormStatus } from 'react-dom';

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
      disabled={pending}
    >
      {pending ? 'Signing out…' : 'Sign out'}
    </button>
  );
}

export function SignOutButton() {
  return <SubmitButton />;
}
