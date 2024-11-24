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
import { Close as CloseIcon, ContentPaste, DeleteOutline, ContentCopy, HelpOutline, Add, ArrowBack, DeleteOutlined } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";
import axios from "axios";
import ItemList from "./Product/ItemList";
import ExportDialog from "./Product/ExportDialog";
import ExportResultsDialog from "./Product/ExportResultsDialog";
import TrashDialog from './Product/TrashDialog';
import { auth } from '../firebase-config';
import MainLayout from './Product/components/MainLayout';
import useDataPersistence from './Product/hooks/useDataPersistence';
import ClearConfirmDialog from './Product/dialogs/ClearConfirmDialog';
import InstructionsDialog from './Product/dialogs/InstructionsDialog';
import ReadingModeControls from './Product/components/ReadingModeControls';

const Product = () => {
  const auth = getAuth();
  const navigate = useNavigate();

  // Initialize all state at the top
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [list1, setList1] = useState([]);
  const [list2, setList2] = useState([]);
  const [list3, setList3] = useState([]);
  const [selectedIndex1, setSelectedIndex1] = useState(null);
  const [selectedIndex2, setSelectedIndex2] = useState(null);
  const [selectedIndex3, setSelectedIndex3] = useState(null);
  const [sliderValue, setSliderValue] = useState(0);
  const [activeList, setActiveList] = useState(1);
  const [newItem, setNewItem] = useState('');
  const [trashedItems, setTrashedItems] = useState([]);
  const [isTrashOpen, setIsTrashOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportResultsOpen, setExportResultsOpen] = useState(false);
  const [reductionPercent, setReductionPercent] = useState(0);
  const [isInstructionsOpen, setIsInstructionsOpen] = useState(false);
  const [hasSeenInstructions, setHasSeenInstructions] = useState(false);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [peakCount1, setPeakCount1] = useState(0);
  const [peakCount2, setPeakCount2] = useState(0);
  const [peakCount3, setPeakCount3] = useState(0);
  const [listToClear, setListToClear] = useState(null);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isReadingMode, setIsReadingMode] = useState(false);
  const [speechRate, setSpeechRate] = useState(1);
  const speechSynthesis = window.speechSynthesis;
  const [currentUtterance, setCurrentUtterance] = useState(null);

  const { isSyncing, isSyncError } = useDataPersistence({
    user,
    isAuthReady,
    list1,
    list2,
    list3,
    trashedItems,
    setList1,
    setList2,
    setList3,
    setTrashedItems,
    setIsLoading
  });

  // Show instructions on first visit
  useEffect(() => {
    // Always show instructions when component mounts
    setIsInstructionsOpen(true);
  }, []);

  // Track peak counts
  useEffect(() => {
    if (list1.length > peakCount1) setPeakCount1(list1.length);
  }, [list1.length, peakCount1]);

  useEffect(() => {
    if (list2.length > peakCount2) setPeakCount2(list2.length);
  }, [list2.length, peakCount2]);

  useEffect(() => {
    if (list3.length > peakCount3) setPeakCount3(list3.length);
  }, [list3.length, peakCount3]);

  // Keyboard handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isInputFocused) return;

      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
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
          if (activeList === 1) setSelectedIndex1(newIndex);
          if (activeList === 2) setSelectedIndex2(newIndex);
          if (activeList === 3) setSelectedIndex3(newIndex);

          requestAnimationFrame(() => {
            const listElement = document.querySelector(`#list-${activeList}`);
            const itemElement = listElement?.querySelector(`[data-index="${newIndex}"]`);

            if (listElement && itemElement) {
              const listRect = listElement.getBoundingClientRect();
              const itemRect = itemElement.getBoundingClientRect();

              // Calculate if item is outside visible area
              const isAbove = itemRect.top < listRect.top;
              const isBelow = itemRect.bottom > listRect.bottom;

              if (isAbove || isBelow) {
                itemElement.scrollIntoView({
                  block: isAbove ? 'start' : 'end',
                  behavior: 'auto'
                });
              }
            }
          });
        };

        const currentList = getCurrentList();
        const currentIndex = getCurrentIndex();

        if (currentList.length > 0) {
          if (e.key === 'ArrowUp') {
            const newIndex = currentIndex === null || currentIndex === 0
              ? currentList.length - 1
              : currentIndex - 1;
            setCurrentIndex(newIndex);
          } else {
            const newIndex = currentIndex === null || currentIndex === currentList.length - 1
              ? 0
              : currentIndex + 1;
            setCurrentIndex(newIndex);
          }
        }
      } else if (e.key === 'ArrowLeft') {
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
        if (activeList === 1 && selectedIndex1 !== null) {
          handleRemoveItem(1);
        } else if (activeList === 2 && selectedIndex2 !== null) {
          handleRemoveItem(2);
        } else if (activeList === 3 && selectedIndex3 !== null) {
          handleRemoveItem(3);
        }
      } else if (e.key === '[' || e.key === ']') {
        if (e.key === '[') {
          const newList = Math.max(1, activeList - 1);
          setActiveList(newList);
          // Clear other selections and select top item of new list
          if (newList === 1) {
            setSelectedIndex1(list1.length > 0 ? 0 : null);
            setSelectedIndex2(null);
            setSelectedIndex3(null);
          } else if (newList === 2) {
            setSelectedIndex1(null);
            setSelectedIndex2(list2.length > 0 ? 0 : null);
            setSelectedIndex3(null);
          } else {
            setSelectedIndex1(null);
            setSelectedIndex2(null);
            setSelectedIndex3(list3.length > 0 ? 0 : null);
          }
        } else {
          const newList = Math.min(3, activeList + 1);
          setActiveList(newList);
          // Clear other selections and select top item of new list
          if (newList === 1) {
            setSelectedIndex1(list1.length > 0 ? 0 : null);
            setSelectedIndex2(null);
            setSelectedIndex3(null);
          } else if (newList === 2) {
            setSelectedIndex1(null);
            setSelectedIndex2(list2.length > 0 ? 0 : null);
            setSelectedIndex3(null);
          } else {
            setSelectedIndex1(null);
            setSelectedIndex2(null);
            setSelectedIndex3(list3.length > 0 ? 0 : null);
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
    activeList,
    isInputFocused
  ]);

  // Add handler for adding items
  const handleAddItem = (e) => {
    e.preventDefault();
    const item = newItem.trim();
    if (item) {
      // Check if item looks like a rated item
      const ratedPattern = /^[01],[01],/;
      if (!ratedPattern.test(item)) {
        setList1(prev => [item, ...prev]);
        setNewItem('');
        setSelectedIndex1(0);
        setActiveList(1);
      } else {
        setNotification({
          open: true,
          message: 'Cannot add rated items to List 1'
        });
      }
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
        const newItem = {
          importance,
          importanceValue,
          idea: selectedItem
        };

        // Find where this importance group starts
        const groupStartIndex = prevList.findIndex(item =>
          item.importanceValue === newItem.importanceValue
        );

        // If no items with this importance value exist
        if (groupStartIndex === -1) {
          // If it's importance 1, add to start of list
          if (newItem.importanceValue === 1) {
            return [newItem, ...prevList];
          }
          // If it's importance 0, add to end of list
          return [...prevList, newItem];
        }

        // Insert at the start of its importance group
        const newList = [...prevList];
        newList.splice(groupStartIndex, 0, newItem);
        return newList;
      });

      // Remove from list1 and select next item
      setList1(prevList => {
        const newList = prevList.filter((_, idx) => idx !== selectedIndex1);
        if (newList.length > 0) {
          const nextIndex = selectedIndex1 < newList.length ? selectedIndex1 : newList.length - 1;
          setSelectedIndex1(nextIndex);

          // Read the next item if reading mode is on
          if (isReadingMode) {
            const nextItem = newList[nextIndex];
            const utterance = new SpeechSynthesisUtterance(nextItem);
            utterance.rate = speechRate;
            if (currentUtterance) {
              speechSynthesis.cancel();
            }
            setCurrentUtterance(utterance);
            speechSynthesis.speak(utterance);
          }
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
        const newItem = {
          importance: selectedItem.importance,
          importanceValue: selectedItem.importanceValue,
          urgency,
          urgencyValue,
          idea: selectedItem.idea
        };

        // Find the start of the appropriate priority group
        const findGroupStart = (imp, urg) => {
          return prevList.findIndex(item =>
            item.importanceValue === imp && item.urgencyValue === urg
          );
        };

        // Determine where to insert based on priority
        let insertIndex;
        if (newItem.importanceValue === 1 && newItem.urgencyValue === 1) {
          // 1,1 goes at the very top
          insertIndex = findGroupStart(1, 1);
          if (insertIndex === -1) insertIndex = 0;
        } else if (newItem.importanceValue === 1 && newItem.urgencyValue === 0) {
          // 1,0 goes after 1,1 group
          insertIndex = findGroupStart(1, 0);
          if (insertIndex === -1) {
            insertIndex = prevList.findIndex(item =>
              item.importanceValue === 0
            );
            if (insertIndex === -1) insertIndex = prevList.length;
          }
        } else if (newItem.importanceValue === 0 && newItem.urgencyValue === 1) {
          // 0,1 goes after 1,0 group
          insertIndex = findGroupStart(0, 1);
          if (insertIndex === -1) {
            insertIndex = prevList.findIndex(item =>
              item.importanceValue === 0 && item.urgencyValue === 0
            );
            if (insertIndex === -1) insertIndex = prevList.length;
          }
        } else {
          // 0,0 goes at the end
          insertIndex = findGroupStart(0, 0);
          if (insertIndex === -1) insertIndex = prevList.length;
        }

        // Insert at the determined position
        const newList = [...prevList];
        newList.splice(insertIndex, 0, newItem);
        return newList;
      });

      // Remove from list2 and select next item
      setList2(prevList => {
        const newList = prevList.filter((_, idx) => idx !== selectedIndex2);
        if (newList.length > 0) {
          const nextIndex = selectedIndex2 < newList.length ? selectedIndex2 : newList.length - 1;
          setSelectedIndex2(nextIndex);

          // Read the next item if reading mode is on
          if (isReadingMode) {
            const nextItem = newList[nextIndex];
            const utterance = new SpeechSynthesisUtterance(nextItem.idea);
            utterance.rate = speechRate;
            if (currentUtterance) {
              speechSynthesis.cancel();
            }
            setCurrentUtterance(utterance);
            speechSynthesis.speak(utterance);
          }
        } else {
          setSelectedIndex2(null);
        }
        return newList;
      });
    }
  };

  // Remove items
  const handleRemoveItem = (listNumber) => {
    console.log('Removing item from list:', listNumber); // Debug log

    if (listNumber === 1 && selectedIndex1 !== null) {
      const itemToTrash = list1[selectedIndex1];
      console.log('Adding to trash:', itemToTrash); // Debug log
      setTrashedItems(prev => [itemToTrash, ...prev]);

      setList1(prevList => {
        const newList = prevList.filter((_, idx) => idx !== selectedIndex1);
        if (newList.length > 0) {
          setSelectedIndex1(selectedIndex1 >= newList.length ? newList.length - 1 : selectedIndex1);
        } else {
          setSelectedIndex1(null);
        }
        return newList;
      });
    } else if (listNumber === 2 && selectedIndex2 !== null) {
      const itemToTrash = list2[selectedIndex2];
      console.log('Adding to trash:', itemToTrash); // Debug log
      setTrashedItems(prev => [itemToTrash, ...prev]);

      setList2(prevList => {
        const newList = prevList.filter((_, idx) => idx !== selectedIndex2);
        if (newList.length > 0) {
          setSelectedIndex2(selectedIndex2 >= newList.length ? newList.length - 1 : selectedIndex2);
        } else {
          setSelectedIndex2(null);
        }
        return newList;
      });
    } else if (listNumber === 3 && selectedIndex3 !== null) {
      const itemToTrash = list3[selectedIndex3];
      console.log('Adding to trash:', itemToTrash); // Debug log
      setTrashedItems(prev => [itemToTrash, ...prev]);

      setList3(prevList => {
        const newList = prevList.filter((_, idx) => idx !== selectedIndex3);
        if (newList.length > 0) {
          setSelectedIndex3(selectedIndex3 >= newList.length ? newList.length - 1 : selectedIndex3);
        } else {
          setSelectedIndex3(null);
        }
        return newList;
      });
    }
  };

  // Load data on mount
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      console.log('Auth state changed:', user?.email);
      setUser(user);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Update the clipboard import handler
  const handleClipboardImport = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const newItems = text
        .split('\n')
        .map(line => line.trim())
        // Filter out empty lines and duplicates
        .filter((line, index, self) => {
          if (line.length === 0) return false;
          // Check if it's a duplicate in the new items
          if (self.indexOf(line) !== index) return false;
          // Check if it already exists in list1
          if (list1.includes(line)) return false;
          // Check if it's a rated item (1,1 or 1,0 etc)
          const ratedPattern = /^[01],[01],/;
          return !ratedPattern.test(line);
        })
        // Sort by character length
        .sort((a, b) => {
          // First by length
          const lengthDiff = a.length - b.length;
          // If same length, sort alphabetically
          if (lengthDiff === 0) {
            return a.localeCompare(b);
          }
          return lengthDiff;
        });

      if (newItems.length > 0) {
        setList1(prevList => [...newItems, ...prevList]);
        setPeakCount1(prev => Math.max(prev, newItems.length + list1.length));
        setSelectedIndex1(0);
        setActiveList(1);

        handleNotification(
          `Imported ${newItems.length} unique items${
            text.split('\n').filter(line => line.trim().length > 0).length > newItems.length
              ? ' (duplicates removed)'
              : ''
          }`
        );
      } else {
        handleNotification('No new items to import', 'info');
      }
    } catch (error) {
      console.error('Error importing from clipboard:', error);
      handleNotification('Failed to import items', 'error');
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
      if (isInputFocused) return;

      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
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
          if (activeList === 1) setSelectedIndex1(newIndex);
          if (activeList === 2) setSelectedIndex2(newIndex);
          if (activeList === 3) setSelectedIndex3(newIndex);
        };

        const currentList = getCurrentList();
        const currentIndex = getCurrentIndex();

        if (currentList.length > 0) {
          if (e.key === 'ArrowUp') {
            // If at top or no selection, go to bottom
            const newIndex = currentIndex === null || currentIndex === 0
              ? currentList.length - 1
              : currentIndex - 1;
            setCurrentIndex(newIndex);

            // Scroll into view if needed
            const element = document.getElementById(`list-${activeList}-item-${newIndex}`);
            if (element) {
              element.scrollIntoView({ block: 'nearest' });
            }
          } else {
            // If at bottom or no selection, go to top
            const newIndex = currentIndex === null || currentIndex === currentList.length - 1
              ? 0
              : currentIndex + 1;
            setCurrentIndex(newIndex);

            // Scroll into view if needed
            const element = document.getElementById(`list-${activeList}-item-${newIndex}`);
            if (element) {
              element.scrollIntoView({ block: 'nearest' });
            }
          }
        }
      } else if (e.key === 'ArrowLeft') {
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
        if (activeList === 1 && selectedIndex1 !== null) {
          handleRemoveItem(1);
        } else if (activeList === 2 && selectedIndex2 !== null) {
          handleRemoveItem(2);
        } else if (activeList === 3 && selectedIndex3 !== null) {
          handleRemoveItem(3);
        }
      } else if (e.key === '[' || e.key === ']') {
        if (e.key === '[') {
          const newList = Math.max(1, activeList - 1);
          setActiveList(newList);
          // Clear other selections and select top item of new list
          if (newList === 1) {
            setSelectedIndex1(list1.length > 0 ? 0 : null);
            setSelectedIndex2(null);
            setSelectedIndex3(null);
          } else if (newList === 2) {
            setSelectedIndex1(null);
            setSelectedIndex2(list2.length > 0 ? 0 : null);
            setSelectedIndex3(null);
          } else {
            setSelectedIndex1(null);
            setSelectedIndex2(null);
            setSelectedIndex3(list3.length > 0 ? 0 : null);
          }
        } else {
          const newList = Math.min(3, activeList + 1);
          setActiveList(newList);
          // Clear other selections and select top item of new list
          if (newList === 1) {
            setSelectedIndex1(list1.length > 0 ? 0 : null);
            setSelectedIndex2(null);
            setSelectedIndex3(null);
          } else if (newList === 2) {
            setSelectedIndex1(null);
            setSelectedIndex2(list2.length > 0 ? 0 : null);
            setSelectedIndex3(null);
          } else {
            setSelectedIndex1(null);
            setSelectedIndex2(null);
            setSelectedIndex3(list3.length > 0 ? 0 : null);
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
    activeList,
    isInputFocused
  ]);

  const handleClearConfirm = () => {
    if (listToClear === 1) {
      // Move items to trash before clearing
      setTrashedItems(prev => [...list1, ...prev]);
      setList1([]);
      setSelectedIndex1(null);
    } else if (listToClear === 2) {
      setTrashedItems(prev => [...list2, ...prev]);
      setList2([]);
      setSelectedIndex2(null);
    } else if (listToClear === 3) {
      setTrashedItems(prev => [...list3, ...prev]);
      setList3([]);
      setSelectedIndex3(null);
    }

    setClearConfirmOpen(false);
    setListToClear(null);

    setNotification({
      open: true,
      message: `List ${listToClear} cleared`
    });
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

  // Calculate total items for export dialog
  const totalItemsAcrossAllLists = list1.length + list2.length + list3.length;

  // Update the instructions dialog close handler
  const handleInstructionsClose = () => {
    setIsInstructionsOpen(false);
    setHasSeenInstructions(true);
  };

  // Add restore handler
  const handleRestoreItem = (index) => {
    const item = trashedItems[index];

    // Convert any item type back to a simple string for list1
    const itemText = typeof item === 'string' ? item : item.idea;

    // Add to beginning of list1
    setList1(prev => [itemText, ...prev]);

    // Remove from trash
    setTrashedItems(prev => prev.filter((_, i) => i !== index));
    setNotification({
      open: true,
      message: 'Item restored to List 1'
    });
  };

  // Update notification handling
  const handleNotification = (message, severity = 'success') => {
    setNotification({
      open: true,
      message,
      severity
    });
  };

  // Log when trashedItems changes
  useEffect(() => {
    console.log('TrashedItems updated:', trashedItems);
  }, [trashedItems]);

  // Add this effect to handle text-to-speech when selection changes
  useEffect(() => {
    if (!isReadingMode) {
      if (currentUtterance) {
        speechSynthesis.cancel();
      }
      return;
    }

    const selectedItem = getSelectedItemText();
    if (selectedItem) {
      if (currentUtterance) {
        speechSynthesis.cancel();
      }

      const utterance = new SpeechSynthesisUtterance(selectedItem);
      utterance.rate = speechRate;
      setCurrentUtterance(utterance);
      speechSynthesis.speak(utterance);
    }
  }, [selectedIndex1, selectedIndex2, selectedIndex3, isReadingMode, speechRate]);

  // Add cleanup effect
  useEffect(() => {
    return () => {
      if (currentUtterance) {
        speechSynthesis.cancel();
      }
    };
  }, []);

  // In Product.jsx, add the delete handler
  const handleDeleteItems = (listNumber, itemsToDelete) => {
    if (listNumber === 1) {
      setList1(prev => {
        const newList = prev.filter(item => !itemsToDelete.includes(item));
        setTrashedItems(prev => [...itemsToDelete, ...prev]);
        return newList;
      });
    } else if (listNumber === 2) {
      setList2(prev => {
        const newList = prev.filter(item => !itemsToDelete.some(deleteItem => deleteItem.idea === item.idea));
        setTrashedItems(prev => [...itemsToDelete, ...prev]);
        return newList;
      });
    } else if (listNumber === 3) {
      setList3(prev => {
        const newList = prev.filter(item => !itemsToDelete.some(deleteItem => deleteItem.idea === item.idea));
        setTrashedItems(prev => [...itemsToDelete, ...prev]);
        return newList;
      });
    }

    setNotification({
      open: true,
      message: `Moved ${itemsToDelete.length} item${itemsToDelete.length > 1 ? 's' : ''} to trash`,
      severity: 'success'
    });
  };

  return (
    <>
      <MainLayout
        navigate={navigate}
        sliderValue={sliderValue}
        setSliderValue={setSliderValue}
        newItem={newItem}
        setNewItem={setNewItem}
        handleClipboardImport={handleClipboardImport}
        handleAddItem={handleAddItem}
        handleExportList3={handleExportList3}
        setIsInputFocused={setIsInputFocused}
        setSelectedIndex1={setSelectedIndex1}
        setSelectedIndex2={setSelectedIndex2}
        setSelectedIndex3={setSelectedIndex3}
        setActiveList={setActiveList}
        setIsInstructionsOpen={setIsInstructionsOpen}
        setIsTrashOpen={setIsTrashOpen}
        isSyncing={isSyncing}
        isSyncError={isSyncError}
        readingModeControls={
          <ReadingModeControls
            isReadingMode={isReadingMode}
            setIsReadingMode={setIsReadingMode}
            speechRate={speechRate}
            setSpeechRate={setSpeechRate}
          />
        }
      >
        {/* Lists Container */}
        <Box sx={{
          display: "flex",
          gap: 2,
          flex: 1,
          minHeight: 0,
          justifyContent: 'center',
          '& > *': {
            flex: '1 0 calc(33.333% - 11px)',
            maxWidth: 'calc(33.333% - 11px)',
            minWidth: 'calc(33.333% - 11px)',
          }
        }}>
          <ItemList
            items={list1}
            selectedIndex={selectedIndex1}
            onItemSelect={(index) => handleItemSelect(1, index)}
            onItemCopy={handleItemCopy}
            onDeleteItems={(items) => handleDeleteItems(1, items)}
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
            onDeleteItems={(items) => handleDeleteItems(2, items)}
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
            onDeleteItems={(items) => handleDeleteItems(3, items)}
            peakCount={peakCount3}
            listNumber={3}
            onClearList={(listNum) => {
              setListToClear(listNum);
              setClearConfirmOpen(true);
            }}
          />
        </Box>
      </MainLayout>

      {/* Dialogs */}
      <ClearConfirmDialog
        open={clearConfirmOpen}
        onClose={() => setClearConfirmOpen(false)}
        onConfirm={handleClearConfirm}
        listNumber={listToClear}
      />
      <InstructionsDialog
        open={isInstructionsOpen}
        onClose={() => setIsInstructionsOpen(false)}
      />
      <TrashDialog
        open={isTrashOpen}
        onClose={() => setIsTrashOpen(false)}
        trashedItems={trashedItems}
        onRestore={handleRestoreItem}
        onClearTrash={() => {
          setTrashedItems([]);
          setNotification({
            open: true,
            message: 'Trash cleared'
          });
        }}
      />
      <ExportDialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        items={list3}
        onExport={handleExportConfirm}
        list1Length={list1.length}
        list2Length={list2.length}
        list3Length={list3.length}
        trashedItemsLength={trashedItems.length}
      />
      <ExportResultsDialog
        open={exportResultsOpen}
        onClose={() => setExportResultsOpen(false)}
        reductionPercent={reductionPercent}
      />

      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={3000}
        onClose={() => setNotification(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setNotification(prev => ({ ...prev, open: false }))}
          severity={notification.severity}
          sx={{ width: '100%' }}
          elevation={6}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default Product;