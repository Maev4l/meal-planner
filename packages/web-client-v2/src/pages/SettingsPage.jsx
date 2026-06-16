// Ardoise chalk re-skin of SettingsPage.
// Logic preserved: useAuth() for user data, navigate to /settings/account and /settings/about,
// navigator.clipboard.writeText(user.email) on copy icon click.
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import TopBar from '../components/ui/TopBar';
import Avatar from '../components/ui/Avatar';
import IconButton from '../components/ui/IconButton';
import Icon from '../components/Icon';
import { useToast } from '../components/ui/Toast';

// A single navigable settings row.
const SettingsRow = ({ iconName, title, sub, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex items-center gap-3.5 p-[15px] rounded-[16px] bg-chalk/[0.04] border border-line mb-3 w-full text-left cursor-pointer"
  >
    {/* Icon box */}
    <div className="w-[42px] h-[42px] rounded-[12px] grid place-items-center bg-coral/15 text-coral flex-none">
      <Icon name={iconName} className="w-5 h-5" />
    </div>

    {/* Labels */}
    <div className="flex-1 min-w-0">
      <div className="font-semibold text-[14.5px] text-chalk">{title}</div>
      <div className="text-chalk-dim text-xs mt-0.5">{sub}</div>
    </div>

    {/* Chevron */}
    <span className="ml-auto text-chalk-faint text-[20px]">→</span>
  </button>
);

const SettingsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const handleCopyEmail = (e) => {
    // Stop the event from bubbling so only the copy fires, not any parent onClick.
    e.stopPropagation();
    if (user?.email) {
      navigator.clipboard.writeText(user.email);
      toast('Email copied', 'success');
    }
  };

  return (
    <div className="flex flex-col">
      <TopBar title="Settings" />

      <div className="px-5 pb-6">
        {/* Profile card */}
        <div className="bg-chalk/5 border border-line rounded-[18px] p-[18px] flex items-center gap-3.5 mb-5">
          <Avatar name={user?.name || '?'} size={56} />

          <div className="flex-1 min-w-0">
            <div className="font-hand font-bold text-[26px] leading-tight truncate">
              {user?.name || 'Unknown'}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-chalk-dim text-xs truncate">
                {user?.email || '—'}
              </span>
              {/* Copy email button — small, inline */}
              <IconButton
                name="copy"
                label="Copy email"
                onClick={handleCopyEmail}
                className="w-6 h-6 border-0 flex-none"
              />
            </div>
          </div>
        </div>

        {/* Account section */}
        <div className="text-[10.5px] tracking-[0.24em] uppercase text-chalk-faint my-3">
          Account
        </div>
        <SettingsRow
          iconName="key"
          title="Account Details"
          sub="Change password &amp; sign out"
          onClick={() => navigate('/settings/account')}
        />

        {/* App section */}
        <div className="text-[10.5px] tracking-[0.24em] uppercase text-chalk-faint my-3">
          App
        </div>
        <SettingsRow
          iconName="info"
          title="About"
          sub="Version &amp; app info"
          onClick={() => navigate('/settings/about')}
        />
      </div>
    </div>
  );
};

export default SettingsPage;
