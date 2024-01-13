import { useEffect, useState } from 'react';
import moment from 'moment';
import { Stack } from '@mui/material';
import { api } from '../api';
import { Progress } from '../components';
import Group from './Group';
import Week from './Week';

const Planning = () => {
  const [schedules, setSchedules] = useState(null);
  const [loading, setLoading] = useState(false);

  const year = moment().year();
  const weekNumber = moment(moment().toDate(), 'MM-DD-YYYY').isoWeek();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { schedules: response } = await api.get(`/api/schedules/${year}-${weekNumber}`);
        setSchedules(response);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const groupsCount = schedules ? schedules.length : 0;

  return (
    <div>
      <Progress open={loading} />
      <Stack spacing={4}>
        <Week year={year} weekNumber={weekNumber} />
        {groupsCount > 0 ? (
          <Group group={schedules[0]} year={year} weekNumber={weekNumber} />
        ) : null}
      </Stack>
    </div>
  );
};

export default Planning;
