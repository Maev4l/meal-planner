import { Stack, Box, Typography, Link } from '@mui/material';
import { useOutletContext } from 'react-router-dom';
import { useState, Fragment } from 'react';

import MealsSelector from './MealsSelector';
import CalendarWeekPicker from './CalendarWeekPicker';
import { VIEW_MODE } from './viewmode';
import CommentPopup from './CommentPopup';
import { MEAL } from '../domain';

const PersonalSchedule = ({
  group,
  weekStartDay,
  onSaveWeeklySchedule,
  onSetMeal,
  onUnsetMeal,
  onPreviousCalendarWeek,
  onNextCalendarWeek,
  onChangeViewMode,
  onSetComment,
}) => {
  const [mealComment, setMealComment] = useState(null);
  const { userId } = useOutletContext();
  const { members, groupId } = group;
  const { schedule, memberName } = members[userId];

  const onClickCommentPopup = (dayOfWeek, day, meal) => {
    const dailySchedule = schedule[day];
    const mealKey = meal === MEAL.LUNCH ? 'lunch' : 'dinner';

    const comment = dailySchedule.comments[mealKey];
    setMealComment({ author: memberName, userId, day, mealKey, content: comment, dayOfWeek });
  };

  const onDismissCommentPopup = () => setMealComment(null);

  const onSubmitComment = (comment) => {
    setMealComment(null);
    onSetComment(comment);
  };

  return (
    <Fragment>
      {mealComment && (
        <CommentPopup
          comment={mealComment}
          onCancel={onDismissCommentPopup}
          onSubmit={onSubmitComment}
        />
      )}

      <Stack spacing={2} sx={{ display: 'flex', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography sx={{ p: 1 }}>
            You can update your default schedule for this group{' '}
            <Link
              style={{ cursor: 'pointer' }}
              onClick={() => {
                onChangeViewMode(VIEW_MODE.DEFAULT_SCHEDULE);
              }}
            >
              here.
            </Link>
          </Typography>
        </Box>
        <CalendarWeekPicker
          weekStartDay={weekStartDay}
          onPrevious={onPreviousCalendarWeek}
          onNext={onNextCalendarWeek}
        />
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography>
            You can view the members schedules{' '}
            <Link
              style={{ cursor: 'pointer' }}
              onClick={() => {
                onChangeViewMode(VIEW_MODE.MEMBERS_SCHEDULES);
              }}
            >
              here.
            </Link>
          </Typography>
        </Box>
        <MealsSelector
          weekStartDay={weekStartDay}
          schedule={schedule}
          onSave={onSaveWeeklySchedule}
          onSet={(day, meal) => onSetMeal(groupId, day, meal)}
          onUnset={(day, meal) => onUnsetMeal(groupId, day, meal)}
          onClickComment={onClickCommentPopup}
        />
      </Stack>
    </Fragment>
  );
};

export default PersonalSchedule;
