import { useState, useEffect, useRef } from 'react';
import BottomSheet from './ui/BottomSheet';
import Button from './ui/Button';
import Field from './ui/Field';
import { colorForName, initialsOf } from '../constants/colors';

const RenameGroupSheet = ({ open, onClose, currentName, onRename }) => {
  const [name, setName] = useState(currentName || '');
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);
  useEffect(() => { if (open) { setName(currentName || ''); setBusy(false); } }, [open, currentName]);

  const trimmed = name.trim();
  const submit = async () => {
    if (!trimmed || busy) return;
    setBusy(true);
    try { await onRename(trimmed); }
    finally { setBusy(false); }
  };

  return (
    <BottomSheet open={open} onClose={busy ? () => {} : onClose} label="Rename group" initialFocus={inputRef}>
      <h2 className="font-hand font-bold text-[30px] leading-none m-0 mb-1.5">Rename group</h2>
      <div className="flex justify-center my-4">
        <span className="w-[74px] h-[74px] rounded-[20px] grid place-items-center font-hand font-bold text-[40px] text-slate-0 -rotate-3"
          style={{ background: colorForName(trimmed || '?') }}>{initialsOf(trimmed || '?')}</span>
      </div>
      <Field
        label="Group name" inputRef={inputRef} value={name} maxLength={40} enterKeyHint="done"
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
      />
      <Button variant="primary" onClick={submit} disabled={!trimmed || busy}>{busy ? 'Saving…' : 'Save'}</Button>
      <div className="mt-3"><Button variant="ghost" onClick={onClose} disabled={busy}>Cancel</Button></div>
    </BottomSheet>
  );
};

export default RenameGroupSheet;
