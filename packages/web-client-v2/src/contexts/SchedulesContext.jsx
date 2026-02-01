/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback, useMemo, useRef } from 'react';
import { api } from '../services/api';

const SchedulesContext = createContext(null);

export const useSchedules = () => {
  const context = useContext(SchedulesContext);
  if (!context) {
    throw new Error('useSchedules must be used within a SchedulesProvider');
  }
  return context;
};

const getCurrentPeriod = () => {
  const now = new Date();
  const year = now.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const days = Math.floor((now - startOfYear) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  return `${year}-${weekNumber}`;
};

export const SchedulesProvider = ({ children }) => {
  const [schedules, setSchedules] = useState([]);
  const [period, setPeriod] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Use refs to track cache state and prevent concurrent fetches
  const cacheRef = useRef({ schedules: [], period: null });
  const fetchPromiseRef = useRef(null);

  const fetchSchedules = useCallback(async (force = false) => {
    const currentPeriod = getCurrentPeriod();

    // Return cached data if available and not forcing refresh
    if (!force && cacheRef.current.schedules.length > 0 && cacheRef.current.period === currentPeriod) {
      return cacheRef.current.schedules;
    }

    // If a fetch is already in progress, return that promise
    if (fetchPromiseRef.current) {
      return fetchPromiseRef.current;
    }

    setLoading(true);
    setError(null);

    fetchPromiseRef.current = api.getSchedules(currentPeriod)
      .then((data) => {
        const fetchedSchedules = data.schedules || [];
        cacheRef.current = { schedules: fetchedSchedules, period: currentPeriod };
        setSchedules(fetchedSchedules);
        setPeriod(currentPeriod);
        return fetchedSchedules;
      })
      .catch((err) => {
        setError(err.message);
        throw err;
      })
      .finally(() => {
        setLoading(false);
        fetchPromiseRef.current = null;
      });

    return fetchPromiseRef.current;
  }, []);

  const getGroup = useCallback((groupId) => {
    return schedules.find((g) => g.groupId === groupId) || null;
  }, [schedules]);

  const updateMemberSchedule = useCallback((groupId, memberId, newDefault) => {
    setSchedules((prev) => {
      const updated = prev.map((group) => {
        if (group.groupId !== groupId) return group;
        return {
          ...group,
          members: {
            ...group.members,
            [memberId]: {
              ...group.members[memberId],
              default: newDefault,
            },
          },
        };
      });
      cacheRef.current = { ...cacheRef.current, schedules: updated };
      return updated;
    });
  }, []);

  const updateMemberPersonalSchedule = useCallback((groupId, memberId, newSchedule) => {
    setSchedules((prev) => {
      const updated = prev.map((group) => {
        if (group.groupId !== groupId) return group;
        return {
          ...group,
          members: {
            ...group.members,
            [memberId]: {
              ...group.members[memberId],
              schedule: newSchedule,
            },
          },
        };
      });
      cacheRef.current = { ...cacheRef.current, schedules: updated };
      return updated;
    });
  }, []);

  const value = useMemo(() => ({
    schedules,
    period,
    loading,
    error,
    fetchSchedules,
    getGroup,
    updateMemberSchedule,
    updateMemberPersonalSchedule,
  }), [schedules, period, loading, error, fetchSchedules, getGroup, updateMemberSchedule, updateMemberPersonalSchedule]);

  return (
    <SchedulesContext.Provider value={value}>
      {children}
    </SchedulesContext.Provider>
  );
};
