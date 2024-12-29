import { useEffect, useState, useRef, useCallback } from 'react';
import axiosInstance from '../../../axios-config';
import { useAuth } from '../../../contexts/AuthContext';

const useDataPersistence = () => {
  const { user } = useAuth();
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSyncError, setIsSyncError] = useState(false);
  const lastSavedData = useRef(null);

  const loadData = useCallback(async () => {
    if (!user) return null;

    try {
      setIsSyncing(true);
      setIsSyncError(false);
      console.log('Loading data for user:', user.email);

      const response = await axiosInstance.get('/api/purchases/lists', {
        params: { email: user.email }
      });

      console.log('Loaded data:', response.data);

      // Validate the data structure
      const data = {
        list1: Array.isArray(response.data.list1) ? response.data.list1 : [],
        list2: Array.isArray(response.data.list2) ? response.data.list2 : [],
        list3: Array.isArray(response.data.list3) ? response.data.list3 : []
      };

      lastSavedData.current = data;
      return data;
    } catch (error) {
      console.error('Error loading data:', error.response?.data || error.message);
      setIsSyncError(true);
      return null;
    } finally {
      setIsSyncing(false);
    }
  }, [user]);

  const saveData = useCallback(async (lists) => {
    if (!user) return;

    // Validate lists before saving
    const validatedLists = {
      list1: Array.isArray(lists.list1) ? lists.list1 : [],
      list2: Array.isArray(lists.list2) ? lists.list2 : [],
      list3: Array.isArray(lists.list3) ? lists.list3 : []
    };

    // Don't save if the data hasn't changed
    const currentData = JSON.stringify(validatedLists);
    const lastData = JSON.stringify(lastSavedData.current);
    if (currentData === lastData) {
      console.log('Data unchanged, skipping save');
      return;
    }

    try {
      setIsSyncing(true);
      setIsSyncError(false);
      console.log('Saving lists for user:', user.email, validatedLists);

      const response = await axiosInstance.post('/api/purchases/save-lists', {
        email: user.email,
        lists: validatedLists
      });

      console.log('Save response:', response.data);
      lastSavedData.current = validatedLists;
    } catch (error) {
      console.error('Error saving data:', error.response?.data || error.message);
      setIsSyncError(true);
      throw error; // Propagate error to component
    } finally {
      setIsSyncing(false);
    }
  }, [user]);

  return {
    loadData,
    saveData,
    isSyncing,
    isSyncError
  };
};

export default useDataPersistence;