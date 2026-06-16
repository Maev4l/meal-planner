// Chalk button. variant: 'primary' (coral) | 'ghost' (outline) | 'danger' (red outline).
const VARIANTS = {
  primary: 'bg-coral text-[#221311] hover:brightness-105',
  ghost: 'bg-transparent text-chalk-dim border border-line hover:text-chalk',
  danger: 'bg-transparent text-red border border-red hover:bg-red/10',
};

const Button = ({ variant = 'primary', className = '', children, ...props }) => (
  <button
    className={`w-full flex items-center justify-center gap-2 font-body font-bold uppercase tracking-[0.1em] text-[13px] py-[15px] rounded-[14px] cursor-pointer transition active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none ${VARIANTS[variant]} ${className}`}
    {...props}
  >
    {children}
  </button>
);

export default Button;
