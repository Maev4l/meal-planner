// Edited by Claude.
// Warm Bistro themed week navigator with proper alignment
import { Box, IconButton, Typography, Chip, alpha } from '@mui/material';
import KeyboardDoubleArrowLeftIcon from '@mui/icons-material/KeyboardDoubleArrowLeft';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { getCurrentWeek } from '../constants/schedule';

const WeekNavigator = ({ year, week, onChange }) => {
  const current = getCurrentWeek();
  const isCurrentWeek = year === current.year && week === current.week;
  const canGoPrevious =
    year > current.year || (year === current.year && week > current.week);

  // Show jump-to-today only if previous week is not the current week
  const prevWeek = week === 1 ? 52 : week - 1;
  const prevYear = week === 1 ? year - 1 : year;
  const previousIsCurrentWeek =
    prevYear === current.year && prevWeek === current.week;
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

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        mb: 2.5,
        gap: 0.5,
      }}
    >
      {/* Jump to today button - fixed width for balance */}
      <Box sx={{ width: 40, display: 'flex', justifyContent: 'center' }}>
        {showJumpToToday && (
          <IconButton
            onClick={handleToday}
            size="small"
            sx={{
              backgroundColor: (theme) =>
                alpha(theme.palette.primary.main, 0.08),
              color: 'primary.main',
              '&:hover': {
                backgroundColor: (theme) =>
                  alpha(theme.palette.primary.main, 0.15),
              },
            }}
          >
            <KeyboardDoubleArrowLeftIcon />
          </IconButton>
        )}
      </Box>

      {/* Previous week - fixed width */}
      <Box sx={{ width: 40, display: 'flex', justifyContent: 'center' }}>
        {canGoPrevious && (
          <IconButton
            onClick={handlePrevious}
            size="small"
            sx={{ color: 'text.secondary' }}
          >
            <ChevronLeftIcon />
          </IconButton>
        )}
      </Box>

      {/* Week display - fixed width center section */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
          px: 2,
          py: 1,
          borderRadius: 3,
          backgroundColor: (theme) =>
            alpha(theme.palette.charcoal.main, 0.04),
          minWidth: 160,
        }}
      >
        <CalendarTodayIcon
          sx={{
            fontSize: 18,
            color: isCurrentWeek ? 'primary.main' : 'text.secondary',
          }}
        />
        <Box sx={{ textAlign: 'center' }}>
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 600,
              fontFamily: '"DM Sans", sans-serif',
              color: 'text.primary',
              lineHeight: 1.2,
            }}
          >
            Week {String(week).padStart(2, '0')}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              display: 'block',
            }}
          >
            {year}
          </Typography>
        </Box>
        {isCurrentWeek && (
          <Chip
            label="Now"
            size="small"
            sx={{
              height: 20,
              backgroundColor: 'primary.main',
              color: 'white',
              fontWeight: 600,
              fontSize: '0.65rem',
              '& .MuiChip-label': {
                px: 0.75,
              },
            }}
          />
        )}
      </Box>

      {/* Next week - fixed width */}
      <Box sx={{ width: 40, display: 'flex', justifyContent: 'center' }}>
        <IconButton
          onClick={handleNext}
          size="small"
          sx={{ color: 'text.secondary' }}
        >
          <ChevronRightIcon />
        </IconButton>
      </Box>

      {/* Spacer to balance layout - fixed width */}
      <Box sx={{ width: 40 }} />
    </Box>
  );
};

export default WeekNavigator;
