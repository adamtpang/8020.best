import React from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemText,
  Typography,
  IconButton
} from '@mui/material';
import { DeleteOutline, ContentCopy } from '@mui/icons-material';

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
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '350px !important',
        minWidth: '350px !important',
        maxWidth: '350px !important',
        flex: '0 0 350px !important',
        bgcolor: 'background.paper',
        borderRadius: 1,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
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
            "Calendar?"}
      </Typography>

      <List
        sx={{
          width: '350px !important',
          maxWidth: '350px !important',
          padding: 0,
          flex: 1,
          overflow: 'auto',
        }}
      >
        {items.map((item, index) => (
          <ListItem
            key={index}
            selected={index === selectedIndex}
            onClick={() => onItemSelect(index)}
            sx={{
              width: '100% !important',
              maxWidth: '100% !important',
              padding: '8px 16px',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              '&:hover': {
                backgroundColor: 'action.hover',
              }
            }}
          >
            <ListItemText
              primary={typeof item === 'string' ? item : item.idea}
              sx={{
                m: 0,
                width: 'calc(100% - 48px) !important', // Leave space for the copy button
                '& .MuiTypography-root': {
                  wordBreak: 'break-word',
                  whiteSpace: 'pre-wrap',
                  overflowWrap: 'break-word',
                  width: '100%',
                  pr: 1,
                }
              }}
            />
            <Box sx={{
              display: 'flex',
              flexShrink: 0,
              ml: 1
            }}>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onItemCopy(item);
                }}
              >
                <ContentCopy fontSize="small" />
              </IconButton>
            </Box>
          </ListItem>
        ))}
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