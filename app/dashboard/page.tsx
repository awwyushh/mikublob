import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { auth } from '@/auth';
import { FormSubmitButton } from '@/components/form-submit-button';
import { MikuMascot } from '@/components/miku-mascot';
import { SignOutButton } from '@/components/sign-out-button';
import { ThemeToggle } from '@/components/theme-toggle';
import { getDashboardData } from '@/lib/blob-service';
import { formatLongDate, formatMonthLabel, getCalendarDays, startOfMonth, toDateInputValue } from '@/lib/utils';
import { createBlobAction, deleteBlobAction, signOutAction, updateBlobAction } from './actions';

type DashboardPageProps = {
  searchParams?: {
    tab?: string;
    date?: string;
    q?: string;
    tag?: string;
    blob?: string;
  };
};

const tabs = [
  { key: 'calendar', label: 'Calendar', icon: '◌' },
  { key: 'search', label: 'Search', icon: '⌕' },
  { key: 'tags', label: 'Tags', icon: '#' },
  { key: 'stats', label: 'Stats', icon: '◔' },
  { key: 'profile', label: 'Profile', icon: '◡' }
] as const;

const blobTypes = ['VIDEO', 'BOOK', 'PAPER', 'ARTICLE', 'PODCAST', 'CONFERENCE', 'COURSE', 'OTHER'] as const;

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const data = await getDashboardData(session.user.id, {
    date: searchParams?.date,
    query: searchParams?.q,
    tag: searchParams?.tag
  });

  if (!data) {
    return (
      <main className="page-shell py-10">
        <div className="soft-card p-6 text-sm text-slate-600 dark:text-slate-300">
          Database is not ready yet. Add `DATABASE_URL`, run Prisma, then reload.
        </div>
      </main>
    );
  }

  const activeTab = resolveTab(searchParams?.tab, searchParams?.blob, searchParams?.tag);
  const activeBlob = searchParams?.blob ? data.allBlobs.find((blob: BlobWithTags) => blob.id === searchParams.blob) : null;
  const currentMonth = startOfMonth(data.activeDate);
  const calendarDays = getCalendarDays(currentMonth);
  const topTags = data.tagCounts.slice(0, 5);
  const previousMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
  const nextMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
  const previousDay = new Date(data.activeDate.getFullYear(), data.activeDate.getMonth(), data.activeDate.getDate() - 1);
  const nextDay = new Date(data.activeDate.getFullYear(), data.activeDate.getMonth(), data.activeDate.getDate() + 1);

  return (
    <main className="min-h-screen pb-24">
      <section className="page-shell py-4 sm:py-6">
        <div className="glass soft-ring rounded-[2rem] p-4 shadow-glow">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-lg font-black text-slate-900 dark:text-white">MikuBlob♪</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">{session.user.email ?? 'quiet learning log'}</div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <form action={signOutAction}>
                <SignOutButton />
              </form>
            </div>
          </div>
        </div>
      </section>

      <section className="page-shell grid gap-6 lg:grid-cols-[380px_1fr]">
        <div className="space-y-6">
          <div className="glass soft-ring bg-grid rounded-[2.5rem] p-6 shadow-glow">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="section-title">hello</div>
                <h1 className="mt-2 text-3xl font-black text-slate-900 dark:text-white">
                  {session.user.name?.split(' ')[0] ?? 'friend'}
                </h1>
                <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                  Keep a small line of what you studied. Tap a day, open a blob, or add a new one.
                </p>
              </div>
              <MikuMascot className="max-w-[110px]" />
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <MetricCard value={String(data.stats.monthBlobCount)} label="this month" />
              <MetricCard value={`${data.stats.monthMinutes}m`} label="minutes" />
              <MetricCard value={String(data.stats.activeDays)} label="active days" />
              <MetricCard value={String(data.stats.streak)} label="streak" />
            </div>
          </div>

          <div className="soft-card p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="section-title">today</div>
                <h2 className="mt-2 text-xl font-bold text-slate-900 dark:text-white">{formatLongDate(data.activeDate)}</h2>
              </div>
              <Link href={`/dashboard?tab=add&date=${toDateInputValue(data.activeDate)}`} className="pill">
                + add blob
              </Link>
            </div>
            <div className="mt-4 space-y-3">
              {data.dayBlobs.length ? (
                data.dayBlobs.map((blob: BlobWithTags) => (
                  <BlobRow key={blob.id} blob={blob} date={toDateInputValue(data.activeDate)} />
                ))
              ) : (
                <EmptyState text="No blobs on this day yet." />
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {activeTab === 'calendar' ? (
            <section className="soft-card p-6 sm:p-7">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="section-title">calendar</div>
                  <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{formatMonthLabel(currentMonth)}</h2>
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/dashboard?tab=calendar&date=${toDateInputValue(previousMonth)}`} className="pill">
                    ←
                  </Link>
                  <Link href={`/dashboard?tab=calendar&date=${toDateInputValue(nextMonth)}`} className="pill">
                    →
                  </Link>
                  <Link href={`/dashboard?tab=add&date=${toDateInputValue(data.activeDate)}`} className="rounded-full bg-gradient-to-r from-teal-500 to-cyan-400 px-4 py-2 text-sm font-semibold text-white">
                    add blob
                  </Link>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-7 gap-2 text-center text-sm">
                {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((day) => (
                  <div key={day} className="pb-2 font-medium text-slate-500 dark:text-slate-400">
                    {day}
                  </div>
                ))}
                {calendarDays.map(({ date, inMonth }) => {
                  const iso = toDateInputValue(date);
                  const isSelected = iso === toDateInputValue(data.activeDate);
                  const count = data.countsByDate.get(iso) ?? 0;

                  return (
                    <Link
                      key={iso}
                      href={`/dashboard?tab=day&date=${iso}`}
                      className={`relative rounded-2xl border p-3 text-center font-semibold ${
                        isSelected
                          ? 'border-teal-400 bg-teal-500 text-white'
                          : count
                            ? 'border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-900 dark:bg-teal-950/50 dark:text-teal-300'
                            : 'border-transparent bg-slate-50 text-slate-500 dark:bg-slate-800/70 dark:text-slate-300'
                      } ${!inMonth ? 'opacity-50' : ''}`}
                    >
                      {date.getDate()}
                      {count ? <span className="absolute bottom-2 right-2 text-[10px]">{count}</span> : null}
                    </Link>
                  );
                })}
              </div>
            </section>
          ) : null}

          {activeTab === 'day' ? (
            <section className="soft-card p-6 sm:p-7">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="section-title">day view</div>
                  <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{formatLongDate(data.activeDate)}</h2>
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/dashboard?tab=day&date=${toDateInputValue(previousDay)}`} className="pill">
                    ←
                  </Link>
                  <Link href={`/dashboard?tab=day&date=${toDateInputValue(nextDay)}`} className="pill">
                    →
                  </Link>
                  <Link href={`/dashboard?tab=add&date=${toDateInputValue(data.activeDate)}`} className="pill">
                    + add blob
                  </Link>
                </div>
              </div>
              <div className="mt-5 space-y-3">
                {data.dayBlobs.length ? data.dayBlobs.map((blob: BlobWithTags) => <BlobCard key={blob.id} blob={blob} date={toDateInputValue(data.activeDate)} />) : <EmptyState text="This day is still empty. Add your first blob." />}
              </div>
            </section>
          ) : null}

          {activeTab === 'add' ? (
            <section className="soft-card p-6 sm:p-7">
              <div className="section-title">add blob</div>
              <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">save today&apos;s study</h2>
              <BlobForm action={createBlobAction} defaultDate={toDateInputValue(data.activeDate)} />
            </section>
          ) : null}

          {activeTab === 'edit' && activeBlob ? (
            <section className="soft-card p-6 sm:p-7">
              <div className="section-title">edit blob</div>
              <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">update this note</h2>
              <BlobForm
                action={updateBlobAction}
                defaultDate={toDateInputValue(activeBlob.consumedAt)}
                blob={activeBlob}
              />
            </section>
          ) : null}

          {activeTab === 'blob' && activeBlob ? (
            <section className="soft-card p-6 sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="section-title">blob view</div>
                  <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{activeBlob.title}</h2>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    {formatLongDate(activeBlob.consumedAt)} · {activeBlob.type.toLowerCase()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/dashboard?tab=edit&blob=${activeBlob.id}&date=${toDateInputValue(activeBlob.consumedAt)}`} className="pill">
                    Edit
                  </Link>
                  <form action={deleteBlobAction}>
                    <input type="hidden" name="blobId" value={activeBlob.id} />
                    <input type="hidden" name="tab" value="day" />
                    <input type="hidden" name="date" value={toDateInputValue(activeBlob.consumedAt)} />
                    <FormSubmitButton
                      label="Delete"
                      pendingLabel="Deleting..."
                      className="rounded-full border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 dark:border-rose-900/60 dark:text-rose-300"
                    />
                  </form>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {activeBlob.tags.map(({ tag }: { tag: { id: string; name: string } }) => (
                  <Link key={tag.id} href={`/dashboard?tab=tags&tag=${tag.name}`} className="pill">
                    {tag.name}
                  </Link>
                ))}
              </div>
              <DetailBlock title="Summary" text={activeBlob.summary || 'No summary yet.'} />
              <DetailBlock title="Key Learnings" text={activeBlob.keyLearnings || 'No key learnings yet.'} />
              <DetailBlock title="Source" text={activeBlob.sourceUrl || 'No source URL saved.'} />
            </section>
          ) : null}

          {activeTab === 'search' ? (
            <section className="soft-card p-6 sm:p-7">
              <div className="section-title">search</div>
              <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">find old notes</h2>
              <form className="mt-5 flex gap-3" action="/dashboard">
                <input type="hidden" name="tab" value="search" />
                <Field label="Title">
                  <input type="hidden" name="date" value={toDateInputValue(data.activeDate)} />
                  <input name="q" defaultValue={searchParams?.q ?? ''} className={inputClassName} placeholder="title, tag, summary..." />
                </Field>
                <button type="submit" className="rounded-full bg-gradient-to-r from-teal-500 to-cyan-400 px-4 py-2 text-sm font-semibold text-white">
                  Search
                </button>
              </form>
              <div className="mt-5 space-y-3">
                {data.allBlobs.length ? data.allBlobs.map((blob: BlobWithTags) => <BlobRow key={blob.id} blob={blob} date={toDateInputValue(blob.consumedAt)} />) : <EmptyState text="No blobs match this search yet." />}
              </div>
            </section>
          ) : null}

          {activeTab === 'tags' ? (
            <section className="soft-card p-6 sm:p-7">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="section-title">tags</div>
                  <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                    {searchParams?.tag ? `#${searchParams.tag}` : 'your tag shelf'}
                  </h2>
                </div>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {data.tagCounts.length ? (
                  data.tagCounts.map((tag: { name: string; count: number }) => (
                    <Link key={tag.name} href={`/dashboard?tab=tags&tag=${tag.name}`} className="rounded-[1.5rem] border border-slate-200/80 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-800/80">
                      <div className="font-semibold text-slate-900 dark:text-white">#{tag.name}</div>
                      <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">{tag.count} blobs</div>
                    </Link>
                  ))
                ) : (
                  <EmptyState text="No tags yet. Add some while saving blobs." />
                )}
              </div>
              {searchParams?.tag ? (
                <div className="mt-6 space-y-3">
                  {data.allBlobs.length ? data.allBlobs.map((blob: BlobWithTags) => <BlobRow key={blob.id} blob={blob} date={toDateInputValue(blob.consumedAt)} />) : <EmptyState text="No blobs under this tag yet." />}
                </div>
              ) : null}
            </section>
          ) : null}

          {activeTab === 'stats' ? (
            <section className="soft-card p-6 sm:p-7">
              <div className="section-title">stats</div>
              <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">how the month looks</h2>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <MetricCard value={String(data.stats.monthBlobCount)} label="month blobs" />
                <MetricCard value={`${data.stats.monthMinutes}m`} label="month minutes" />
                <MetricCard value={String(data.stats.activeDays)} label="active days" />
                <MetricCard value={String(data.stats.totalBlobCount)} label="all blobs" />
              </div>
              <div className="mt-6 rounded-[1.5rem] bg-slate-50 p-4 dark:bg-slate-800/70">
                <div className="text-sm font-semibold text-slate-900 dark:text-white">Top tags</div>
                <div className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                  {topTags.length ? topTags.map((tag: { name: string; count: number }) => <div key={tag.name} className="flex items-center justify-between"><span>#{tag.name}</span><span>{tag.count}</span></div>) : <div>No tags yet.</div>}
                </div>
              </div>
            </section>
          ) : null}

          {activeTab === 'profile' ? (
            <section className="soft-card p-6 sm:p-7">
              <div className="section-title">profile</div>
              <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{session.user.name ?? 'MikuBlob user'}</h2>
              <div className="mt-5 space-y-4">
                <ProfileRow label="email" value={session.user.email ?? 'No email returned'} />
                <ProfileRow label="this month" value={`${data.stats.monthBlobCount} blobs`} />
                <ProfileRow label="all blobs" value={`${data.stats.totalBlobCount} total`} />
                <ProfileRow label="streak" value={`${data.stats.streak} days`} />
                <ProfileRow label="tags" value={`${data.tagCounts.length} tags`} />
                <ProfileRow label="theme" value="light / dark" />
              </div>
            </section>
          ) : null}
        </div>
      </section>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/50 bg-white/85 px-4 py-3 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/85">
        <div className="page-shell">
          <div className="grid grid-cols-5 gap-2">
            {tabs.map((tab) => {
              const href = `/dashboard?tab=${tab.key}${tab.key === 'calendar' || tab.key === 'search' || tab.key === 'tags' || tab.key === 'stats' || tab.key === 'profile' ? `&date=${toDateInputValue(data.activeDate)}` : ''}`;
              const isActive = activeTab === tab.key;

              return (
                <Link
                  key={tab.key}
                  href={href as never}
                  className={`rounded-2xl px-2 py-2 text-center text-xs font-semibold ${
                    isActive ? 'bg-teal-500 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  <div>{tab.icon}</div>
                  <div className="mt-1">{tab.label}</div>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </main>
  );
}

function resolveTab(tab: string | undefined, blobId: string | undefined, tag: string | undefined) {
  if (blobId) {
    return 'blob';
  }

  if (tag && tab === 'tags') {
    return 'tags';
  }

  if (tab === 'add' || tab === 'edit' || tab === 'search' || tab === 'tags' || tab === 'stats' || tab === 'profile' || tab === 'day') {
    return tab;
  }

  return 'calendar';
}

function MetricCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-[1.5rem] bg-white/85 p-4 dark:bg-slate-900/80">
      <div className="text-2xl font-black text-slate-900 dark:text-white">{value}</div>
      <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">{label}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <div className="mb-2 text-sm font-medium text-slate-600 dark:text-slate-300">{label}</div>
      {children}
    </label>
  );
}

function BlobCard({ blob, date }: { blob: BlobWithTags; date: string }) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200/80 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-800/80">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link href={`/dashboard?tab=blob&blob=${blob.id}&date=${date}`} className="text-base font-semibold text-slate-900 dark:text-white">
            {blob.title}
          </Link>
          <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {blob.type.toLowerCase()} {blob.durationMin ? `· ${blob.durationMin} min` : ''}
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{blob.summary || blob.keyLearnings || 'Open to read more.'}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {blob.tags.slice(0, 2).map(({ tag }) => (
            <Link key={tag.id} href={`/dashboard?tab=tags&tag=${tag.name}`} className="pill">
              {tag.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function BlobRow({ blob, date }: { blob: BlobWithTags; date: string }) {
  return (
    <Link
      href={`/dashboard?tab=blob&blob=${blob.id}&date=${date}`}
      className="flex items-center justify-between rounded-[1.5rem] border border-slate-200/80 bg-white/80 p-4 transition hover:border-teal-300 dark:border-slate-700 dark:bg-slate-800/80"
    >
      <div>
        <div className="font-semibold text-slate-900 dark:text-white">{blob.title}</div>
        <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {blob.type.toLowerCase()} · {formatLongDate(blob.consumedAt)}
        </div>
      </div>
      <div className="pill">{blob.tags[0]?.tag.name ?? blob.type.toLowerCase()}</div>
    </Link>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-[1.5rem] bg-slate-50 p-4 text-sm text-slate-500 dark:bg-slate-800/70 dark:text-slate-400">{text}</div>;
}

function DetailBlock({ title, text }: { title: string; text: string }) {
  return (
    <div className="mt-6 rounded-[1.5rem] bg-slate-50 p-4 dark:bg-slate-800/70">
      <div className="text-sm font-semibold text-slate-900 dark:text-white">{title}</div>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-600 dark:text-slate-300">{text}</p>
    </div>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.5rem] bg-slate-50 p-4 dark:bg-slate-800/70">
      <div className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</div>
      <div className="mt-2 font-semibold text-slate-900 dark:text-white">{value}</div>
    </div>
  );
}

function BlobForm({
  action,
  defaultDate,
  blob
}: {
  action: (formData: FormData) => Promise<void>;
  defaultDate: string;
  blob?: BlobWithTags;
}) {
  return (
    <form action={action} className="mt-6 space-y-4">
      {blob ? <input type="hidden" name="blobId" value={blob.id} /> : null}
      <Field label="Title">
        <input name="title" required className={inputClassName} placeholder="LLVM IR Deep Dive" defaultValue={blob?.title ?? ''} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Date">
          <input name="consumedAt" type="date" defaultValue={defaultDate} className={inputClassName} />
        </Field>
        <Field label="Type">
          <select name="type" className={inputClassName} defaultValue={blob?.type ?? 'VIDEO'}>
            {blobTypes.map((type) => (
              <option key={type} value={type}>
                {type.toLowerCase()}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Duration (min)">
          <input
            name="durationMin"
            type="number"
            min="0"
            className={inputClassName}
            placeholder="58"
            defaultValue={blob?.durationMin ?? undefined}
          />
        </Field>
      </div>
      <Field label="Source URL">
        <input name="sourceUrl" type="url" className={inputClassName} placeholder="https://..." defaultValue={blob?.sourceUrl ?? ''} />
      </Field>
      <Field label="Tags">
        <input
          name="tags"
          className={inputClassName}
          placeholder="compiler, llvm, ssa"
          defaultValue={blob ? blob.tags.map(({ tag }) => tag.name).join(', ') : ''}
        />
      </Field>
      <Field label="Summary">
        <textarea
          name="summary"
          className={`${inputClassName} min-h-24`}
          placeholder="What was this about?"
          defaultValue={blob?.summary ?? ''}
        />
      </Field>
      <Field label="Key Learnings">
        <textarea
          name="keyLearnings"
          className={`${inputClassName} min-h-28`}
          placeholder="What do you want to remember?"
          defaultValue={blob?.keyLearnings ?? ''}
        />
      </Field>
      <FormSubmitButton
        label={blob ? 'Update blob' : 'Save blob'}
        pendingLabel={blob ? 'Updating...' : 'Saving...'}
        className="rounded-full bg-gradient-to-r from-teal-500 to-cyan-400 px-5 py-3 text-sm font-semibold text-white"
      />
    </form>
  );
}

type BlobWithTags = {
  id: string;
  title: string;
  type: string;
  sourceUrl: string | null;
  summary: string | null;
  keyLearnings: string | null;
  durationMin: number | null;
  consumedAt: Date;
  tags: Array<{
    tag: {
      id: string;
      name: string;
    };
  }>;
};

const inputClassName =
  'w-full rounded-[1.25rem] border border-slate-200 bg-white/90 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-teal-400 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100';
