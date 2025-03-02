import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Divider,
  Grid,
  Paper,
  Stack
} from '@mui/material';
import {
  PriorityHigh as UrgentIcon,
  StarOutline as ImportantIcon,
  AutoAwesome as AIIcon,
  CreditCard as CreditIcon,
  CheckCircleOutline as CheckIcon
} from '@mui/icons-material';

const InstructionsDialog = ({ open, onClose }) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3 }
      }}
    >
      <DialogTitle sx={{
        borderBottom: '1px solid rgba(0,0,0,0.08)',
        py: 2.5,
        px: 3,
        typography: 'h5',
        fontWeight: 600,
        color: 'primary.main'
      }}>
        How to Use 8020.best
      </DialogTitle>

      <DialogContent sx={{ py: 4, px: 3 }}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Stack spacing={3}>
              <Box>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <AIIcon color="primary" sx={{ mr: 1 }} />
                  Quick Start Guide
                </Typography>

                <Stack spacing={2} sx={{ mt: 2 }}>
                  <Paper elevation={0} sx={{ p: 2, borderRadius: 2, bgcolor: 'grey.50', border: '1px solid rgba(0,0,0,0.05)' }}>
                    <Typography variant="subtitle2" gutterBottom>1. Input Tasks</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Add your tasks one per line in the text field
                    </Typography>
                  </Paper>

                  <Paper elevation={0} sx={{ p: 2, borderRadius: 2, bgcolor: 'grey.50', border: '1px solid rgba(0,0,0,0.05)' }}>
                    <Typography variant="subtitle2" gutterBottom>2. Click "Analyze Tasks"</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Our AI will categorize them based on importance and urgency
                    </Typography>
                  </Paper>

                  <Paper elevation={0} sx={{ p: 2, borderRadius: 2, bgcolor: 'grey.50', border: '1px solid rgba(0,0,0,0.05)' }}>
                    <Typography variant="subtitle2" gutterBottom>3. Review Categories</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Focus on urgent and important tasks first
                    </Typography>
                  </Paper>
                </Stack>
              </Box>

              <Box>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <CreditIcon color="primary" sx={{ mr: 1 }} />
                  Credits System
                </Typography>

                <Paper elevation={0} sx={{ p: 2, borderRadius: 2, bgcolor: 'grey.50', border: '1px solid rgba(0,0,0,0.05)' }}>
                  <Stack spacing={1.5}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <CheckIcon fontSize="small" color="success" sx={{ mr: 1 }} />
                      <Typography variant="body2">Start with 100 free credits</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <CheckIcon fontSize="small" color="success" sx={{ mr: 1 }} />
                      <Typography variant="body2">1 credit per task analyzed</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <CheckIcon fontSize="small" color="success" sx={{ mr: 1 }} />
                      <Typography variant="body2">Purchase more credits when needed</Typography>
                    </Box>
                  </Stack>
                </Paper>
              </Box>
            </Stack>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <ImportantIcon color="primary" sx={{ mr: 1 }} />
              Understanding Categories
            </Typography>

            <Stack spacing={2} sx={{ mt: 2 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: 'error.50',
                  border: '1px solid',
                  borderColor: 'error.100'
                }}
              >
                <Typography variant="subtitle1" color="error.main" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <UrgentIcon fontSize="small" sx={{ mr: 1 }} /> Urgent Tasks
                </Typography>
                <Typography variant="body2">
                  Time-sensitive tasks that need immediate attention. Do these first to meet deadlines.
                </Typography>
              </Paper>

              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: 'warning.50',
                  border: '1px solid',
                  borderColor: 'warning.100'
                }}
              >
                <Typography variant="subtitle1" color="warning.dark" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <ImportantIcon fontSize="small" sx={{ mr: 1 }} /> Important Tasks
                </Typography>
                <Typography variant="body2">
                  High-impact tasks aligned with your long-term goals. Schedule these for focused work.
                </Typography>
              </Paper>

              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: 'success.50',
                  border: '1px solid',
                  borderColor: 'success.100'
                }}
              >
                <Typography variant="subtitle1" color="success.dark" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <CheckIcon fontSize="small" sx={{ mr: 1 }} /> Unimportant Tasks
                </Typography>
                <Typography variant="body2">
                  Tasks with lower impact. Consider delegating, postponing, or eliminating these.
                </Typography>
              </Paper>
            </Stack>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid rgba(0,0,0,0.08)' }}>
        <Button
          onClick={onClose}
          variant="contained"
          color="primary"
          sx={{ px: 3, py: 1, borderRadius: 2, textTransform: 'none' }}
        >
          Got it
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default InstructionsDialog;