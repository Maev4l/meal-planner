import { useState, useEffect, useCallback } from 'react';
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
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SettingsIcon from '@mui/icons-material/Settings';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import 'dayjs/locale/fr';

dayjs.extend(isoWeek);
dayjs.locale('en');
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
  // ISO week 1 contains January 4th, find that week's Monday then offset
  const jan4 = dayjs(`${year}-01-04`);
  const firstMonday = jan4.startOf('isoWeek');
  const targetMonday = firstMonday.add(week - 1, 'week');
  return DAYS.map((_, i) => targetMonday.add(i, 'day').format('D MMM'));
};

const ScheduleTable = ({ schedule, dates, onToggle }) => (
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

const PersonalSchedulePage = () => {
  const { groupId, groupName } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const current = getCurrentWeek();
  const [year, setYear] = useState(current.year);
  const [week, setWeek] = useState(current.week);
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saveError, setSaveError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        const period = `${year}-${week}`;
        const data = await api.getSchedules(period);
        const group = data.schedules?.find((g) => g.groupId === groupId);

        if (group) {
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

  const handleToggle = useCallback(async (day, mealType) => {
    const prevSchedule = schedule;
    const newSchedule = {
      ...schedule,
      [day]: (schedule[day] ?? 0) ^ mealType,
    };
    setSchedule(newSchedule);

    try {
      const period = `${year}-${week}`;
      await api.createSchedule(groupId, {
        period,
        schedule: newSchedule,
      });
    } catch {
      setSchedule(prevSchedule);
      setSaveError('Failed to save schedule');
    }
  }, [schedule, groupId, year, week]);

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
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : schedule ? (
          <Paper elevation={2} sx={{ overflow: 'hidden' }}>
            <ScheduleTable schedule={schedule} dates={getWeekDates(year, week)} onToggle={handleToggle} />
          </Paper>
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

export default PersonalSchedulePage;
