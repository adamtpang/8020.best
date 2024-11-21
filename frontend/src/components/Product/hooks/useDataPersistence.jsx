import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { auth } from '../../../firebase-config';

const CHUNK_SIZE = 50; // Smaller chunks for better reliability

// Remove lodash import and add custom debounce
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
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

        console.log('Raw response:', response.data);

        if (response.data.success) {
          const lists = response.data.lists;

          console.log('Full lists data:', lists);
          console.log('Trash data:', lists.list4);

          if (Array.isArray(lists.list1)) {
            console.log('Setting list1:', lists.list1.length, 'items');
            setList1(lists.list1);
          }
          if (Array.isArray(lists.list2)) {
            console.log('Setting list2:', lists.list2.length, 'items');
            setList2(lists.list2);
          }
          if (Array.isArray(lists.list3)) {
            console.log('Setting list3:', lists.list3.length, 'items');
            setList3(lists.list3);
          }
          if (Array.isArray(lists.list4)) {
            console.log('Setting trash items:', lists.list4.length, 'items');
            setTrashedItems(lists.list4);
          } else {
            console.log('No trash items found in response');
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

  // New save implementation using chunks
  const saveChunkedData = async () => {
    if (!user?.email) return;

    setIsSyncing(true);
    setIsSyncError(false);

    try {
      console.log('Starting chunked save for user:', user.email);

      // Helper function to save a chunk of items
      const saveChunk = async (items, listName, chunkIndex, totalChunks) => {
        console.log(`Saving ${listName} chunk ${chunkIndex + 1}/${totalChunks}`);

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

      // Process each list in chunks
      for (let i = 0; i < list1.length; i += CHUNK_SIZE) {
        const chunk = list1.slice(i, i + CHUNK_SIZE);
        const totalChunks = Math.ceil(list1.length / CHUNK_SIZE);
        await saveChunk(chunk, 'list1', i / CHUNK_SIZE, totalChunks);
      }

      for (let i = 0; i < list2.length; i += CHUNK_SIZE) {
        const chunk = list2.slice(i, i + CHUNK_SIZE);
        const totalChunks = Math.ceil(list2.length / CHUNK_SIZE);
        await saveChunk(chunk, 'list2', i / CHUNK_SIZE, totalChunks);
      }

      for (let i = 0; i < list3.length; i += CHUNK_SIZE) {
        const chunk = list3.slice(i, i + CHUNK_SIZE);
        const totalChunks = Math.ceil(list3.length / CHUNK_SIZE);
        await saveChunk(chunk, 'list3', i / CHUNK_SIZE, totalChunks);
      }

      for (let i = 0; i < trashedItems.length; i += CHUNK_SIZE) {
        const chunk = trashedItems.slice(i, i + CHUNK_SIZE);
        const totalChunks = Math.ceil(trashedItems.length / CHUNK_SIZE);
        await saveChunk(chunk, 'trashedItems', i / CHUNK_SIZE, totalChunks);
      }

      // Final sync to update metadata
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
      console.error('Error in chunked save:', error);
      setIsSyncError(true);
    } finally {
      setIsSyncing(false);
    }
  };

  // Debounced save effect
  useEffect(() => {
    const debouncedSave = debounce(saveChunkedData, 1000);

    if (user?.email && (list1.length > 0 || list2.length > 0 || list3.length > 0 || trashedItems.length > 0)) {
      debouncedSave();
    }

    return () => debouncedSave.cancel();
  }, [list1, list2, list3, trashedItems, user?.email]);

  return { isSyncing, isSyncError };
};

export default useDataPersistence;