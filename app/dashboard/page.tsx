import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { auth } from '@/auth';
import { DashboardTopBar } from '@/components/dashboard-top-bar';
import { FormSubmitButton } from '@/components/form-submit-button';
import { MikuImage } from '@/components/miku-image';
import { SignOutButton } from '@/components/sign-out-button';
import { ThemeToggle } from '@/components/theme-toggle';
import { getDashboardData } from '@/lib/blob-service';
import type { DashboardTab, SearchScope, StatsPeriod, TagMode } from '@/lib/dashboard-types';
import { formatLongDate, formatMonthLabel, getCalendarDays, startOfMonth, toDateInputValue } from '@/lib/utils';
import { createBlobAction, deleteBlobAction, signOutAction, updateBlobAction } from './actions';

type DashboardPageProps = {
  searchParams?: {
    tab?: string;
    date?: string;
    q?: string;
    tag?: string;
    blob?: string;
    scope?: string;
    mode?: string;
    period?: string;
  };
};

const tabs: Array<{ key: DashboardTab; label: string }> = [
  { key: 'calendar', label: 'Calendar' },
  { key: 'search', label: 'Search' },
  { key: 'tags', label: 'Tags' },
  { key: 'stats', label: 'Stats' },
  { key: 'profile', label: 'Profile' }
];

