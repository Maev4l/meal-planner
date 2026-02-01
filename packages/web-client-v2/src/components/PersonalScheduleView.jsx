import { Box, Typography, Switch, IconButton } from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import { DAYS, DAY_LABELS, MEAL, getTodayIndex } from '../constants/schedule';

const PersonalScheduleView = ({ schedule, dates, onToggle, year, week, comments, onDayClick }) => {
  const todayIndex = getTodayIndex(year, week);

  return (
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
        <Box sx={{ width: 48 }} />
      </Box>
      {DAYS.map((day, index) => {
        const attendance = schedule?.[day] ?? 0;
        const hasLunch = (attendance & MEAL.LUNCH) !== 0;
        const hasDinner = (attendance & MEAL.DINNER) !== 0;
        const isToday = index === todayIndex;
        const isPast = todayIndex >= 0 && index < todayIndex;
        const dayComments = comments?.[day];
        const hasComment = dayComments?.lunch || dayComments?.dinner;

        return (
          <Box
            key={day}
            sx={{
              display: 'flex',
              alignItems: 'center',
              borderBottom: '1px solid',
              borderColor: 'divider',
              borderLeft: isToday ? 4 : 0,
              borderLeftColor: 'primary.main',
            }}
          >
            <Box sx={{ width: 100, py: 1, pl: 2 }}>
              <Typography variant="body2" color={isPast ? 'text.disabled' : 'text.primary'}>
                {DAY_LABELS[index]}
              </Typography>
              <Typography variant="caption" color={isPast ? 'text.disabled' : 'text.secondary'}>
                {dates[index]}
              </Typography>
            </Box>
            <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
              <Switch
                checked={hasLunch}
                onChange={() => onToggle(day, MEAL.LUNCH)}
                size="small"
                disabled={isPast}
                sx={{
                  '& .MuiSwitch-switchBase:not(.Mui-checked)': {
                    color: 'error.main',
                    '& + .MuiSwitch-track': { backgroundColor: 'error.main' },
                  },
                }}
              />
            </Box>
            <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
              <Switch
                checked={hasDinner}
                onChange={() => onToggle(day, MEAL.DINNER)}
                size="small"
                disabled={isPast}
                sx={{
                  '& .MuiSwitch-switchBase:not(.Mui-checked)': {
                    color: 'error.main',
                    '& + .MuiSwitch-track': { backgroundColor: 'error.main' },
                  },
                }}
              />
            </Box>
            <Box sx={{ width: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {hasComment && (
                <ChatBubbleOutlineIcon sx={{ fontSize: 16, color: 'primary.main', mr: -0.5 }} />
              )}
              <IconButton size="small" onClick={() => onDayClick(day, index)}>
                <ChevronRightIcon />
              </IconButton>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
};

export default PersonalScheduleView;
