import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

const CHUNK_SIZE = 50; // Smaller chunk size for more frequent updates
const SYNC_DELAY = 2000; // 2 seconds between syncs

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
  const [syncTimeout, setSyncTimeout] = useState(null);
  const [lastSyncedData, setLastSyncedData] = useState(null);

  // Function to chunk array into smaller pieces
  const chunkArray = (array, size) => {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  };

  // Sync data with server
  const syncData = useCallback(async (data) => {
    if (!user || !isAuthReady) return;

    setIsSyncing(true);
    setIsSyncError(false);

    try {
      const response = await axios.post('/api/sync', {
        email: user.email,
        ...data
      });

      // Update last synced data
      setLastSyncedData(data);
      setIsSyncError(false);
    } catch (error) {
      console.error('Sync error:', error);
      setIsSyncError(true);

      // Revert to last successful sync if available
      if (lastSyncedData) {
        setList1(lastSyncedData.list1 || []);
        setList2(lastSyncedData.list2 || []);
        setList3(lastSyncedData.list3 || []);
        setTrashedItems(lastSyncedData.trashedItems || []);
      }
    } finally {
      setIsSyncing(false);
    }
  }, [user, isAuthReady]);

  // Debounced sync with chunking
  const debouncedSync = useCallback((newData) => {
    if (syncTimeout) {
      clearTimeout(syncTimeout);
    }

    const timeout = setTimeout(() => {
      syncData(newData);
    }, SYNC_DELAY);

    setSyncTimeout(timeout);
  }, [syncData, syncTimeout]);

  // Clear list handler with proper trash handling
  const clearList = useCallback(async (listNumber) => {
    if (!user || !isAuthReady) return;

    try {
      let itemsToTrash = [];
      const newData = {
        list1: [...list1],
        list2: [...list2],
        list3: [...list3],
        trashedItems: [...trashedItems]
      };

      // Store items in trash before clearing
      if (listNumber === 1) {
        itemsToTrash = [...list1];
        newData.list1 = [];
      } else if (listNumber === 2) {
        itemsToTrash = [...list2];
        newData.list2 = [];
      } else if (listNumber === 3) {
        itemsToTrash = [...list3];
        newData.list3 = [];
      } else if (listNumber === 'trash') {
        newData.trashedItems = [];
      }

      // Add items to trash unless we're clearing the trash itself
      if (listNumber !== 'trash' && itemsToTrash.length > 0) {
        newData.trashedItems = [...itemsToTrash, ...newData.trashedItems];
      }

      // Immediate sync for clear operations
      await syncData(newData);

      // Update local state after successful sync
      if (listNumber === 1) setList1([]);
      else if (listNumber === 2) setList2([]);
      else if (listNumber === 3) setList3([]);
      else if (listNumber === 'trash') setTrashedItems([]);

      // Update trash if we're not clearing it
      if (listNumber !== 'trash' && itemsToTrash.length > 0) {
        setTrashedItems(prev => [...itemsToTrash, ...prev]);
      }

    } catch (error) {
      console.error('Error clearing list:', error);
      setIsSyncError(true);
    }
  }, [user, isAuthReady, list1, list2, list3, trashedItems]);

  // Watch for changes and trigger sync
  useEffect(() => {
    if (!user || !isAuthReady) return;

    const newData = {
      list1,
      list2,
      list3,
      trashedItems
    };

    debouncedSync(newData);

    return () => {
      if (syncTimeout) {
        clearTimeout(syncTimeout);
      }
    };
  }, [user, isAuthReady, list1, list2, list3, trashedItems]);

  // Initial data load
  useEffect(() => {
    const loadData = async () => {
      if (!user || !isAuthReady) return;

      try {
        setIsLoading(true);
        const response = await axios.get(`/api/sync?email=${user.email}`);
        const data = response.data;

        setList1(data.list1 || []);
        setList2(data.list2 || []);
        setList3(data.list3 || []);
        setTrashedItems(data.trashedItems || []);
        setLastSyncedData(data);
      } catch (error) {
        console.error('Error loading data:', error);
        setIsSyncError(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user, isAuthReady]);

  return {
    isSyncing,
    isSyncError,
    clearList
  };
};

export default useDataPersistence;