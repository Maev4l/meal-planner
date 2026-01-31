import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActionArea,
  CircularProgress,
  Alert,
  AppBar,
  Toolbar,
} from '@mui/material';
import GroupIcon from '@mui/icons-material/Group';
import { api } from '../services/api';

const getCurrentPeriod = () => {
  const now = new Date();
  const year = now.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const days = Math.floor((now - startOfYear) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  return `${year}-${weekNumber}`;
};

const GroupCard = ({ group }) => {
  const { groupName, members } = group;
  const memberCount = Object.keys(members).length;

  return (
    <Card sx={{ mb: 2 }}>
      <CardActionArea>
        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <GroupIcon color="primary" />
          <Box>
            <Typography variant="h6" component="div">
              {groupName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {memberCount} {memberCount === 1 ? 'member' : 'members'}
            </Typography>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

const GroupsPage = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const period = getCurrentPeriod();
        const data = await api.getSchedules(period);
        setGroups(data.schedules || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, []);

  return (
    <>
      <AppBar
        position="static"
        sx={{
          width: '100vw',
          ml: 'calc(-50vw + 50%)',
        }}
      >
        <Toolbar>
          <Typography variant="h6" component="h1" sx={{ flexGrow: 1, textAlign: 'center' }}>
            Groups
          </Typography>
        </Toolbar>
      </AppBar>
      <Box sx={{ py: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : groups.length === 0 ? (
          <Typography variant="body1" color="text.secondary">
            No groups found.
          </Typography>
        ) : (
          groups.map((group) => (
            <GroupCard key={group.groupId} group={group} />
          ))
        )}
      </Box>
    </>
  );
};

export default GroupsPage;
