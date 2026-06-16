import { useState, useEffect } from 'react';
import BottomSheet from './ui/BottomSheet';
import Button from './ui/Button';
import Icon from './Icon';

// Type-to-confirm: the destructive button unlocks only when the typed text
// matches the group name exactly (trimmed).
const DeleteGroupSheet = ({ open, onClose, groupName, memberCount, onConfirm, busy = false }) => {
  const [text, setText] = useState('');
  useEffect(() => { if (open) setText(''); }, [open]);
  const armed = text.trim() === groupName;

  return (
    <BottomSheet open={open} onClose={busy ? () => {} : onClose}>
      <h2 className="font-hand font-bold text-[30px] leading-none m-0 mb-1.5 text-red">Delete {groupName}</h2>
      <p className="text-[13px] text-chalk-dim leading-relaxed m-0 mb-4">
        Permanently deletes the group and all schedules, notes &amp; invites for{' '}
        <b>{memberCount} {memberCount === 1 ? 'member' : 'members'}</b>. This cannot be undone.
      </p>
      <label className="block text-[10.5px] tracking-[0.24em] uppercase text-chalk-dim mb-1.5">
        Type the group name to confirm
      </label>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={groupName}
        className="w-full bg-transparent border-0 border-b-[1.5px] border-line text-chalk text-[15px] py-2 px-0.5 outline-none focus:border-coral mb-4"
      />
      <Button variant="danger" onClick={onConfirm} disabled={!armed || busy}>
        <Icon name="trash" className="w-[17px] h-[17px]" />Delete forever
      </Button>
      <button onClick={onClose} disabled={busy}
        className="w-full mt-3 font-body font-bold uppercase tracking-[0.1em] text-[13px] py-[15px] rounded-[14px] bg-transparent text-chalk-dim border border-line hover:text-chalk disabled:opacity-40">
        Cancel
      </button>
    </BottomSheet>
  );
};

export default DeleteGroupSheet;
