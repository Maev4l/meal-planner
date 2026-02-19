// Edited by Claude.
// Warm Bistro themed default schedule page with proper column alignment
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
  Snackbar,
  alpha,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import LunchDiningIcon from '@mui/icons-material/LunchDining';
import DinnerDiningIcon from '@mui/icons-material/DinnerDining';
import { useAuth } from '../contexts/AuthContext';
import { useSchedules } from '../contexts/SchedulesContext';
import { api } from '../services/api';
import { DAYS, DAY_LABELS, MEAL } from '../constants/schedule';

// Column width for day label
const COL_DAY = 85;

// Custom meal toggle component with high contrast between present/absent states
const MealToggle = ({ checked, onChange, type }) => {
  const isLunch = type === 'lunch';
  const Icon = isLunch ? LunchDiningIcon : DinnerDiningIcon;

  return (
    <Box
      onClick={onChange}
      sx={{
        width: 48,
        height: 48,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        // High contrast: solid green when present, red/terracotta when absent
        backgroundColor: (theme) =>
          checked
            ? theme.palette.sage.main
            : alpha(theme.palette.terracotta.main, 0.15),
        border: (theme) =>
          checked
            ? `2px solid ${theme.palette.sage.dark}`
            : `2px dashed ${theme.palette.terracotta.main}`,
        boxShadow: (theme) =>
          checked
            ? `0 2px 8px ${alpha(theme.palette.sage.main, 0.4)}`
            : `0 2px 8px ${alpha(theme.palette.terracotta.main, 0.25)}`,
        '&:hover': {
          transform: 'scale(1.08)',
          boxShadow: (theme) =>
            checked
              ? `0 4px 16px ${alpha(theme.palette.sage.main, 0.5)}`
              : `0 4px 12px ${alpha(theme.palette.terracotta.main, 0.3)}`,
          backgroundColor: (theme) =>
            checked
              ? theme.palette.sage.main
              : alpha(theme.palette.terracotta.main, 0.25),
        },
        '&:active': {
          transform: 'scale(0.95)',
        },
      }}
    >
      <Icon
        sx={{
          fontSize: 22,
          // White icon when present, terracotta when absent
          color: (theme) =>
            checked ? 'white' : theme.palette.terracotta.main,
          transition: 'all 0.25s ease',
        }}
      />
    </Box>
  );
};

const ScheduleTable = ({ schedule, onToggle }) => (
  <Box
    sx={{
      overflow: 'hidden',
    }}
  >
    {/* Header row - matches Paper's border radius (20px from theme) */}
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        background: (theme) =>
          `linear-gradient(135deg, ${theme.palette.burgundy.main} 0%, ${theme.palette.burgundy.dark} 100%)`,
        color: 'white',
        py: 1.5,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
      }}
    >
      <Box sx={{ width: COL_DAY, pl: 2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, opacity: 0.9 }}>
          DAY
        </Typography>
      </Box>
      <Box sx={{ flex: 1, textAlign: 'center' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, opacity: 0.9 }}>
          LUNCH
        </Typography>
      </Box>
      <Box sx={{ flex: 1, textAlign: 'center' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, opacity: 0.9 }}>
          DINNER
        </Typography>
      </Box>
    </Box>

    {/* Day rows */}
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
            py: 1.25,
            borderBottom: (theme) =>
              `1px solid ${alpha(theme.palette.charcoal.main, 0.08)}`,
            animation: 'fadeInUp 0.4s ease-out forwards',
            animationDelay: `${index * 0.05}s`,
            opacity: 0,
          }}
        >
          {/* Day info */}
          <Box sx={{ width: COL_DAY, pl: 2 }}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 500,
                color: 'text.primary',
                fontSize: '0.875rem',
              }}
            >
              {DAY_LABELS[index]}
            </Typography>
          </Box>

          {/* Lunch toggle */}
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <MealToggle
              checked={hasLunch}
              onChange={() => onToggle(day, MEAL.LUNCH)}
              type="lunch"
            />
          </Box>

          {/* Dinner toggle */}
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <MealToggle
              checked={hasDinner}
              onChange={() => onToggle(day, MEAL.DINNER)}
              type="dinner"
            />
          </Box>
        </Box>
      );
    })}
  </Box>
);

const DefaultSchedulePage = () => {
  const { groupId, groupName } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { fetchSchedules, loading, error: contextError } = useSchedules();
  const [schedule, setSchedule] = useState(null);
  const [error, setError] = useState(null);
  const [saveError, setSaveError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      const schedules = await fetchSchedules();
      const group = schedules.find((g) => g.groupId === groupId);

      if (group) {
        const currentMember = group.members[user.memberId];
        if (currentMember) {
          setSchedule({ ...currentMember.default });
        } else {
          setError('You are not a member of this group');
        }
      } else {
        setError('Group not found');
      }
    };

    loadData();
  }, [groupId, user.memberId, fetchSchedules]);

  const handleToggle = useCallback(
    async (day, mealType) => {
      const prevSchedule = schedule;
      const newSchedule = {
        ...schedule,
        [day]: (schedule[day] ?? 0) ^ mealType,
      };
      setSchedule(newSchedule);

      try {
        await api.createSchedule(groupId, {
          default: true,
          schedule: newSchedule,
        });
        // Refresh schedules from server as default changes may affect personal schedule
        fetchSchedules(true);
      } catch {
        setSchedule(prevSchedule);
        setSaveError('Failed to save schedule');
      }
    },
    [schedule, groupId, fetchSchedules]
  );

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 68px)',
        mx: -2,
      }}
    >
      <AppBar position="static" sx={{ width: '100%' }}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => navigate(-1)}
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
            }}
          >
            {decodeURIComponent(groupName)}
          </Typography>
        </Toolbar>
      </AppBar>

      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          p: 2,
          backgroundColor: 'background.default',
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
              Loading default schedule...
            </Typography>
          </Box>
        ) : error || contextError ? (
          <Alert
            severity="error"
            sx={{ animation: 'fadeIn 0.3s ease-out forwards' }}
          >
            {error || contextError}
          </Alert>
        ) : schedule ? (
          <>
            {/* Header */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1.5,
                mb: 3,
                animation: 'fadeInUp 0.4s ease-out forwards',
              }}
            >
              <CalendarTodayIcon
                sx={{ fontSize: 20, color: 'primary.main' }}
              />
              <Typography
                variant="h6"
                sx={{
                  fontFamily: '"Playfair Display", Georgia, serif',
                  fontWeight: 600,
                  color: 'text.primary',
                }}
              >
                Default Schedule
              </Typography>
            </Box>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                textAlign: 'center',
                mb: 3,
                animation: 'fadeIn 0.3s ease-out forwards',
                animationDelay: '0.1s',
              }}
            >
              This will be applied to new weeks automatically
            </Typography>

            <Paper
              elevation={2}
              sx={{
                overflow: 'hidden',
                animation: 'scaleIn 0.3s ease-out forwards',
              }}
            >
              <ScheduleTable schedule={schedule} onToggle={handleToggle} />
            </Paper>
          </>
        ) : null}
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

export default DefaultSchedulePage;
