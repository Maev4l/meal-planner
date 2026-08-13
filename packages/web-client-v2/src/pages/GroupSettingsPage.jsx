import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSchedules } from '../contexts/SchedulesContext';
import { useAuth } from '../contexts/AuthContext';
import { api, errorMessage } from '../services/api';
import TopBar from '../components/ui/TopBar';
import IconButton from '../components/ui/IconButton';
import Spinner from '../components/ui/Spinner';
import Button from '../components/ui/Button';
import Icon from '../components/Icon';
import RenameGroupSheet from '../components/RenameGroupSheet';
import DeleteGroupSheet from '../components/DeleteGroupSheet';
import MemberRow from '../components/MemberRow';
import ConfirmSheet from '../components/ConfirmSheet';
import { colorForName, initialsOf } from '../constants/colors';
import { useToast } from '../components/ui/Toast';

const SectionLabel = ({ children, danger }) => (
  <div className={`text-[10.5px] tracking-[0.24em] uppercase mt-[22px] mb-2.5 ${danger ? 'text-red' : 'text-chalk-dim'}`}>{children}</div>
);

// One invite-row action. The visible mark stays 34px; an invisible ::after inset
// carries the touch target out to 44px, so the chalk stays small and the thumb
// still lands.
const InviteAction = ({ icon, label, onClick, danger, className = '' }) => (
  <button
    onClick={onClick}
    aria-label={label}
    className={`relative w-[34px] h-[34px] rounded-[9px] grid place-items-center bg-transparent border border-transparent text-chalk-dim cursor-pointer transition after:absolute after:content-[''] after:-inset-[6px]
      ${danger ? 'hover:text-red hover:border-red/40 hover:bg-red/[0.08]' : 'hover:text-chalk hover:border-line hover:bg-chalk/[0.07]'} ${className}`}
  >
    <Icon name={icon} className="w-4 h-4" />
  </button>
);

