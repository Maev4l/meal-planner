import { forwardRef, useState } from 'react';
import {
  Slide,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  TextField,
} from '@mui/material';

// eslint-disable-next-line react/jsx-props-no-spreading
const Transition = forwardRef((props, ref) => <Slide direction="up" ref={ref} {...props} />);

const CommentPopup = ({ comment, onCancel, onSubmit }) => {
  const { author, content, dayOfWeek, mealKey } = comment;
  const [text, setText] = useState(content);

  const onChangeText = (e) => {
    const {
      target: { value },
    } = e;
    setText(value);
  };

  return (
    <Dialog open TransitionComponent={Transition} keepMounted onClose={onCancel}>
      <DialogTitle>{`Author: ${author} - Date: ${dayOfWeek.format(
        'MMMM DD',
      )} (${mealKey})`}</DialogTitle>
      <DialogContent>
        {onSubmit ? (
          <TextField
            fullWidth
            multiline
            rows={4}
            onChange={onChangeText}
            value={text}
            inputProps={{ maxLength: 100 }}
          />
        ) : (
          <DialogContentText>{content}</DialogContentText>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Cancel</Button>
        {onSubmit && (
          <Button onClick={() => onSubmit({ ...comment, content: text })}>Submit</Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
export default CommentPopup;
