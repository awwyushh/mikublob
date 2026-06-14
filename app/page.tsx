import { ThemeToggle } from '@/components/theme-toggle';

const blobs = [
  { title: 'LLVM IR Deep Dive', type: 'Video', time: '58m', tags: ['compiler', 'llvm', 'ssa'] },
  { title: 'APUE Chapter 4', type: 'Book', time: '45m', tags: ['unix', 'systems'] },
  { title: 'CppCon Reflection Talk', type: 'Conference', time: '1h 2m', tags: ['cpp', 'reflection'] },
  { title: 'SSA Paper Notes', type: 'Paper', time: '32m', tags: ['compiler', 'research'] }
];

const tags = ['compiler', 'rust', 'linux', 'os', 'math', 'networking', 'cpp', 'security'];

const calendarDays = Array.from({ length: 30 }, (_, index) => index + 1);
const activeDays = new Set([2, 3, 6, 9, 12, 13, 14, 16, 19, 23, 24, 28]);

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden">
      <section className="mx-auto flex max-w-7xl flex-col gap-10 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="glass soft-ring bg-grid rounded-4xl p-5 shadow-glow sm:p-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <div className="section-title">Mobile PWA · Learning Timeline</div>
              <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-900 dark:text-white sm:text-6xl">
                MikuBlob<span className="text-teal-500">♪</span>
              </h1>
              <p className="mt-4 max-w-xl text-lg leading-8 text-slate-600 dark:text-slate-300">
                Track learning, one Blob at a time. A minimalist, Miku-inspired archive for videos,
                papers, books, talks, and everything else you study.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href="#dashboard"
                  className="rounded-full bg-gradient-to-r from-teal-500 to-cyan-400 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-500/30 transition hover:translate-y-[-1px]"
                >
                  Explore the UI
                </a>
                <a
                  href="#theming"
                  className="glass rounded-full px-5 py-3 text-sm font-semibold text-slate-700 transition hover:translate-y-[-1px] dark:text-slate-200"
                >
                  See dark theme
                </a>
              </div>
            </div>
            <div className="flex flex-col items-start gap-4 lg:items-end">
              <ThemeToggle />
              <div className="glass rounded-3xl p-4 text-sm text-slate-600 dark:text-slate-300">
                <div className="font-semibold text-slate-900 dark:text-white">Design System</div>
                <div className="mt-3 flex gap-2">
                  {['#39c5bb', '#8fe3da', '#f8fefe', '#1a1a1a'].map((swatch) => (
                    <div key={swatch} className="space-y-2 text-center">
                      <div className="h-10 w-10 rounded-2xl border border-black/5" style={{ backgroundColor: swatch }} />
                      <div className="text-[11px]">{swatch}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <section id="dashboard" className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <div className="glass soft-ring rounded-4xl p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="section-title">Calendar Home</div>
                  <h2 className="card-title mt-2">June 2026</h2>
                </div>
                <div className="rounded-full bg-teal-500/10 px-3 py-1 text-sm font-semibold text-teal-700 dark:text-teal-300">
                  🔥 42 day streak
                </div>
              </div>
              <div className="mt-6 grid grid-cols-7 gap-2 text-center text-sm">
                {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((day) => (
                  <div key={day} className="pb-2 font-medium text-slate-500 dark:text-slate-400">
                    {day}
                  </div>
                ))}
                {calendarDays.map((day) => {
                  const active = activeDays.has(day);
                  const current = day === 14;
                  return (
                    <div
                      key={day}
                      className={`relative rounded-2xl border p-3 font-semibold transition ${
                        current
                          ? 'border-teal-400 bg-teal-500 text-white shadow-lg shadow-teal-500/25'
                          : active
                            ? 'border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-900 dark:bg-teal-950/50 dark:text-teal-300'
                            : 'border-transparent bg-slate-50 text-slate-500 dark:bg-slate-800/70 dark:text-slate-300'
                      }`}
                    >
                      {day}
                      {active && !current ? <span className="absolute bottom-2 right-2 h-1.5 w-1.5 rounded-full bg-teal-400" /> : null}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="glass soft-ring rounded-4xl p-5 sm:p-6">
                <div className="section-title">Day View</div>
                <h2 className="card-title mt-2">June 14, 2026</h2>
                <div className="mt-5 space-y-3">
                  {blobs.map((blob) => (
                    <div key={blob.title} className="rounded-3xl border border-slate-200/70 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-800/80">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-base font-semibold text-slate-900 dark:text-white">{blob.title}</div>
                          <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            {blob.type} · {blob.time}
                          </div>
                        </div>
                        <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-200">
                          {blob.tags[0]}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass soft-ring rounded-4xl p-5 sm:p-6">
                <div className="section-title">Add Blob</div>
                <h2 className="card-title mt-2">Fast, structured logging</h2>
                <div className="mt-5 space-y-4">
                  {[
                    ['Title', 'e.g. LLVM IR Deep Dive'],
                    ['Type', 'Video'],
                    ['Source URL', 'https://youtube.com/watch?...'],
                    ['Duration', '58 min'],
                    ['Summary', 'A focused breakdown of SSA form and IR design'],
                    ['Key Learnings', 'Phi nodes merge control flow...']
                  ].map(([label, value]) => (
                    <div key={label}>
                      <div className="mb-2 text-sm font-medium text-slate-600 dark:text-slate-300">{label}</div>
                      <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-400">
                        {value}
                      </div>
                    </div>
                  ))}
                  <div className="flex flex-wrap gap-2">
                    {['compiler', 'llvm', 'ssa'].map((tag) => (
                      <span key={tag} className="rounded-full bg-teal-500/10 px-3 py-1 text-xs font-semibold text-teal-700 dark:text-teal-300">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="glass soft-ring rounded-4xl p-5 sm:p-6">
              <div className="section-title">Search & Tags</div>
              <h2 className="card-title mt-2">Rediscover what you learned</h2>
              <div className="mt-5 rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-400 dark:border-slate-700 dark:bg-slate-800/80">
                Search blobs, tags, topics, papers...
              </div>
              <div className="mt-4 space-y-3">
                {blobs.slice(0, 3).map((blob) => (
                  <div key={blob.title} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-800/70">
                    <div>
                      <div className="font-medium text-slate-800 dark:text-slate-100">{blob.title}</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">{blob.type}</div>
                    </div>
                    <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-700 dark:text-cyan-300">
                      {blob.tags[0]}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span key={tag} className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 dark:border-slate-700 dark:text-slate-300">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="glass soft-ring rounded-4xl p-5 sm:p-6">
              <div className="section-title">Stats</div>
              <h2 className="card-title mt-2">Momentum over perfection</h2>
              <div className="mt-5 grid grid-cols-2 gap-3">
                {[
                  ['12', 'Blobs'],
                  ['7h 43m', 'Time Spent'],
                  ['42', 'Day Streak'],
                  ['1,458', 'Total Blobs']
                ].map(([value, label]) => (
                  <div key={label} className="rounded-3xl bg-gradient-to-br from-white to-teal-50 p-4 dark:from-slate-800 dark:to-slate-900">
                    <div className="text-2xl font-black text-slate-900 dark:text-white">{value}</div>
                    <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">{label}</div>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex items-center gap-4">
                <div className="flex h-28 w-28 items-center justify-center rounded-full bg-[conic-gradient(#2dd4bf_0_35%,#22c55e_35%_58%,#a78bfa_58%_78%,#fb7185_78%_100%)]">
                  <div className="h-16 w-16 rounded-full bg-white dark:bg-slate-900" />
                </div>
                <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                  <div>Compiler · 35%</div>
                  <div>Rust · 23%</div>
                  <div>Linux · 19%</div>
                  <div>Math · 12%</div>
                  <div>Others · 11%</div>
                </div>
              </div>
            </div>

            <div className="glass soft-ring rounded-4xl p-5 sm:p-6" id="theming">
              <div className="section-title">Dark Theming</div>
              <h2 className="card-title mt-2">Soft contrast, same playful identity</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                The interface supports both light and dark modes with shared teal accents, translucent cards,
                comfortable contrast, and the same calendar-first information hierarchy.
              </p>
              <div className="mt-5 rounded-3xl border border-dashed border-teal-400/40 bg-slate-950 px-5 py-4 text-sm text-slate-200">
                Tip: use the theme toggle above to preview both modes instantly.
              </div>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
