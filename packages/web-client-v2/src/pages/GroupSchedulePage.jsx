// Edited by Claude.
// Warm Bistro themed group schedule page with elegant layout
import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
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
  alpha,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import TuneIcon from '@mui/icons-material/Tune';
import PersonIcon from '@mui/icons-material/Person';
import GroupsIcon from '@mui/icons-material/Groups';
import PullToRefresh from 'react-simple-pull-to-refresh';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import WeekNavigator from '../components/WeekNavigator';
import PersonalScheduleView from '../components/PersonalScheduleView';
import MembersScheduleView from '../components/MembersScheduleView';
import CommentsDrawer from '../components/CommentsDrawer';
import {
  getCurrentWeek,
  getWeekDates,
  DAY_LABELS,
  DAYS,
} from '../constants/schedule';

const GroupSchedulePage = () => {
  const { groupId, groupName } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const current = getCurrentWeek();
  const [year, setYear] = useState(location.state?.year ?? current.year);
  const [week, setWeek] = useState(location.state?.week ?? current.week);
  const [view, setView] = useState('personal');
  const [schedule, setSchedule] = useState(null);
  const [comments, setComments] = useState(null);
  const [members, setMembers] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [commentsSheetDay, setCommentsSheetDay] = useState(null);
  const todayCardRef = useRef(null);

  // Scroll to today's card when view changes to "everyone" and data is loaded
  useEffect(() => {
    if (!loading && view === 'everyone' && todayCardRef.current) {
      todayCardRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [loading, view]);

  const loadData = useCallback(
    async (showLoading = true) => {
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
            setComments(currentMember.comments ?? null);
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
    },
    [groupId, user.memberId, year, week]
  );

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

  const handleToggle = useCallback(
    async (day, mealType) => {
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
    },
    [schedule, groupId, year, week, user.memberId]
  );

  const dates = getWeekDates(year, week);

  const handleDayClick = useCallback(
    (day, dayIndex) => {
      navigate(`/groups/${groupId}/${groupName}/day/${day}`, {
        state: {
          year,
          week,
          dayIndex,
          initialComments: comments?.[day] ?? null,
          allComments: comments ?? {},
        },
      });
    },
    [navigate, groupId, groupName, year, week, comments]
  );

  // Get all comments for a given day from all members
  const getCommentsForDay = (dayKey) => {
    if (!members) return [];
    return Object.entries(members)
      .filter(([, member]) => {
        const dayComments = member.comments?.[dayKey];
        return dayComments?.lunch || dayComments?.dinner;
      })
      .map(([, member]) => ({
        memberName: member.memberName,
        lunch: member.comments?.[dayKey]?.lunch || '',
        dinner: member.comments?.[dayKey]?.dinner || '',
      }))
      .sort((a, b) => a.memberName.localeCompare(b.memberName));
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: 'var(--vh-with-nav)', // Account for bottom navigation
        mx: -2,
      }}
    >
      <AppBar position="static" sx={{ width: '100%' }}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => navigate('/')}
            sx={{
              '&:hover': {
                backgroundColor: (theme) =>
                  alpha(theme.palette.common.white, 0.1),
              },
            }}
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
              fontFamily: '"Playfair Display", Georgia, serif',
              fontWeight: 600,
              letterSpacing: '0.02em',
            }}
          >
            {decodeURIComponent(groupName)}
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <IconButton
            edge="end"
            color="inherit"
            onClick={() => navigate(`/groups/${groupId}/${groupName}/default`)}
            sx={{
              '&:hover': {
                backgroundColor: (theme) =>
                  alpha(theme.palette.common.white, 0.1),
              },
            }}
          >
            <TuneIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Controls section */}
      <Box
        sx={{
          py: 2.5,
          px: 2,
          backgroundColor: 'background.default',
        }}
      >
        <WeekNavigator year={year} week={week} onChange={handleWeekChange} />

        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <ToggleButtonGroup
            value={view}
            exclusive
            onChange={handleViewChange}
            size="small"
          >
            <ToggleButton value="personal">
              <PersonIcon sx={{ fontSize: 18, mr: 0.75 }} />
              My Schedule
            </ToggleButton>
            <ToggleButton value="everyone">
              <GroupsIcon sx={{ fontSize: 18, mr: 0.75 }} />
              Everyone
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>

      {/* Content area */}
      <Box
        sx={{
          flex: 1,
          overflow: 'hidden',
          backgroundColor: 'background.default',
        }}
      >
        <PullToRefresh
          onRefresh={handleRefresh}
          pullingContent=""
          style={{ height: '100%' }}
        >
          <Box
            sx={{
              px: 2,
              pt: 1,
              pb: 3,
              height: '100%',
              overflow: 'auto',
            }}
          >
            {loading ? (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  py: 8,
                  gap: 2,
                }}
              >
                <CircularProgress size={40} />
                <Typography variant="body2" color="text.secondary">
                  Loading schedule...
                </Typography>
              </Box>
            ) : error ? (
              <Alert
                severity="error"
                sx={{ animation: 'fadeIn 0.3s ease-out forwards' }}
              >
                {error}
              </Alert>
            ) : view === 'personal' && schedule ? (
              <Paper
                elevation={2}
                sx={{
                  overflow: 'hidden',
                  animation: 'scaleIn 0.3s ease-out forwards',
                }}
              >
                <PersonalScheduleView
                  schedule={schedule}
                  dates={dates}
                  onToggle={handleToggle}
                  year={year}
                  week={week}
                  comments={comments}
                  onDayClick={handleDayClick}
                />
              </Paper>
            ) : view === 'everyone' && members ? (
              <MembersScheduleView
                members={members}
                dates={dates}
                year={year}
                week={week}
                todayRef={todayCardRef}
                onCommentsClick={(dayIndex) => setCommentsSheetDay(dayIndex)}
              />
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

      <CommentsDrawer
        open={commentsSheetDay !== null}
        onClose={() => setCommentsSheetDay(null)}
        dayLabel={commentsSheetDay !== null ? DAY_LABELS[commentsSheetDay] : ''}
        year={year}
        week={week}
        dayIndex={commentsSheetDay}
        comments={
          commentsSheetDay !== null ? getCommentsForDay(DAYS[commentsSheetDay]) : []
        }
      />
    </Box>
  );
};

export default GroupSchedulePage;
