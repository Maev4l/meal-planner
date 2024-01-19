/* eslint-disable no-bitwise */
import {
  Stack,
  Box,
  Typography,
  Link,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Button,
} from '@mui/material';
import { ExpandMore, EditNote } from '@mui/icons-material';
import { Fragment, useState } from 'react';
import moment from 'moment';

import CommentPopup from './CommentPopup';
import { VIEW_MODE } from './viewmode';
import { MEAL } from '../domain';

const AttendanceReportButton = ({ attendance, comments, onClick }) => (
  <Box sx={{ pl: '1', pr: '1' }}>
    <Button
      variant="contained"
      color={attendance ? 'success' : 'error'}
      onClick={onClick}
      endIcon={comments ? <EditNote /> : null}
      size="small"
      fullWidth
    >
      {attendance ? 'Present' : 'Absent'}
    </Button>
  </Box>
);

const AccordionSchedule = ({ day, group, members, onShowComment }) => {
  const { key: keyDay, date } = day;
  const totals = {
    lunch: 0,
    dinner: 0,
  };

  return (
    <Accordion defaultExpanded>
      <AccordionSummary expandIcon={<ExpandMore />} sx={{ textTransform: 'capitalize' }}>
        <Typography sx={{ fontWeight: 'bold' }}>{date.format('dddd MMM DD')}</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Grid container spacing={1} justifyContent="center" alignItems="center">
          <Grid item xs={4}>
            &nbsp;
          </Grid>
          <Grid item xs={4} sx={{ textAlign: 'center' }}>
            <Typography>Lunch</Typography>
          </Grid>
          <Grid item xs={4} sx={{ textAlign: 'center' }}>
            <Typography>Dinner</Typography>
          </Grid>
          {members.map((member) => {
            const { memberId, memberName } = member;

            const schedule = group.members[memberId].schedule[keyDay];
            const { meals, comments } = schedule;
            if (meals & MEAL.LUNCH) {
              totals.lunch += 1;
            }
            if (meals & MEAL.DINNER) {
              totals.dinner += 1;
            }
            return (
              <Fragment key={memberId}>
                <Grid item xs={4} align="right">
                  {memberName}
                </Grid>
                <Grid item xs={4} align="center">
                  <AttendanceReportButton
                    attendance={meals & MEAL.LUNCH}
                    comments={comments.lunch}
                    onClick={
                      comments.lunch
                        ? () =>
                            onShowComment({
                              author: memberName,
                              content: comments.lunch,
                              dayOfWeek: date,
                              mealKey: 'lunch',
                            })
                        : null
                    }
                  />
                </Grid>
                <Grid item xs={4} align="center">
                  <AttendanceReportButton
                    attendance={meals & MEAL.DINNER}
                    comments={comments.dinner}
                    onClick={
                      comments.dinner
                        ? () =>
                            onShowComment({
                              author: memberName,
                              content: comments.lunch,
                              dayOfWeek: date,
                              mealKey: 'dinner',
                            })
                        : null
                    }
                  />
                </Grid>
              </Fragment>
            );
          })}
          <Grid item xs={4} align="right">
            <Typography sx={{ fontWeight: 'bold' }}>Total</Typography>
          </Grid>
          <Grid item xs={4} align="center">
            {totals.lunch}
          </Grid>
          <Grid item xs={4} align="center">
            {totals.dinner}
          </Grid>
        </Grid>
      </AccordionDetails>
    </Accordion>
  );
};

const MembersSchedules = ({ group, weekStartDay, onChangeViewMode }) => {
  const [comment, setComment] = useState(null);
  const { members } = group;
  const sortedMembers = Object.entries(members)
    .map(([, m]) => m)
    .sort((a, b) => a.memberName.toLowerCase().localeCompare(b.memberName.toLowerCase()));

  const monday = moment(weekStartDay);
  const tuesday = moment(monday).add(1, 'days');
  const wednesday = moment(monday).add(2, 'days');
  const thursday = moment(monday).add(3, 'days');
  const friday = moment(monday).add(4, 'days');
  const saturday = moment(monday).add(5, 'days');
  const sunday = moment(monday).add(6, 'days');

  const daysOfWeek = [
    { key: 'monday', date: monday },
    { key: 'tuesday', date: tuesday },
    { key: 'wednesday', date: wednesday },
    { key: 'thursday', date: thursday },
    { key: 'friday', date: friday },
    { key: 'saturday', date: saturday },
    { key: 'sunday', date: sunday },
  ];

  const onShowCommentPopup = (c) => {
    setComment(c);
  };

  const onDismissCommentPopup = () => {
    setComment(null);
  };

  return (
    <Fragment>
      {comment && <CommentPopup comment={comment} onCancel={onDismissCommentPopup} />}
      <Stack spacing={2} sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography>
            Back to{' '}
            <Link
              style={{ cursor: 'pointer' }}
              onClick={() => {
                onChangeViewMode(VIEW_MODE.PERSONAL_SCHEDULE);
              }}
            >
              your schedule.
            </Link>
          </Typography>
        </Box>
        <Box>
          <Typography variant="h6">Member schedules</Typography>
        </Box>
        <Box sx={{ width: '100%', p: 2 }}>
          {daysOfWeek.map((day) => (
            <AccordionSchedule
              key={day.key}
              day={day}
              group={group}
              members={sortedMembers}
              onShowComment={onShowCommentPopup}
            />
          ))}
        </Box>
      </Stack>
    </Fragment>
  );
  /*
  return (
    <Stack spacing={2} sx={{ display: 'flex', alignItems: 'center' }}>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Typography>
          Back to{' '}
          <Link
            style={{ cursor: 'pointer' }}
            onClick={() => {
              onChangeViewMode(VIEW_MODE.PERSONAL_SCHEDULE);
            }}
          >
            your schedule.
          </Link>
        </Typography>
      </Box>
      <Box>
        <Typography variant="h6">Member schedules</Typography>
      </Box>
      <Stack direction="row">
        <Stack>
          <Box sx={{ p: 0.5 }}>&nbsp;</Box>
          <Box sx={{ p: 0.5 }}>&nbsp;</Box>
          {sortedMembers.map((m) => (
            <Box sx={{ pr: 0.5 }} key={m.memberId}>
              <Typography sx={{ p: '1px', float: 'right' }} display="inline">
                {m.memberName}
              </Typography>
            </Box>
          ))}
          <Box sx={{ p: 0.5 }}>
            <Typography sx={{ p: '1px', float: 'right' }} display="inline">
              Total
            </Typography>
          </Box>
        </Stack>
        {daysOfWeek.map((day) => renderColumn(day, sortedMembers))}
      </Stack>
    </Stack>
  );
  */
};

export default MembersSchedules;
