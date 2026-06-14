import { useRef, useEffect } from 'react';

const Textarea = ({ value, onChange, onBlur, placeholder, disabled, className = '' }) => {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);
  return (
    <textarea
      ref={ref}
      rows={1}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      placeholder={placeholder}
      disabled={disabled}
      className={`w-full resize-none bg-transparent border-0 border-b border-dashed border-chalk-faint focus:border-coral text-chalk font-body text-[15px] py-2 outline-none placeholder:italic placeholder:text-chalk-faint disabled:opacity-70 ${className}`}
    />
  );
};

export default Textarea;
