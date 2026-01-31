import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  AppBar,
  Toolbar,
  IconButton,
  CircularProgress,
  Alert,
  Paper,
  Switch,
  Snackbar,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SettingsIcon from '@mui/icons-material/Settings';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';

dayjs.extend(isoWeek);

import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import WeekNavigator from '../components/WeekNavigator';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const MEAL = {
  LUNCH: 1,
  DINNER: 2,
};

const getCurrentWeek = () => {
  const now = dayjs();
  return { year: now.isoWeekYear(), week: now.isoWeek() };
};

const getWeekDates = (year, week) => {
  const jan4 = dayjs(`${year}-01-04`);
  const firstMonday = jan4.startOf('isoWeek');
  const targetMonday = firstMonday.add(week - 1, 'week');
  return DAYS.map((_, i) => targetMonday.add(i, 'day').format('D MMM'));
};

// Personal schedule table with toggles
const PersonalScheduleTable = ({ schedule, dates, onToggle }) => (
  <Box>
    <Box
      sx={{
        display: 'flex',
        bgcolor: 'primary.main',
        color: 'white',
        fontWeight: 600,
      }}
    >
      <Box sx={{ width: 100, py: 1, pl: 2 }}>
        <Typography variant="subtitle2" fontWeight={600}>Day</Typography>
      </Box>
      <Box sx={{ flex: 1, py: 1, textAlign: 'center' }}>
        <Typography variant="subtitle2" fontWeight={600}>Lunch</Typography>
      </Box>
      <Box sx={{ flex: 1, py: 1, textAlign: 'center' }}>
        <Typography variant="subtitle2" fontWeight={600}>Dinner</Typography>
      </Box>
    </Box>
    {DAYS.map((day, index) => {
      const attendance = schedule?.[day] ?? 0;
      const hasLunch = (attendance & MEAL.LUNCH) !== 0;
      const hasDinner = (attendance & MEAL.DINNER) !== 0;

      return (
        <Box
          key={day}
          sx={{
            display: 'flex',
            alignItems: 'center',
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box sx={{ width: 100, py: 1, pl: 2 }}>
            <Typography variant="body2">{DAY_LABELS[index]}</Typography>
            <Typography variant="caption" color="text.secondary">
              {dates[index]}
            </Typography>
          </Box>
          <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <Switch
              checked={hasLunch}
              onChange={() => onToggle(day, MEAL.LUNCH)}
              size="small"
            />
          </Box>
          <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <Switch
              checked={hasDinner}
              onChange={() => onToggle(day, MEAL.DINNER)}
              size="small"
            />
          </Box>
        </Box>
      );
    })}
  </Box>
);

// Members schedule with day cards
const MembersScheduleCards = ({ members, dates, year, week, todayRef }) => {
  const getMealAttendees = (dayKey, mealType) => {
    return Object.entries(members)
      .filter(([, member]) => ((member.schedule?.[dayKey] ?? 0) & mealType) !== 0)
      .map(([, member]) => member.memberName.toUpperCase())
      .sort();
  };

  // Calculate today's index in the week (0-6, or -1 if not in this week)
  const today = dayjs();
  const todayIndex = today.isoWeekYear() === year && today.isoWeek() === week
    ? today.isoWeekday() - 1
    : -1;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {DAYS.map((day, index) => {
        const lunchAttendees = getMealAttendees(day, MEAL.LUNCH);
        const dinnerAttendees = getMealAttendees(day, MEAL.DINNER);
        const isToday = index === todayIndex;

        return (
          <Paper
            key={day}
            ref={isToday ? todayRef : null}
            elevation={2}
            sx={{
              p: 2,
              borderLeft: isToday ? 4 : 0,
              borderColor: 'primary.main',
            }}
          >
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
              {DAY_LABELS[index]}, {dates[index]}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box>
                <Typography variant="body2" color="text.secondary" component="span">
                  Lunch ({lunchAttendees.length}):{' '}
                </Typography>
                <Typography variant="body2" component="span">
                  {lunchAttendees.length > 0 ? lunchAttendees.join(', ') : '—'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary" component="span">
                  Dinner ({dinnerAttendees.length}):{' '}
                </Typography>
                <Typography variant="body2" component="span">
                  {dinnerAttendees.length > 0 ? dinnerAttendees.join(', ') : '—'}
                </Typography>
              </Box>
            </Box>
          </Paper>
        );
      })}
    </Box>
  );
};

const GroupSchedulePage = () => {
  const { groupId, groupName } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const current = getCurrentWeek();
  const [year, setYear] = useState(current.year);
  const [week, setWeek] = useState(current.week);
  const [view, setView] = useState('personal');
  const [schedule, setSchedule] = useState(null);
  const [members, setMembers] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const todayCardRef = useRef(null);

  // Scroll to today's card when view changes to "everyone" and data is loaded
  useEffect(() => {
    if (!loading && view === 'everyone' && todayCardRef.current) {
      todayCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [loading, view]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        const period = `${year}-${week}`;
        const data = await api.getSchedules(period);
        const group = data.schedules?.find((g) => g.groupId === groupId);

        if (group) {
          setMembers(group.members);
          const currentMember = group.members[user.memberId];
          if (currentMember) {
            setSchedule({ ...currentMember.schedule });
          } else {
            setError('You are not a member of this group');
          }
        } else {
          setError('Group not found');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [groupId, user.memberId, year, week]);

  const handleWeekChange = (newYear, newWeek) => {
    setYear(newYear);
    setWeek(newWeek);
  };

  const handleViewChange = (_, newView) => {
    if (newView !== null) {
      setView(newView);
    }
  };

  const handleToggle = useCallback(async (day, mealType) => {
    const prevSchedule = schedule;
    const newSchedule = {
      ...schedule,
      [day]: (schedule[day] ?? 0) ^ mealType,
    };
    setSchedule(newSchedule);

    // Also update in members for consistency
    setMembers((prev) => ({
      ...prev,
      [user.memberId]: {
        ...prev[user.memberId],
        schedule: newSchedule,
      },
    }));

    try {
      const period = `${year}-${week}`;
      await api.createSchedule(groupId, {
        period,
        schedule: newSchedule,
      });
    } catch {
      setSchedule(prevSchedule);
      setMembers((prev) => ({
        ...prev,
        [user.memberId]: {
          ...prev[user.memberId],
          schedule: prevSchedule,
        },
      }));
      setSaveError('Failed to save schedule');
    }
  }, [schedule, groupId, year, week, user.memberId]);

  const dates = getWeekDates(year, week);

  return (
    <>
      <AppBar
        position="sticky"
        sx={{
          width: '100vw',
          ml: 'calc(-50vw + 50%)',
          top: 0,
        }}
      >
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => navigate('/')}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography
            variant="h6"
            component="h1"
            sx={{
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
            }}
          >
            {decodeURIComponent(groupName)}
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <IconButton
            edge="end"
            color="inherit"
            onClick={() => navigate(`/groups/${groupId}/${groupName}/default`)}
          >
            <SettingsIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Box sx={{ py: 2 }}>
        <WeekNavigator year={year} week={week} onChange={handleWeekChange} />

        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <ToggleButtonGroup
            value={view}
            exclusive
            onChange={handleViewChange}
            size="small"
          >
            <ToggleButton value="personal">My Schedule</ToggleButton>
            <ToggleButton value="everyone">Everyone</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : view === 'personal' && schedule ? (
          <Paper elevation={2} sx={{ overflow: 'hidden' }}>
            <PersonalScheduleTable schedule={schedule} dates={dates} onToggle={handleToggle} />
          </Paper>
        ) : view === 'everyone' && members ? (
          <MembersScheduleCards members={members} dates={dates} year={year} week={week} todayRef={todayCardRef} />
        ) : null}
      </Box>
      <Snackbar
        open={!!saveError}
        autoHideDuration={4000}
        onClose={() => setSaveError(null)}
        message={saveError}
      />
    </>
  );
};

export default GroupSchedulePage;
