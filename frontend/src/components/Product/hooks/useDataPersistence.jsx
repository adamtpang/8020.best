import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
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
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/purchases/load-lists`,
          {
            params: { email: user.email }
          }
        );

        if (response.data.success) {
          const lists = response.data.lists;
          console.log('Loaded lists:', lists);

          // Clear existing lists before setting new data
          setList1([]);
          setList2([]);
          setList3([]);
          setTrashedItems([]);

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
        // Process each list in chunks
        const CHUNK_SIZE = 50;

        // Helper function to save a chunk
        const saveChunk = async (items, listName, chunkIndex, totalChunks) => {
          await axios.post(
            `${import.meta.env.VITE_API_URL}/api/purchases/sync-chunk`,
            {
              email: user.email,
              listName,
              chunk: {
                items,
                index: chunkIndex,
                total: totalChunks
              }
            }
          );
        };

        // Save list1 in chunks
        for (let i = 0; i < list1.length; i += CHUNK_SIZE) {
          const chunk = list1.slice(i, i + CHUNK_SIZE);
          const totalChunks = Math.ceil(list1.length / CHUNK_SIZE);
          await saveChunk(chunk, 'list1', i / CHUNK_SIZE, totalChunks);
        }

        // Save list2 in chunks
        for (let i = 0; i < list2.length; i += CHUNK_SIZE) {
          const chunk = list2.slice(i, i + CHUNK_SIZE);
          const totalChunks = Math.ceil(list2.length / CHUNK_SIZE);
          await saveChunk(chunk, 'list2', i / CHUNK_SIZE, totalChunks);
        }

        // Save list3 in chunks
        for (let i = 0; i < list3.length; i += CHUNK_SIZE) {
          const chunk = list3.slice(i, i + CHUNK_SIZE);
          const totalChunks = Math.ceil(list3.length / CHUNK_SIZE);
          await saveChunk(chunk, 'list3', i / CHUNK_SIZE, totalChunks);
        }

        // Save trashedItems in chunks
        for (let i = 0; i < trashedItems.length; i += CHUNK_SIZE) {
          const chunk = trashedItems.slice(i, i + CHUNK_SIZE);
          const totalChunks = Math.ceil(trashedItems.length / CHUNK_SIZE);
          await saveChunk(chunk, 'trashedItems', i / CHUNK_SIZE, totalChunks);
        }

        // Final sync
        await axios.post(
          `${import.meta.env.VITE_API_URL}/api/purchases/sync-complete`,
          {
            email: user.email,
            metadata: {
              list1Length: list1.length,
              list2Length: list2.length,
              list3Length: list3.length,
              trashedItemsLength: trashedItems.length,
              lastSyncedAt: new Date().toISOString()
            }
          }
        );

        setIsSyncError(false);
      } catch (error) {
        console.error('Sync error:', error);
        setIsSyncError(true);
      } finally {
        setIsSyncing(false);
      }
    }, 1000);

    if (user?.email) {
      debouncedSave();
    }

    return () => debouncedSave.cancel();
  }, [list1, list2, list3, trashedItems, user?.email]);

  // Update the clearList function
  const clearList = async (listNumber) => {
    if (!user?.email) return;

    try {
      console.log(`Clearing list ${listNumber}`);

      // First, clear in MongoDB
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/purchases/clear-list`,
        {
          email: user.email,
          listNumber
        }
      );

      if (response.data.success) {
        // Then clear local state
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
          case 'trash':
            setTrashedItems([]);
            break;
        }

        // Force a reload of all lists to ensure sync
        const reloadResponse = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/purchases/load-lists`,
          {
            params: { email: user.email }
          }
        );

        if (reloadResponse.data.success) {
          const lists = reloadResponse.data.lists;
          // Update all lists with fresh data
          setList1(lists.list1 || []);
          setList2(lists.list2 || []);
          setList3(lists.list3 || []);
          setTrashedItems(lists.trashedItems || []);
        }
      }
    } catch (error) {
      console.error('Error clearing list:', error);
      setIsSyncError(true);
    }
  };

  return { isSyncing, isSyncError, clearList };
};

export default useDataPersistence;