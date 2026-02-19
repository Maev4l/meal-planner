// Edited by Claude.
// Warm Bistro themed comments page with elegant form design
import { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  AppBar,
  Toolbar,
  IconButton,
  TextField,
  CircularProgress,
  Snackbar,
  Button,
  alpha,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LunchDiningIcon from '@mui/icons-material/LunchDining';
import DinnerDiningIcon from '@mui/icons-material/DinnerDining';
import SaveIcon from '@mui/icons-material/Save';
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
  const { year, week, dayIndex, initialComments, allComments } =
    location.state || {};

  // Compute full date with long month name
  const getFullDate = () => {
    const jan4 = dayjs(`${year}-01-04`);
    const firstMonday = jan4.startOf('isoWeek');
    const targetDay = firstMonday.add(week - 1, 'week').add(dayIndex, 'day');
    return targetDay.format('D MMMM YYYY');
  };

  const [lunchComment, setLunchComment] = useState(
    initialComments?.lunch ?? ''
  );
  const [dinnerComment, setDinnerComment] = useState(
    initialComments?.dinner ?? ''
  );
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
      navigate(`/groups/${groupId}/${groupName}`, { state: { year, week } });
    } catch {
      setSaveError('Failed to save comment');
    } finally {
      setSaving(false);
    }
  };

  if (!year || !week) {
    return (
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
          Loading...
        </Typography>
      </Box>
    );
  }

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
            onClick={() =>
              navigate(`/groups/${groupId}/${groupName}`, {
                state: { year, week },
              })
            }
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
            Comments
          </Typography>
        </Toolbar>
      </AppBar>

      <Box
        sx={{
          p: 3,
          flex: 1,
          overflow: 'auto',
          backgroundColor: 'background.default',
        }}
      >
        {/* Date header */}
        <Box
          sx={{
            textAlign: 'center',
            mb: 4,
            animation: 'fadeInUp 0.4s ease-out forwards',
          }}
        >
          <Typography
            variant="h5"
            sx={{
              fontFamily: '"Playfair Display", Georgia, serif',
              fontWeight: 600,
              color: 'text.primary',
              mb: 0.5,
            }}
          >
            {DAY_LABELS[dayIndex]}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {getFullDate()}
          </Typography>
        </Box>

        {/* Comments form */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
          }}
        >
          {/* Lunch comment section */}
          <Box
            sx={{
              animation: 'fadeInUp 0.4s ease-out forwards',
              animationDelay: '0.1s',
              opacity: 0,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mb: 1.5,
              }}
            >
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 2,
                  backgroundColor: (theme) =>
                    alpha(theme.palette.amber.main, 0.15),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <LunchDiningIcon
                  sx={{ fontSize: 20, color: 'secondary.dark' }}
                />
              </Box>
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 600,
                  color: 'text.primary',
                }}
              >
                Lunch
              </Typography>
            </Box>
            <TextField
              fullWidth
              multiline
              rows={3}
              placeholder={
                isPast ? 'Past meals cannot be edited' : 'Add a note for lunch...'
              }
              value={lunchComment}
              onChange={(e) => handleCommentChange('lunch', e.target.value)}
              variant="outlined"
              disabled={isPast}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'background.paper',
                },
              }}
            />
          </Box>

          {/* Dinner comment section */}
          <Box
            sx={{
              animation: 'fadeInUp 0.4s ease-out forwards',
              animationDelay: '0.2s',
              opacity: 0,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mb: 1.5,
              }}
            >
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 2,
                  backgroundColor: (theme) =>
                    alpha(theme.palette.burgundy.main, 0.1),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <DinnerDiningIcon
                  sx={{ fontSize: 20, color: 'primary.main' }}
                />
              </Box>
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 600,
                  color: 'text.primary',
                }}
              >
                Dinner
              </Typography>
            </Box>
            <TextField
              fullWidth
              multiline
              rows={3}
              placeholder={
                isPast
                  ? 'Past meals cannot be edited'
                  : 'Add a note for dinner...'
              }
              value={dinnerComment}
              onChange={(e) => handleCommentChange('dinner', e.target.value)}
              variant="outlined"
              disabled={isPast}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'background.paper',
                },
              }}
            />
          </Box>

          {/* Save button */}
          {!isPast && (
            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={handleSave}
              disabled={!isDirty || saving}
              startIcon={
                saving ? (
                  <CircularProgress size={18} sx={{ color: 'inherit' }} />
                ) : (
                  <SaveIcon />
                )
              }
              sx={{
                mt: 2,
                py: 1.5,
                animation: 'fadeInUp 0.4s ease-out forwards',
                animationDelay: '0.3s',
                opacity: 0,
              }}
            >
              {saving ? 'Saving...' : 'Save Comments'}
            </Button>
          )}

          {isPast && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                textAlign: 'center',
                fontStyle: 'italic',
                mt: 2,
              }}
            >
              Comments for past meals are read-only
            </Typography>
          )}
        </Box>
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
