import { useEffect, useState, useRef } from 'react';
import axios from '../../../axios-config';
import { auth } from '../../../firebase-config';

// Custom debounce with cancel functionality
function debounce(func, wait) {
  let timeoutId;

  // Create the debounced function
  const debounced = function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), wait);
  };

  // Add cancel method
  debounced.cancel = function() {
    clearTimeout(timeoutId);
  };

  return debounced;
}

// Add BASE_URL constant at the top
const BASE_URL = import.meta.env.VITE_API_URL || '';

const useDataPersistence = ({
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
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSyncError, setIsSyncError] = useState(false);
  const isInitialLoad = useRef(true);

  // Auth listener
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        setList1([]);
        setList2([]);
        setList3([]);
        setTrashedItems([]);
      }
    });

    return () => unsubscribe();
  }, []);

  // Load data when user is available
  useEffect(() => {
    const loadLists = async () => {
      if (!isAuthReady || !user?.email) {
        setIsLoading(false);
        return;
      }

      setIsSyncing(true);
      setIsSyncError(false);

      try {
        console.log('Loading lists for user:', user.email);
        const response = await axios.get(`/api/purchases/lists`, {
          params: { email: user.email }
        });

        if (response.data) {
          const lists = response.data;
          console.log('Loaded lists:', lists);

          // Then set new data
          if (Array.isArray(lists.list1)) {
            setList1(lists.list1);
          }
          if (Array.isArray(lists.list2)) {
            setList2(lists.list2);
          }
          if (Array.isArray(lists.list3)) {
            setList3(lists.list3);
          }
          if (Array.isArray(lists.trashedItems)) {
            setTrashedItems(lists.trashedItems);
          }
        }
      } catch (error) {
        console.error('Error loading lists:', error);
        setIsSyncError(true);
      } finally {
        setIsSyncing(false);
        setIsLoading(false);
      }
    };

    loadLists();
  }, [isAuthReady, user?.email]);

  // Save data effect
  useEffect(() => {
    const debouncedSave = debounce(async () => {
      if (!user?.email) return;

      setIsSyncing(true);
      try {
        await axios.post(`/api/purchases/save-lists`, {
          email: user.email,
          lists: {
            list1,
            list2,
            list3,
            trashedItems
          }
        });

        setIsSyncError(false);
      } catch (error) {
        console.error('Sync error:', error);
        setIsSyncError(true);
      } finally {
        setIsSyncing(false);
      }
    }, 1000);

    if (!isInitialLoad.current && user?.email) {
      debouncedSave();
    }
    isInitialLoad.current = false;

    return () => debouncedSave.cancel();
  }, [list1, list2, list3, trashedItems, user?.email]);

  // Update the clearList function
  const clearList = async (listNumber) => {
    if (!user?.email) return;

    try {
      console.log(`Clearing list ${listNumber}`);

      // Store items in trash before clearing (except when clearing trash)
      let itemsToTrash = [];
      if (listNumber === 1) itemsToTrash = [...list1];
      else if (listNumber === 2) itemsToTrash = [...list2];
      else if (listNumber === 3) itemsToTrash = [...list3];

      // Updated endpoint
      await axios.post(`${BASE_URL}/api/purchases/clear-list`, {
        email: user.email,
        listNumber,
        itemsToTrash: listNumber !== 'trash' ? itemsToTrash : []
      });

      // Update local state
      if (listNumber === 1) {
        setList1([]);
        setTrashedItems(prev => [...itemsToTrash, ...prev]);
      } else if (listNumber === 2) {
        setList2([]);
        setTrashedItems(prev => [...itemsToTrash, ...prev]);
      } else if (listNumber === 3) {
        setList3([]);
        setTrashedItems(prev => [...itemsToTrash, ...prev]);
      } else if (listNumber === 'trash') {
        setTrashedItems([]);
      }

    } catch (error) {
      console.error('Error clearing list:', error);
      setIsSyncError(true);
    }
  };

  return { isSyncing, isSyncError, clearList };
};

export default useDataPersistence;