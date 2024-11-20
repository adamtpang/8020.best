import React, { useState, useEffect } from 'react';
import axios from 'axios';
import debounce from 'lodash/debounce';

const useDataPersistence = () => {
  const [list1, setList1] = useState([]);
  const [list2, setList2] = useState([]);
  const [list3, setList3] = useState([]);
  const [trashedItems, setTrashedItems] = useState([]);
  const [previousList1, setPreviousList1] = useState([]);
  const [previousList2, setPreviousList2] = useState([]);
  const [previousList3, setPreviousList3] = useState([]);
  const [previousTrashedItems, setPreviousTrashedItems] = useState([]);
  const [lastSyncTimestamp, setLastSyncTimestamp] = useState(null);
  const [isSyncError, setIsSyncError] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    setPreviousList1(list1);
    setPreviousList2(list2);
    setPreviousList3(list3);
    setPreviousTrashedItems(trashedItems);
  }, []);

  const CHUNK_SIZE = 50; // Even smaller chunks for reliability

  const syncData = async () => {
    if (!user || !isAuthReady) return;

    try {
      setIsSyncing(true);
      console.log('Starting chunked sync for user:', user.email);

      // Function to sync a single chunk
      const syncChunk = async (items, startIndex, endIndex, total) => {
        console.log(`Syncing chunk ${startIndex}-${endIndex} of ${total}`);

        const chunk = {
          email: user.email,
          chunk: {
            startIndex,
            endIndex,
            totalChunks: Math.ceil(total / CHUNK_SIZE),
            currentChunk: Math.floor(startIndex / CHUNK_SIZE) + 1,
            items
          }
        };

        return axios.post(
          `${import.meta.env.VITE_API_URL}/api/purchases/sync-chunk`,
          chunk,
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
      };

      // Sync list1 in chunks
      for (let i = 0; i < list1.length; i += CHUNK_SIZE) {
        const chunk = list1.slice(i, i + CHUNK_SIZE);
        await syncChunk(chunk, i, i + CHUNK_SIZE, list1.length);
      }

      // Sync list2 in chunks if needed
      for (let i = 0; i < list2.length; i += CHUNK_SIZE) {
        const chunk = list2.slice(i, i + CHUNK_SIZE);
        await syncChunk(chunk, i, i + CHUNK_SIZE, list2.length);
      }

      // Sync list3 in chunks if needed
      for (let i = 0; i < list3.length; i += CHUNK_SIZE) {
        const chunk = list3.slice(i, i + CHUNK_SIZE);
        await syncChunk(chunk, i, i + CHUNK_SIZE, list3.length);
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
            lastSyncedAt: new Date().toISOString()
          }
        }
      );

      setIsSyncing(false);
      setIsSyncError(false);
      console.log('Sync completed successfully');

    } catch (error) {
      console.error('Sync error:', error);
      setIsSyncError(true);
      setIsSyncing(false);
    }
  };

  // Add debounced sync
  useEffect(() => {
    const debouncedSync = debounce(syncData, 2000);

    if (user && isAuthReady) {
      debouncedSync();
    }

    return () => debouncedSync.cancel();
  }, [list1, list2, list3, trashedItems, user, isAuthReady]);

  return {
    list1,
    setList1,
    list2,
    setList2,
    list3,
    setList3,
    trashedItems,
    setTrashedItems,
    previousList1,
    setPreviousList1,
    previousList2,
    setPreviousList2,
    previousList3,
    setPreviousList3,
    previousTrashedItems,
    setPreviousTrashedItems,
    lastSyncTimestamp,
    setLastSyncTimestamp,
    isSyncError,
    setIsSyncError,
    isSyncing,
    setIsSyncing
  };
};