/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);
export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState(null);
  const show = useCallback((message) => {
    setToast(message);
    setTimeout(() => setToast(null), 2400);
  }, []);
  return (
    <ToastContext.Provider value={show}>
      {children}
      {toast && (
        <div className="fixed left-1/2 -translate-x-1/2 bottom-[96px] z-50 px-4 py-2.5 rounded-full bg-slate-2 border border-line text-chalk text-[13px] shadow-[0_18px_44px_-12px_rgba(0,0,0,0.7)]">
          {toast}
        </div>
      )}
    </ToastContext.Provider>
  );
};
