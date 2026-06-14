import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSchedules } from '../contexts/SchedulesContext';
import { colorForName, colorsForNames, initialsOf } from '../constants/colors';
import Icon from '../components/Icon';
import TopBar from '../components/ui/TopBar';
import Spinner from '../components/ui/Spinner';

const GroupRow = ({ group, onClick }) => {
  const members = Object.values(group.members);
  const avatarColors = colorsForNames(members.map((m) => m.memberName));
  return (
    <button onClick={onClick}
      className="group w-full flex items-center gap-4 py-[18px] border-b border-dashed border-chalk-faint text-left bg-transparent cursor-pointer">
      <span className="flex-none w-[52px] h-[52px] rounded-[14px] grid place-items-center font-hand font-bold text-[30px] text-slate-0 -rotate-3"
            style={{ background: colorForName(group.groupName) }}>
        {initialsOf(group.groupName)}
      </span>
      <span className="min-w-0">
        <span className="block font-hand font-bold text-[27px] leading-none group-hover:text-mustard transition-colors">{group.groupName}</span>
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
      <span className="ml-auto text-chalk-faint text-[22px]">→</span>
    </button>
  );
};

const GroupsPage = () => {
  const navigate = useNavigate();
  const { schedules: groups, loading, error, fetchSchedules } = useSchedules();
  useEffect(() => { fetchSchedules(); }, [fetchSchedules]);

  return (
    <div>
      <TopBar title="Your groups" sub={`${groups.length} ${groups.length === 1 ? 'group' : 'groups'}`} />
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
            <p className="text-chalk-dim text-[13.5px] leading-relaxed max-w-[235px] m-0">
              You&apos;ll see your meal-planning groups here once you&apos;ve been added to one.
            </p>
          </div>
        ) : (
          groups.map((g) => (
            <GroupRow key={g.groupId} group={g}
              onClick={() => navigate(`/groups/${g.groupId}/${encodeURIComponent(g.groupName)}`)} />
          ))
        )}
      </div>
    </div>
  );
};

export default GroupsPage;
