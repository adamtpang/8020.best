// src/components/Product.jsx

import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  List,
  ListItem,
  ListItemText,
  Typography,
  IconButton,
  Paper,
  Slider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  LinearProgress,
  FormGroup,
  FormControlLabel,
  Checkbox,
  TextField,
  Snackbar,
  Alert,
  Container,
} from "@mui/material";
import { Close as CloseIcon, ContentPaste, DeleteOutline, ContentCopy, HelpOutline, Add, ArrowBack } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";
import axios from "axios";
import ItemList from "./Product/ItemList";
import ExportDialog from "./Product/ExportDialog";
import ExportResultsDialog from "./Product/ExportResultsDialog";

const Product = () => {
  const auth = getAuth();
  const navigate = useNavigate();

  // Core state
  const [list1, setList1] = useState([]);  // Initial list
  const [list2, setList2] = useState([]); // With importance
  const [list3, setList3] = useState([]); // With importance & urgency
  const [selectedIndex1, setSelectedIndex1] = useState(null);
  const [selectedIndex2, setSelectedIndex2] = useState(null);
  const [selectedIndex3, setSelectedIndex3] = useState(null);
  const [sliderValue, setSliderValue] = useState(0);
  const [activeList, setActiveList] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [clipboardContent, setClipboardContent] = useState("");
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [listToClear, setListToClear] = useState(null);
  const [isInstructionsOpen, setIsInstructionsOpen] = useState(false);

  // Add new state for import progress
  const [importProgress, setImportProgress] = useState(0);
  const [totalLines, setTotalLines] = useState(0);
  const [remainingLines, setRemainingLines] = useState(0);

  // Add new state for peak counts
  const [peakCount1, setPeakCount1] = useState(0);
  const [peakCount2, setPeakCount2] = useState(0);
  const [peakCount3, setPeakCount3] = useState(0);

  // Add new state for export dialog and options
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    '1,1': true,  // 11s checked by default
    '1,0': false,
    '0,1': false,
    '0,0': false
  });

  // Add new state for text input
  const [newItem, setNewItem] = useState('');

  // Add new state for notification
  const [notification, setNotification] = useState({
    open: false,
    message: ''
  });

  // Add new state
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportResultsOpen, setExportResultsOpen] = useState(false);
  const [reductionPercent, setReductionPercent] = useState(0);

  // Add to your state declarations
  const [hasSeenInstructions, setHasSeenInstructions] = useState(() => {
    return localStorage.getItem('hasSeenInstructions') === 'true'
  });

  // Add this useEffect near the top with other useEffects
  useEffect(() => {
    // Show instructions if user hasn't seen them
    if (!hasSeenInstructions) {
      setIsInstructionsOpen(true);
    }
  }, [hasSeenInstructions]);

  // Add handler for adding items
  const handleAddItem = (e) => {
    e.preventDefault();
    if (newItem.trim()) {
      setList1(prev => [newItem.trim(), ...prev]);
      setNewItem('');
      setSelectedIndex1(0);
      setActiveList(1);
    }
  };

  // Update handleSelectItem to handleItemSelect
  const handleItemSelect = (listNumber, index) => {
    if (listNumber === 1) {
      setSelectedIndex1(index);
      setSelectedIndex2(null);
      setSelectedIndex3(null);
    } else if (listNumber === 2) {
      setSelectedIndex1(null);
      setSelectedIndex2(index);
      setSelectedIndex3(null);
    } else if (listNumber === 3) {
      setSelectedIndex1(null);
      setSelectedIndex2(null);
      setSelectedIndex3(index);
    }
    setActiveList(listNumber);
  };

  // Move items between lists
  const handleMoveToList2 = () => {
    if (selectedIndex1 !== null) {
      const selectedItem = list1[selectedIndex1];
      const importanceValue = Number(sliderValue === 1);
      const importance = importanceValue === 1;

      // Add new item and sort list2
      setList2(prevList => {
        const newList = [
          ...prevList,
          {
            importance,
            importanceValue,
            idea: selectedItem
          }
        ].sort((a, b) => {
          // Sort by importance (1s first, then 0s)
          return b.importanceValue - a.importanceValue;
        });

        return newList;
      });

      // Remove from list1
      setList1(prevList => {
        const newList = prevList.filter((_, idx) => idx !== selectedIndex1);
        if (newList.length > 0) {
          const nextIndex = selectedIndex1 < newList.length ? selectedIndex1 : newList.length - 1;
          setSelectedIndex1(nextIndex);
        } else {
          setSelectedIndex1(null);
        }
        return newList;
      });
    }
  };

  const handleMoveToList3 = () => {
    if (selectedIndex2 !== null) {
      const selectedItem = list2[selectedIndex2];
      const urgencyValue = Number(sliderValue === 1);
      const urgency = urgencyValue === 1;

      // Add new item and sort list3
      setList3(prevList => {
        const newList = [
          ...prevList,
          {
            importance: selectedItem.importance,
            importanceValue: selectedItem.importanceValue,
            urgency,
            urgencyValue,
            idea: selectedItem.idea
          }
        ].sort((a, b) => {
          // First sort by importance
          if (b.importanceValue !== a.importanceValue) {
            return b.importanceValue - a.importanceValue;
          }
          // Then by urgency if importance is equal
          return b.urgencyValue - a.urgencyValue;
        });

        return newList;
      });

      // Remove item from list2 and update selection
      setList2(prevList => {
        const newList = prevList.filter((_, idx) => idx !== selectedIndex2);
        if (newList.length > 0) {
          const nextIndex = selectedIndex2 < newList.length ? selectedIndex2 : newList.length - 1;
          setSelectedIndex2(nextIndex);
        } else {
          setSelectedIndex2(null);
        }
        return newList;
      });
    }
  };

  // Remove items
  const handleRemoveItem = (listNumber) => {
    if (listNumber === 1 && selectedIndex1 !== null) {
      setList1(prevList => {
        const newList = prevList.filter((_, idx) => idx !== selectedIndex1);
        if (newList.length > 0) {
          if (selectedIndex1 >= newList.length) {
            setSelectedIndex1(newList.length - 1);
          }
        } else {
          setSelectedIndex1(null);
        }
        return newList;
      });
    } else if (listNumber === 2 && selectedIndex2 !== null) {
      setList2(list2.filter((_, idx) => idx !== selectedIndex2));
      setSelectedIndex2(null);
    } else if (listNumber === 3 && selectedIndex3 !== null) {
      setList3(list3.filter((_, idx) => idx !== selectedIndex3));
      setSelectedIndex3(null);
    }
  };

  // Load data on mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          console.log('Loading data for user:', user.uid);
          const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/get-user-data/${user.uid}`);
          const userData = response.data;

          if (userData) {
            console.log('Loaded user data:', userData);
            setList1(userData.list1 || []);
            setList2(userData.list2 || []);
            setList3(userData.list3 || []);
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };

    // Add auth state listener
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        loadUserData();
      }
    });

    // Initial load
    loadUserData();

    // Cleanup
    return () => unsubscribe();
  }, []);

  // Save data when it changes
  useEffect(() => {
    const saveUserData = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          await axios.post(`${import.meta.env.VITE_API_URL}/api/save-user-data`, {
            userId: user.uid,
            list1,
            list2,
            list3
          });
        }
      } catch (error) {
        console.error('Error saving user data:', error);
      }
    };

    if (list1.length > 0 || list2.length > 0 || list3.length > 0) {
      const debounceTimer = setTimeout(saveUserData, 1000);
      return () => clearTimeout(debounceTimer);
    }
  }, [list1, list2, list3]);

  // Update the clipboard import handler
  const handleClipboardImport = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const newItems = text
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);  // Filter out empty lines

      if (newItems.length > 0) {
        // Add to beginning of list1, not replace it
        setList1(prevList => [...newItems, ...prevList]);

        // Update peak count if needed
        setPeakCount1(prev => Math.max(prev, newItems.length + list1.length));

        // Auto-select first item
        setSelectedIndex1(0);
        setActiveList(1);

        setNotification({
          open: true,
          message: `Imported ${newItems.length} items`
        });
      }
    } catch (error) {
      console.error('Error importing from clipboard:', error);
      setNotification({
        open: true,
        message: 'Failed to import items'
      });
    }
  };

  // Add effect to auto-select top item in List 1
  useEffect(() => {
    if (list1.length > 0 && selectedIndex1 === null) {
      setSelectedIndex1(0);
      setActiveList(1);
    }
  }, [list1]);

  // Update handleConfirmImport to show progress
  const handleConfirmImport = () => {
    const newItems = clipboardContent
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    setTotalLines(newItems.length);
    setRemainingLines(newItems.length);
    setImportProgress(0);

    // Add items one by one with progress
    newItems.forEach((item, index) => {
      setTimeout(() => {
        setList1(prevList => [item, ...prevList]);
        setRemainingLines(prev => prev - 1);
        setImportProgress(((index + 1) / newItems.length) * 100);
      }, index * 50); // 50ms delay between each item
    });

    // Close dialog after all items are added
    setTimeout(() => {
      setIsDialogOpen(false);
      setClipboardContent("");
      setImportProgress(0);
      setTotalLines(0);
      setRemainingLines(0);
      setSelectedIndex1(0);
      setActiveList(1);
    }, newItems.length * 50);
  };

  // Helper function to get currently selected item text
  const getSelectedItemText = () => {
    if (selectedIndex1 !== null) return list1[selectedIndex1];
    if (selectedIndex2 !== null) {
      const item = list2[selectedIndex2];
      return `${item.importanceValue}, ${item.idea}`;
    }
    if (selectedIndex3 !== null) {
      const item = list3[selectedIndex3];
      return `${item.importanceValue},${item.urgencyValue},${item.idea}`;
    }
    return null;
  };

  // Update the keyboard event handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        setSliderValue(0);
      } else if (e.key === 'ArrowRight') {
        setSliderValue(1);
      } else if (e.key === 'Enter') {
        if (selectedIndex1 !== null) {
          handleMoveToList2();
        } else if (selectedIndex2 !== null) {
          handleMoveToList3();
        }
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedIndex1 !== null) {
          setList1(prevList => {
            const newList = prevList.filter((_, idx) => idx !== selectedIndex1);
            if (newList.length > 0) {
              if (selectedIndex1 >= newList.length) {
                setSelectedIndex1(newList.length - 1);
              }
            } else {
              setSelectedIndex1(null);
            }
            return newList;
          });
        } else if (selectedIndex2 !== null) {
          setList2(prevList => {
            const newList = prevList.filter((_, idx) => idx !== selectedIndex2);
            if (newList.length > 0) {
              if (selectedIndex2 >= newList.length) {
                setSelectedIndex2(newList.length - 1);
              }
            } else {
              setSelectedIndex2(null);
            }
            return newList;
          });
        } else if (selectedIndex3 !== null) {
          setList3(prevList => {
            const newList = prevList.filter((_, idx) => idx !== selectedIndex3);
            if (newList.length > 0) {
              if (selectedIndex3 >= newList.length) {
                setSelectedIndex3(newList.length - 1);
              }
            } else {
              setSelectedIndex3(null);
            }
            return newList;
          });
        }
      } else if (e.key === '[' || e.key === ']') {
        // Handle bracket key navigation between lists
        let nextList;
        if (e.key === '[') {
          // Move left
          if (selectedIndex2 !== null || activeList === 2) {
            nextList = 1;
            setSelectedIndex2(null);
            // Don't set selection if list is empty
            setSelectedIndex1(list1.length > 0 ? 0 : null);
          } else if (selectedIndex3 !== null || activeList === 3) {
            nextList = 2;
            setSelectedIndex3(null);
            // Don't set selection if list is empty
            setSelectedIndex2(list2.length > 0 ? 0 : null);
          }
        } else {
          // Move right (])
          if (selectedIndex1 !== null || activeList === 1) {
            nextList = 2;
            setSelectedIndex1(null);
            // Don't set selection if list is empty
            setSelectedIndex2(list2.length > 0 ? 0 : null);
          } else if (selectedIndex2 !== null || activeList === 2) {
            nextList = 3;
            setSelectedIndex2(null);
            // Don't set selection if list is empty
            setSelectedIndex3(list3.length > 0 ? 0 : null);
          }
        }
        if (nextList) {
          setActiveList(nextList);
        }
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();

        const getCurrentList = () => {
          if (activeList === 1) return list1;
          if (activeList === 2) return list2;
          if (activeList === 3) return list3;
          return [];
        };

        const getCurrentIndex = () => {
          if (activeList === 1) return selectedIndex1;
          if (activeList === 2) return selectedIndex2;
          if (activeList === 3) return selectedIndex3;
          return null;
        };

        const setCurrentIndex = (newIndex) => {
          console.log('Setting index:', newIndex, 'for list:', activeList);
          if (activeList === 1) setSelectedIndex1(newIndex);
          if (activeList === 2) setSelectedIndex2(newIndex);
          if (activeList === 3) setSelectedIndex3(newIndex);
        };

        const currentList = getCurrentList();
        const currentIndex = getCurrentIndex();

        if (currentList.length > 0) {
          if (e.key === 'ArrowUp') {
            const newIndex = currentIndex === 0 ? currentList.length - 1 : currentIndex - 1;
            console.log('ArrowUp:', { currentIndex, newIndex, listLength: currentList.length });
            setCurrentIndex(newIndex);
          } else {
            const newIndex = currentIndex === currentList.length - 1 ? 0 : currentIndex + 1;
            console.log('ArrowDown:', { currentIndex, newIndex, listLength: currentList.length });
            setCurrentIndex(newIndex);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    selectedIndex1,
    selectedIndex2,
    selectedIndex3,
    list1.length,
    list2.length,
    list3.length,
    sliderValue,
    activeList
  ]);

  const handleClearConfirm = () => {
    switch(listToClear) {
      case 1:
        setList1([]);
        setSelectedIndex1(null);
        break;
      case 2:
        setList2([]);
        setSelectedIndex2(null);
        break;
      case 3:
        setList3([]);
        setSelectedIndex3(null);
        break;
    }
    setClearConfirmOpen(false);
    setListToClear(null);
  };

  // Update export handler
  const handleExportList3 = () => {
    setExportDialogOpen(true);
  };

  const handleExportConfirm = async (selectedItems, reductionPercent) => {
    try {
      const exportText = selectedItems
        .map(item => `${item.importanceValue},${item.urgencyValue},${item.idea}`)
        .join('\n');

      await navigator.clipboard.writeText(exportText);
      setExportDialogOpen(false);
      setReductionPercent(reductionPercent);
      setExportResultsOpen(true);
    } catch (error) {
      console.error('Error exporting:', error);
      setNotification({
        open: true,
        message: 'Failed to export items'
      });
    }
  };

  // Add copy handler function
  const handleItemCopy = async (item) => {
    try {
      let textToCopy;
      if (typeof item === 'string') {
        textToCopy = item;
      } else if (item.urgencyValue !== undefined) {
        textToCopy = `${item.importanceValue},${item.urgencyValue},${item.idea}`;
      } else {
        textToCopy = `${item.importanceValue},${item.idea}`;
      }

      await navigator.clipboard.writeText(textToCopy);
      setNotification({
        open: true,
        message: 'Item copied to clipboard'
      });
    } catch (error) {
      console.error('Failed to copy:', error);
      setNotification({
        open: true,
        message: 'Failed to copy item'
      });
    }
  };

  // Update useEffect to track peak counts
  useEffect(() => {
    if (list1.length > peakCount1) setPeakCount1(list1.length);
  }, [list1.length]);

  useEffect(() => {
    if (list2.length > peakCount2) setPeakCount2(list2.length);
  }, [list2.length]);

  useEffect(() => {
    if (list3.length > peakCount3) setPeakCount3(list3.length);
  }, [list3.length]);

  // Calculate total items for export dialog
  const totalItemsAcrossAllLists = list1.length + list2.length + list3.length;

  // Update the instructions dialog close handler
  const handleInstructionsClose = () => {
    setIsInstructionsOpen(false);
    setHasSeenInstructions(true);
    localStorage.setItem('hasSeenInstructions', 'true');
  };

  return (
    <Container maxWidth="xl" sx={{ height: '100vh', display: 'flex' }}>
      <Box sx={{
        width: '100%',
        maxWidth: '1400px',  // Adjust this value to control max width
        margin: '0 auto',    // Center horizontally
        height: { xs: '100vh', md: '85vh' },
        overflow: 'hidden',
        display: "flex",
        flexDirection: "column",
        p: { xs: 1, md: 2 },
        gap: 2,
        position: 'relative'
      }}>
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          mb: 2
        }}>
          <IconButton
            onClick={() => navigate('/')}
            size="small"
            sx={{
              color: 'black',
              '&:hover': {
                backgroundColor: 'rgba(0,0,0,0.04)'
              }
            }}
          >
            <ArrowBack />
          </IconButton>
        </Box>

        {/* Row 1: Slider */}
        <Box sx={{
          display: 'flex',
          gap: 2,
          alignItems: 'center',
          width: '100%'
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
              '& .MuiSlider-track': {
                backgroundColor: 'black',
              },
              '& .MuiSlider-rail': {
                backgroundColor: '#ccc',
              },
              '& .MuiSlider-thumb': {
                backgroundColor: 'black',
              },
              '& .MuiSlider-mark': {
                backgroundColor: '#bbb',
              },
              '& .MuiSlider-markActive': {
                backgroundColor: 'black',
              }
            }}
            size="small"
          />
        </Box>

        {/* Row 2: Import/Export Controls */}
        <Box sx={{
          display: 'flex',
          gap: 2,
          alignItems: 'center'
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

        {/* Row 3: Lists */}
        <Box sx={{
          display: "flex",
          gap: 2,
          flex: 1,
          minHeight: 0,
          justifyContent: 'center'  // Center lists horizontally
        }}>
          <ItemList
            items={list1}
            selectedIndex={selectedIndex1}
            onItemSelect={(index) => handleItemSelect(1, index)}
            onItemCopy={handleItemCopy}
            peakCount={peakCount1}
            listNumber={1}
            onClearList={(listNum) => {
              setListToClear(listNum);
              setClearConfirmOpen(true);
            }}
          />
          <ItemList
            items={list2}
            selectedIndex={selectedIndex2}
            onItemSelect={(index) => handleItemSelect(2, index)}
            onItemCopy={handleItemCopy}
            peakCount={peakCount2}
            listNumber={2}
            onClearList={(listNum) => {
              setListToClear(listNum);
              setClearConfirmOpen(true);
            }}
          />
          <ItemList
            items={list3}
            selectedIndex={selectedIndex3}
            onItemSelect={(index) => handleItemSelect(3, index)}
            onItemCopy={handleItemCopy}
            peakCount={peakCount3}
            listNumber={3}
            onClearList={(listNum) => {
              setListToClear(listNum);
              setClearConfirmOpen(true);
            }}
          />
        </Box>

        {/* Help Button */}
        <IconButton
          onClick={() => setIsInstructionsOpen(true)}
          size="small"
          sx={{
            alignSelf: 'flex-start',
            backgroundColor: 'black',
            color: 'white',
            '&:hover': {
              backgroundColor: '#333'
            },
            width: 40,
            height: 40
          }}
        >
          <HelpOutline />
        </IconButton>

        {/* Instructions Dialog */}
        <Dialog
          open={isInstructionsOpen}
          onClose={handleInstructionsClose}  // Use new handler
          maxWidth="md"
          fullWidth
        >
          <DialogTitle sx={{ borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
            How to Use Hower
          </DialogTitle>
          <DialogContent>
            <Box sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Step by Step Guide</Typography>
              <Box sx={{ pl: 2 }}>
                <Typography paragraph>
                  1. <b>Import Items</b><br />
                  • Paste your items using the clipboard icon, or<br />
                  • Type items one by one in the input box
                </Typography>

                <Typography paragraph>
                  2. <b>Rate Items by Importance</b><br />
                  • Navigate items using Up/Down arrow keys<br />
                  • Use Left/Right arrow keys to set importance (0 or 1)<br />
                  • Press Enter to move item to next list
                </Typography>

                <Typography paragraph>
                  3. <b>Rate Items by Urgency</b><br />
                  • Navigate to second list using ] key<br />
                  • Use Left/Right arrow keys to set urgency (0 or 1)<br />
                  • Press Enter to move item to final list
                </Typography>

                <Typography paragraph>
                  4. <b>Review Final List</b><br />
                  • Items are automatically sorted by importance and urgency<br />
                  • Format: importance,urgency,item<br />
                  • Use the copy icon to export your prioritized items
                </Typography>
              </Box>

              <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Keyboard Shortcuts</Typography>
              <Box sx={{ pl: 2 }}>
                <Typography>
                  • <b>[ and ]</b> - Move between lists<br />
                  • <b>↑/↓</b> - Navigate items<br />
                  • <b>←/→</b> - Toggle rating (0/1)<br />
                  • <b>Enter</b> - Move item forward<br />
                  • <b>Delete/Backspace</b> - Remove item
                </Typography>
              </Box>

              <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Item Ratings</Typography>
              <Box sx={{ pl: 2 }}>
                <Typography>
                  • <b>1,1</b> - Important & Urgent<br />
                  • <b>1,0</b> - Important, Not Urgent<br />
                  • <b>0,1</b> - Not Important, Urgent<br />
                  • <b>0,0</b> - Not Important, Not Urgent
                </Typography>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={handleInstructionsClose}  // Use new handler
              variant="contained"
              sx={{
                backgroundColor: 'black',
                '&:hover': {
                  backgroundColor: '#333',
                }
              }}
            >
              Got it
            </Button>
          </DialogActions>
        </Dialog>

        {/* Add Import Dialog */}
        <Dialog
          open={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          aria-labelledby="clipboard-preview-dialog-title"
        >
          <DialogTitle id="clipboard-preview-dialog-title">
            Import from Clipboard
          </DialogTitle>
          <DialogContent>
            <DialogContentText>
              Do you want to add the following items to the top of List 1?
            </DialogContentText>
            <Box sx={{ mt: 2, maxHeight: 200, overflow: "auto" }}>
              {clipboardContent.split("\n").map((line, index) => (
                <Typography key={index} variant="body2">
                  {line}
                </Typography>
              ))}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setIsDialogOpen(false);
                setImportProgress(0);
                setTotalLines(0);
                setRemainingLines(0);
              }}
              disabled={importProgress > 0}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmImport}
              autoFocus
              disabled={importProgress > 0}
            >
              Confirm
            </Button>
          </DialogActions>
        </Dialog>

        {/* Add Clear Confirmation Dialog */}
        <Dialog
          open={clearConfirmOpen}
          onClose={() => {
            setClearConfirmOpen(false);
            setListToClear(null);
          }}
        >
          <DialogTitle>Clear List</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to clear this list?
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setClearConfirmOpen(false);
                setListToClear(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleClearConfirm}
              color="error"
              autoFocus
            >
              Clear
            </Button>
          </DialogActions>
        </Dialog>

        {/* Add Export Dialog */}
        <ExportDialog
          open={exportDialogOpen}
          onClose={() => setExportDialogOpen(false)}
          items={list3}
          onExport={handleExportConfirm}
          totalItemsAcrossAllLists={totalItemsAcrossAllLists}
        />

        <ExportResultsDialog
          open={exportResultsOpen}
          onClose={() => setExportResultsOpen(false)}
          reductionPercent={reductionPercent}
        />

        {/* Add Snackbar component at the end of your JSX */}
        <Snackbar
          open={notification.open}
          autoHideDuration={2000}
          onClose={() => setNotification({ ...notification, open: false })}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert
            onClose={() => setNotification({ ...notification, open: false })}
            severity="success"
            sx={{
              backgroundColor: 'black',
              color: 'white',
              '.MuiAlert-icon': {
                color: 'white'
              }
            }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      </Box>
    </Container>
  );
};

export default Product;