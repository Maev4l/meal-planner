// Edited by Claude.
// Warm Bistro themed comments drawer with elegant comment cards
import { Box, Typography, Drawer, IconButton, Avatar, alpha } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import LunchDiningIcon from '@mui/icons-material/LunchDining';
import DinnerDiningIcon from '@mui/icons-material/DinnerDining';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';

dayjs.extend(isoWeek);

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

const CommentCard = ({ memberName, lunch, dinner, isLast }) => {
  const color = stringToColor(memberName);

  return (
    <Box
      sx={{
        display: 'flex',
        gap: 2,
        pb: isLast ? 0 : 2.5,
        mb: isLast ? 0 : 2.5,
        borderBottom: isLast
          ? 'none'
          : (theme) => `1px solid ${alpha(theme.palette.charcoal.main, 0.08)}`,
      }}
    >
      <Avatar
        sx={{
          bgcolor: color,
          width: 40,
          height: 40,
          fontSize: '0.9rem',
          fontWeight: 600,
          flexShrink: 0,
        }}
      >
        {memberName.charAt(0).toUpperCase()}
      </Avatar>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 600,
            color: 'text.primary',
            mb: 1,
          }}
        >
          {memberName}
        </Typography>

        {lunch && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 1,
              mb: dinner ? 1 : 0,
            }}
          >
            <LunchDiningIcon
              sx={{
                fontSize: 16,
                color: 'secondary.main',
                mt: 0.25,
                flexShrink: 0,
              }}
            />
            <Typography variant="body2" color="text.secondary">
              {lunch}
            </Typography>
          </Box>
        )}

        {dinner && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 1,
            }}
          >
            <DinnerDiningIcon
              sx={{
                fontSize: 16,
                color: 'primary.main',
                mt: 0.25,
                flexShrink: 0,
              }}
            />
            <Typography variant="body2" color="text.secondary">
              {dinner}
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

const CommentsDrawer = ({
  open,
  onClose,
  dayLabel,
  year,
  week,
  dayIndex,
  comments,
}) => {
  // Compute full date with long month name
  const getFullDate = () => {
    if (dayIndex === null || dayIndex === undefined) return '';
    const jan4 = dayjs(`${year}-01-04`);
    const firstMonday = jan4.startOf('isoWeek');
    const targetDay = firstMonday.add(week - 1, 'week').add(dayIndex, 'day');
    return targetDay.format('D MMMM YYYY');
  };

  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          maxHeight: '75vh',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          overflow: 'hidden',
        },
      }}
    >
      {/* Drawer handle */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          pt: 1.5,
          pb: 1,
        }}
      >
        <Box
          sx={{
            width: 36,
            height: 4,
            borderRadius: 2,
            backgroundColor: (theme) =>
              alpha(theme.palette.charcoal.main, 0.15),
          }}
        />
      </Box>

      <Box sx={{ px: 3, pb: 3 }}>
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            mb: 3,
          }}
        >
          <Box>
            <Typography
              variant="h5"
              sx={{
                fontFamily: '"Playfair Display", Georgia, serif',
                fontWeight: 600,
                color: 'text.primary',
                mb: 0.25,
              }}
            >
              {dayLabel}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {getFullDate()}
            </Typography>
          </Box>
          <IconButton
            onClick={onClose}
            size="small"
            sx={{
              mt: -0.5,
              color: 'text.secondary',
              backgroundColor: (theme) =>
                alpha(theme.palette.charcoal.main, 0.06),
              '&:hover': {
                backgroundColor: (theme) =>
                  alpha(theme.palette.charcoal.main, 0.12),
              },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* Comments list */}
        {comments.length === 0 ? (
          <Box
            sx={{
              textAlign: 'center',
              py: 4,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              No comments for this day
            </Typography>
          </Box>
        ) : (
          <Box>
            {comments.map((item, idx) => (
              <CommentCard
                key={idx}
                memberName={item.memberName}
                lunch={item.lunch}
                dinner={item.dinner}
                isLast={idx === comments.length - 1}
              />
            ))}
          </Box>
        )}
      </Box>
    </Drawer>
  );
};

export default CommentsDrawer;
