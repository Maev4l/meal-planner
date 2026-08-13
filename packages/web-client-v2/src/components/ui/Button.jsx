// Chalk button. variant: 'primary' (coral fill) | 'ghost' (hairline) | 'danger' (red hairline).
// Every variant carries a border, so all three measure the same height — the filled
// primary used to come out 50px against 52px for the outlined ones, visible wherever
// they stack (which is every sheet and the login screen).
const BASE =
  'w-full flex items-center justify-center gap-2 font-body font-bold uppercase tracking-[0.1em] text-[13px] py-[15px] rounded-[14px] border cursor-pointer transition active:scale-[0.98] disabled:pointer-events-none';

const VARIANTS = {
  primary: 'bg-coral border-coral text-[#221311] hover:brightness-105',
  ghost: 'bg-transparent border-line text-chalk-dim hover:text-chalk',
  danger: 'bg-transparent border-red text-red hover:bg-red/10',
};

// Disabled is a state, not a variant, so it overrides all three identically:
// a dashed hairline shell that reads "not yet". Fading the filled primary to 40%
// made the loudest control on the login screen also the least legible — its label
// measured 2.11:1 against its own fill. Dashed carries the system's own meaning
// for provisional, and it distinguishes a not-yet primary from a live ghost.
const DISABLED =
  'disabled:bg-transparent disabled:border-dashed disabled:border-chalk-faint disabled:text-chalk-dim';

const Button = ({ variant = 'primary', className = '', children, ...props }) => (
  <button className={`${BASE} ${VARIANTS[variant]} ${DISABLED} ${className}`} {...props}>
    {children}
  </button>
);

export default Button;
