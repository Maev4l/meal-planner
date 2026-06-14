// Sticky top bar. `left`/`right` are optional slots (e.g. IconButton); title in Caveat.
const TopBar = ({ title, sub, left, right }) => (
  <div className="sticky top-0 z-10 flex items-center gap-3 px-5 pb-3.5 pt-[max(1rem,env(safe-area-inset-top))] bg-gradient-to-b from-slate-1 from-[72%] to-transparent">
    {left}
    <div className="min-w-0">
      <div className="font-hand font-bold text-[30px] leading-none truncate">{title}</div>
      {sub && <div className="text-[11px] tracking-[0.2em] uppercase text-chalk-dim mt-0.5">{sub}</div>}
    </div>
    {right && <div className="ml-auto flex items-center gap-2">{right}</div>}
  </div>
);

export default TopBar;
