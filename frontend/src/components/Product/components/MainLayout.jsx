import React from 'react';
import { Box, Container, IconButton, Slider, TextField } from '@mui/material';
import {
  ArrowBack,
  ContentPaste,
  ContentCopy,
  HelpOutline,
  DeleteOutlined,
  Check,
  SyncProblem
} from '@mui/icons-material';
import CircularProgress from '@mui/material/CircularProgress';

const MainLayout = ({
  navigate,
  sliderValue,
  setSliderValue,
  newItem,
  setNewItem,
  handleClipboardImport,
  handleAddItem,
  handleExportList3,
  setIsInputFocused,
  setSelectedIndex1,
  setSelectedIndex2,
  setSelectedIndex3,
  setActiveList,
  setIsInstructionsOpen,
  setIsTrashOpen,
  isSyncing,
  isSyncError,
  children,
  readingModeControls
}) => {
  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box sx={{
        p: 2,
        borderBottom: 1,
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        {/* Container to match listboxes width */}
        <Box sx={{
          width: '90%',
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 2
        }}>
          {/* Row 1: Back Button and Sync Status */}
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            width: '100%'
          }}>
            <IconButton
              onClick={() => navigate('/')}
              size="small"
              sx={{ color: 'black' }}
            >
              <ArrowBack />
            </IconButton>

            {/* Sync Status Indicator */}
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              opacity: 0.7,
              transition: 'opacity 0.3s ease'
            }}>
              {isSyncing ? (
                <CircularProgress
                  size={16}
                  thickness={6}
                  sx={{ color: 'black' }}
                />
              ) : isSyncError ? (
                <SyncProblem
                  sx={{
                    color: 'error.main',
                    fontSize: 18
                  }}
                />
              ) : (
                <Check
                  sx={{
                    color: 'success.main',
                    fontSize: 18,
                    animation: 'fadeIn 0.3s ease'
                  }}
                />
              )}
            </Box>
          </Box>

          {/* Slider Row */}
          <Box sx={{
            display: 'flex',
            gap: 2,
            alignItems: 'center',
            width: '100%',
          }}>
            <Slider
              value={sliderValue}
              onChange={(_, newValue) => setSliderValue(newValue)}
              step={1}
              marks
              min={0}
              max={1}
              sx={{
                width: '100%',
                flexShrink: 0,
                '& .MuiSlider-track': { backgroundColor: 'black' },
                '& .MuiSlider-rail': { backgroundColor: '#ccc' },
                '& .MuiSlider-thumb': { backgroundColor: 'black' },
                '& .MuiSlider-mark': { backgroundColor: '#bbb' },
                '& .MuiSlider-markActive': { backgroundColor: 'black' }
              }}
              size="small"
            />
          </Box>

          {/* Import/Export Controls Row */}
          <Box sx={{
            display: 'flex',
            gap: 2,
            alignItems: 'center',
            width: '100%',
          }}>
            <IconButton
              onClick={handleClipboardImport}
              size="small"
              sx={{ color: 'black' }}
            >
              <ContentPaste />
            </IconButton>

            <Box component="form" onSubmit={handleAddItem} sx={{ flex: 1 }}>
              <TextField
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                placeholder="Add new item..."
                size="small"
                fullWidth
                onFocus={() => {
                  setIsInputFocused(true);
                  setSelectedIndex1(null);
                  setSelectedIndex2(null);
                  setSelectedIndex3(null);
                  setActiveList(1);
                }}
                onBlur={() => {
                  setIsInputFocused(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.stopPropagation();
                  }
                }}
              />
            </Box>

            <IconButton
              onClick={handleExportList3}
              size="small"
              sx={{ color: 'black' }}
            >
              <ContentCopy />
            </IconButton>
          </Box>
        </Box>
      </Box>

      {/* Main content area - Simplified structure */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          width: '90%',
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '16px 0',
        }}
      >
        {children}
      </Box>

      {/* Bottom Controls Container */}
      <Box sx={{
        position: 'fixed',
        bottom: 16,
        left: 16,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        zIndex: 1200,
      }}>
        <IconButton
          onClick={() => {
            console.log('Instructions button clicked');
            setIsInstructionsOpen(true);
          }}
          size="small"
          sx={{
            backgroundColor: 'black',
            color: 'white',
            '&:hover': { backgroundColor: '#333' },
            width: 40,
            height: 40
          }}
        >
          <HelpOutline />
        </IconButton>
        <IconButton
          onClick={() => setIsTrashOpen(true)}
          size="small"
          sx={{
            backgroundColor: 'black',
            color: 'white',
            '&:hover': { backgroundColor: '#333' },
            width: 40,
            height: 40
          }}
        >
          <DeleteOutlined />
        </IconButton>
        {/* Reading Mode Controls */}
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          backgroundColor: 'white',
          padding: '4px 12px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}>
          {readingModeControls}
        </Box>
      </Box>
    </Box>
  );
};

export default MainLayout;