// `inline` drops the standalone page padding so the spinner fits inside a
// button without inflating its height (button already supplies its own py).
const Spinner = ({ label, inline = false }) => (
  <div className={`flex flex-col items-center justify-center gap-3 ${inline ? '' : 'py-8'}`}>
    <div className="flex gap-2">
      {['bg-coral', 'bg-mustard', 'bg-sage'].map((c, i) => (
        <span key={c} className={`w-2 h-2 rounded-full ${c} animate-bounce`} style={{ animationDelay: `${i * 0.16}s` }} />
      ))}
    </div>
    {label && <span className="text-chalk-dim text-sm">{label}</span>}
  </div>
);

export default Spinner;
