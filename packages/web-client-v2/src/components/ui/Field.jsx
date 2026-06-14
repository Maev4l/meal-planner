// Chalk text field: uppercase label, transparent input on a chalk underline.
// `help` renders below; `helpTone`: 'dim' | 'ok' | 'bad'.
const Field = ({ label, help, helpTone = 'dim', rightSlot, count, className = '', ...inputProps }) => {
  const tone = { dim: 'text-chalk-dim', ok: 'text-sage', bad: 'text-red' }[helpTone];
  return (
    <div className={`mb-3.5 ${className}`}>
      <div className="flex justify-between items-baseline">
        <label className="block text-[10.5px] tracking-[0.24em] uppercase text-chalk-dim mb-1.5">{label}</label>
        {count != null && <span className="text-[10px] tracking-[0.12em] text-chalk-faint">{count}</span>}
      </div>
      <div className="flex items-center gap-2 border-b-[1.5px] border-line focus-within:border-coral transition-colors">
        <input
          className="w-full bg-transparent border-0 text-chalk font-body text-[16px] py-2 px-0.5 outline-none placeholder:text-chalk-faint"
          {...inputProps}
        />
        {rightSlot}
      </div>
      {help && <div className={`text-[11px] mt-1.5 ${tone}`}>{help}</div>}
    </div>
  );
};

export default Field;
