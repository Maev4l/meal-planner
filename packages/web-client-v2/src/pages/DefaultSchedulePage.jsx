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
  ButtonBase,
  Snackbar,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { useAuth } from '../contexts/AuthContext';
import { useSchedules } from '../contexts/SchedulesContext';
import { api } from '../services/api';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const MEAL = {
  LUNCH: 1,
  DINNER: 2,
};

const MealColumn = ({ title, schedule, mealType, onToggle }) => (
  <Box sx={{ flex: 1 }}>
    <Typography
      variant="subtitle2"
      sx={{
        textAlign: 'center',
        fontWeight: 600,
        py: 1,
        bgcolor: 'primary.main',
        color: 'white',
      }}
    >
      {title}
    </Typography>
    {DAYS.map((day, index) => {
      const attendance = schedule?.[day] ?? 0;
      const isPresent = (attendance & mealType) !== 0;

      return (
        <ButtonBase
          key={day}
          onClick={() => onToggle(day, mealType)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            px: 2,
            py: 1,
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography variant="body2">{DAY_LABELS[index]}</Typography>
          {isPresent ? (
            <CheckCircleIcon color="success" fontSize="small" />
          ) : (
            <CancelIcon color="error" fontSize="small" />
          )}
        </ButtonBase>
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

  const handleToggle = useCallback(async (day, mealType) => {
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
  }, [schedule, groupId, fetchSchedules]);

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
            onClick={() => navigate(-1)}
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
        </Toolbar>
      </AppBar>
      <Box sx={{ py: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (error || contextError) ? (
          <Alert severity="error">{error || contextError}</Alert>
        ) : schedule ? (
          <>
            <Typography variant="subtitle1" sx={{ textAlign: 'center', mb: 2, fontWeight: 500 }}>
              My Default Schedule
            </Typography>
            <Paper elevation={2} sx={{ display: 'flex', overflow: 'hidden' }}>
              <MealColumn title="LUNCH" schedule={schedule} mealType={MEAL.LUNCH} onToggle={handleToggle} />
              <Box sx={{ width: '1px', bgcolor: 'divider' }} />
              <MealColumn title="DINNER" schedule={schedule} mealType={MEAL.DINNER} onToggle={handleToggle} />
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
    </>
  );
};

export default DefaultSchedulePage;
