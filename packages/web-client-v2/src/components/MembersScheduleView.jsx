// Edited by Claude.
// Warm Bistro themed members schedule with elegant attendance cards
import { Box, Typography, Paper, IconButton, Avatar, Chip, alpha } from '@mui/material';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import LunchDiningIcon from '@mui/icons-material/LunchDining';
import DinnerDiningIcon from '@mui/icons-material/DinnerDining';
import { DAYS, DAY_LABELS, MEAL, getTodayIndex } from '../constants/schedule';

// Generate consistent color from string for avatar backgrounds
const stringToColor = (str) => {
  const colors = [
    '#722F37', // burgundy
    '#D4A373', // amber
    '#87A878', // sage
    '#C9705E', // terracotta
    '#8B4049', // burgundy light
    '#B8895C', // amber dark
    '#6B8C5E', // sage dark
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

// Attendee chip component
const AttendeeChip = ({ name }) => {
  const initial = name.charAt(0).toUpperCase();
  const color = stringToColor(name);

  return (
    <Chip
      size="small"
      avatar={
        <Avatar
          sx={{
            bgcolor: color,
            width: 22,
            height: 22,
            fontSize: '0.65rem',
            fontWeight: 600,
          }}
        >
          {initial}
        </Avatar>
      }
      label={name}
      sx={{
        height: 28,
        backgroundColor: (theme) => alpha(color, 0.1),
        borderColor: (theme) => alpha(color, 0.2),
        border: '1px solid',
        '& .MuiChip-label': {
          fontSize: '0.75rem',
          fontWeight: 500,
          pl: 1,
          pr: 1.5,
        },
      }}
    />
  );
};

// Meal section component
const MealSection = ({ type, attendees }) => {
  const isLunch = type === 'lunch';
  const Icon = isLunch ? LunchDiningIcon : DinnerDiningIcon;
  const label = isLunch ? 'Lunch' : 'Dinner';
  const hasAttendees = attendees.length > 0;

  return (
    <Box sx={{ mb: 1.5, '&:last-child': { mb: 0 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Icon
          sx={{
            fontSize: 18,
            color: hasAttendees ? 'primary.main' : 'text.disabled',
          }}
        />
        <Typography
          variant="body2"
          sx={{
            fontWeight: 500,
            color: hasAttendees ? 'text.primary' : 'text.disabled',
          }}
        >
          {label}
        </Typography>
        {/* Emphasized attendee count for meal planning */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: 32,
            height: 28,
            px: 1,
            borderRadius: 2,
            backgroundColor: (theme) =>
              hasAttendees
                ? theme.palette.primary.main
                : alpha(theme.palette.charcoal.main, 0.1),
            color: hasAttendees ? 'white' : 'text.disabled',
          }}
        >
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: '0.9rem',
              lineHeight: 1,
            }}
          >
            {attendees.length}
          </Typography>
        </Box>
      </Box>

      {hasAttendees ? (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
          {attendees.map((name) => (
            <AttendeeChip key={name} name={name} />
          ))}
        </Box>
      ) : (
        <Typography
          variant="body2"
          sx={{
            color: 'text.disabled',
            fontStyle: 'italic',
            fontSize: '0.8rem',
          }}
        >
          No attendees
        </Typography>
      )}
    </Box>
  );
};

const MembersScheduleView = ({
  members,
  dates,
  year,
  week,
  todayRef,
  onCommentsClick,
}) => {
  const getMealAttendees = (dayKey, mealType) => {
    return Object.entries(members)
      .filter(([, member]) => ((member.schedule?.[dayKey] ?? 0) & mealType) !== 0)
      .map(([, member]) => member.memberName)
      .sort((a, b) => a.localeCompare(b));
  };

  const hasCommentsForDay = (dayKey) => {
    return Object.values(members).some((member) => {
      const dayComments = member.comments?.[dayKey];
      return dayComments?.lunch || dayComments?.dinner;
    });
  };

  const todayIndex = getTodayIndex(year, week);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {DAYS.map((day, index) => {
        const lunchAttendees = getMealAttendees(day, MEAL.LUNCH);
        const dinnerAttendees = getMealAttendees(day, MEAL.DINNER);
        const isToday = index === todayIndex;
        const isPast = todayIndex >= 0 && index < todayIndex;
        const hasComments = hasCommentsForDay(day);

        return (
          <Paper
            key={day}
            ref={isToday ? todayRef : null}
            elevation={isToday ? 3 : 2}
            sx={{
              p: 2.5,
              position: 'relative',
              overflow: 'hidden',
              opacity: isPast ? 0.6 : 1,
              // Today highlight
              backgroundColor: isToday
                ? (theme) => alpha(theme.palette.burgundy.main, 0.02)
                : 'background.paper',
              // Today indicator bar
              '&::before': isToday
                ? {
                    content: '""',
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: 4,
                    background: (theme) =>
                      `linear-gradient(180deg, ${theme.palette.burgundy.main} 0%, ${theme.palette.burgundy.light} 100%)`,
                  }
                : {},
              // Staggered animation
              animation: 'fadeInUp 0.4s ease-out forwards',
              animationDelay: `${index * 0.06}s`,
            }}
          >
            {/* Day header */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 2,
              }}
            >
              <Box>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontFamily: '"Playfair Display", Georgia, serif',
                    fontWeight: 600,
                    color: isToday ? 'primary.main' : 'text.primary',
                  }}
                >
                  {DAY_LABELS[index]}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {dates[index]}
                </Typography>
              </Box>

              {/* Today badge */}
              {isToday && (
                <Chip
                  label="Today"
                  size="small"
                  sx={{
                    backgroundColor: 'primary.main',
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '0.7rem',
                    height: 24,
                  }}
                />
              )}

              {/* Comments button */}
              {hasComments && (
                <IconButton
                  size="small"
                  onClick={() => onCommentsClick(index)}
                  sx={{
                    ml: 1,
                    color: 'primary.main',
                    backgroundColor: (theme) =>
                      alpha(theme.palette.primary.main, 0.08),
                    '&:hover': {
                      backgroundColor: (theme) =>
                        alpha(theme.palette.primary.main, 0.15),
                    },
                  }}
                >
                  <ChatBubbleOutlineIcon sx={{ fontSize: 18 }} />
                </IconButton>
              )}
            </Box>

            {/* Meal sections */}
            <MealSection type="lunch" attendees={lunchAttendees} />
            <Box
              sx={{
                height: '1px',
                backgroundColor: (theme) =>
                  alpha(theme.palette.charcoal.main, 0.06),
                my: 1.5,
              }}
            />
            <MealSection type="dinner" attendees={dinnerAttendees} />
          </Paper>
        );
      })}
    </Box>
  );
};

export default MembersScheduleView;
