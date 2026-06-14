const Spinner = ({ label }) => (
  <div className="flex flex-col items-center justify-center gap-3 py-8">
    <div className="flex gap-2">
      {['bg-coral', 'bg-mustard', 'bg-sage'].map((c, i) => (
        <span key={c} className={`w-2 h-2 rounded-full ${c} animate-bounce`} style={{ animationDelay: `${i * 0.16}s` }} />
      ))}
    </div>
    {label && <span className="text-chalk-dim text-sm">{label}</span>}
  </div>
);

export default Spinner;
