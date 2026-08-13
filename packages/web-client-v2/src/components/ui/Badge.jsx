import Avatar from './Avatar';

// `provisional` marks attendance the member never confirmed — the API served it
// from their usual. A dashed hairline is the system's existing word for that, so
// an assumption and a decision no longer look identical.
const Badge = ({ name, provisional }) => (
  <span
    className={`inline-flex items-center gap-2 pl-1 pr-3 py-1 border rounded-full bg-chalk/5 text-[13px] leading-none
      ${provisional ? 'border-dashed border-chalk-faint text-chalk-dim' : 'border-line'}`}
  >
    <Avatar name={name} size={22} />
    {name}
  </span>
);

export default Badge;
