import { Snackbar, Alert } from '@mui/material';
import { createContext, useContext, useState, useMemo } from 'react';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [notificationText, setNotificationText] = useState(null);
  const [notificationSeverity, setNotificationSeverity] = useState(null);

  const success = (text) => {
    setNotificationText(text);
    setNotificationSeverity('success');
  };
  const error = (text) => {
    setNotificationText(text);
    setNotificationSeverity('error');
  };

  const info = (text) => {
    setNotificationText(text);
    setNotificationSeverity('info');
  };

  const clear = () => {
    setNotificationText(null);
    setNotificationSeverity(null);
  };

  const n = useMemo(
    () => ({
      text: notificationText,
      severity: notificationSeverity,
      success,
      error,
      info,
      clear,
    }),
    [notificationText, notificationSeverity],
  );

  return <NotificationContext.Provider value={n}>{children}</NotificationContext.Provider>;
};

export const useNotification = () => useContext(NotificationContext);

export const NotificationBar = () => {
  const notification = useNotification();

  const handleClose = () => {
    notification.clear();
  };

  return (
    notification.text && (
      <Snackbar
        open
        autoHideDuration={5000}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleClose}
          severity={notification.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {notification.text}
        </Alert>
      </Snackbar>
    )
  );
};
