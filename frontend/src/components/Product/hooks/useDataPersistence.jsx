import { useEffect, useState, useRef, useCallback } from 'react';
import axiosInstance from '../../../axios-config';
import { useAuth } from '../../../contexts/AuthContext';

const useDataPersistence = () => {
  const { user } = useAuth();
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSyncError, setIsSyncError] = useState(false);
  const lastSavedData = useRef(null);

  const loadData = useCallback(async () => {
    if (!user?.email) {
      console.log('No user email available for loading data');
      return null;
    }

    try {
      setIsSyncing(true);
      setIsSyncError(false);
      console.log('Loading data for user:', user.email);

      const response = await axiosInstance.get('/api/purchases/lists', {
        params: { email: user.email }
      });

      if (!response.data) {
        console.error('No data received from server');
        return null;
      }

      console.log('Loaded data:', response.data);

      // Validate and clean the data structure
      const data = {
        list1: Array.isArray(response.data.list1) ? response.data.list1.filter(Boolean) : [],
        list2: Array.isArray(response.data.list2) ? response.data.list2.filter(Boolean) : [],
        list3: Array.isArray(response.data.list3) ?
          response.data.list3.filter(Boolean).sort((a, b) => {
            const [aImportance, aUrgency] = a.split(',');
            const [bImportance, bUrgency] = b.split(',');
            const aScore = (Number(aImportance) * 2) + Number(aUrgency);
            const bScore = (Number(bImportance) * 2) + Number(bUrgency);
            return bScore - aScore;
          }) : []
      };

      lastSavedData.current = data;
      return data;
    } catch (error) {
      console.error('Error loading data:', error);
      if (error.response) {
        console.error('Response error:', error.response.data);
        console.error('Status code:', error.response.status);
      }
      setIsSyncError(true);
      return null;
    } finally {
      setIsSyncing(false);
    }
  }, [user]);

  const saveData = useCallback(async (lists) => {
    if (!user?.email) {
      console.log('No user email available for saving data');
      return;
    }

    // Clean and validate lists before saving
    const validatedLists = {
      list1: Array.isArray(lists.list1) ? lists.list1.filter(Boolean) : [],
      list2: Array.isArray(lists.list2) ? lists.list2.filter(Boolean) : [],
      list3: Array.isArray(lists.list3) ? lists.list3.filter(Boolean) : []
    };

    // Sort list3 by ratings
    if (validatedLists.list3.length > 0) {
      validatedLists.list3.sort((a, b) => {
        const [aImportance, aUrgency] = a.split(',');
        const [bImportance, bUrgency] = b.split(',');
        const aScore = (Number(aImportance) * 2) + Number(aUrgency);
        const bScore = (Number(bImportance) * 2) + Number(bUrgency);
        return bScore - aScore;
      });
    }

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

      await axiosInstance.post('/api/purchases/save-lists', {
        email: user.email,
        list1: validatedLists.list1,
        list2: validatedLists.list2,
        list3: validatedLists.list3
      });

      lastSavedData.current = validatedLists;
    } catch (error) {
      console.error('Error saving data:', error);
      if (error.response) {
        console.error('Response error:', error.response.data);
        console.error('Status code:', error.response.status);
      }
      setIsSyncError(true);
      throw error;
    } finally {
      setIsSyncing(false);
    }
  }, [user]);

  // Add an effect to load data when user changes
  useEffect(() => {
    if (user?.email) {
      loadData();
    }
  }, [user, loadData]);

  return {
    loadData,
    saveData,
    isSyncing,
    isSyncError
  };
};

export default useDataPersistence;