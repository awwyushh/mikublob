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

function getReturnUrl(formData: FormData, fallback: string) {
  const returnTab = String(formData.get('returnTab') ?? '');
  const returnDate = String(formData.get('returnDate') ?? '');
  const returnBlob = String(formData.get('returnBlob') ?? '');
  const returnTag = String(formData.get('returnTag') ?? '');
  const returnMode = String(formData.get('returnMode') ?? '');
  const returnScope = String(formData.get('returnScope') ?? '');
  const returnQuery = String(formData.get('returnQuery') ?? '');
  const returnPeriod = String(formData.get('returnPeriod') ?? '');

  if (!returnTab) {
    return fallback;
  }

  const params = new URLSearchParams();
  params.set('tab', returnTab);
  if (returnDate) params.set('date', returnDate);
  if (returnBlob) params.set('blob', returnBlob);
  if (returnTag) params.set('tag', returnTag);
  if (returnMode) params.set('mode', returnMode);
  if (returnScope) params.set('scope', returnScope);
  if (returnQuery) params.set('q', returnQuery);
  if (returnPeriod) params.set('period', returnPeriod);
  return `/dashboard?${params.toString()}`;
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

  redirect(getReturnUrl(formData, `/dashboard?tab=${tab}${date ? `&date=${date}` : ''}${tag ? `&tag=${tag}` : ''}${mode ? `&mode=${mode}` : ''}`));
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

  redirect(getReturnUrl(formData, `/dashboard?tab=blob&blob=${blobId}&date=${consumedAt}`));
}
