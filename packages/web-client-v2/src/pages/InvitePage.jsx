import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSchedules } from '../contexts/SchedulesContext';
import { api, ApiError } from '../services/api';
import { setPendingInvite, clearPendingInvite } from '../services/pendingInvite';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import Icon from '../components/Icon';
import { colorForName, initialsOf } from '../constants/colors';

// States: loading | anon | confirm | joining | already | expired | error
const InvitePage = () => {
  const { code } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, refreshSession } = useAuth();
  const { fetchSchedules } = useSchedules();

  // ?g= is a cosmetic hint only; render as plain (auto-escaped) text.
  const hintName = (params.get('g') || '').slice(0, 60);

  const [state, setState] = useState('loading');
  const [groupName, setGroupName] = useState(hintName);

  // Load the authoritative invite (authenticated + approved only).
  const load = useCallback(async () => {
    setState('loading');
    try {
      const inv = await api.getInvite(code);
      setGroupName(inv.groupName);
      setState('confirm');
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) { clearPendingInvite(); setState('expired'); return; }
      setState('error');
    }
  }, [code]);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      setPendingInvite(code);   // bridge across login/approval
      setState('anon');
      return;
    }
    load();
  }, [isLoading, isAuthenticated, code, load]);

  const join = async () => {
    setState('joining');
    try {
      const res = await api.redeemInvite(code);
      await refreshSession();      // new idToken carries approved:true
      clearPendingInvite();
      await fetchSchedules(true);
      if (res.alreadyMember) { setGroupName(res.groupName); setState('already'); return; }
      navigate(`/groups/${res.groupId}/${encodeURIComponent(res.groupName)}`);
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) { clearPendingInvite(); setState('expired'); return; }
      setState('error');
    }
  };

  const Crest = ({ children, tone }) => (
    <div className={`w-24 h-24 rounded-full grid place-items-center mb-6 ${tone || 'border-2 border-dashed border-coral'}`}>{children}</div>
  );
  const Mark = ({ name }) => (
    <span className="w-[74px] h-[74px] rounded-[20px] grid place-items-center font-hand font-bold text-[40px] text-slate-0 -rotate-3"
      style={{ background: colorForName(name || '?') }}>{initialsOf(name || '?')}</span>
  );

  const wrap = (children) => (
    <div className="min-h-dvh flex flex-col items-center justify-center text-center px-8 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">{children}</div>
  );

  if (state === 'loading' || isLoading) return wrap(<Spinner label="Checking invite…" />);

  if (state === 'anon') return wrap(<>
    <Crest><Mark name={groupName} /></Crest>
    <div className="font-body font-semibold tracking-[0.28em] uppercase text-[11px] text-coral mb-2.5">You&apos;ve been invited</div>
    <h2 className="font-hand font-bold text-[46px] leading-[0.9] m-0 mb-1.5">{groupName ? <>Join<br /><span className="text-mustard">{groupName}</span></> : <>Join a group<br />on Meal&nbsp;Planner</>}</h2>
    <p className="text-chalk-dim text-[13.5px] leading-relaxed max-w-[250px] m-0 mb-6">Sign in or create an account to start planning meals with the group.</p>
    <div className="w-full max-w-[250px]">
      <Button variant="primary" onClick={() => navigate('/login')}>Sign in to join</Button>
      <div className="mt-3"><Button variant="ghost" onClick={() => navigate('/signup')}>Create account</Button></div>
    </div>
  </>);

  if (state === 'confirm') return wrap(<>
    <Crest><Mark name={groupName} /></Crest>
    <div className="font-body font-semibold tracking-[0.28em] uppercase text-[11px] text-coral mb-2.5">Invitation</div>
    <h2 className="font-hand font-bold text-[46px] leading-[0.9] m-0 mb-1.5">Join<br /><span className="text-mustard">{groupName}</span>?</h2>
    <p className="text-chalk-dim text-[13.5px] leading-relaxed max-w-[250px] m-0 mb-6">You&apos;ll join as a member and can set your meals straight away.</p>
    <div className="w-full max-w-[250px]">
      <Button variant="primary" onClick={join}><Icon name="check" className="w-[17px] h-[17px]" />Join group</Button>
      <div className="mt-3"><Button variant="ghost" onClick={() => navigate('/')}>Not now</Button></div>
    </div>
  </>);

  if (state === 'joining') return wrap(<Spinner label="Joining…" />);

  if (state === 'already') return wrap(<>
    <Crest tone="border-2 border-sage"><Icon name="check" className="w-[46%] h-[46%] text-sage" /></Crest>
    <h2 className="font-hand font-bold text-[40px] leading-[0.9] m-0 mb-2">You&apos;re already in <span className="text-mustard">{groupName}</span></h2>
    <div className="w-full max-w-[250px]"><Button variant="primary" onClick={() => navigate('/')}>Open your groups</Button></div>
  </>);

  if (state === 'expired') return wrap(<>
    <Crest tone="border-2 border-red"><Icon name="clock" className="w-[46%] h-[46%] text-red" /></Crest>
    <h2 className="font-hand font-bold text-[40px] leading-[0.9] m-0 mb-2">Invite<br />expired</h2>
    <p className="text-chalk-dim text-[13.5px] leading-relaxed max-w-[250px] m-0 mb-6">This invite link has expired or was revoked. Ask the group admin for a fresh one.</p>
    <div className="w-full max-w-[250px]"><Button variant="ghost" onClick={() => navigate('/')}>Back to your groups</Button></div>
  </>);

  // error / network
  return wrap(<>
    <Crest tone="border-2 border-dashed border-chalk-faint"><Icon name="refresh" className="w-[46%] h-[46%] text-chalk-faint" /></Crest>
    <h2 className="font-hand font-bold text-[40px] leading-[0.9] m-0 mb-2">Something<br />went wrong</h2>
    <p className="text-chalk-dim text-[13.5px] leading-relaxed max-w-[250px] m-0 mb-6">Couldn&apos;t reach the server. Check your connection and try again.</p>
    <div className="w-full max-w-[250px]"><Button variant="primary" onClick={load}>Try again</Button></div>
  </>);
};

export default InvitePage;
