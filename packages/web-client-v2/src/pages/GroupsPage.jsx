import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PullToRefresh from 'react-simple-pull-to-refresh';
import { useSchedules } from '../contexts/SchedulesContext';
import { api } from '../services/api';
import { colorForName, colorsForNames, initialsOf } from '../constants/colors';
import Icon from '../components/Icon';
import TopBar from '../components/ui/TopBar';
import IconButton from '../components/ui/IconButton';
import Spinner from '../components/ui/Spinner';
import Button from '../components/ui/Button';
import CreateGroupSheet from '../components/CreateGroupSheet';

// Row body navigates to schedule; trailing gear navigates directly to group settings.
const GroupRow = ({ group, onOpen, onSettings }) => {
  const members = Object.values(group.members)
    .sort((a, b) => a.memberName.localeCompare(b.memberName, undefined, { sensitivity: 'base' }));
  const avatarColors = colorsForNames(members.map((m) => m.memberName));
  return (
    <div className="flex items-center gap-4 py-[18px] border-b border-dashed border-chalk-faint">
      <button onClick={onOpen} className="group flex items-center gap-4 flex-1 min-w-0 text-left bg-transparent border-0 cursor-pointer">
        <span className="flex-none w-[52px] h-[52px] rounded-[14px] grid place-items-center font-hand font-bold text-[30px] text-slate-0 -rotate-3"
          style={{ background: colorForName(group.groupName) }}>{initialsOf(group.groupName)}</span>
        <span className="min-w-0">
          <span className="block font-hand font-bold text-[27px] leading-none group-hover:text-mustard transition-colors truncate">{group.groupName}</span>
          <span className="flex items-center gap-2 text-xs text-chalk-dim mt-1">
            {members.length} {members.length === 1 ? 'member' : 'members'}
            <span className="flex flex-wrap gap-y-1">
              {members.map((m, i) => (
                <span key={i} className="w-6 h-6 rounded-full border-2 border-slate-1 grid place-items-center text-[9.5px] font-bold text-[#1b1f1c] -ml-[7px] first:ml-0"
                  style={{ background: avatarColors[i] }}>{initialsOf(m.memberName)}</span>
              ))}
            </span>
          </span>
        </span>
      </button>
      {/* Gear goes directly to settings — no intermediate action sheet */}
      <button onClick={onSettings} aria-label={`${group.groupName} settings`}
        className="flex-none w-9 h-9 rounded-full grid place-items-center text-chalk-faint bg-transparent border-0 cursor-pointer hover:text-chalk hover:bg-chalk/[0.07]">
        <Icon name="gear" className="w-6 h-6" />
      </button>
    </div>
  );
};

const GroupsPage = () => {
  const navigate = useNavigate();
  const { schedules: groups, loading, error, fetchSchedules } = useSchedules();
  useEffect(() => { fetchSchedules(); }, [fetchSchedules]);

  const [createOpen, setCreateOpen] = useState(false);

  const openGroup = (g) => navigate(`/groups/${g.groupId}/${encodeURIComponent(g.groupName)}`);

  const handleCreate = async (name) => {
    const g = await api.createGroup(name);
    await fetchSchedules(true);
    setCreateOpen(false);
    // Send the new admin straight to the group's settings, where they can
    // create and share an invite link inline (no separate invite sheet).
    navigate(`/groups/${g.id}/settings`);
  };

  return (
    <div>
      <TopBar title="Your groups" sub={`${groups.length} ${groups.length === 1 ? 'group' : 'groups'}`}
        right={<IconButton name="plus" label="New group" onClick={() => setCreateOpen(true)} />} />
      <PullToRefresh onRefresh={() => fetchSchedules(true)} pullingContent="">
      <div className="px-5 pb-6">
        {loading ? (
          <Spinner label="Loading your groups…" />
        ) : error ? (
          <div className="text-red text-sm py-4">{error}</div>
        ) : groups.length === 0 ? (
          <div className="flex flex-col items-center text-center pt-12 px-2">
            <div className="w-28 h-28 rounded-full border-2 border-dashed border-chalk-faint grid place-items-center mb-6 text-chalk-faint">
              <Icon name="meal" className="w-[52%] h-[52%]" />
            </div>
            <h2 className="font-hand font-bold text-[34px] m-0 mb-2 text-chalk">No groups yet</h2>
            <p className="text-chalk-dim text-[13.5px] leading-relaxed max-w-[235px] m-0 mb-5">
              Start a group for your household, or join one with an invite link to begin planning meals together.
            </p>
            <div className="w-full max-w-[230px]">
              <Button variant="primary" onClick={() => setCreateOpen(true)}><Icon name="plus" className="w-[17px] h-[17px]" />New group</Button>
            </div>
          </div>
        ) : (
          groups.map((g) => (
            <GroupRow key={g.groupId} group={g} onOpen={() => openGroup(g)} onSettings={() => navigate(`/groups/${g.groupId}/settings`)} />
          ))
        )}
      </div>
      </PullToRefresh>

      <CreateGroupSheet open={createOpen} onClose={() => setCreateOpen(false)} onCreate={handleCreate} />
    </div>
  );
};

export default GroupsPage;
