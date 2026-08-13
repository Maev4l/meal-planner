import BottomSheet from './ui/BottomSheet';
import Button from './ui/Button';
import Icon from './Icon';

// Simple destructive confirm. `iconName` optional; `busy` disables actions.
const ConfirmSheet = ({ open, onClose, title, body, confirmLabel, onConfirm, iconName = 'trash', busy = false }) => (
  <BottomSheet open={open} onClose={busy ? () => {} : onClose} label={title}>
    <div className="w-[54px] h-[54px] rounded-[16px] grid place-items-center mb-3.5 bg-red/15 text-red">
      <Icon name={iconName} className="w-[26px] h-[26px]" />
    </div>
    <h2 className="font-hand font-bold text-[30px] leading-tight m-0 mb-1.5 break-words line-clamp-2">{title}</h2>
    <p className="text-[13px] text-chalk-dim leading-relaxed m-0 mb-4">{body}</p>
    <Button variant="danger" onClick={onConfirm} disabled={busy}>{confirmLabel}</Button>
    <div className="mt-3"><Button variant="ghost" onClick={onClose} disabled={busy}>Cancel</Button></div>
  </BottomSheet>
);

export default ConfirmSheet;
