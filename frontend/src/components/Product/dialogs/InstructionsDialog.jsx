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

const InstructionsDialog = ({ open, onClose }) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle sx={{ borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
        How to Use 8020.best
      </DialogTitle>
      <DialogContent>
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>Step by Step Guide</Typography>
          <Box sx={{ pl: 2 }}>
            <Typography paragraph>
              1. <b>Import Items</b><br />
              • Paste your items using the clipboard icon, or<br />
              • Type items one by one in the input box
            </Typography>

            <Typography paragraph>
              2. <b>Rate Items by Importance</b><br />
              • Navigate items using Up/Down arrow keys<br />
              • Use Left/Right arrow keys to set importance (0 or 1)<br />
              • Press Enter to move item to next list
            </Typography>

            <Typography paragraph>
              3. <b>Rate Items by Urgency</b><br />
              • Navigate to second list using ] key<br />
              • Use Left/Right arrow keys to set urgency (0 or 1)<br />
              • Press Enter to move item to final list
            </Typography>

            <Typography paragraph>
              4. <b>Review Final List</b><br />
              • Items are automatically sorted by importance and urgency<br />
              • Format: importance,urgency,item<br />
              • Use the copy icon to export your prioritized items
            </Typography>
          </Box>

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Keyboard Shortcuts</Typography>
          <Box sx={{ pl: 2 }}>
            <Typography>
              • <b>[ and ]</b> - Move between lists<br />
              • <b>↑/↓</b> - Navigate items<br />
              • <b>←/→</b> - Toggle rating (0/1)<br />
              • <b>Enter</b> - Move item forward<br />
              • <b>Delete/Backspace</b> - Remove item
            </Typography>
          </Box>

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Item Ratings</Typography>
          <Box sx={{ pl: 2 }}>
            <Typography>
              • <b>1,1</b> - Problem & Urgent<br />
              • <b>1,0</b> - Problem, Not Urgent<br />
              • <b>0,1</b> - Not Problem, Urgent<br />
              • <b>0,0</b> - Not Problem, Not Urgent
            </Typography>
          </Box>
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
          Got it
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default InstructionsDialog;