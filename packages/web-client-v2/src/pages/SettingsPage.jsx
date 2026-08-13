import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePWA } from '../contexts/PWAContext';
import TopBar from '../components/ui/TopBar';
import Avatar from '../components/ui/Avatar';
import IconButton from '../components/ui/IconButton';
import Button from '../components/ui/Button';
import Icon from '../components/Icon';
import { useToast } from '../components/ui/Toast';

// A navigable row: hairline-separated, no card and no icon plaque. The coral box
// that used to sit on every row spent the one action colour on furniture, against
// the One-Accent Rule. The chevron is the chalk `back` glyph rotated, the same
// trick WeekNavigator uses for "next" — never a text arrow.
const Row = ({ title, sub, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="w-full flex items-center gap-3 py-4 bg-transparent border-0 border-b border-line text-left cursor-pointer transition active:scale-[0.99] hover:bg-chalk/[0.03]"
  >
    <span className="flex-1 min-w-0">
      <span className="block text-[15px] font-semibold text-chalk">{title}</span>
      <span className="block text-[12.5px] text-chalk-dim mt-0.5">{sub}</span>
    </span>
    <Icon name="back" className="w-[18px] h-[18px] rotate-180 text-chalk-dim flex-none" />
  </button>
);

const SettingsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const { needRefresh, checkForUpdate, applyUpdate } = usePWA();
  const [isChecking, setIsChecking] = useState(false);
  const [checkResult, setCheckResult] = useState(null); // null | 'current' | 'failed'

  const handleCopyEmail = () => {
    if (!user?.email) return;
    navigator.clipboard.writeText(user.email);
    toast?.('Email copied', 'success');
  };

  const handleCheckUpdate = useCallback(async () => {
    if (isChecking) return;
    setIsChecking(true);
    setCheckResult(null);
    // A rejected update() (offline, or no service worker) must not be reported as
    // success — this branch used to render "Up to date" for a check that never ran.
    let ok = false;
    try { ok = await checkForUpdate(); } catch { ok = false; }
    setTimeout(() => {
      setIsChecking(false);
      setCheckResult(ok ? 'current' : 'failed');
      setTimeout(() => setCheckResult(null), 2500);
    }, 500);
  }, [checkForUpdate, isChecking]);

  const updateLabel = isChecking
    ? { icon: 'refresh', tone: '', text: 'Checking…' }
    : checkResult === 'current'
      ? { icon: 'check', tone: 'text-sage', text: 'Up to date' }
      : checkResult === 'failed'
        ? { icon: 'info', tone: 'text-red', text: "Couldn't check" }
        : { icon: 'refresh', tone: '', text: 'Check for updates' };

  return (
    <div className="flex flex-col">
      <TopBar title="Settings" />

      <div className="px-5 pb-6">
        {/* Who you are. No card: the avatar and the type carry it. */}
        <div className="flex items-center gap-3.5 py-2 mb-2">
          <Avatar name={user?.name || '?'} size={56} />
          <div className="flex-1 min-w-0">
            <div className="font-hand font-bold text-[30px] leading-tight truncate">{user?.name || 'Unknown'}</div>
            <div className="text-chalk-dim text-[12.5px] truncate">{user?.email || '—'}</div>
          </div>
          <IconButton name="copy" label="Copy email address" onClick={handleCopyEmail} className="border-0" />
        </div>

        <Row
          title="Account"
          sub="Change your password, or sign out"
          onClick={() => navigate('/settings/account')}
        />

        {/* What About used to be: a crest, two boxed rows and a tagline, for one
            version string and one button. It is a signature at the foot instead. */}
        <div className="mt-9 pt-6 border-t border-dashed border-chalk-faint flex flex-col items-center text-center">
          <div className="font-hand font-bold text-[30px] leading-none">Meal Planner</div>
          <div className="font-mono text-[11px] text-chalk-dim mt-2 tabular-nums">
            v{__APP_VERSION__} · {__GIT_COMMIT_HASH__}
          </div>

          <div className="w-full max-w-[240px] mt-5">
            {needRefresh ? (
              <Button variant="primary" onClick={applyUpdate}>
                <Icon name="refresh" className="w-[17px] h-[17px]" />
                Install update
              </Button>
            ) : (
              <Button variant="ghost" onClick={handleCheckUpdate} disabled={isChecking}>
                <Icon name={updateLabel.icon} className={`w-[17px] h-[17px] ${updateLabel.tone}`} />
                {updateLabel.text}
              </Button>
            )}
          </div>

          <div className="font-hand text-coral text-[22px] mt-6">à table.</div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
