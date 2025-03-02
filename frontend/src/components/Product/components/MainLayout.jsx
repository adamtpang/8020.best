import React from 'react';
import {
  Box,
  IconButton,
  TextField,
  CircularProgress,
  Tooltip,
  Button,
  Badge,
  Chip,
} from '@mui/material';
import {
  ArrowBack,
  ContentPaste,
  ContentCopy,
  HelpOutline,
  DeleteOutlined,
  Check,
  SyncProblem,
  Psychology,
  CreditCard,
} from '@mui/icons-material';

const MainLayout = ({
  navigate,
  newItem,
  setNewItem,
  handleClipboardImport,
  handleAddItem,
  handleExportList3,
  setIsInputFocused,
  setIsInstructionsOpen,
  setIsTrashOpen,
  isSyncing,
  isSyncError,
  children,
  readingModeControls,
  trashedItems,
  onTriggerAnalysis,
  isAnalyzing,
  credits,
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
          {/* Row 1: Back Button, Sync Status, Credits */}
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            width: '100%',
            justifyContent: 'space-between'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
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

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {/* Credits Display */}
              {credits !== null && (
                <Tooltip title="Available credits for AI analysis">
                  <Chip
                    icon={<CreditCard fontSize="small" />}
                    label={`${credits} credits`}
                    color={credits > 10 ? 'primary' : 'error'}
                    size="small"
                    variant="outlined"
                    sx={{
                      borderColor: credits > 10 ? 'primary.main' : 'error.main',
                      '& .MuiChip-icon': {
                        color: credits > 10 ? 'primary.main' : 'error.main',
                      }
                    }}
                  />
                </Tooltip>
              )}

              {/* AI Analysis Button */}
              {onTriggerAnalysis && (
                <Tooltip title="Analyze tasks with AI">
                  <span>
                    <Button
                      onClick={onTriggerAnalysis}
                      disabled={isAnalyzing || (credits !== null && credits < 1)}
                      variant="outlined"
                      size="small"
                      startIcon={isAnalyzing ? <CircularProgress size={16} /> : <Psychology />}
                      sx={{
                        color: 'black',
                        borderColor: 'black',
                        '&:hover': {
                          borderColor: 'black',
                          backgroundColor: 'rgba(0,0,0,0.04)',
                        }
                      }}
                    >
                      {isAnalyzing ? 'Analyzing...' : 'Analyze Tasks'}
                    </Button>
                  </span>
                </Tooltip>
              )}
            </Box>
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
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
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

      {/* Main content area */}
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

        <Box sx={{ position: 'relative' }}>
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
          {trashedItems?.length > 0 && (
            <Box
              sx={{
                position: 'absolute',
                top: -8,
                right: -8,
                backgroundColor: 'error.main',
                color: 'white',
                borderRadius: '50%',
                padding: '2px 6px',
                fontSize: '0.75rem',
                minWidth: '20px',
                height: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {trashedItems.length}
            </Box>
          )}
        </Box>
        {readingModeControls}
      </Box>
    </Box>
  );
}

export default MainLayout;