const blobTypes = ['VIDEO', 'BOOK', 'PAPER', 'ARTICLE', 'PODCAST', 'CONFERENCE', 'COURSE', 'OTHER'] as const;
const searchScopes: SearchScope[] = ['all', 'blobs', 'tags'];
const tagModes: TagMode[] = ['recent', 'popular'];
const statsPeriods: StatsPeriod[] = ['week', 'month'];

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const activeTab = resolveTab(searchParams?.tab, searchParams?.blob, searchParams?.tag);
  const activeDate = searchParams?.date;
  const searchScope = resolveSearchScope(searchParams?.scope);
  const tagMode = resolveTagMode(searchParams?.mode);
  const statsPeriod = resolveStatsPeriod(searchParams?.period);
  const currentQuery = searchParams?.q ?? '';
  const currentTag = searchParams?.tag ?? '';

  const data = await getDashboardData(session.user.id, {
    date: activeDate,
    query: searchParams?.q,
    tag: searchParams?.tag,
    scope: searchScope,
    mode: tagMode,
    period: statsPeriod
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

  const currentMonth = startOfMonth(data.activeDate);
  const calendarDays = getCalendarDays(currentMonth);
  const previousMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
  const nextMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
  const previousDay = new Date(data.activeDate.getFullYear(), data.activeDate.getMonth(), data.activeDate.getDate() - 1);
  const nextDay = new Date(data.activeDate.getFullYear(), data.activeDate.getMonth(), data.activeDate.getDate() + 1);
  const activeBlob = searchParams?.blob ? data.searchBlobs.find((blob: BlobWithTags) => blob.id === searchParams.blob) ?? data.dayBlobs.find((blob: BlobWithTags) => blob.id === searchParams.blob) ?? data.activeTagBlobs.find((blob: BlobWithTags) => blob.id === searchParams.blob) : null;
  const matchingTags = searchParams?.q
    ? data.tagCounts.filter((tag: { name: string; count: number }) => tag.name.includes(searchParams.q!.trim().toLowerCase())).slice(0, 6)
    : [];
  const topBarConfig = getTopBarConfig({
    activeTab,
    activeDate: data.activeDate,
    currentMonth,
    activeBlobId: activeBlob?.id ?? null,
    activeBlobTitle: activeBlob?.title ?? null,
    activeTag: searchParams?.tag ?? null
  });

  return (
    <main className="min-h-screen pb-24">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 pb-24 pt-4">
        <DashboardTopBar
          title={topBarConfig.title}
          subtitle={topBarConfig.subtitle}
          backHref={topBarConfig.backHref}
          showTheme={activeTab === 'calendar'}
          collapsible={activeTab === 'calendar' || activeTab === 'day'}
        />

        <div className="mt-4 space-y-4">
          {activeTab === 'calendar' ? (
            <WelcomeCard
              name={session.user.name?.split(' ')[0] ?? 'friend'}
              streak={data.stats.streak}
              blobCount={data.stats.monthBlobCount}
              minuteCount={statsPeriod === 'week' ? data.stats.weekMinutes : data.stats.monthMinutes}
            />
          ) : null}

          {activeTab === 'calendar' ? (
            <ScreenCard
              title="Calendar"
              subtitle={formatMonthLabel(currentMonth)}
              hideHeader
              action={
                <div className="flex items-center gap-2">
                  <Link href={`/dashboard?tab=calendar&date=${toDateInputValue(previousMonth)}`} className="pill">
                    ←
                  </Link>
                  <Link href={`/dashboard?tab=calendar&date=${toDateInputValue(nextMonth)}`} className="pill">
                    →
                  </Link>
                </div>
              }
            >
              <CalendarGrid calendarDays={calendarDays} activeDate={data.activeDate} countsByDate={data.countsByDate} />
              <div className="mt-4 grid grid-cols-2 gap-3">
                <MetricTile label="Learning Streak" value={`${data.stats.streak} 🔥`} />
                <MetricTile label="This Month" value={`${data.stats.monthBlobCount} Blobs`} />
              </div>
              <FloatingAddLink date={data.activeDate} />
            </ScreenCard>
          ) : null}

          {activeTab === 'day' ? (
            <ScreenCard
              title="Day View"
              subtitle={formatLongDate(data.activeDate)}
              hideHeader
              action={
                <div className="flex items-center gap-2">
                  <Link href={`/dashboard?tab=day&date=${toDateInputValue(previousDay)}`} className="pill">
                    ←
                  </Link>
                  <Link href={`/dashboard?tab=day&date=${toDateInputValue(nextDay)}`} className="pill">
                    →
                  </Link>
                </div>
              }
            >
              <DayTypeStrip counts={data.dayTypeCounts} />
              <div className="mt-4 space-y-3">
                {data.dayBlobs.length ? data.dayBlobs.map((blob: BlobWithTags) => <BlobListRow key={blob.id} blob={blob} date={data.activeDate} />) : <EmptyState text="No blobs on this day yet." />}
              </div>
              <AddBar date={data.activeDate} />
            </ScreenCard>
          ) : null}

          {activeTab === 'add' ? (
            <ScreenCard title="Add Blob" subtitle="Save today’s study" hideHeader>
              <BlobForm action={createBlobAction} defaultDate={toDateInputValue(data.activeDate)} />
            </ScreenCard>
          ) : null}

          {activeTab === 'edit' && activeBlob ? (
            <ScreenCard title="Edit Blob" subtitle="Update this note" hideHeader>
              <BlobForm
                action={updateBlobAction}
                defaultDate={toDateInputValue(activeBlob.consumedAt)}
                blob={activeBlob}
                cancelHref={`/dashboard?tab=blob&blob=${activeBlob.id}&date=${toDateInputValue(activeBlob.consumedAt)}`}
                returnState={{
                  tab: 'blob',
                  date: toDateInputValue(activeBlob.consumedAt),
                  blob: activeBlob.id
                }}
              />
            </ScreenCard>
          ) : null}

          {activeTab === 'blob' && activeBlob ? (
            <ScreenCard
              title="Blob View"
              subtitle={activeBlob.title}
              hideHeader
              action={<Link href={`/dashboard?tab=edit&blob=${activeBlob.id}&date=${toDateInputValue(activeBlob.consumedAt)}`} className="pill">Edit</Link>}
            >
              <BlobHero blob={activeBlob} />
              <TagPills tags={activeBlob.tags} />
              <ArticleBlock title="Summary" text={activeBlob.summary || 'No summary yet.'} />
              <ArticleBlock title="Key Learnings" text={activeBlob.keyLearnings || 'No key learnings yet.'} />
              <SourceBlock sourceUrl={activeBlob.sourceUrl} />
              <div className="mt-4">
                <form action={deleteBlobAction}>
                  <input type="hidden" name="blobId" value={activeBlob.id} />
                  <input type="hidden" name="tab" value="day" />
                  <input type="hidden" name="date" value={toDateInputValue(activeBlob.consumedAt)} />
                  <input type="hidden" name="returnTab" value="day" />
                  <input type="hidden" name="returnDate" value={toDateInputValue(activeBlob.consumedAt)} />
                  {currentTag ? <input type="hidden" name="returnTag" value={currentTag} /> : null}
                  {searchParams?.mode ? <input type="hidden" name="returnMode" value={searchParams.mode} /> : null}
                  {searchScope ? <input type="hidden" name="returnScope" value={searchScope} /> : null}
                  {currentQuery ? <input type="hidden" name="returnQuery" value={currentQuery} /> : null}
                  {statsPeriod ? <input type="hidden" name="returnPeriod" value={statsPeriod} /> : null}
                  <FormSubmitButton
                    label="Delete Blob"
                    pendingLabel="Deleting..."
                    className="w-full rounded-full border border-rose-200 px-4 py-3 text-sm font-semibold text-rose-600 dark:border-rose-900/60 dark:text-rose-300"
                  />
                </form>
              </div>
            </ScreenCard>
          ) : null}

          {activeTab === 'search' ? (
            <ScreenCard title="Search" subtitle="Find old notes" hideHeader>
              <form action="/dashboard" className="space-y-3">
                <input type="hidden" name="tab" value="search" />
                <input type="hidden" name="date" value={toDateInputValue(data.activeDate)} />
                <div className="rounded-[1.5rem] border border-slate-200 bg-white/90 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/80">
                  <input name="q" defaultValue={searchParams?.q ?? ''} className="w-full bg-transparent text-sm outline-none" placeholder="ssa, compiler, june..." />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {searchScopes.map((scope) => (
                    <label key={scope} className={`rounded-full px-3 py-2 text-center text-xs font-semibold ${searchScope === scope ? 'bg-teal-500 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>
                      <input type="radio" name="scope" value={scope} defaultChecked={searchScope === scope} className="sr-only" />
                      {scope === 'all' ? 'All' : scope === 'blobs' ? 'Blobs' : 'Tags'}
                    </label>
                  ))}
                </div>
                <button type="submit" className="w-full rounded-full bg-gradient-to-r from-teal-500 to-cyan-400 px-4 py-3 text-sm font-semibold text-white">
                  Search
                </button>
              </form>
              {matchingTags.length > 0 && searchScope !== 'blobs' ? (
                <div className="mt-4">
                  <div className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">Matching Tags</div>
                  <div className="flex flex-wrap gap-2">
                    {matchingTags.map((tag: { name: string; count: number }) => (
                      <Link key={tag.name} href={`/dashboard?tab=tag&tag=${tag.name}&date=${toDateInputValue(data.activeDate)}`} className="pill">
                        #{tag.name} · {tag.count}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}
              <div className="mt-4 space-y-3">
                {data.searchBlobs.length ? data.searchBlobs.map((blob: BlobWithTags) => <BlobListRow key={blob.id} blob={blob} date={blob.consumedAt} />) : <EmptyState text="No results yet." />}
              </div>
            </ScreenCard>
          ) : null}

          {activeTab === 'tags' ? (
            <ScreenCard title="Tags" subtitle="Your shelves" hideHeader>
              <div className="space-y-3">
                {data.tagCounts.length ? data.tagCounts.map((tag: { name: string; count: number }) => (
                  <Link key={tag.name} href={`/dashboard?tab=tag&tag=${tag.name}&date=${toDateInputValue(data.activeDate)}`} className="flex items-center justify-between rounded-[1.5rem] border border-slate-200/80 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-800/80">
                    <span className="font-semibold text-slate-900 dark:text-white">#{tag.name}</span>
                    <span className="text-sm text-slate-500 dark:text-slate-400">{tag.count}</span>
                  </Link>
                )) : <EmptyState text="No tags yet." />}
              </div>
            </ScreenCard>
          ) : null}

          {activeTab === 'tag' ? (
            <ScreenCard title="Tag Detail" subtitle={searchParams?.tag ? `#${searchParams.tag}` : 'Pick a tag'} hideHeader>
              <div className="grid grid-cols-2 gap-2">
                {tagModes.map((mode) => (
                  <Link
                    key={mode}
                    href={`/dashboard?tab=tag&tag=${searchParams?.tag ?? ''}&mode=${mode}&date=${toDateInputValue(data.activeDate)}`}
                    className={`rounded-full px-3 py-2 text-center text-xs font-semibold ${tagMode === mode ? 'bg-teal-500 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}
                  >
                    {mode === 'recent' ? 'Recent' : 'Popular'}
                  </Link>
                ))}
              </div>
              <div className="mt-4 text-sm text-slate-500 dark:text-slate-400">{data.activeTagBlobs.length} blobs</div>
              <div className="mt-4 space-y-3">
                {data.activeTagBlobs.length ? data.activeTagBlobs.map((blob: BlobWithTags) => <BlobListRow key={blob.id} blob={blob} date={blob.consumedAt} />) : <EmptyState text="No blobs under this tag yet." />}
              </div>
            </ScreenCard>
          ) : null}

          {activeTab === 'stats' ? (
            <ScreenCard title="Stats" subtitle="How it is going" hideHeader>
              <div className="grid grid-cols-2 gap-2">
                {statsPeriods.map((period) => (
                  <Link
                    key={period}
                    href={`/dashboard?tab=stats&period=${period}&date=${toDateInputValue(data.activeDate)}`}
                    className={`rounded-full px-3 py-2 text-center text-xs font-semibold ${statsPeriod === period ? 'bg-teal-500 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}
                  >
                    {period === 'week' ? 'This Week' : 'This Month'}
                  </Link>
                ))}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <MetricTile label="Blobs" value={String(statsPeriod === 'week' ? data.stats.weekBlobCount : data.stats.monthBlobCount)} />
                <MetricTile label="Time Spent" value={`${statsPeriod === 'week' ? data.stats.weekMinutes : data.stats.monthMinutes}m`} />
                <MetricTile label="Day Streak" value={String(data.stats.streak)} />
                <MetricTile label="Total Blobs" value={String(data.stats.totalBlobCount)} />
              </div>
              <div className="mt-5 rounded-[1.5rem] bg-slate-50 p-4 dark:bg-slate-800/70">
                <div className="text-sm font-semibold text-slate-900 dark:text-white">Top Topics</div>
                <div className="mt-4 flex items-center gap-4">
                  <DonutChart items={data.topicDistribution} />
                  <div className="flex-1 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                    {data.topicDistribution.length ? data.topicDistribution.map((item) => (
                      <div key={item.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                          <span>#{item.name}</span>
                        </div>
                        <span>{item.percentage}%</span>
                      </div>
                    )) : <div>No tag data yet.</div>}
                  </div>
                </div>
              </div>
            </ScreenCard>
          ) : null}

          {activeTab === 'profile' ? (
            <ScreenCard title="Profile" subtitle={session.user.name ?? 'MikuBlob user'} hideHeader>
              <div className="rounded-[1.5rem] bg-gradient-to-br from-teal-100 to-cyan-50 p-4 dark:from-teal-950/40 dark:to-slate-900">
                <div className="flex items-center gap-4">
                  <MikuImage size={72} className="max-w-[72px]" />
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">{session.user.name ?? 'MikuBlob user'}</div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">{session.user.email ?? 'quiet learner'}</div>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <MetricTile compact label="Total Blobs" value={String(data.stats.totalBlobCount)} />
                  <MetricTile compact label="Learning Days" value={String(data.stats.activeDays)} />
                  <MetricTile compact label="Hours Logged" value={(Math.round(data.stats.monthMinutes / 6) / 10).toFixed(1)} />
                </div>
              </div>
              <div className="mt-4 space-y-3">
                <ProfileLink href="/api/export" label="Export Data" hint="Download your blobs as JSON" />
                <ProfileLink href="/dashboard?tab=profile" label="Import Data" hint="Soon" disabled />
                <div className="rounded-[1.5rem] border border-slate-200/80 bg-white/80 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/80">
                  <div className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Theme</div>
                  <ThemeToggle />
                </div>
                <ProfileLink href="/dashboard?tab=profile" label="Backup" hint="Soon" disabled />
                <ProfileLink href="mailto:support@mikublob.app" label="Help & Feedback" hint="Send email" />
                <form action={signOutAction}>
                  <FormSubmitButton
                    label="Logout"
                    pendingLabel="Logging out..."
                    className="w-full rounded-[1.5rem] border border-rose-200 bg-white/90 px-4 py-3 text-left text-sm font-semibold text-rose-600 dark:border-rose-900/60 dark:bg-slate-900/80 dark:text-rose-300"
                  />
                </form>
              </div>
            </ScreenCard>
          ) : null}
        </div>
      </div>

      <BottomNav activeTab={activeTab} date={data.activeDate} />
    </main>
  );
}

function WelcomeCard({ name, streak, blobCount, minuteCount }: { name: string; streak: number; blobCount: number; minuteCount: number }) {
  return (
    <div className="glass soft-ring bg-grid rounded-[2.5rem] p-5 shadow-glow">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="section-title">hello</div>
          <h1 className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{name}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            Keep a small line of what you studied. One blob at a time.
          </p>
        </div>
        <MikuImage size={88} className="max-w-[88px]" />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <MetricTile compact label="Streak" value={`${streak}`} />
        <MetricTile compact label="This Month" value={`${blobCount}`} />
        <MetricTile compact label="Minutes" value={`${minuteCount}`} />
      </div>
    </div>
  );
}

function ScreenCard({
  title,
  subtitle,
  action,
  hideHeader = false,
  children
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  hideHeader?: boolean;
  children: ReactNode;
}) {
  return (
    <section className="soft-card screen-enter p-5">
      {!hideHeader || action ? (
        <div className="flex items-start justify-between gap-3">
          {!hideHeader ? (
            <div>
              <div className="section-title">{title}</div>
              {subtitle ? <h2 className="mt-2 text-xl font-bold text-slate-900 dark:text-white">{subtitle}</h2> : null}
            </div>
          ) : (
            <div />
          )}
          {action}
        </div>
      ) : null}
      <div className={!hideHeader || action ? 'mt-4' : ''}>{children}</div>
    </section>
  );
}

function CalendarGrid({
  calendarDays,
  activeDate,
  countsByDate
}: {
  calendarDays: Array<{ date: Date; inMonth: boolean }>;
  activeDate: Date;
  countsByDate: Map<string, number>;
}) {
  return (
    <div className="grid grid-cols-7 gap-2 text-center text-sm">
      {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((day) => (
        <div key={day} className="pb-2 font-medium text-slate-500 dark:text-slate-400">
          {day}
        </div>
      ))}
      {calendarDays.map(({ date, inMonth }) => {
        const iso = toDateInputValue(date);
        const isSelected = iso === toDateInputValue(activeDate);
        const count = countsByDate.get(iso) ?? 0;

        return (
          <Link
            key={iso}
            href={`/dashboard?tab=day&date=${iso}`}
            className={`relative rounded-2xl border p-3 font-semibold ${
              isSelected
                ? 'border-teal-400 bg-teal-500 text-white'
                : count
                  ? 'border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-900 dark:bg-teal-950/50 dark:text-teal-300'
                  : 'border-transparent bg-slate-50 text-slate-500 dark:bg-slate-800/70 dark:text-slate-300'
            } ${!inMonth ? 'opacity-50' : ''}`}
          >
            <span className="block text-center">{date.getDate()}</span>
            {count ? (
              <span
                className={`absolute -right-1.5 -top-1.5 flex min-h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold leading-none shadow-sm ${
                  isSelected
                    ? 'bg-white text-teal-600'
                    : 'bg-teal-500 text-white dark:bg-teal-400 dark:text-slate-950'
                }`}
              >
                {count > 99 ? '99+' : count}
              </span>
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}

function DayTypeStrip({ counts }: { counts: Array<{ type: string; count: number }> }) {
  if (!counts.length) {
    return null;
  }

  return (
    <div className="rounded-[1.5rem] bg-teal-50/70 p-4 dark:bg-teal-950/30">
      <div className="text-sm font-semibold text-slate-900 dark:text-white">{counts.reduce((sum, item) => sum + item.count, 0)} Blobs</div>
      <div className="mt-3 grid grid-cols-4 gap-2">
        {counts.slice(0, 4).map((item) => (
          <div key={item.type} className="rounded-[1.25rem] bg-white/80 p-2 text-center dark:bg-slate-900/70">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">{item.type.toLowerCase()}</div>
            <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{item.count}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FloatingAddLink({ date }: { date: Date }) {
  return (
    <div className="mt-5 flex justify-end">
      <Link
        href={`/dashboard?tab=add&date=${toDateInputValue(date)}`}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-teal-500 to-cyan-400 text-xl font-semibold text-white shadow-lg shadow-teal-500/30"
      >
        +
      </Link>
    </div>
  );
}

function AddBar({ date }: { date: Date }) {
  return (
    <div className="mt-5">
      <Link
        href={`/dashboard?tab=add&date=${toDateInputValue(date)}`}
        className="flex w-full items-center justify-center rounded-full bg-gradient-to-r from-teal-500 to-cyan-400 px-5 py-3 text-sm font-semibold text-white"
      >
        + Add Blob
      </Link>
    </div>
  );
}

function BlobListRow({ blob, date }: { blob: BlobWithTags; date: Date }) {
  return (
    <Link
      href={`/dashboard?tab=blob&blob=${blob.id}&date=${toDateInputValue(date)}`}
      className="flex items-center justify-between rounded-[1.5rem] border border-slate-200/80 bg-white/80 p-4 transition hover:border-teal-300 dark:border-slate-700 dark:bg-slate-800/80"
    >
      <div className="min-w-0">
        <div className="truncate font-semibold text-slate-900 dark:text-white">{blob.title}</div>
        <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {blob.type.toLowerCase()} {blob.durationMin ? `· ${blob.durationMin}m` : ''}
        </div>
      </div>
      <div className="ml-3 shrink-0 text-right text-xs text-slate-400">{blob.tags[0]?.tag.name ?? blob.type.toLowerCase()}</div>
    </Link>
  );
}

function BlobHero({ blob }: { blob: BlobWithTags }) {
  return (
    <div className="rounded-[1.75rem] bg-slate-50/90 p-5 dark:bg-slate-800/75">
      <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-teal-600 dark:text-teal-300">Reading Note</div>
      <h2 className="mt-3 text-2xl font-black leading-tight text-slate-900 dark:text-white">{blob.title}</h2>
      <div className="mt-3 text-sm leading-7 text-slate-500 dark:text-slate-400">
        {blob.type.toLowerCase()} · {blob.durationMin ? `${blob.durationMin} min` : 'no duration'} · {formatLongDate(blob.consumedAt)}
      </div>
    </div>
  );
}

function TagPills({ tags }: { tags: BlobWithTags['tags'] }) {
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {tags.map(({ tag }) => (
        <Link key={tag.id} href={`/dashboard?tab=tag&tag=${tag.name}`} className="pill">
          {tag.name}
        </Link>
      ))}
    </div>
  );
}

function ArticleBlock({ title, text }: { title: string; text: string }) {
  return (
    <article className="mt-5 rounded-[1.75rem] border border-slate-200/70 bg-white/90 p-5 dark:border-slate-700/80 dark:bg-slate-900/85">
      <div className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{title}</div>
      <div className="mt-4">
        <p className="whitespace-pre-wrap break-words text-[15px] leading-8 text-slate-700 dark:text-slate-200">{text}</p>
      </div>
    </article>
  );
}

function SourceBlock({ sourceUrl }: { sourceUrl: string | null }) {
  return (
    <section className="mt-5 rounded-[1.75rem] border border-slate-200/70 bg-white/90 p-5 dark:border-slate-700/80 dark:bg-slate-900/85">
      <div className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Source URL</div>
      <div className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
        {sourceUrl ? (
          <a
            href={sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="block break-all text-teal-700 underline decoration-teal-300 underline-offset-4 dark:text-teal-300"
          >
            {sourceUrl}
          </a>
        ) : (
          <p className="break-words">No source URL saved.</p>
        )}
      </div>
    </section>
  );
}

function MetricTile({
  label,
  value,
  compact = false
}: {
  label: string;
  value: string;
  compact?: boolean;
}) {
  return (
    <div className={`rounded-[1.5rem] bg-white/85 dark:bg-slate-900/80 ${compact ? 'p-3' : 'p-4'}`}>
      <div className={`${compact ? 'text-lg' : 'text-2xl'} font-black text-slate-900 dark:text-white`}>{value}</div>
      <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{label}</div>
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

function BlobForm({
  action,
  defaultDate,
  blob,
  cancelHref,
  returnState
}: {
  action: (formData: FormData) => Promise<void>;
  defaultDate: string;
  blob?: BlobWithTags;
  cancelHref?: string;
  returnState?: {
    tab: string;
    date?: string;
    blob?: string;
    tag?: string;
    mode?: string;
    scope?: string;
    q?: string;
    period?: string;
  };
}) {
  return (
    <form action={action} className="space-y-4">
      {blob ? <input type="hidden" name="blobId" value={blob.id} /> : null}
      {returnState ? <input type="hidden" name="returnTab" value={returnState.tab} /> : null}
      {returnState?.date ? <input type="hidden" name="returnDate" value={returnState.date} /> : null}
      {returnState?.blob ? <input type="hidden" name="returnBlob" value={returnState.blob} /> : null}
      {returnState?.tag ? <input type="hidden" name="returnTag" value={returnState.tag} /> : null}
      {returnState?.mode ? <input type="hidden" name="returnMode" value={returnState.mode} /> : null}
      {returnState?.scope ? <input type="hidden" name="returnScope" value={returnState.scope} /> : null}
      {returnState?.q ? <input type="hidden" name="returnQuery" value={returnState.q} /> : null}
      {returnState?.period ? <input type="hidden" name="returnPeriod" value={returnState.period} /> : null}
      <Field label="Title">
        <input name="title" required className={inputClassName} placeholder="e.g. LLVM IR Deep Dive" defaultValue={blob?.title ?? ''} />
      </Field>
      <Field label="Type">
        <select name="type" className={inputClassName} defaultValue={blob?.type ?? 'VIDEO'}>
          {blobTypes.map((type) => (
            <option key={type} value={type}>
              {type[0]}{type.slice(1).toLowerCase()}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Date">
        <input name="consumedAt" type="date" defaultValue={defaultDate} className={inputClassName} />
      </Field>
      <Field label="Source URL">
        <input name="sourceUrl" type="url" className={inputClassName} placeholder="https://youtube.com/watch?v=..." defaultValue={blob?.sourceUrl ?? ''} />
      </Field>
      <Field label="Duration (min)">
        <input name="durationMin" type="number" min="0" className={inputClassName} placeholder="58" defaultValue={blob?.durationMin ?? undefined} />
      </Field>
      <Field label="Tags">
        <input name="tags" className={inputClassName} placeholder="compiler, llvm, ssa" defaultValue={blob ? blob.tags.map(({ tag }) => tag.name).join(', ') : ''} />
      </Field>
      <Field label="Summary">
        <textarea name="summary" className={`${inputClassName} min-h-24`} placeholder="What was this about?" defaultValue={blob?.summary ?? ''} />
      </Field>
      <Field label="Key Learnings">
        <textarea name="keyLearnings" className={`${inputClassName} min-h-28`} placeholder="What did you learn?" defaultValue={blob?.keyLearnings ?? ''} />
      </Field>
      <div className="flex gap-3">
        {cancelHref ? (
          <Link
            href={cancelHref as never}
            className="flex-1 rounded-full border border-slate-200 bg-white/90 px-5 py-3 text-center text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200"
          >
            Cancel
          </Link>
        ) : null}
        <FormSubmitButton
          label={blob ? 'Save Changes' : 'Save Blob'}
          pendingLabel={blob ? 'Saving...' : 'Saving...'}
          className={`${cancelHref ? 'flex-1' : 'w-full'} rounded-full bg-gradient-to-r from-teal-500 to-cyan-400 px-5 py-3 text-sm font-semibold text-white`}
        />
      </div>
    </form>
  );
}

function DonutChart({
  items
}: {
  items: Array<{ name: string; count: number; percentage: number; color: string }>;
}) {
  if (!items.length) {
    return <div className="flex h-24 w-24 items-center justify-center rounded-full bg-slate-200 text-xs text-slate-500 dark:bg-slate-700">0</div>;
  }

  const gradient = items
    .reduce<{ start: number; parts: string[] }>(
      (acc, item) => {
        const end = acc.start + item.percentage;
        acc.parts.push(`${item.color} ${acc.start}% ${end}%`);
        acc.start = end;
        return acc;
      },
      { start: 0, parts: [] }
    )
    .parts.join(', ');

  return (
    <div className="flex h-24 w-24 items-center justify-center rounded-full" style={{ background: `conic-gradient(${gradient})` }}>
      <div className="h-14 w-14 rounded-full bg-white dark:bg-slate-900" />
    </div>
  );
}

function ProfileLink({
  href,
  label,
  hint,
  disabled = false
}: {
  href: string;
  label: string;
  hint: string;
  disabled?: boolean;
}) {
  const className = 'flex items-center justify-between rounded-[1.5rem] border border-slate-200/80 bg-white/80 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-800/80';

  if (disabled) {
    return (
      <div className={`${className} text-slate-400 dark:text-slate-500`}>
        <span>{label}</span>
        <span>{hint}</span>
      </div>
    );
  }

  return (
    <a href={href} className={`${className} text-slate-700 dark:text-slate-200`} download={href === '/api/export' ? '' : undefined}>
      <span>{label}</span>
      <span className="text-slate-400">{hint}</span>
    </a>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200/80 bg-white/80 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/80">
      <div className="text-sm font-semibold text-slate-900 dark:text-white">{label}</div>
      <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">{value}</div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-[1.5rem] bg-slate-50 p-4 text-sm text-slate-500 dark:bg-slate-800/70 dark:text-slate-400">{text}</div>;
}

function BottomNav({ activeTab, date }: { activeTab: DashboardTab; date: Date }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 px-4 pb-3 pt-2">
      <div className="mx-auto w-full max-w-md">
        <div className="grid grid-cols-5 gap-1 rounded-[2rem] border border-white/60 bg-white/92 p-2 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/90 dark:shadow-[0_-8px_30px_rgba(0,0,0,0.35)]">
          {tabs.map((tab) => {
            const href = `/dashboard?tab=${tab.key}&date=${toDateInputValue(date)}`;
            const isActive = activeTab === tab.key || (activeTab === 'tag' && tab.key === 'tags');

            return (
              <Link
                key={tab.key}
                href={href as never}
                className={`group flex flex-col items-center rounded-[1.25rem] px-1 py-2 text-center transition ${
                  isActive ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                <div
                  className={`flex h-8 min-w-12 items-center justify-center rounded-full px-3 transition ${
                    isActive
                      ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/60 dark:text-teal-200'
                      : 'group-hover:bg-slate-100 dark:group-hover:bg-slate-800/80'
                  }`}
                >
                  <BottomNavIcon tab={tab.key} active={isActive} />
                </div>
                <div className={`mt-1 text-[11px] font-semibold ${isActive ? 'text-slate-900 dark:text-white' : ''}`}>{tab.label}</div>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

function BottomNavIcon({ tab, active }: { tab: DashboardTab; active: boolean }) {
  const className = `h-5 w-5 ${active ? 'stroke-[2.4]' : 'stroke-2'}`;

  switch (tab) {
    case 'calendar':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
          <path d="M7 3.5v3M17 3.5v3M3.5 9.5h17" />
          <path d="M8 13h2M12 13h2M16 13h.01M8 17h2M12 17h2" />
        </svg>
      );
    case 'search':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="6.5" />
          <path d="M16 16l4.5 4.5" />
        </svg>
      );
    case 'tags':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 12.5V6.8A2.8 2.8 0 0 1 6.8 4H13l7 7-8.2 8.2a2 2 0 0 1-2.8 0L4 14.9a3.4 3.4 0 0 1 0-2.4Z" />
          <circle cx="9" cy="9" r="1.2" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'stats':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 19.5V11M12 19.5V5M19 19.5v-8" />
          <path d="M3.5 19.5h17" />
        </svg>
      );
    case 'profile':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8.5" r="3.5" />
          <path d="M5 19c1.8-3 4.2-4.5 7-4.5S17.2 16 19 19" />
        </svg>
      );
    default:
      return null;
  }
}

function resolveTab(tab: string | undefined, blobId: string | undefined, tag: string | undefined): DashboardTab {
  if (tab === 'edit') return 'edit';
  if (tab === 'blob' || blobId) return 'blob';
  if (tab === 'tag' || (tag && tab === 'tags')) return tab === 'tag' ? 'tag' : 'tags';
  if (tab === 'add' || tab === 'edit' || tab === 'search' || tab === 'tags' || tab === 'stats' || tab === 'profile' || tab === 'day') {
    return tab;
  }
  return 'calendar';
}

function resolveSearchScope(value: string | undefined): SearchScope {
  return value === 'blobs' || value === 'tags' ? value : 'all';
}

function resolveTagMode(value: string | undefined): TagMode {
  return value === 'popular' ? 'popular' : 'recent';
}

function resolveStatsPeriod(value: string | undefined): StatsPeriod {
  return value === 'month' ? 'month' : 'week';
}

function getTopBarConfig({
  activeTab,
  activeDate,
  currentMonth,
  activeBlobId,
  activeBlobTitle,
  activeTag
}: {
  activeTab: DashboardTab;
  activeDate: Date;
  currentMonth: Date;
  activeBlobId: string | null;
  activeBlobTitle: string | null;
  activeTag: string | null;
}) {
  switch (activeTab) {
    case 'calendar':
      return {
        title: 'MikuBlob♪',
        subtitle: formatMonthLabel(currentMonth)
      };
    case 'day':
      return {
        title: 'Day View',
        subtitle: formatLongDate(activeDate),
        backHref: `/dashboard?tab=calendar&date=${toDateInputValue(activeDate)}`
      };
    case 'add':
      return {
        title: 'Add Blob',
        subtitle: formatLongDate(activeDate),
        backHref: `/dashboard?tab=day&date=${toDateInputValue(activeDate)}`
      };
    case 'edit':
      return {
        title: 'Edit Blob',
        subtitle: activeBlobTitle ?? 'Update note',
        backHref: activeBlobId ? `/dashboard?tab=blob&blob=${activeBlobId}&date=${toDateInputValue(activeDate)}` : `/dashboard?tab=day&date=${toDateInputValue(activeDate)}`
      };
    case 'blob':
      return {
        title: activeBlobTitle ?? 'Blob View',
        subtitle: formatLongDate(activeDate),
        backHref: `/dashboard?tab=day&date=${toDateInputValue(activeDate)}`
      };
    case 'search':
      return {
        title: 'Search',
        subtitle: 'Find old notes'
      };
    case 'tags':
      return {
        title: 'Tags',
        subtitle: 'Your shelves'
      };
    case 'tag':
      return {
        title: activeTag ? `#${activeTag}` : 'Tag Detail',
        subtitle: 'Recent and popular',
        backHref: `/dashboard?tab=tags&date=${toDateInputValue(activeDate)}`
      };
    case 'stats':
      return {
        title: 'Stats',
        subtitle: 'This week and month'
      };
    case 'profile':
      return {
        title: 'Profile',
        subtitle: 'Settings and export'
      };
    default:
      return {
        title: 'MikuBlob♪'
      };
  }
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
