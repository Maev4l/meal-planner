// Edited by Claude.
// Warm Bistro themed personal schedule with proper column alignment using flex
import { Box, Typography, IconButton, alpha } from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import LunchDiningIcon from '@mui/icons-material/LunchDining';
import DinnerDiningIcon from '@mui/icons-material/DinnerDining';
import { DAYS, DAY_LABELS, MEAL, getTodayIndex } from '../constants/schedule';

// Custom meal toggle component with high contrast between present/absent states
const MealToggle = ({ checked, onChange, disabled, type }) => {
  const isLunch = type === 'lunch';
  const Icon = isLunch ? LunchDiningIcon : DinnerDiningIcon;

  return (
    <Box
      onClick={disabled ? undefined : onChange}
      sx={{
        width: 48,
        height: 48,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: disabled ? 'default' : 'pointer',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        opacity: disabled ? 0.5 : 1,
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
        '&:hover': disabled
          ? {}
          : {
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
        '&:active': disabled
          ? {}
          : {
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

const PersonalScheduleView = ({
  schedule,
  dates,
  onToggle,
  year,
  week,
  comments,
  onDayClick,
}) => {
  const todayIndex = getTodayIndex(year, week);

  return (
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
        <Box sx={{ width: 80, flexShrink: 0, pl: 2 }}>
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 600, opacity: 0.9 }}
          >
            DAY
          </Typography>
        </Box>
        <Box sx={{ flex: 1, textAlign: 'center' }}>
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 600, opacity: 0.9 }}
          >
            LUNCH
          </Typography>
        </Box>
        <Box sx={{ flex: 1, textAlign: 'center' }}>
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 600, opacity: 0.9 }}
          >
            DINNER
          </Typography>
        </Box>
        <Box sx={{ width: 44, flexShrink: 0 }} />
      </Box>

      {/* Day rows */}
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
              py: 1.25,
              borderBottom: (theme) =>
                `1px solid ${alpha(theme.palette.charcoal.main, 0.08)}`,
              position: 'relative',
              backgroundColor: isToday
                ? (theme) => alpha(theme.palette.burgundy.main, 0.04)
                : 'transparent',
              '&::before': isToday
                ? {
                    content: '""',
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: 4,
                    backgroundColor: 'primary.main',
                    borderRadius: '0 2px 2px 0',
                  }
                : {},
              animation: 'fadeInUp 0.4s ease-out forwards',
              animationDelay: `${index * 0.05}s`,
              opacity: 0,
            }}
          >
            {/* Day info - fixed width */}
            <Box sx={{ width: 80, flexShrink: 0, pl: 2 }}>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: isToday ? 600 : 500,
                  color: isPast ? 'text.disabled' : 'text.primary',
                  fontSize: '0.875rem',
                }}
              >
                {DAY_LABELS[index]}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: isPast ? 'text.disabled' : 'text.secondary',
                  display: 'block',
                  fontSize: '0.7rem',
                }}
              >
                {dates[index]}
              </Typography>
            </Box>

            {/* Lunch toggle - flex grows to fill space */}
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
                disabled={isPast}
                type="lunch"
              />
            </Box>

            {/* Dinner toggle - flex grows to fill space */}
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
                disabled={isPast}
                type="dinner"
              />
            </Box>

            {/* Comment indicator and navigation - fixed width */}
            <Box
              sx={{
                width: 44,
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {!isPast && (
                <>
                  {hasComment && (
                    <ChatBubbleOutlineIcon
                      sx={{
                        fontSize: 14,
                        color: 'primary.main',
                        mr: -0.5,
                      }}
                    />
                  )}
                  <IconButton
                    size="small"
                    onClick={() => onDayClick(day, index)}
                    sx={{
                      color: 'text.secondary',
                      p: 0.5,
                      '&:hover': {
                        color: 'primary.main',
                      },
                    }}
                  >
                    <ChevronRightIcon fontSize="small" />
                  </IconButton>
                </>
              )}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
};

export default PersonalScheduleView;