const GroupSettingsPage = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { schedules, loading, fetchSchedules, getGroup } = useSchedules();
  const toast = useToast();
  const [renameOpen, setRenameOpen] = useState(false);
  const [kickFor, setKickFor] = useState(null); // { id, name }
  const [busy, setBusy] = useState(false);
  const [invites, setInvites] = useState([]);
  const [invitesLoading, setInvitesLoading] = useState(false);
  const [creatingInvite, setCreatingInvite] = useState(false);
  const [revokeFor, setRevokeFor] = useState(null); // code
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);

  useEffect(() => { fetchSchedules(); }, [fetchSchedules]);

  // Load active invite links — only when the current user is admin of this group.
  // Re-runs when schedules refresh so the list stays in sync after mutations.
  useEffect(() => {
    let active = true;
    const g = getGroup(groupId);
    if (!g || g.members[user.memberId]?.admin !== true) return;
    setInvitesLoading(true);
    api.listInvites(groupId)
      .then((r) => { if (active) setInvites(r.invites || []); })
      .catch(() => { if (active) setInvites([]); })
      .finally(() => { if (active) setInvitesLoading(false); });
    return () => { active = false; };
  }, [groupId, getGroup, user.memberId, schedules]);

  const group = getGroup(groupId);
  if (loading && !group) {
    return (<div><TopBar title="Group settings" left={<IconButton name="back" label="Back" onClick={() => navigate('/')} className="ml-0" />} /><div className="px-5"><Spinner label="Loading&hellip;" /></div></div>);
  }
  if (!group) {
    return (<div><TopBar title="Group settings" left={<IconButton name="back" label="Back" onClick={() => navigate('/')} className="ml-0" />} /><div className="px-5 text-red text-sm py-4">Group not found.</div></div>);
  }

  const isAdmin = group.members[user.memberId]?.admin === true;
  const memberCount = Object.keys(group.members).length;

  const handleRename = async (name) => {
    try { await api.renameGroup(groupId, name); await fetchSchedules(true); setRenameOpen(false); toast?.('Group renamed', 'success'); }
    catch (err) { toast?.(errorMessage(err, { fallback: "Couldn't rename the group." }), 'error'); }
  };

  const handleKick = async () => {
    if (!kickFor) return;
    setBusy(true);
    try { await api.kickMember(groupId, kickFor.id); await fetchSchedules(true); toast?.(`${kickFor.name} removed`, 'success'); setKickFor(null); }
    catch (err) { toast?.(errorMessage(err, { 403: 'Only the group admin can remove members.', fallback: "Couldn't remove that member." }), 'error'); }
    finally { setBusy(false); }
  };

  const reloadInvites = async () => {
    try { const r = await api.listInvites(groupId); setInvites(r.invites || []); } catch { /* keep */ }
  };
  const handleRevoke = async () => {
    if (!revokeFor) return;
    setBusy(true);
    try { await api.revokeInvite(groupId, revokeFor); await reloadInvites(); toast?.('Invite revoked', 'success'); setRevokeFor(null); }
    catch (err) { toast?.(errorMessage(err, { fallback: "Couldn't revoke that invite link." }), 'error'); }
    finally { setBusy(false); }
  };
  const handleDelete = async () => {
    setBusy(true);
    try { await api.deleteGroup(groupId); await fetchSchedules(true); toast?.('Group deleted', 'success'); navigate('/'); }
    catch (err) { toast?.(errorMessage(err, { 403: 'Only the group admin can delete this group.', fallback: "Couldn't delete the group." }), 'error'); setBusy(false); }
  };
  const handleLeave = async () => {
    setBusy(true);
    try { await api.leaveGroup(groupId, user.memberId); await fetchSchedules(true); toast?.('You left the group', 'success'); navigate('/'); }
    catch (err) { toast?.(errorMessage(err, { 403: "You're the only admin — delete the group instead of leaving.", fallback: "Couldn't leave the group." }), 'error'); setBusy(false); }
  };
  const relExpiry = (iso) => {
    const days = Math.max(0, Math.ceil((new Date(iso) - Date.now()) / 86400000));
    return days <= 1 ? 'expires soon' : `expires in ${days}d`;
  };

  // Shareable link: random code is authoritative; ?g= is a cosmetic name hint
  // read only by the pre-login InvitePage.
  const buildInviteUrl = (code) => `${window.location.origin}/invite/${code}?g=${encodeURIComponent(group.groupName)}`;
  const shareInvite = async (code) => {
    const url = buildInviteUrl(code);
    if (navigator.share) {
      try { await navigator.share({ title: group.groupName, text: `Join ${group.groupName} on Meal Planner`, url }); }
      catch { /* AbortError = cancelled, no-op */ }
    } else { copyInvite(code); }
  };
  const copyInvite = async (code) => {
    try { await navigator.clipboard.writeText(buildInviteUrl(code)); toast?.('Invite link copied', 'success'); }
    catch { toast?.('Could not copy', 'error'); }
  };
  // Inline create: mint the invite immediately, then refresh the active list so
  // the new row (with its own Share/Copy/Revoke) appears in place.
  const handleCreateInvite = async () => {
    setCreatingInvite(true);
    try { await api.createInvite(groupId); await reloadInvites(); toast?.('Invite link created', 'success'); }
    catch (err) { toast?.(errorMessage(err, { fallback: "Couldn't create an invite link." }), 'error'); }
    finally { setCreatingInvite(false); }
  };

  return (
    <div className="min-h-dvh">
      <TopBar title={group.groupName} sub="Group settings"
        left={<IconButton name="back" label="Back" onClick={() => navigate('/')} className="ml-0" />} />
      <div className="px-5 pb-10">
        {/* Identity */}
        <div className="flex items-center gap-4 pt-1.5">
          <span className="w-16 h-16 rounded-[18px] grid place-items-center font-hand font-bold text-[36px] text-slate-0 -rotate-3 flex-none"
            style={{ background: colorForName(group.groupName) }}>{initialsOf(group.groupName)}</span>
          <div className="flex-1 min-w-0">
            <div className="font-hand font-bold text-[30px] leading-none truncate">{group.groupName}</div>
            <div className="text-xs text-chalk-dim mt-1">{memberCount} {memberCount === 1 ? 'member' : 'members'}</div>
          </div>
          {isAdmin && <IconButton name="pencil" label="Rename group" onClick={() => setRenameOpen(true)} />}
        </div>

        {/* Members / Invites / Danger zone are added in Tasks 8–10, gated by isAdmin. */}
        <SectionLabel>Members &middot; {memberCount}</SectionLabel>
        {Object.entries(group.members)
          .sort(([, a], [, b]) => a.memberName.localeCompare(b.memberName, undefined, { sensitivity: 'base' }))
          .map(([memberId, m]) => (
          <MemberRow key={memberId} name={m.memberName} isAdmin={m.admin === true}
            isYou={memberId === user.memberId}
            onRemove={isAdmin && !m.admin && memberId !== user.memberId ? () => setKickFor({ id: memberId, name: m.memberName }) : undefined} />
        ))}

        {/* Invites section — admin only */}
        {isAdmin && (
          <>
            <SectionLabel>Invite people</SectionLabel>
            <Button variant="primary" onClick={handleCreateInvite} disabled={creatingInvite}>
              <Icon name="share" className="w-[17px] h-[17px]" />{creatingInvite ? 'Creating…' : 'Create invite link'}
            </Button>
            <div className="mt-3.5">
              {invitesLoading ? (
                <Spinner label="Loading invites…" />
              ) : invites.length === 0 ? (
                <div className="text-chalk-dim italic font-hand text-[18px] px-0.5 py-1.5">No active invite links — create one to add people.</div>
              ) : invites.map((inv) => (
                <div key={inv.code} className="flex items-center gap-2 py-2.5 px-3 border border-line rounded-[13px] bg-chalk/[0.04] mb-2.5">
                  <Icon name="link" className="w-4 h-4 text-coral flex-none" />
                  <span className="font-mono text-[13px] truncate">{inv.code.slice(0, 8)}…</span>
                  <span className="text-[11px] text-chalk-dim ml-auto whitespace-nowrap">{relExpiry(inv.expiresAt)}</span>
                  {/* Per-row actions: Share / Copy, then Revoke set apart. 10px between
                      the safe pair puts their 44px hit areas edge to edge without
                      overlapping; Revoke gets another 8px because a mis-tap there
                      destroys a link the admin may have just sent. */}
                  <div className="flex items-center gap-2.5 flex-none">
                    <InviteAction icon="share" label="Share invite link" onClick={() => shareInvite(inv.code)} />
                    <InviteAction icon="copy" label="Copy invite link" onClick={() => copyInvite(inv.code)} />
                    <InviteAction icon="trash" label="Revoke invite" danger className="ml-2" onClick={() => setRevokeFor(inv.code)} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <SectionLabel danger>Danger zone</SectionLabel>
        <div className="border-[1.5px] border-dashed border-red/50 rounded-[16px] p-4 bg-red/[0.05]">
          {isAdmin ? (
            <>
              <p className="text-[12.5px] text-chalk-dim leading-relaxed m-0 mb-1">Deletes the group and all schedules, notes &amp; invites for everyone. This can&apos;t be undone.</p>
              <Button variant="danger" onClick={() => setDeleteOpen(true)}><Icon name="trash" className="w-[17px] h-[17px]" />Delete group</Button>
            </>
          ) : (
            <>
              <p className="text-[12.5px] text-chalk-dim leading-relaxed m-0 mb-1">Leaving removes your schedules &amp; notes from {group.groupName}. You can rejoin with an invite link.</p>
              <Button variant="danger" onClick={() => setLeaveOpen(true)}><Icon name="logout" className="w-[17px] h-[17px]" />Leave group</Button>
            </>
          )}
        </div>
      </div>

      <RenameGroupSheet open={renameOpen} onClose={() => setRenameOpen(false)} currentName={group.groupName} onRename={handleRename} />
      <ConfirmSheet open={kickFor !== null} onClose={() => setKickFor(null)}
        iconName="trash" title={`Remove ${kickFor?.name}?`}
        body={`This deletes all of ${kickFor?.name}'s schedules and notes in ${group.groupName}. They can be re-invited later.`}
        confirmLabel="Remove" onConfirm={handleKick} busy={busy} />
      <ConfirmSheet open={revokeFor !== null} onClose={() => setRevokeFor(null)}
        iconName="trash" title="Revoke this invite?"
        body="The link stops working immediately. People who already joined stay in the group."
        confirmLabel="Revoke link" onConfirm={handleRevoke} busy={busy} />
      <DeleteGroupSheet open={deleteOpen} onClose={() => setDeleteOpen(false)}
        groupName={group.groupName} memberCount={memberCount} onConfirm={handleDelete} busy={busy} />
      <ConfirmSheet open={leaveOpen} onClose={() => setLeaveOpen(false)}
        iconName="logout" title={`Leave ${group.groupName}?`}
        body="Your schedules and notes for this group will be removed. You can rejoin later with an invite link."
        confirmLabel="Leave group" onConfirm={handleLeave} busy={busy} />
    </div>
  );
};

export default GroupSettingsPage;
