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
  Snackbar,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SettingsIcon from '@mui/icons-material/Settings';
import PullToRefresh from 'react-simple-pull-to-refresh';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import WeekNavigator from '../components/WeekNavigator';
import PersonalScheduleView from '../components/PersonalScheduleView';
import MembersScheduleView from '../components/MembersScheduleView';
import { getCurrentWeek, getWeekDates } from '../constants/schedule';

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

  const loadData = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    }
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
  }, [groupId, user.memberId, year, week]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = async () => {
    await loadData(false);
  };

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
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 56px)', // Account for bottom navigation
        mx: -2, // Offset container padding
      }}
    >
      <AppBar
        position="static"
        sx={{
          width: '100%',
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
      <Box sx={{ py: 2, px: 2 }}>
        <WeekNavigator year={year} week={week} onChange={handleWeekChange} />

        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
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
      </Box>

      <Box
        sx={{
          flex: 1,
          overflow: 'hidden',
        }}
      >
        <PullToRefresh
          onRefresh={handleRefresh}
          pullingContent=""
          style={{ height: '100%' }}
        >
          <Box sx={{ px: 2, pt: 2, pb: 2, height: '100%', overflow: 'auto' }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Alert severity="error">{error}</Alert>
            ) : view === 'personal' && schedule ? (
              <Paper elevation={2} sx={{ overflow: 'hidden' }}>
                <PersonalScheduleView schedule={schedule} dates={dates} onToggle={handleToggle} year={year} week={week} />
              </Paper>
            ) : view === 'everyone' && members ? (
              <MembersScheduleView members={members} dates={dates} year={year} week={week} todayRef={todayCardRef} />
            ) : null}
          </Box>
        </PullToRefresh>
      </Box>
      <Snackbar
        open={!!saveError}
        autoHideDuration={4000}
        onClose={() => setSaveError(null)}
        message={saveError}
      />
    </Box>
  );
};

export default GroupSchedulePage;
