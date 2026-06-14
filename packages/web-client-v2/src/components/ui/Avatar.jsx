import { colorForName, initialsOf } from '../../constants/colors';

const Avatar = ({ name, size = 24, className = '' }) => (
  <span
    className={`grid place-items-center rounded-full font-bold text-[#1b1f1c] flex-none ${className}`}
    style={{ width: size, height: size, fontSize: size * 0.4, background: colorForName(name) }}
  >
    {initialsOf(name)}
  </span>
);

export default Avatar;
