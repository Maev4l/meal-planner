/* eslint-disable react-refresh/only-export-components */
// PWA update context — registers the service worker once and exposes update state
// plus a manual check, consumed by the update banner and the About page.
import { createContext, useContext, useCallback, useRef } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

const PWAContext = createContext(null);

export const PWAProvider = ({ children }) => {
  const registrationRef = useRef(null);

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      registrationRef.current = registration;
      if (!registration) return;

      // Hourly background safety net: catch a deploy while the app sits open and idle.
      // Hourly (not 60s) — visibilitychange below covers the common return-to-app case,
      // so a tighter interval would only re-fetch sw.js more often and risk re-showing a
      // phantom "update available" without delivering new versions any faster.
      setInterval(() => registration.update(), 60 * 60 * 1000);

      // Primary trigger: re-check the instant the user returns to the app.
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') registration.update();
      });
    },
  });

  // Manual update check — asks the SW to re-check. Returns false if no SW is registered
  // (e.g. local dev). If a new version is found, `needRefresh` flips to true.
  const checkForUpdate = useCallback(async () => {
    if (!registrationRef.current) return false;
    await registrationRef.current.update();
    return true;
  }, []);

  // Apply the pending update (skip waiting + reload).
  const applyUpdate = useCallback(() => updateServiceWorker(true), [updateServiceWorker]);

  return (
    <PWAContext.Provider value={{ needRefresh, checkForUpdate, applyUpdate }}>
      {children}
    </PWAContext.Provider>
  );
};

export const usePWA = () => {
  const context = useContext(PWAContext);
  if (!context) {
    throw new Error('usePWA must be used within a PWAProvider');
  }
  return context;
};
