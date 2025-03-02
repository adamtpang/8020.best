import React, { useState } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemText,
  TextField,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Clear as ClearIcon } from '@mui/icons-material';

const ItemList = ({ items, listNumber, onDeleteItems, onAddItem }) => {
  const [newTask, setNewTask] = useState('');

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && newTask.trim() && listNumber === 1) {
      onAddItem(newTask.trim(), undefined, 1);
      setNewTask('');
    }
  };

  const handleClearList = () => {
    onDeleteItems(items);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {listNumber === 1 && (
        <Box sx={{ p: { xs: 1, sm: 1.5 }, borderBottom: '1px solid #333', flexShrink: 0 }}>
          <TextField
            fullWidth
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Add new task..."
            variant="outlined"
            size="small"
            InputProps={{
              sx: {
                color: '#fff',
                backgroundColor: '#222',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#333',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#444',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#666',
                },
              }
            }}
          />
        </Box>
      )}

      <List sx={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        py: 0,
        '& .MuiListItem-root': {
          py: { xs: 0.75, sm: 1 },
          px: { xs: 1, sm: 1.5 },
          borderBottom: '1px solid #333',
          '&:last-child': {
            borderBottom: 'none'
          }
        }
      }}>
        {items.map((item, index) => (
          <ListItem
            key={index}
            sx={{
              color: '#fff',
              '&:hover': {
                backgroundColor: '#222',
              }
            }}
          >
            <ListItemText
              primary={item}
              sx={{
                '& .MuiTypography-root': {
                  fontSize: { xs: '0.875rem', sm: '0.9rem' },
                  lineHeight: 1.4,
                }
              }}
            />
          </ListItem>
        ))}
      </List>

      {items.length > 0 && (
        <Box sx={{
          p: { xs: 1, sm: 1.5 },
          borderTop: '1px solid #333',
          display: 'flex',
          justifyContent: 'center'
        }}>
          <Tooltip title={`Clear ${listNumber === 1 ? 'Important' : listNumber === 2 ? 'Urgent' : 'Calendar'} List`}>
            <IconButton
              onClick={handleClearList}
              size="small"
              sx={{
                color: '#666',
                '&:hover': {
                  color: '#fff',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)'
                }
              }}
            >
              <ClearIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      )}
    </Box>
  );
}

export default ItemList;