'use server';

import { signIn } from '@/auth';

export async function signInWithGoogle() {
  await signIn('google', { redirectTo: '/dashboard?tab=calendar' });
}

export async function signInWithGitHub() {
  await signIn('github', { redirectTo: '/dashboard?tab=calendar' });
}
