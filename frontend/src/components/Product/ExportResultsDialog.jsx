import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box
} from '@mui/material';

const ExportResultsDialog = ({
  open,
  onClose,
  reductionPercent
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
        Congratulations!
      </DialogTitle>
      <DialogContent>
        <Box sx={{
          textAlign: 'center',
          py: 4
        }}>
          <Typography variant="h3" gutterBottom>
            {reductionPercent}% Reduced!
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            You've successfully prioritized your items.
          </Typography>
          {reductionPercent >= 80 && (
            <Typography variant="h6" sx={{ color: 'success.main' }}>
              Amazing job! You're a master of prioritization! 🏆
            </Typography>
          )}
          {reductionPercent >= 50 && reductionPercent < 80 && (
            <Typography variant="h6" sx={{ color: 'success.main' }}>
              Great work! You've significantly reduced your workload! 🌟
            </Typography>
          )}
          {reductionPercent < 50 && (
            <Typography variant="h6" sx={{ color: 'info.main' }}>
              Good start! Consider being more selective next time. 💪
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
          variant="contained"
          sx={{
            backgroundColor: 'black',
            '&:hover': {
              backgroundColor: '#333',
            }
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExportResultsDialog;