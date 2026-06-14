import Icon from '../Icon';

const IconButton = ({ name, label, className = '', ...props }) => (
  <button
    aria-label={label}
    className={`flex-none w-10 h-10 grid place-items-center rounded-full border-[1.5px] border-line text-chalk-dim bg-transparent cursor-pointer transition hover:text-chalk hover:border-chalk-dim active:scale-95 disabled:opacity-25 disabled:pointer-events-none ${className}`}
    {...props}
  >
    <Icon name={name} className="w-[58%] h-[58%]" />
  </button>
);

export default IconButton;
