import { Box, Typography, Drawer, Divider, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';

dayjs.extend(isoWeek);

const CommentsDrawer = ({ open, onClose, dayLabel, year, week, dayIndex, comments }) => {
  // Compute full date with long month name
  const getFullDate = () => {
    if (dayIndex === null || dayIndex === undefined) return '';
    const jan4 = dayjs(`${year}-01-04`);
    const firstMonday = jan4.startOf('isoWeek');
    const targetDay = firstMonday.add(week - 1, 'week').add(dayIndex, 'day');
    return targetDay.format('D MMMM');
  };
  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { maxHeight: '70vh', borderTopLeftRadius: 16, borderTopRightRadius: 16 },
      }}
    >
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            {dayLabel}, {getFullDate()}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
        <Divider sx={{ mb: 2 }} />
        {comments.map((item, idx) => (
          <Box key={idx} sx={{ mb: 2 }}>
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 0.5 }}>
              {item.memberName.toUpperCase()}
            </Typography>
            {item.lunch && (
              <Typography variant="body2" color="text.secondary">
                <strong>Lunch:</strong> {item.lunch}
              </Typography>
            )}
            {item.dinner && (
              <Typography variant="body2" color="text.secondary">
                <strong>Dinner:</strong> {item.dinner}
              </Typography>
            )}
            {idx < comments.length - 1 && <Divider sx={{ mt: 2 }} />}
          </Box>
        ))}
      </Box>
    </Drawer>
  );
};

export default CommentsDrawer;
