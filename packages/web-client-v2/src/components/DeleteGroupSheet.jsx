import { useState, useEffect, useRef } from 'react';
import BottomSheet from './ui/BottomSheet';
import Button from './ui/Button';
import Field from './ui/Field';
import Icon from './Icon';

// Type-to-confirm: the destructive button unlocks only when the typed text
// matches the group name exactly (trimmed).
const DeleteGroupSheet = ({ open, onClose, groupName, memberCount, onConfirm, busy = false }) => {
  const [text, setText] = useState('');
  const inputRef = useRef(null);
  useEffect(() => { if (open) setText(''); }, [open]);
  const armed = text.trim() === groupName;

  return (
    <BottomSheet open={open} onClose={busy ? () => {} : onClose} label={`Delete ${groupName}`} initialFocus={inputRef}>
      <h2 className="font-hand font-bold text-[30px] leading-tight m-0 mb-1.5 text-red break-words line-clamp-2">Delete {groupName}</h2>
      <p className="text-[13px] text-chalk-dim leading-relaxed m-0 mb-4">
        Permanently deletes the group and all schedules, notes &amp; invites for{' '}
        <b>{memberCount} {memberCount === 1 ? 'member' : 'members'}</b>. This cannot be undone.
      </p>
      <Field
        label="Type the group name to confirm" inputRef={inputRef} value={text}
        placeholder={groupName} autoCapitalize="none" autoCorrect="off"
        onChange={(e) => setText(e.target.value)}
      />
      <Button variant="danger" onClick={onConfirm} disabled={!armed || busy}>
        <Icon name="trash" className="w-[17px] h-[17px]" />Delete forever
      </Button>
      <div className="mt-3"><Button variant="ghost" onClick={onClose} disabled={busy}>Cancel</Button></div>
    </BottomSheet>
  );
};

export default DeleteGroupSheet;
