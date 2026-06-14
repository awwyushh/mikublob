type MikuMascotProps = {
  className?: string;
  mood?: 'happy' | 'calm';
};

export function MikuMascot({ className = '', mood = 'happy' }: MikuMascotProps) {
  const blush = mood === 'happy' ? 'opacity-100' : 'opacity-60';

  return (
    <div className={`relative aspect-square w-full max-w-[320px] ${className}`}>
      <div className="absolute left-1/2 top-3 h-5 w-5 -translate-x-1/2 rounded-full bg-teal-300/70 blur-md dark:bg-teal-200/40" />
      <div className="absolute left-8 top-16 h-36 w-16 rounded-full bg-[#39c5bb] shadow-[0_18px_40px_rgba(57,197,187,0.28)] dark:bg-[#2ea79f]" />
      <div className="absolute right-8 top-16 h-36 w-16 rounded-full bg-[#39c5bb] shadow-[0_18px_40px_rgba(57,197,187,0.28)] dark:bg-[#2ea79f]" />
      <div className="absolute left-16 top-10 h-24 w-10 rounded-full bg-[#6ce1d7] dark:bg-[#49c7bd]" />
      <div className="absolute right-16 top-10 h-24 w-10 rounded-full bg-[#6ce1d7] dark:bg-[#49c7bd]" />
      <div className="absolute left-1/2 top-8 h-44 w-44 -translate-x-1/2 rounded-[44%] border border-white/50 bg-white/85 shadow-[0_28px_80px_rgba(57,197,187,0.2)] dark:border-white/10 dark:bg-slate-900/80">
        <div className="absolute inset-x-8 top-4 h-8 rounded-b-[24px] rounded-t-[12px] bg-[#57d9cf] dark:bg-[#3dc0b6]" />
        <div className="absolute left-1/2 top-8 h-8 w-12 -translate-x-1/2 rounded-b-full bg-[#0f172a]" />
        <div className="absolute left-10 top-[4.75rem] h-3 w-3 rounded-full bg-slate-900 dark:bg-slate-100" />
        <div className="absolute right-10 top-[4.75rem] h-3 w-3 rounded-full bg-slate-900 dark:bg-slate-100" />
        <div className={`absolute left-7 top-[5.75rem] h-3 w-5 rounded-full bg-pink-200 ${blush} dark:bg-pink-300/60`} />
        <div className={`absolute right-7 top-[5.75rem] h-3 w-5 rounded-full bg-pink-200 ${blush} dark:bg-pink-300/60`} />
        <div
          className={`absolute left-1/2 top-[6.35rem] -translate-x-1/2 rounded-full border-b-2 border-slate-700 dark:border-slate-200 ${
            mood === 'happy' ? 'h-3 w-8' : 'h-2 w-6'
          }`}
        />
        <div className="absolute bottom-0 left-1/2 h-12 w-20 -translate-x-1/2 rounded-t-[24px] bg-slate-900 dark:bg-slate-100" />
      </div>
      <div className="absolute left-5 top-5 text-2xl text-teal-400">♪</div>
      <div className="absolute right-5 top-10 text-xl text-cyan-400">♪</div>
      <div className="absolute bottom-8 left-7 text-xl text-teal-300">✦</div>
      <div className="absolute bottom-4 right-10 text-lg text-cyan-300">✦</div>
    </div>
  );
}
