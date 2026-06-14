import { useEffect } from 'react';

const BottomSheet = ({ open, onClose, children }) => {
  // Close on Escape; lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/55 animate-[fadeIn_0.16s_ease-out]" onClick={onClose} />
      <div
        className="relative bg-slate-2 rounded-t-[22px] border-t border-line px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 max-h-[80vh] overflow-y-auto animate-[rise_0.16s_ease-out]"
        role="dialog"
        aria-modal="true"
      >
        <div className="mx-auto mb-3 w-10 border-b-2 border-dashed border-chalk-faint" />
        {children}
      </div>
    </div>
  );
};

export default BottomSheet;
