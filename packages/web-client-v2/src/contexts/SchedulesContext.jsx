/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback, useMemo, useRef } from 'react';
import { api, errorMessage } from '../services/api';
import { getCurrentPeriod } from '../constants/schedule';

const SchedulesContext = createContext(null);

export const useSchedules = () => {
  const context = useContext(SchedulesContext);
  if (!context) {
    throw new Error('useSchedules must be used within a SchedulesProvider');
  }
  return context;
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
        setError(errorMessage(err, { fallback: "Couldn't load your groups." }));
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

  const value = useMemo(() => ({
    schedules,
    period,
    loading,
    error,
    fetchSchedules,
    getGroup,
  }), [schedules, period, loading, error, fetchSchedules, getGroup]);

  return (
    <SchedulesContext.Provider value={value}>
      {children}
    </SchedulesContext.Provider>
  );
};
