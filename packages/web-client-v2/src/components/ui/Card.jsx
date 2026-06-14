// Translucent chalk-over-slate surface with a hairline border. dashed=true for "template" framing.
const Card = ({ dashed = false, className = '', children }) => (
  <div className={`rounded-[18px] bg-chalk/5 border ${dashed ? 'border-dashed border-chalk-faint' : 'border-line'} ${className}`}>
    {children}
  </div>
);

export default Card;
