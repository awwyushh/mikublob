'use server';

import { auth, signOut } from '@/auth';
import { createBlobEntry, deleteBlobEntry, updateBlobEntry } from '@/lib/blob-service';
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
  const tag = String(formData.get('tag') ?? '');
  const mode = String(formData.get('mode') ?? '');

  if (blobId) {
    await deleteBlobEntry(session.user.id, blobId);
  }

  const params = new URLSearchParams();
  params.set('tab', tab);
  if (date) params.set('date', date);
  if (tag) params.set('tag', tag);
  if (mode) params.set('mode', mode);
  redirect(`/dashboard?${params.toString()}`);
}

export async function updateBlobAction(formData: FormData) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const blobId = String(formData.get('blobId') ?? '');
  const consumedAt = String(formData.get('consumedAt') ?? '');

  if (blobId) {
    await updateBlobEntry(session.user.id, blobId, {
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
  }

  redirect(`/dashboard?tab=blob&blob=${blobId}&date=${consumedAt}`);
}
