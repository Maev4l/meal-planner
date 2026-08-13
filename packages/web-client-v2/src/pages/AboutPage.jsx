// Ardoise chalk re-skin of AboutPage.
// Logic preserved:
//   - navigate(-1) on back button
//   - __APP_VERSION__ and __GIT_COMMIT_HASH__ build-time globals for version/build info
//   - manual update check via PWAContext (usePWA)
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../components/ui/TopBar';
import IconButton from '../components/ui/IconButton';
import Icon from '../components/Icon';
import Button from '../components/ui/Button';
import { usePWA } from '../contexts/PWAContext';

// An info row showing a labelled value with a coral icon box.
const InfoRow = ({ iconName, label, value }) => (
  <div className="flex items-center gap-3.5 p-4 rounded-[14px] bg-chalk/5 border border-line mb-3">
    {/* Icon box */}
    <div className="w-[40px] h-[40px] rounded-[12px] grid place-items-center bg-coral/15 text-coral flex-none">
      <Icon name={iconName} className="w-5 h-5" />
    </div>

    {/* Label + value */}
    <div className="flex-1 min-w-0">
      <div className="text-chalk-dim text-[11px] tracking-wide">{label}</div>
      <div className="font-mono text-[13px] text-chalk truncate">{value}</div>
    </div>
  </div>
);

const AboutPage = () => {
  const navigate = useNavigate();
  const { needRefresh, checkForUpdate, applyUpdate } = usePWA();
  const [isChecking, setIsChecking] = useState(false);
  const [checkResult, setCheckResult] = useState(null); // null | 'current' | 'failed'

  const handleCheckUpdate = useCallback(async () => {
    if (isChecking) return;
    setIsChecking(true);
    setCheckResult(null);

    // A rejected update() (offline, or no service worker registered) used to leave
    // the button stuck on "Checking…" and then claim "Up to date" — reporting
    // success for a check that never happened.
    let ok = false;
    try { ok = await checkForUpdate(); } catch { ok = false; }

    // Brief delay so the "checking" state is visible, then show the result. If an
    // update was found, needRefresh flips and the button becomes "tap to install".
    setTimeout(() => {
      setIsChecking(false);
      setCheckResult(ok ? 'current' : 'failed');
      setTimeout(() => setCheckResult(null), 2500);
    }, 500);
  }, [checkForUpdate, isChecking]);

  return (
    <div className="flex flex-col">
      <TopBar
        title="About"
        left={
          <IconButton
            name="back"
            label="Back"
            onClick={() => navigate(-1)}
            className="ml-0"
          />
        }
      />

      <div className="px-5 pb-6">
        {/* Crest / branding */}
        <div className="flex flex-col items-center mb-6">
          {/* Dashed-ring crest */}
          <div className="w-[88px] h-[88px] rounded-full border-2 border-dashed border-coral grid place-items-center mx-auto text-mustard mb-2">
            <Icon name="meal" className="w-[58%] h-[58%]" />
          </div>

          <div className="font-hand font-bold text-[48px] leading-tight">Meal Planner</div>
          <div className="font-hand text-coral text-[24px]">&agrave; table.</div>
        </div>

        {/* Version & build info rows */}
        <InfoRow iconName="code" label="Version" value={__APP_VERSION__} />
        <InfoRow iconName="branch" label="Build" value={__GIT_COMMIT_HASH__} />

        {/* Update: when a new version is waiting, tapping installs it; otherwise a manual check. */}
        {needRefresh ? (
          <Button
            variant="primary"
            onClick={applyUpdate}
            className="mt-2 flex items-center justify-center gap-2"
          >
            <Icon name="refresh" className="w-[18px] h-[18px]" />
            Update available — tap to install
          </Button>
        ) : (
          <Button
            variant="ghost"
            onClick={handleCheckUpdate}
            disabled={isChecking}
            className="mt-2 flex items-center justify-center gap-2"
          >
            {isChecking ? (
              <>
                <Icon name="refresh" className="w-[18px] h-[18px] animate-spin" />
                Checking…
              </>
            ) : checkResult === 'current' ? (
              <>
                <Icon name="check" className="w-[17px] h-[17px] text-sage" />
                Up to date
              </>
            ) : checkResult === 'failed' ? (
              <>
                <Icon name="info" className="w-[17px] h-[17px] text-red" />
                Couldn&apos;t check
              </>
            ) : (
              <>
                <Icon name="refresh" className="w-[18px] h-[18px]" />
                Check for updates
              </>
            )}
          </Button>
        )}

        {/* Footer */}
        <div className="font-hand text-chalk-dim text-center mt-6 text-[18px]">
          made with care for shared meals
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
