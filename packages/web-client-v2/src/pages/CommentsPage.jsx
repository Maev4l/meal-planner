import { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  AppBar,
  Toolbar,
  IconButton,
  TextField,
  Divider,
  CircularProgress,
  Snackbar,
  Button,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import { api } from '../services/api';
import { DAY_LABELS, getTodayIndex } from '../constants/schedule';

dayjs.extend(isoWeek);

const CommentDetailPage = () => {
  const { groupId, groupName, day } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Get data passed via navigation state
  const {
    year,
    week,
    dayIndex,
    initialComments,
    allComments,
  } = location.state || {};

  // Compute full date with long month name
  const getFullDate = () => {
    const jan4 = dayjs(`${year}-01-04`);
    const firstMonday = jan4.startOf('isoWeek');
    const targetDay = firstMonday.add(week - 1, 'week').add(dayIndex, 'day');
    return targetDay.format('D MMMM');
  };

  const [lunchComment, setLunchComment] = useState(initialComments?.lunch ?? '');
  const [dinnerComment, setDinnerComment] = useState(initialComments?.dinner ?? '');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [isDirty, setIsDirty] = useState(false);

  const todayIndex = getTodayIndex(year, week);
  const isPast = todayIndex >= 0 && dayIndex < todayIndex;

  const handleCommentChange = (meal, value) => {
    if (meal === 'lunch') {
      setLunchComment(value);
    } else {
      setDinnerComment(value);
    }
    setIsDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const getComments = (dayName) => {
        if (dayName === day) {
          return { lunch: lunchComment, dinner: dinnerComment };
        }
        return allComments?.[dayName] ?? { lunch: '', dinner: '' };
      };

      await api.createComments(groupId, {
        year,
        weekNumber: week,
        monday: getComments('monday'),
        tuesday: getComments('tuesday'),
        wednesday: getComments('wednesday'),
        thursday: getComments('thursday'),
        friday: getComments('friday'),
        saturday: getComments('saturday'),
        sunday: getComments('sunday'),
      });
      navigate(-1);
    } catch {
      setSaveError('Failed to save comment');
    } finally {
      setSaving(false);
    }
  };

  if (!year || !week) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 56px)',
        mx: -2,
      }}
    >
      <AppBar position="static" sx={{ width: '100%' }}>
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
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 2, flex: 1, overflow: 'auto' }}>
        <Typography variant="subtitle1" color="text.secondary" sx={{ textAlign: 'center' }}>
          {DAY_LABELS[dayIndex]} {getFullDate()}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
          You can leave a comment for each meal
        </Typography>

        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>Lunch</Typography>
        <TextField
          fullWidth
          multiline
          rows={2}
          placeholder="Add a comment for lunch..."
          value={lunchComment}
          onChange={(e) => handleCommentChange('lunch', e.target.value)}
          variant="outlined"
          size="small"
          disabled={isPast}
        />

        <Divider sx={{ my: 3 }} />

        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>Dinner</Typography>
        <TextField
          fullWidth
          multiline
          rows={2}
          placeholder="Add a comment for dinner..."
          value={dinnerComment}
          onChange={(e) => handleCommentChange('dinner', e.target.value)}
          variant="outlined"
          size="small"
          disabled={isPast}
        />

        {!isPast && (
          <Button
            variant="contained"
            fullWidth
            onClick={handleSave}
            disabled={!isDirty || saving}
            sx={{ mt: 3 }}
          >
            {saving ? 'Saving...' : 'Save'}
          </Button>
        )}
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

export default CommentDetailPage;
