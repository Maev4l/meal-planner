import Icon from './Icon';
import { usePWA } from '../contexts/PWAContext';

// Chalk "update available" banner. SW registration + periodic checks live in PWAProvider;
// this just reflects needRefresh and applies the update on tap.
const UpdatePrompt = () => {
  const { needRefresh, applyUpdate } = usePWA();

  if (!needRefresh) return null;

  return (
    <div
      onClick={applyUpdate}
      className="fixed left-4 right-4 bottom-[90px] z-40 flex items-center gap-3 px-4 py-3.5 rounded-[16px] cursor-pointer text-chalk border-[1.5px] border-coral bg-gradient-to-br from-[#2c352d] to-[#222823] shadow-[0_18px_44px_-12px_rgba(0,0,0,0.75)] animate-[rise_0.45s_ease-out] active:scale-[0.98] max-w-md mx-auto"
    >
      <span className="w-10 h-10 rounded-[12px] grid place-items-center bg-coral/15 text-coral flex-none">
        <Icon name="refresh" className="w-5 h-5" />
      </span>
      <div>
        <b className="block text-sm font-bold">Update available</b>
        <small className="text-[11.5px] text-chalk-dim">Tap to refresh to the latest version</small>
      </div>
    </div>
  );
};

export default UpdatePrompt;
