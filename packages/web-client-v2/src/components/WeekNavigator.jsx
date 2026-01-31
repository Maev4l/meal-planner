import { Box, IconButton, Typography } from '@mui/material';
import KeyboardDoubleArrowLeftIcon from '@mui/icons-material/KeyboardDoubleArrowLeft';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

const getCurrentWeek = () => {
  const now = new Date();
  const year = now.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const days = Math.floor((now - startOfYear) / (24 * 60 * 60 * 1000));
  const week = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  return { year, week };
};

const WeekNavigator = ({ year, week, onChange }) => {
  const current = getCurrentWeek();
  const isCurrentWeek = year === current.year && week === current.week;
  const canGoPrevious = year > current.year || (year === current.year && week > current.week);

  // Show jump-to-today only if previous week is not the current week
  const prevWeek = week === 1 ? 52 : week - 1;
  const prevYear = week === 1 ? year - 1 : year;
  const previousIsCurrentWeek = prevYear === current.year && prevWeek === current.week;
  const showJumpToToday = !isCurrentWeek && !previousIsCurrentWeek;

  const handleToday = () => {
    onChange(current.year, current.week);
  };

  const handlePrevious = () => {
    if (!canGoPrevious) return;
    if (week === 1) {
      onChange(year - 1, 52);
    } else {
      onChange(year, week - 1);
    }
  };

  const handleNext = () => {
    if (week === 52) {
      onChange(year + 1, 1);
    } else {
      onChange(year, week + 1);
    }
  };

  const weekLabel = `${year} - ${String(week).padStart(2, '0')}`;

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 2 }}>
      <IconButton
        onClick={handleToday}
        size="small"
        sx={{ visibility: showJumpToToday ? 'visible' : 'hidden' }}
      >
        <KeyboardDoubleArrowLeftIcon />
      </IconButton>
      <IconButton
        onClick={handlePrevious}
        size="small"
        sx={{ visibility: canGoPrevious ? 'visible' : 'hidden' }}
      >
        <ChevronLeftIcon />
      </IconButton>
      <Typography variant="subtitle1" sx={{ fontWeight: 500, minWidth: 80, textAlign: 'center' }}>
        {weekLabel}
      </Typography>
      <IconButton onClick={handleNext} size="small">
        <ChevronRightIcon />
      </IconButton>
    </Box>
  );
};

export default WeekNavigator;
