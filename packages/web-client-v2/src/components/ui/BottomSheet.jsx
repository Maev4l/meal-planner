import { useEffect, useRef } from 'react';

const FOCUSABLE =
  'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

// `label` becomes the dialog's accessible name — it declared role="dialog" with no
// name at all before, so a screen reader announced an anonymous dialog.
//
// `initialFocus` is an optional ref to focus on open. It defaults to the panel
// itself, deliberately: focusing the first focusable put focus on the *destructive*
// button in every confirm sheet, one Enter away from removing a member. Sheets whose
// job is text entry pass their input instead, so typing still starts immediately.
const BottomSheet = ({ open, onClose, label, initialFocus, children }) => {
  const panelRef = useRef(null);
  const restoreTo = useRef(null);

  useEffect(() => {
    if (!open) return;
    restoreTo.current = document.activeElement;
    document.body.style.overflow = 'hidden';

    const panel = panelRef.current;
    // Focus previously stayed behind the scrim, so a keyboard user opening the
    // delete-group sheet went on tabbing through the page underneath it.
    (initialFocus?.current ?? panel)?.focus();

    const onKey = (e) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key !== 'Tab' || !panel) return;
      const items = [...panel.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null);
      if (!items.length) { e.preventDefault(); return; }
      const first = items[0];
      const last = items[items.length - 1];
      // Cycle within the sheet rather than escaping into the page behind it.
      if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      restoreTo.current?.focus?.();
    };
  }, [open, onClose, initialFocus]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/55 animate-[fadeIn_0.16s_ease-out]" onClick={onClose} />
      <div
        ref={panelRef}
        tabIndex={-1}
        className="relative bg-slate-2 rounded-t-[22px] border-t border-line px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 max-h-[80vh] overflow-y-auto animate-[rise_0.16s_ease-out] outline-none"
        role="dialog"
        aria-modal="true"
        aria-label={label}
      >
        <div aria-hidden="true" className="mx-auto mb-3 w-10 border-b-2 border-dashed border-chalk-faint" />
        {children}
      </div>
    </div>
  );
};

export default BottomSheet;
