import Avatar from './Avatar';

const Badge = ({ name }) => (
  <span className="inline-flex items-center gap-2 pl-1 pr-3 py-1 border border-line rounded-full bg-chalk/5 text-[13px] leading-none">
    <Avatar name={name} size={22} />
    {name}
  </span>
);

export default Badge;
