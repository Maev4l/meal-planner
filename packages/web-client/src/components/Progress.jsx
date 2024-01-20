import { Backdrop, CircularProgress } from '@mui/material';

export const Progress = ({ show }) => (
  <Backdrop sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }} open={show}>
    <CircularProgress color="inherit" />
  </Backdrop>
);
