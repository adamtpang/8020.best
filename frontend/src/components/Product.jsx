// src/components/Product.jsx

import React, { useState, useEffect } from "react";
import { signOut } from 'firebase/auth';
import { auth } from '../firebase-config';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Box,
  Container,
  Tabs,
  Tab,
  Slider,
  Typography,
  Button,
  IconButton,
  Tooltip,
  Snackbar,
  Alert,
  Avatar,
} from "@mui/material";
import {
  ContentPaste as PasteIcon,
  ContentCopy as CopyIcon,
} from '@mui/icons-material';
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
  const [rating, setRating] = useState(0);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
  const [isLoading, setIsLoading] = useState(true);

  const { loadData, saveData, isSyncing, isSyncError } = useDataPersistence();

  // Load initial data
  useEffect(() => {
    const initializeData = async () => {
      try {
        setIsLoading(true);
        const data = await loadData();
        if (data) {
          console.log('Successfully loaded data:', data);
          setList1(data.list1 || []);
          setList2(data.list2 || []);
          setList3(data.list3 || []);
        } else {
          console.log('No data loaded, using empty lists');
          setList1([]);
          setList2([]);
          setList3([]);
        }
      } catch (error) {
        console.error('Error initializing data:', error);
        setNotification({
          open: true,
          message: 'Failed to load your data. Please try refreshing the page.',
          severity: 'error'
        });
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();
  }, [loadData]);

  // Save data when lists change
  useEffect(() => {
    if (isLoading) return; // Don't save while initial load is happening

    const saveTimeout = setTimeout(async () => {
      try {
        await saveData({ list1, list2, list3 });
        console.log('Data saved successfully');
      } catch (error) {
        console.error('Error saving data:', error);
        setNotification({
          open: true,
          message: 'Failed to save your changes. Please try again.',
          severity: 'error'
        });
      }
    }, 500);

    return () => clearTimeout(saveTimeout);
  }, [list1, list2, list3, saveData, isLoading]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't handle keyboard shortcuts if user is typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

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
          handleAddItem(item, rating, activeTab + 2);
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

  const handleItemSelect = (listNumber, index) => {
    setSelectedIndex1(listNumber === 1 ? index : null);
    setSelectedIndex2(listNumber === 2 ? index : null);
    setSelectedIndex3(listNumber === 3 ? index : null);
  };

  const handleDeleteItems = (listNumber, items) => {
    console.log('Deleting items:', { listNumber, items });
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

  const handleAddItem = (text, rating = undefined, targetListNumber = null) => {
    console.log('handleAddItem called:', { text, rating, targetListNumber });

    if (!text) return;

    const cleanText = String(text).split(',').pop().trim();
    const listNumber = targetListNumber || 1;

    let itemWithRating;
    let targetList;

    switch (listNumber) {
      case 1:
        itemWithRating = cleanText;
        targetList = setList1;
        break;
      case 2:
        itemWithRating = `${rating},${cleanText}`;
        targetList = setList2;
        break;
      case 3:
        // For list3, we need to preserve both ratings
        const parts = String(text).split(',');
        const firstRating = parts.length > 1 ? parts[0] : '0';
        itemWithRating = `${firstRating},${rating},${cleanText}`;
        targetList = setList3;

        // Sort list3 by both ratings (11 > 10 > 01 > 00)
        setList3(prev => {
          const newList = [...prev, itemWithRating];
          return newList.sort((a, b) => {
            const [aImportance, aUrgency] = a.split(',');
            const [bImportance, bUrgency] = b.split(',');

            // Convert ratings to numbers for comparison
            const aScore = (Number(aImportance) * 2) + Number(aUrgency); // 11=3, 10=2, 01=1, 00=0
            const bScore = (Number(bImportance) * 2) + Number(bUrgency);

            return bScore - aScore; // Sort in descending order
          });
        });
        return; // Return early since we've already handled list3
      default:
        return;
    }

    targetList(prev => [itemWithRating, ...prev]);
  };

  const handleClipboardImport = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const newItems = [...new Set(
        text
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0)
      )];

      if (newItems.length > 0) {
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
      const currentList = activeTab === 0 ? list1 : activeTab === 1 ? list2 : list3;
      const text = currentList.join('\n');
      await navigator.clipboard.writeText(text);

      // Special message for calendar tab
      if (activeTab === 2) {
        setNotification({
          open: true,
          message: (
            <span>
              Calendar tasks copied! Visit{' '}
              <a
                href="https://caldump.com"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: '#4caf50',
                  textDecoration: 'none',
                  fontWeight: 'bold'
                }}
              >
                caldump.com
              </a>
              {' '}to easily add them to your calendar.
            </span>
          ),
          severity: 'success'
        });
      } else {
        setNotification({
          open: true,
          message: `Exported ${currentList.length} items to clipboard`,
          severity: 'success'
        });
      }
    } catch (error) {
      console.error('Error exporting to clipboard:', error);
      setNotification({
        open: true,
        message: 'Failed to export items',
        severity: 'error'
      });
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
      setNotification({
        open: true,
        message: 'Failed to sign out. Please try again.',
        severity: 'error'
      });
    }
  };

  return (
    <Box sx={{
      height: '100vh',
      backgroundColor: '#000000',
      display: 'flex',
      overflow: 'hidden',
      p: { xs: 1, sm: 2, md: 3 },
      position: 'fixed',
      width: '100%',
      top: 0,
      left: 0
    }}>
      <Container maxWidth="md" sx={{
        display: 'flex',
        height: 'calc(100vh - 16px)',
        overflow: 'hidden'
      }}>
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          maxWidth: '800px',
          margin: '0 auto',
          backgroundColor: '#111111',
          borderRadius: { xs: 1, sm: 2 },
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          p: { xs: 1, sm: 2 },
          border: '1px solid #222',
          overflow: 'hidden'
        }}>
          <Box sx={{
            mb: { xs: 1, sm: 2 },
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            pb: { xs: 1, sm: 2 },
            borderBottom: '1px solid #222',
            flexShrink: 0
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 } }}>
              <Typography
                variant="h4"
                component="h1"
                sx={{
                  fontWeight: 'bold',
                  color: '#ffffff',
                  fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' }
                }}
              >
                8020.best
              </Typography>
              <Box sx={{
                display: 'flex',
                gap: 0.5,
                backgroundColor: '#222',
                borderRadius: 1,
                p: 0.5
              }}>
                <Tooltip title="Import from clipboard">
                  <IconButton
                    onClick={handleClipboardImport}
                    size="small"
                    sx={{
                      color: '#999',
                      '&:hover': {
                        backgroundColor: '#333',
                        color: '#fff'
                      }
                    }}
                  >
                    <PasteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Export to clipboard">
                  <IconButton
                    onClick={handleClipboardExport}
                    size="small"
                    sx={{
                      color: '#999',
                      '&:hover': {
                        backgroundColor: '#333',
                        color: '#fff'
                      }
                    }}
                  >
                    <CopyIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {user?.photoURL && (
                <Avatar
                  src={user.photoURL}
                  alt={user.email}
                  sx={{
                    width: 32,
                    height: 32,
                    border: '1px solid #333'
                  }}
                />
              )}
              <Button
                onClick={handleSignOut}
                variant="outlined"
                size="small"
                sx={{
                  color: '#999',
                  borderColor: '#333',
                  '&:hover': {
                    borderColor: '#666',
                    backgroundColor: '#222'
                  },
                  px: { xs: 2, sm: 3 }
                }}
              >
                Sign Out
              </Button>
            </Box>
          </Box>

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
              mb: 2,
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

          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            sx={{
              mb: 2,
              '& .MuiTabs-indicator': {
                backgroundColor: '#fff'
              },
              '& .MuiTab-root': {
                color: '#999',
                '&.Mui-selected': {
                  color: '#fff'
                }
              }
            }}
          >
            <Tab label={`Important? (${list1.length})`} />
            <Tab label={`Urgent? (${list2.length})`} />
            <Tab label={`Calendar? (${list3.length})`} />
          </Tabs>

          <Box sx={{
            flex: 1,
            backgroundColor: '#1a1a1a',
            borderRadius: 1,
            border: '1px solid #333',
            overflow: 'hidden'
          }}>
            {activeTab === 0 && (
              <ItemList
                items={list1}
                listNumber={1}
                selectedIndex={selectedIndex1}
                onItemSelect={(index) => handleItemSelect(1, index)}
                onDeleteItems={(items) => handleDeleteItems(1, items)}
                onAddItem={handleAddItem}
                rating={rating}
              />
            )}
            {activeTab === 1 && (
              <ItemList
                items={list2}
                listNumber={2}
                selectedIndex={selectedIndex2}
                onItemSelect={(index) => handleItemSelect(2, index)}
                onDeleteItems={(items) => handleDeleteItems(2, items)}
                onAddItem={handleAddItem}
                rating={rating}
              />
            )}
            {activeTab === 2 && (
              <ItemList
                items={list3}
                listNumber={3}
                selectedIndex={selectedIndex3}
                onItemSelect={(index) => handleItemSelect(3, index)}
                onDeleteItems={(items) => handleDeleteItems(3, items)}
                onAddItem={handleAddItem}
                rating={rating}
              />
            )}
          </Box>

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