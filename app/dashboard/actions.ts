'use server';

import { auth, signOut } from '@/auth';
import { createBlobEntry, deleteBlobEntry } from '@/lib/blob-service';
import { redirect } from 'next/navigation';

export async function signOutAction() {
  await signOut({ redirectTo: '/login' });
}

export async function createBlobAction(formData: FormData) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const consumedAt = String(formData.get('consumedAt') ?? '');

  await createBlobEntry(session.user.id, {
    title: String(formData.get('title') ?? ''),
    type: String(formData.get('type') ?? 'OTHER'),
    sourceUrl: String(formData.get('sourceUrl') ?? ''),
    summary: String(formData.get('summary') ?? ''),
    keyLearnings: String(formData.get('keyLearnings') ?? ''),
    durationMin: formData.get('durationMin') ? Number(formData.get('durationMin')) : null,
    consumedAt,
    tags: String(formData.get('tags') ?? '')
      .split(',')
      .map((tag) => tag.trim())
  });

  redirect(`/dashboard?tab=day&date=${consumedAt}`);
}

export async function deleteBlobAction(formData: FormData) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const blobId = String(formData.get('blobId') ?? '');
  const tab = String(formData.get('tab') ?? 'day');
  const date = String(formData.get('date') ?? '');

  if (blobId) {
    await deleteBlobEntry(session.user.id, blobId);
  }

  redirect(`/dashboard?tab=${tab}${date ? `&date=${date}` : ''}`);
}
