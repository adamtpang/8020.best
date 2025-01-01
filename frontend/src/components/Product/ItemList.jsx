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

const ItemList = ({ items, listNumber, selectedIndex, onItemSelect, onDeleteItems, onAddItem, rating }) => {
  const [newTask, setNewTask] = useState('');
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [swipingItem, setSwipingItem] = useState(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const swipeThreshold = 100; // minimum distance for a swipe

  const handleTouchStart = (e, index) => {
    setTouchStart(e.targetTouches[0].clientX);
    setSwipingItem(index);
    setSwipeOffset(0);
  };

  const handleTouchMove = (e) => {
    if (!touchStart) return;

    const currentTouch = e.targetTouches[0].clientX;
    const offset = currentTouch - touchStart;
    setSwipeOffset(offset);
    setTouchEnd(currentTouch);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd || swipingItem === null) return;

    const distance = touchEnd - touchStart;
    const isLeftSwipe = distance < -swipeThreshold;
    const isRightSwipe = distance > swipeThreshold;

    if (listNumber < 3) {
      const item = items[swipingItem];
      if (!item) {
        console.log('No item found at index:', swipingItem);
        return;
      }

      console.log('Processing swipe:', {
        listNumber,
        item,
        isLeftSwipe,
        isRightSwipe,
        distance
      });

      if (isLeftSwipe || isRightSwipe) {
        const swipeRating = isRightSwipe ? 1 : 0;
        moveItemToNextList(item, swipeRating);
      }
    }

    // Reset touch states
    setTouchStart(null);
    setTouchEnd(null);
    setSwipingItem(null);
    setSwipeOffset(0);
  };

  const moveItemToNextList = (item, currentRating) => {
    if (listNumber < 3) {
      console.log('moveItemToNextList called:', {
        item,
        currentRating,
        listNumber,
        cleanText: String(item).split(',').pop().trim()
      });

      // Remove from current list
      onDeleteItems([item]);

      // Get clean text without ratings
      const cleanText = String(item).split(',').pop().trim();

      // Add to next list with rating
      onAddItem(cleanText, currentRating, listNumber + 1);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      if (selectedIndex !== null && selectedIndex >= 0 && selectedIndex < items.length) {
        // Move selected item to next list
        const selectedItem = items[selectedIndex];
        console.log('Moving selected item:', { selectedItem, rating, listNumber });
        moveItemToNextList(selectedItem, rating);
      } else if (newTask.trim() && listNumber === 1) {
        // Add new task to list1
        console.log('Adding new task:', { text: newTask.trim(), listNumber });
        onAddItem(newTask.trim(), undefined, 1);
        setNewTask('');
      }
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
            onFocus={() => {
              onItemSelect(null); // Clear selection when input is focused
            }}
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
            selected={index === selectedIndex}
            onClick={() => onItemSelect(index)}
            onTouchStart={(e) => handleTouchStart(e, index)}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            sx={{
              cursor: 'pointer',
              backgroundColor: index === selectedIndex ? '#333' : 'transparent',
              borderLeft: index === selectedIndex ? '4px solid #fff' : '4px solid transparent',
              color: '#fff',
              transform: swipingItem === index ? `translateX(${swipeOffset}px)` : 'none',
              transition: swipingItem === index ? 'none' : 'all 0.2s ease',
              position: 'relative',
              '&:hover': {
                backgroundColor: '#222',
                borderLeft: index === selectedIndex ? '4px solid #fff' : '4px solid #444'
              },
              '&::after': swipingItem === index ? {
                content: '""',
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: swipeOffset < 0 ? 'auto' : 0,
                right: swipeOffset < 0 ? 0 : 'auto',
                width: '100%',
                backgroundColor: swipeOffset < 0 ? 'rgba(244, 67, 54, 0.1)' : 'rgba(76, 175, 80, 0.1)',
                pointerEvents: 'none'
              } : {}
            }}
          >
            <ListItemText
              primary={item}
              sx={{
                '& .MuiTypography-root': {
                  fontSize: { xs: '0.875rem', sm: '0.9rem' },
                  lineHeight: 1.4,
                  fontWeight: index === selectedIndex ? 600 : 400
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
};

export default ItemList;