import { useState, useEffect, useRef, useCallback } from 'react';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import { api } from '../services/api';
import { DAYS, DAY_LABELS } from '../constants/schedule';
import BottomSheet from './ui/BottomSheet';
import Textarea from './ui/Textarea';
import { useToast } from './ui/Toast';

dayjs.extend(isoWeek);

// open: bool; day: 'monday'…; dayIndex: 0..6; year, week; groupId;
// allComments: { monday:{lunch,dinner}, … } for the member this week; readOnly: bool;
// onSaved(updatedAllComments): lets the parent update its in-memory comments.
const CommentEditorSheet = ({ open, onClose, day, dayIndex, year, week, groupId, allComments, readOnly, onSaved }) => {
  const toast = useToast();
  const [lunch, setLunch] = useState('');
  const [dinner, setDinner] = useState('');
  const initial = useRef({ lunch: '', dinner: '' });

  useEffect(() => {
    if (!open) return;
    const c = allComments?.[day] ?? { lunch: '', dinner: '' };
    setLunch(c.lunch ?? '');
    setDinner(c.dinner ?? '');
    initial.current = { lunch: c.lunch ?? '', dinner: c.dinner ?? '' };
  }, [open, day, allComments]);

  const fullDate = open
    ? dayjs(`${year}-01-04`).startOf('isoWeek').add(week - 1, 'week').add(dayIndex, 'day').format('D MMMM YYYY')
    : '';

  const persist = useCallback(async () => {
    if (readOnly) return;
    if (lunch === initial.current.lunch && dinner === initial.current.dinner) return; // nothing changed
    const week7 = Object.fromEntries(
      DAYS.map((d) => [d, d === day ? { lunch, dinner } : (allComments?.[d] ?? { lunch: '', dinner: '' })])
    );
    try {
      await api.createComments(groupId, { year, weekNumber: week, ...week7 });
      initial.current = { lunch, dinner };
      onSaved?.(week7);
      toast?.('Saved', 'success');
    } catch {
      toast?.('Failed to save note', 'error');
    }
  }, [readOnly, lunch, dinner, day, allComments, groupId, year, week, onSaved, toast]);

  const handleClose = async () => { await persist(); onClose(); };

  return (
    <BottomSheet open={open} onClose={handleClose}>
      <div className="mb-4">
        <div className="font-hand font-bold text-[30px] leading-none">{DAY_LABELS[dayIndex] ?? ''}</div>
        <div className="text-[11px] tracking-[0.2em] uppercase text-chalk-dim mt-1">{fullDate}</div>
      </div>
      <div className="mb-4">
        <div className="font-hand font-bold text-[24px] text-mustard leading-none mb-1.5">Lunch</div>
        <Textarea value={lunch} disabled={readOnly} onBlur={persist}
          placeholder={readOnly ? 'past — read only' : 'note for the cook…'}
          onChange={(e) => setLunch(e.target.value)} />
      </div>
      <div>
        <div className="font-hand font-bold text-[24px] text-coral leading-none mb-1.5">Dinner</div>
        <Textarea value={dinner} disabled={readOnly} onBlur={persist}
          placeholder={readOnly ? 'past — read only' : 'note for the cook…'}
          onChange={(e) => setDinner(e.target.value)} />
      </div>
      {readOnly && <div className="text-chalk-faint italic font-hand text-[18px] mt-3">past — read only</div>}
    </BottomSheet>
  );
};

export default CommentEditorSheet;
