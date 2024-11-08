import React from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemText,
  Typography,
  IconButton
} from '@mui/material';
import { DeleteOutline } from '@mui/icons-material';

const ItemList = ({
  items,
  selectedIndex,
  onItemSelect,
  onItemCopy,
  peakCount,
  listNumber,
  onClearList
}) => {
  return (
    <Box sx={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      maxHeight: '65vh',
      position: 'relative',
    }}>
      {/* List Label */}
      <Typography
        variant="caption"
        sx={{
          color: 'text.secondary',
          mb: 1,
          fontSize: '0.75rem',
          opacity: 0.7
        }}
      >
        {listNumber === 1 ? "Important?" :
         listNumber === 2 ? "Urgent?" :
         "Final List"}
      </Typography>

      <List
        id={`list-${listNumber}`}
        sx={{
          flex: 1,
          overflow: 'auto',
          border: '1px solid rgba(0, 0, 0, 0.12)',
          borderRadius: 1,
          p: 1,
          position: 'relative',
          height: '100%',
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: '#f1f1f1',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#888',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: '#555',
          },
        }}
      >
        <Box sx={{
          position: 'relative',
          minHeight: '100%'
        }}>
          {items.map((item, index) => (
            <ListItem
              key={index}
              data-index={index}
              selected={selectedIndex === index}
              onClick={() => onItemSelect(index)}
              onDoubleClick={() => onItemCopy(item)}
              sx={{
                cursor: 'pointer',
                backgroundColor: selectedIndex === index ? 'black !important' :
                  listNumber === 1 ? 'transparent' :
                  listNumber === 2 ?
                    (item.importanceValue === 1 ? 'rgba(76, 175, 80, 0.15)' : 'rgba(244, 67, 54, 0.15)') :
                  (item.importanceValue === 1 && item.urgencyValue === 1) ? 'rgba(76, 175, 80, 0.35)' :
                  (item.importanceValue === 0 && item.urgencyValue === 0) ? 'rgba(244, 67, 54, 0.35)' :
                  (item.importanceValue === 1) ? 'rgba(76, 175, 80, 0.15)' :
                  'rgba(244, 67, 54, 0.15)',
                color: selectedIndex === index ? 'white !important' : 'inherit',
                borderLeft: selectedIndex === index ? '6px solid #333' : '6px solid transparent',
                boxShadow: selectedIndex === index ? '0 2px 4px rgba(0,0,0,0.2)' : 'none',
                '&:hover': {
                  backgroundColor: selectedIndex === index ? 'black !important' :
                    listNumber === 1 ? 'rgba(0, 0, 0, 0.04)' :
                    listNumber === 2 ?
                      (item.importanceValue === 1 ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)') :
                    (item.importanceValue === 1 && item.urgencyValue === 1) ? 'rgba(76, 175, 80, 0.45)' :
                    (item.importanceValue === 0 && item.urgencyValue === 0) ? 'rgba(244, 67, 54, 0.45)' :
                    (item.importanceValue === 1) ? 'rgba(76, 175, 80, 0.2)' :
                    'rgba(244, 67, 54, 0.2)',
                },
                borderRadius: 1,
                mb: 0.5,
                transition: 'all 0.2s ease',
              }}
            >
              <ListItemText
                primary={listNumber === 1 ? item :
                  listNumber === 2 ? `${item.importanceValue}, ${item.idea}` :
                  `${item.importanceValue},${item.urgencyValue},${item.idea}`}
              />
            </ListItem>
          ))}
        </Box>
      </List>

      {/* Bottom Controls */}
      <Box sx={{
        mt: 1,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        px: 1,
        position: 'relative',
      }}>
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
            fontSize: '0.75rem',
            backgroundColor: 'rgba(0,0,0,0.05)',
            padding: '2px 6px',
            borderRadius: '4px'
          }}
        >
          {items.length} items
        </Typography>

        <IconButton
          onClick={() => onClearList(listNumber)}
          size="small"
          sx={{
            color: 'black',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.04)',
            }
          }}
        >
          <DeleteOutline />
        </IconButton>
      </Box>
    </Box>
  );
};

export default ItemList;