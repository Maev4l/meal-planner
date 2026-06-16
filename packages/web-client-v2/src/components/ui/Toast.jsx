/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback } from 'react';
import Icon from '../Icon';

const ToastContext = createContext(null);
export const useToast = () => useContext(ToastContext);

// Variant → border/text color + leading icon. Unknown/omitted type = neutral (no icon).
const VARIANTS = {
  success: { className: 'border-sage/40 text-sage', icon: 'check' },
  error: { className: 'border-red/50 text-red', icon: 'info' },
};
const NEUTRAL = { className: 'border-line text-chalk', icon: null };

export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState(null); // { text, type } | null
  const show = useCallback((message, type) => {
    setToast({ text: message, type });
    setTimeout(() => setToast(null), 2400);
  }, []);
  const variant = (toast && VARIANTS[toast.type]) || NEUTRAL;
  return (
    <ToastContext.Provider value={show}>
      {children}
      {toast && (
        <div
          className={`fixed left-1/2 -translate-x-1/2 bottom-[96px] z-50 px-4 py-2.5 rounded-full bg-slate-2 border text-[13px] shadow-[0_18px_44px_-12px_rgba(0,0,0,0.7)] flex items-center gap-2 ${variant.className}`}
        >
          {variant.icon && <Icon name={variant.icon} className="w-4 h-4" />}
          {toast.text}
        </div>
      )}
    </ToastContext.Provider>
  );
};
