import { useId } from 'react';

// Chalk text field: uppercase label, transparent input on a chalk underline.
// `help` renders below; `helpTone`: 'dim' | 'ok' | 'bad'.
// `inputRef` exposes the input so a BottomSheet can hand it initial focus.
const Field = ({ label, help, helpTone = 'dim', rightSlot, count, inputRef, className = '', ...inputProps }) => {
  const tone = { dim: 'text-chalk-dim', ok: 'text-sage', bad: 'text-red' }[helpTone];
  // The label was previously unassociated, so every field in the product announced
  // as "edit text, blank" to a screen reader. useId keeps the pairing unique even
  // when the same Field renders twice on one screen.
  const id = useId();
  const helpId = `${id}-help`;
  return (
    <div className={`mb-3.5 ${className}`}>
      <div className="flex justify-between items-baseline">
        <label htmlFor={id} className="block text-[10.5px] tracking-[0.24em] uppercase text-chalk-dim mb-1.5">{label}</label>
        {count != null && <span className="text-[10px] tracking-[0.12em] text-chalk-dim">{count}</span>}
      </div>
      {/* Focus thickens the underline as well as colouring it, so focus is never
          signalled by colour alone. */}
      <div className="flex items-center gap-2 border-b-[1.5px] border-line focus-within:border-b-2 focus-within:border-coral transition-colors">
        <input
          id={id}
          ref={inputRef}
          aria-describedby={help ? helpId : undefined}
          aria-invalid={helpTone === 'bad' ? true : undefined}
          className="w-full bg-transparent border-0 text-chalk font-body text-[16px] py-2 px-0.5 outline-none placeholder:text-chalk-dim"
          {...inputProps}
        />
        {rightSlot}
      </div>
      {help && <div id={helpId} className={`text-[11px] mt-1.5 ${tone}`}>{help}</div>}
    </div>
  );
};

export default Field;
