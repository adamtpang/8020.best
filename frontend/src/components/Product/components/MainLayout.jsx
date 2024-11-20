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
  children
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
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        {/* Row 1: Back Button and Sync Status */}
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2
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
          mb: 2
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
          mb: 2
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

      {/* Main content area - This is where the lists are rendered */}
      <Box
        sx={{
          flex: 1,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        {/* Scrollable content wrapper */}
        <Box
          sx={{
            flex: 1,
            overflow: 'auto',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
          }}
        >
          {children}
        </Box>
      </Box>

      {/* Bottom Controls Container */}
      <Box sx={{
        position: 'relative',
        zIndex: 2,
        backgroundColor: 'white',
        mt: 'auto'
      }}>
        {/* Help and Trash Buttons */}
        <Box sx={{
          position: 'fixed',
          bottom: 16,
          left: 16,
          display: 'flex',
          gap: 2
        }}>
          <IconButton
            onClick={() => setIsInstructionsOpen(true)}
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
        </Box>
      </Box>
    </Box>
  );
};

export default MainLayout;