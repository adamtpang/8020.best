import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Box,
  Typography
} from '@mui/material';
import { RestoreFromTrash, DeleteForever } from '@mui/icons-material';

const TrashDialog = ({
  open,
  onClose,
  trashedItems,
  onRestore,
  onClearTrash
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle sx={{
        borderBottom: '1px solid rgba(0,0,0,0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span>Trash ({trashedItems.length} items)</span>
        <Button
          onClick={onClearTrash}
          startIcon={<DeleteForever />}
          color="error"
          disabled={trashedItems.length === 0}
        >
          Clear Trash
        </Button>
      </DialogTitle>
      <DialogContent>
        {trashedItems.length === 0 ? (
          <Box sx={{
            textAlign: 'center',
            py: 4,
            color: 'text.secondary'
          }}>
            <Typography>Trash is empty</Typography>
          </Box>
        ) : (
          <List>
            {trashedItems.map((item, index) => (
              <ListItem
                key={index}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 2,
                  pr: 2
                }}
              >
                <ListItemText
                  primary={typeof item === 'string' ? item :
                    item.urgencyValue !== undefined ?
                      `${item.importanceValue},${item.urgencyValue},${item.idea}` :
                      `${item.importanceValue},${item.idea}`
                  }
                  sx={{
                    flex: '1 1 auto',
                    mr: 2,
                    '& .MuiTypography-root': {
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }
                  }}
                />
                <Button
                  startIcon={<RestoreFromTrash />}
                  onClick={() => onRestore(index)}
                  sx={{
                    color: 'black',
                    flexShrink: 0,
                    minWidth: '140px',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.04)'
                    }
                  }}
                >
                  Restore to List 1
                </Button>
              </ListItem>
            ))}
          </List>
        )}
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

export default TrashDialog;