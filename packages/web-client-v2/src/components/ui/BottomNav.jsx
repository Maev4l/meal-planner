import { useLocation, useNavigate } from 'react-router-dom';
import Icon from '../Icon';

const TABS = [
  { path: '/', name: 'meal', label: 'Groups' },
  { path: '/settings', name: 'sliders', label: 'Settings' },
];

const BottomNav = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const activeIdx = pathname.startsWith('/settings') ? 1 : 0;
  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 h-[calc(74px+env(safe-area-inset-bottom))] flex bg-slate-0/90 border-t border-line backdrop-blur-md pb-[env(safe-area-inset-bottom)]">
      {TABS.map((t, i) => (
        <button
          key={t.path}
          onClick={() => navigate(t.path)}
          className={`flex-1 flex flex-col items-center justify-center gap-1.5 bg-transparent border-0 cursor-pointer text-[10px] tracking-[0.1em] uppercase ${i === activeIdx ? 'text-chalk' : 'text-chalk-faint'}`}
        >
          <Icon name={t.name} className="w-5 h-5" />
          {t.label}
        </button>
      ))}
    </nav>
  );
};

export default BottomNav;
