import React, { useState } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemText,
  IconButton,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';

const ItemList = ({ items, listNumber, selectedIndex, onItemSelect, onDeleteItems, onClearList, onAddItem }) => {
  const [newTask, setNewTask] = useState('');

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && newTask.trim()) {
      onAddItem(newTask.trim());
      setNewTask('');
    }
  };

  const handleAddClick = () => {
    if (newTask.trim()) {
      onAddItem(newTask.trim());
      setNewTask('');
    }
  };

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      height: '100%'
    }}>
      {listNumber === 1 && (
        <Box sx={{ p: 1.5, borderBottom: '1px solid #333', flexShrink: 0 }}>
          <TextField
            fullWidth
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Add new task..."
            variant="outlined"
            size="small"
            InputProps={{
              endAdornment: newTask && (
                <InputAdornment position="end">
                  <IconButton
                    onClick={handleAddClick}
                    edge="end"
                    sx={{ color: '#999' }}
                  >
                    <AddIcon />
                  </IconButton>
                </InputAdornment>
              ),
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
        width: '100%',
        '& .MuiListItem-root': {
          py: 1,
          px: 1.5,
          borderBottom: '1px solid #333',
          '&:last-child': {
            borderBottom: 'none'
          }
        }
      }}>
        {items.map((item, index) => (
          <ListItem
            key={index}
            selected={index === selectedIndex}
            onClick={() => onItemSelect(index)}
            sx={{
              cursor: 'pointer',
              backgroundColor: index === selectedIndex ? '#333' : 'transparent',
              borderLeft: index === selectedIndex ? '4px solid #fff' : '4px solid transparent',
              '&:hover': {
                backgroundColor: '#222',
                borderLeft: index === selectedIndex ? '4px solid #fff' : '4px solid #444'
              },
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              width: '100%',
              transition: 'all 0.2s ease',
              pl: index === selectedIndex ? 1.1 : 1.5
            }}
          >
            <ListItemText
              primary={item}
              sx={{
                m: 0,
                flex: 1,
                '& .MuiTypography-root': {
                  fontSize: '0.9rem',
                  lineHeight: 1.4,
                  fontWeight: index === selectedIndex ? 600 : 400,
                  letterSpacing: index === selectedIndex ? '0.01em' : 'normal'
                }
              }}
            />
          </ListItem>
        ))}
      </List>

      {items.length > 0 && (
        <Box sx={{
          p: 0.5,
          borderTop: '1px solid #333',
          display: 'flex',
          justifyContent: 'flex-end',
          flexShrink: 0,
          backgroundColor: '#1a1a1a'
        }}>
          <IconButton
            onClick={() => onClearList()}
            sx={{
              color: '#999',
              p: 0.5,
              '&:hover': {
                color: '#ff4444',
                backgroundColor: '#333'
              }
            }}
          >
            <ClearIcon fontSize="small" />
          </IconButton>
        </Box>
      )}
    </Box>
  );
};

export default ItemList;