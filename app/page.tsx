import Link from 'next/link';
import { auth } from '@/auth';
import { MikuMascot } from '@/components/miku-mascot';
import { ThemeToggle } from '@/components/theme-toggle';

const dayBlobs = [
  { title: 'LLVM IR Deep Dive', type: 'Video', note: 'SSA felt much cleaner after this one.' },
  { title: 'APUE Chapter 4', type: 'Book', note: 'File work finally clicked.' },
  { title: 'SSA Paper Notes', type: 'Paper', note: 'A short note, but worth keeping.' }
];

const gentleStats = [
  ['42', 'day streak'],
  ['1,458', 'saved blobs'],
  ['7h 43m', 'this week'],
  ['128', 'compiler notes']
];

const tinySteps = [
  'Save one thing you learned.',
  'Tag it so future you can find it.',
  'Come back tomorrow and keep the line going.'
];

export default async function HomePage() {
  const session = await auth();
  const primaryHref = session?.user ? '/dashboard' : '/login';
  const primaryLabel = session?.user ? 'Open my blob book' : 'Log in';

  return (
    <main className="min-h-screen overflow-hidden">
      <section className="page-shell py-6 lg:py-8">
        <div className="glass soft-ring rounded-4xl p-5 shadow-glow sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2 text-xl font-black text-slate-900 dark:text-white">
              <span className="text-teal-500">♪</span>
              <span>MikuBlob</span>
            </Link>
            <div className="flex items-center gap-3">
              {session?.user ? (
                <Link href="/dashboard" className="pill hidden sm:inline-flex">
                  {session.user.name ?? 'my page'}
                </Link>
              ) : null}
              <ThemeToggle />
            </div>
          </div>
        </div>
      </section>

      <section className="page-shell grid items-center gap-10 pb-8 pt-2 lg:grid-cols-[1.05fr_0.95fr] lg:pb-14">
        <div className="space-y-6">
          <div className="section-title">a small place for what you learned</div>
          <h1 className="max-w-3xl text-5xl font-black tracking-tight text-slate-900 dark:text-white sm:text-6xl lg:text-7xl">
            keep your study days
            <span className="block text-teal-500">soft and findable</span>
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
            MikuBlob keeps one clean line of your reading, watching, and note-taking. Save the title,
            the day, and the one thought you want to keep.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href={primaryHref}
              className="rounded-full bg-gradient-to-r from-teal-500 to-cyan-400 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-500/30"
            >
              {primaryLabel}
            </Link>
            <a
              href="#sample-day"
              className="glass rounded-full px-5 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200"
            >
              See a sample day
            </a>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {tinySteps.map((step, index) => (
              <div key={step} className="soft-card p-4">
                <div className="text-sm font-semibold text-teal-600 dark:text-teal-300">0{index + 1}</div>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{step}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex justify-center">
          <div className="glass soft-ring bg-grid w-full max-w-xl rounded-[2.5rem] p-6 sm:p-8">
            <div className="grid gap-6 sm:grid-cols-[1fr_0.9fr] sm:items-center">
              <div className="space-y-4">
                <div className="pill inline-flex">miku mint</div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">one blob at a time</h2>
                  <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                    A soft home screen, a small log form, and a calm list of what you learned.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {gentleStats.map(([value, label]) => (
                    <div key={label} className="soft-card p-4">
                      <div className="text-2xl font-black text-slate-900 dark:text-white">{value}</div>
                      <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">{label}</div>
                    </div>
                  ))}
                </div>
              </div>
              <MikuMascot mood="happy" className="mx-auto max-w-[260px]" />
            </div>
          </div>
        </div>
      </section>

      <section className="page-shell grid gap-6 pb-16 lg:grid-cols-[1.1fr_0.9fr]" id="sample-day">
        <div className="space-y-6">
          <div className="soft-card p-6 sm:p-7">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="section-title">today</div>
                <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">June 14</h2>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">3 blobs, 1 hour 35 minutes</p>
              </div>
              <div className="pill">streak 42</div>
            </div>
            <div className="mt-5 space-y-3">
              {dayBlobs.map((blob) => (
                <div
                  key={blob.title}
                  className="rounded-[1.5rem] border border-slate-200/80 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-800/80"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-base font-semibold text-slate-900 dark:text-white">{blob.title}</div>
                      <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">{blob.type}</div>
                      <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{blob.note}</p>
                    </div>
                    <div className="pill">{blob.type}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="soft-card p-6 sm:p-7">
            <div className="section-title">why it feels light</div>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {[
                ['small entry', 'Title, type, date, tags, one note.'],
                ['easy return', 'Search later when the name slips away.'],
                ['quiet rhythm', 'A streak is there, but it does not shout.']
              ].map(([title, text]) => (
                <div key={title} className="rounded-[1.5rem] bg-teal-50/70 p-4 dark:bg-teal-950/30">
                  <div className="font-semibold text-slate-900 dark:text-white">{title}</div>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="soft-card p-6 sm:p-7">
            <div className="section-title">calendar</div>
            <div className="mt-4 grid grid-cols-7 gap-2 text-center text-sm">
              {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((day) => (
                <div key={day} className="pb-2 font-medium text-slate-500 dark:text-slate-400">
                  {day}
                </div>
              ))}
              {Array.from({ length: 30 }, (_, index) => {
                const day = index + 1;
                const active = [2, 3, 6, 9, 12, 13, 14, 16, 19, 23, 24, 28].includes(day);

                return (
                  <div
                    key={day}
                    className={`rounded-2xl border p-3 font-semibold ${
                      day === 14
                        ? 'border-teal-400 bg-teal-500 text-white'
                        : active
                          ? 'border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-900 dark:bg-teal-950/50 dark:text-teal-300'
                          : 'border-transparent bg-slate-50 text-slate-500 dark:bg-slate-800/70 dark:text-slate-300'
                    }`}
                  >
                    {day}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="soft-card p-6 sm:p-7">
            <div className="section-title">log in</div>
            <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">keep your own line</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
              Sign in with Google or GitHub and start saving your daily reading and watching.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href={primaryHref}
                className="rounded-full bg-gradient-to-r from-teal-500 to-cyan-400 px-5 py-3 text-sm font-semibold text-white"
              >
                {primaryLabel}
              </Link>
              {session?.user ? (
                <Link href="/dashboard" className="pill inline-flex items-center px-4 py-3 text-sm font-semibold">
                  go to dashboard
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
