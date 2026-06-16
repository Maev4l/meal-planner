import { useState, useEffect } from 'react';
import BottomSheet from './ui/BottomSheet';
import Button from './ui/Button';
import { colorForName, initialsOf } from '../constants/colors';

// Single-field create with a live initials-avatar preview. onCreated(group)
// is called with the API response { id, name }.
const CreateGroupSheet = ({ open, onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (open) { setName(''); setBusy(false); } }, [open]);

  const trimmed = name.trim();
  const submit = async () => {
    if (!trimmed || busy) return;
    setBusy(true);
    try { await onCreate(trimmed); }
    finally { setBusy(false); }
  };

  return (
    <BottomSheet open={open} onClose={busy ? () => {} : onClose}>
      <h2 className="font-hand font-bold text-[30px] leading-none m-0 mb-1.5">New group</h2>
      <div className="flex justify-center my-4">
        <span className="w-[74px] h-[74px] rounded-[20px] grid place-items-center font-hand font-bold text-[40px] text-slate-0 -rotate-3"
          style={{ background: colorForName(trimmed || '?') }}>
          {initialsOf(trimmed || '?')}
        </span>
      </div>
      <label className="block text-[10.5px] tracking-[0.24em] uppercase text-chalk-dim mb-1.5">Group name</label>
      <input
        autoFocus value={name} maxLength={40} enterKeyHint="done"
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        className="w-full bg-transparent border-0 border-b-[1.5px] border-line text-chalk text-[15px] py-2 px-0.5 outline-none focus:border-coral mb-4"
      />
      <Button variant="primary" onClick={submit} disabled={!trimmed || busy}>{busy ? 'Creating…' : 'Create group'}</Button>
      <div className="mt-3"><Button variant="ghost" onClick={onClose} disabled={busy}>Cancel</Button></div>
    </BottomSheet>
  );
};

export default CreateGroupSheet;
