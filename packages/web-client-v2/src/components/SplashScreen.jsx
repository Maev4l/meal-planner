import Icon, { ChalkSprite } from './Icon';

const SplashScreen = () => (
  <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
       style={{ background: 'radial-gradient(circle at 50% 36%, #212a20 0%, #141811 72%)' }}>
    <ChalkSprite />
    <div className="w-[120px] h-[120px] rounded-full border-2 border-dashed border-coral grid place-items-center mb-7 animate-[breathe_2.4s_ease-in-out_infinite] text-mustard">
      <Icon name="meal" className="w-[66%] h-[66%]" />
    </div>
    <h1 className="font-hand font-bold text-[52px] leading-none m-0 text-chalk">Meal Planner</h1>
    <div className="font-hand font-semibold text-[24px] text-coral mt-1.5">à table.</div>
    <div className="flex gap-2.5 mt-9">
      {['bg-coral', 'bg-mustard', 'bg-sage'].map((c, i) => (
        <span key={c} className={`w-2.5 h-2.5 rounded-full ${c} animate-bounce`} style={{ animationDelay: `${i * 0.16}s` }} />
      ))}
    </div>
  </div>
);

export default SplashScreen;
