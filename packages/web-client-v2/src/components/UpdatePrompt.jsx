import { useRegisterSW } from 'virtual:pwa-register/react';
import Icon from './Icon';

// Background safety-net poll interval. Hourly (not 60s): visibilitychange below
// covers the common open/background/return pattern, so a tighter interval would
// only re-fetch sw.js more often — maximizing the chance of catching a divergent
// edge copy and re-showing a phantom "update available" banner — without
// delivering new versions any faster.
const UPDATE_CHECK_INTERVAL = 60 * 60 * 1000;

const UpdatePrompt = () => {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      if (registration) {
        setInterval(() => registration.update(), UPDATE_CHECK_INTERVAL);
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') registration.update();
        });
      }
    },
  });

  if (!needRefresh) return null;

  return (
    <div
      onClick={() => updateServiceWorker(true)}
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
