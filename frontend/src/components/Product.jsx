// src/components/Product.jsx

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from '../firebase-config';
import { signOut } from 'firebase/auth';
import { useAuth } from '../contexts/AuthContext';
import axiosInstance from '../axios-config';
import {
  Box,
  Button,
  Typography,
  Snackbar,
  Alert,
  Container,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Slider,
} from "@mui/material";
import {
  ContentPaste as PasteIcon,
  ContentCopy as CopyIcon,
} from '@mui/icons-material';

// Local imports
import ItemList from "./Product/ItemList";
import useDataPersistence from './Product/hooks/useDataPersistence';

const Product = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [list1, setList1] = useState([]);
  const [list2, setList2] = useState([]);
  const [list3, setList3] = useState([]);
  const [selectedIndex1, setSelectedIndex1] = useState(null);
  const [selectedIndex2, setSelectedIndex2] = useState(null);
  const [selectedIndex3, setSelectedIndex3] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
  const [rating, setRating] = useState(0);

  const { loadData, saveData, isSyncing } = useDataPersistence();

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === '[') {
        setActiveTab(prev => (prev > 0 ? prev - 1 : prev));
      } else if (e.key === ']') {
        setActiveTab(prev => (prev < 2 ? prev + 1 : prev));
      } else if (e.key === 'ArrowLeft') {
        setRating(0);
      } else if (e.key === 'ArrowRight') {
        setRating(1);
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault(); // Prevent page scroll
        const currentList = activeTab === 0 ? list1 : activeTab === 1 ? list2 : list3;
        const currentIndex = activeTab === 0 ? selectedIndex1 : activeTab === 1 ? selectedIndex2 : selectedIndex3;

        if (currentList.length > 0) {
          let newIndex;
          if (currentIndex === null) {
            newIndex = 0;
          } else {
            if (e.key === 'ArrowUp') {
              newIndex = currentIndex > 0 ? currentIndex - 1 : currentList.length - 1;
            } else {
              newIndex = currentIndex < currentList.length - 1 ? currentIndex + 1 : 0;
            }
          }
          handleItemSelect(activeTab + 1, newIndex);
        }
      } else if (e.key === 'Enter' && activeTab < 2) {
        const currentList = activeTab === 0 ? list1 : list2;
        const selectedIndex = activeTab === 0 ? selectedIndex1 : selectedIndex2;

        if (selectedIndex !== null) {
          const item = currentList[selectedIndex];
          handleDeleteItems(activeTab + 1, [item]);
          handleAddItem(activeTab + 2, item, rating);
        }
      } else if (e.key === 'Backspace') {
        const currentList = activeTab === 0 ? list1 : activeTab === 1 ? list2 : list3;
        const selectedIndex = activeTab === 0 ? selectedIndex1 : activeTab === 1 ? selectedIndex2 : selectedIndex3;

        if (selectedIndex !== null) {
          const item = currentList[selectedIndex];
          handleDeleteItems(activeTab + 1, [item]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, rating, list1, list2, list3, selectedIndex1, selectedIndex2, selectedIndex3]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);

  // Load initial data
  useEffect(() => {
    const initializeData = async () => {
      try {
        const data = await loadData();
        console.log('Initializing data:', data);
        if (data) {
          // Set all lists at once to prevent race conditions
          setList1(data.list1 || []);
          setList2(data.list2 || []);
          setList3(data.list3 || []);
        }
      } catch (error) {
        console.error('Error initializing data:', error);
      }
    };

    if (user) {
      initializeData();
    }
  }, [user, loadData]);

  // Save data when lists change
  useEffect(() => {
    if (!user) return;

    console.log('Lists changed, preparing to save:', { list1, list2, list3 });
    const saveTimeout = setTimeout(async () => {
      try {
        await saveData({
          list1,
          list2,
          list3
        });
        console.log('Data saved successfully');
      } catch (error) {
        console.error('Error saving data:', error);
      }
    }, 500); // Reduced debounce time

    return () => clearTimeout(saveTimeout);
  }, [list1, list2, list3, user, saveData]);

  const handleItemSelect = (listNumber, index) => {
    setSelectedIndex1(listNumber === 1 ? index : null);
    setSelectedIndex2(listNumber === 2 ? index : null);
    setSelectedIndex3(listNumber === 3 ? index : null);
  };

  const handleDeleteItems = (listNumber, items) => {
    switch (listNumber) {
      case 1:
        setList1(prev => prev.filter(item => !items.includes(item)));
        break;
      case 2:
        setList2(prev => prev.filter(item => !items.includes(item)));
        break;
      case 3:
        setList3(prev => prev.filter(item => !items.includes(item)));
        break;
    }
  };

  const handleClearList = (listNumber) => {
    switch (listNumber) {
      case 1:
        setList1([]);
        break;
      case 2:
        setList2([]);
        break;
      case 3:
        setList3([]);
        break;
    }
  };

  const getListTitle = (index) => {
    switch (index) {
      case 0: return "Problem?";
      case 1: return "Urgent?";
      case 2: return "Calendar?";
      default: return `List ${index + 1}`;
    }
  };

  const handleClipboardImport = async () => {
    try {
      const text = await navigator.clipboard.readText();
      // Create a Set to remove duplicates, then convert back to array
      const newItems = [...new Set(
        text
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0)
      )]
        .sort((a, b) => a.length - b.length);

      if (newItems.length > 0) {
        // Also remove duplicates against existing items in list1
        const uniqueNewItems = newItems.filter(item => !list1.includes(item));

        if (uniqueNewItems.length > 0) {
          setList1(prev => [...uniqueNewItems, ...prev]);
          setNotification({
            open: true,
            message: `Imported ${uniqueNewItems.length} unique items`,
            severity: 'success'
          });
        } else {
          setNotification({
            open: true,
            message: 'No new unique items to import',
            severity: 'info'
          });
        }
      }
    } catch (error) {
      console.error('Error importing from clipboard:', error);
      setNotification({
        open: true,
        message: 'Failed to import items',
        severity: 'error'
      });
    }
  };

  const handleClipboardExport = async () => {
    try {
      let currentList;
      switch (activeTab) {
        case 0:
          currentList = list1;
          break;
        case 1:
          currentList = list2.map(item => item.text || item);
          break;
        case 2:
          currentList = list3.map(item => item.text || item);
          break;
        default:
          currentList = [];
      }

      const text = currentList.join('\n');
      await navigator.clipboard.writeText(text);
      setNotification({
        open: true,
        message: `Exported ${currentList.length} items to clipboard`,
        severity: 'success'
      });
    } catch (error) {
      console.error('Error exporting to clipboard:', error);
      setNotification({
        open: true,
        message: 'Failed to export items',
        severity: 'error'
      });
    }
  };

  const handleAddItem = (listNumber, text, rating) => {
    // Normalize text by trimming and converting to lowercase for comparison
    const normalizedText = text.trim().toLowerCase();

    let itemWithRating = text;
    if (rating !== undefined) {
      if (listNumber === 2) {
        itemWithRating = `${rating},${text}`;
      } else if (listNumber === 3) {
        itemWithRating = `${rating},${rating},${text}`;
      }
    }

    // Extract text part for duplicate checking
    const getTextPart = (item) => {
      const parts = item.split(',');
      return parts[parts.length - 1].trim().toLowerCase();
    };

    switch (listNumber) {
      case 1:
        setList1(prev => {
          // Check if normalized text already exists in list1
          if (prev.some(item => item.trim().toLowerCase() === normalizedText)) return prev;
          return [itemWithRating, ...prev];
        });
        break;
      case 2:
        setList2(prev => {
          // Check if normalized text part already exists in list2
          if (prev.some(item => getTextPart(item) === normalizedText)) return prev;
          const newList = [...prev, itemWithRating];
          return newList.sort((a, b) => {
            const ratingA = parseInt(a.split(',')[0]);
            const ratingB = parseInt(b.split(',')[0]);
            return ratingB - ratingA;
          });
        });
        break;
      case 3:
        setList3(prev => {
          // Check if normalized text part already exists in list3
          if (prev.some(item => getTextPart(item) === normalizedText)) return prev;
          const newList = [...prev, itemWithRating];
          return newList.sort((a, b) => {
            const [rating1A, rating2A] = a.split(',').slice(0, 2).map(Number);
            const [rating1B, rating2B] = b.split(',').slice(0, 2).map(Number);
            if (rating1A !== rating1B) {
              return rating1B - rating1A;
            }
            return rating2B - rating2A;
          });
        });
        break;
    }
  };

  return (
    <Box
      sx={{
        height: '100vh',
        backgroundColor: '#000000',
        display: 'flex',
        overflow: 'hidden',
        p: 3,
        position: 'fixed',
        width: '100%',
        top: 0,
        left: 0
      }}
    >
      <Container
        maxWidth="xl"
        sx={{
          display: 'flex',
          height: 'calc(100vh - 48px)',
          overflow: 'hidden'
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            backgroundColor: '#111111',
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            p: 2,
            border: '1px solid #222',
            overflow: 'hidden'
          }}
        >
          {/* Header */}
          <Box
            sx={{
              mb: 2,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              pb: 2,
              borderBottom: '1px solid',
              borderColor: '#222',
              flexShrink: 0
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography
                variant="h4"
                component="h1"
                sx={{
                  fontWeight: 'bold',
                  color: '#ffffff' // White text
                }}
              >
                8020.best
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  gap: 1,
                  backgroundColor: '#222',
                  borderRadius: 1,
                  p: 0.5
                }}
              >
                <Tooltip title="Import from clipboard">
                  <IconButton
                    onClick={handleClipboardImport}
                    size="large"
                    sx={{
                      color: '#999',
                      '&:hover': {
                        backgroundColor: '#333',
                        color: '#fff'
                      }
                    }}
                  >
                    <PasteIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Export to clipboard">
                  <IconButton
                    onClick={handleClipboardExport}
                    size="large"
                    sx={{
                      color: '#999',
                      '&:hover': {
                        backgroundColor: '#333',
                        color: '#fff'
                      }
                    }}
                  >
                    <CopyIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
            <Button
              onClick={() => signOut(auth)}
              variant="outlined"
              sx={{
                color: '#999',
                borderColor: '#333',
                '&:hover': {
                  borderColor: '#666',
                  backgroundColor: '#222'
                }
              }}
            >
              Sign Out
            </Button>
          </Box>

          {/* Rating Scale */}
          <Box sx={{ mb: 2, flexShrink: 0, px: 2 }}>
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              color: '#fff'
            }}>
              <Slider
                value={rating}
                onChange={(_, newValue) => setRating(newValue)}
                min={0}
                max={1}
                step={1}
                marks={[
                  { value: 0, label: '0' },
                  { value: 1, label: '1' }
                ]}
                sx={{
                  color: '#666',
                  '& .MuiSlider-thumb': {
                    backgroundColor: '#fff',
                  },
                  '& .MuiSlider-track': {
                    backgroundColor: '#666',
                  },
                  '& .MuiSlider-rail': {
                    backgroundColor: '#444',
                  },
                  '& .MuiSlider-mark': {
                    backgroundColor: '#555',
                  },
                  '& .MuiSlider-markLabel': {
                    color: '#999',
                  }
                }}
              />
            </Box>
          </Box>

          {/* Tabs */}
          <Box sx={{ mb: 2, flexShrink: 0 }}>
            <Tabs
              value={activeTab}
              onChange={(_, newValue) => setActiveTab(newValue)}
              sx={{
                '& .MuiTabs-indicator': {
                  backgroundColor: '#fff'
                },
                '& .MuiTab-root': {
                  color: '#999',
                  fontSize: '1rem',
                  textTransform: 'none',
                  minWidth: 120,
                  '&.Mui-selected': {
                    color: '#fff',
                    fontWeight: 'bold'
                  }
                }
              }}
            >
              <Tab label={`${getListTitle(0)} (${list1.length})`} />
              <Tab label={`${getListTitle(1)} (${list2.length})`} />
              <Tab label={`${getListTitle(2)} (${list3.length})`} />
            </Tabs>
          </Box>

          {/* Active List */}
          <Box
            sx={{
              flex: 1,
              width: '100%',
              maxWidth: '800px',
              mx: 'auto',
              backgroundColor: '#1a1a1a',
              borderRadius: 1,
              boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
              border: '1px solid #333',
              overflow: 'hidden',
              display: 'flex'
            }}
          >
            {activeTab === 0 && (
              <ItemList
                items={list1}
                listNumber={1}
                selectedIndex={selectedIndex1}
                onItemSelect={(index) => handleItemSelect(1, index)}
                onDeleteItems={(items) => handleDeleteItems(1, items)}
                onClearList={() => handleClearList(1)}
                onAddItem={(text) => handleAddItem(1, text)}
              />
            )}
            {activeTab === 1 && (
              <ItemList
                items={list2}
                listNumber={2}
                selectedIndex={selectedIndex2}
                onItemSelect={(index) => handleItemSelect(2, index)}
                onDeleteItems={(items) => handleDeleteItems(2, items)}
                onClearList={() => handleClearList(2)}
                onAddItem={(text) => handleAddItem(2, text)}
              />
            )}
            {activeTab === 2 && (
              <ItemList
                items={list3}
                listNumber={3}
                selectedIndex={selectedIndex3}
                onItemSelect={(index) => handleItemSelect(3, index)}
                onDeleteItems={(items) => handleDeleteItems(3, items)}
                onClearList={() => handleClearList(3)}
                onAddItem={(text) => handleAddItem(3, text)}
              />
            )}
          </Box>

          {/* Notification */}
          <Snackbar
            open={notification.open}
            autoHideDuration={3000}
            onClose={() => setNotification(prev => ({ ...prev, open: false }))}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          >
            <Alert
              onClose={() => setNotification(prev => ({ ...prev, open: false }))}
              severity={notification.severity}
              sx={{
                width: '100%',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
              }}
            >
              {notification.message}
            </Alert>
          </Snackbar>
        </Box>
      </Container>
    </Box>
  );
};

export default Product;