import { useState } from 'react';

const useListManagement = (setNotification) => {
  const [list1, setList1] = useState([]);
  const [list2, setList2] = useState([]);
  const [list3, setList3] = useState([]);
  const [selectedIndex1, setSelectedIndex1] = useState(null);
  const [selectedIndex2, setSelectedIndex2] = useState(null);
  const [selectedIndex3, setSelectedIndex3] = useState(null);
  const [peakCount1, setPeakCount1] = useState(0);
  const [peakCount2, setPeakCount2] = useState(0);
  const [peakCount3, setPeakCount3] = useState(0);

  const handleMoveToList2 = (selectedItem, sliderValue) => {
    const importanceValue = Number(sliderValue === 1);
    const importance = importanceValue === 1;

    setList2(prevList => {
      const newItem = {
        importance,
        importanceValue,
        idea: selectedItem
      };

      const groupStartIndex = prevList.findIndex(item =>
        item.importanceValue === newItem.importanceValue
      );

      if (groupStartIndex === -1) {
        if (newItem.importanceValue === 1) {
          return [newItem, ...prevList];
        }
        return [...prevList, newItem];
      }

      const newList = [...prevList];
      newList.splice(groupStartIndex, 0, newItem);
      return newList;
    });
  };

  const handleMoveToList3 = (selectedItem, sliderValue) => {
    const urgencyValue = Number(sliderValue === 1);
    const urgency = urgencyValue === 1;

    setList3(prevList => {
      const newItem = {
        importance: selectedItem.importance,
        importanceValue: selectedItem.importanceValue,
        urgency,
        urgencyValue,
        idea: selectedItem.idea
      };

      const findGroupStart = (imp, urg) => {
        return prevList.findIndex(item =>
          item.importanceValue === imp && item.urgencyValue === urg
        );
      };

      let insertIndex;
      if (newItem.importanceValue === 1 && newItem.urgencyValue === 1) {
        insertIndex = findGroupStart(1, 1);
        if (insertIndex === -1) insertIndex = 0;
      } else if (newItem.importanceValue === 1 && newItem.urgencyValue === 0) {
        insertIndex = findGroupStart(1, 0);
        if (insertIndex === -1) {
          insertIndex = prevList.findIndex(item =>
            item.importanceValue === 0
          );
          if (insertIndex === -1) insertIndex = prevList.length;
        }
      } else if (newItem.importanceValue === 0 && newItem.urgencyValue === 1) {
        insertIndex = findGroupStart(0, 1);
        if (insertIndex === -1) {
          insertIndex = prevList.findIndex(item =>
            item.importanceValue === 0 && item.urgencyValue === 0
          );
          if (insertIndex === -1) insertIndex = prevList.length;
        }
      } else {
        insertIndex = findGroupStart(0, 0);
        if (insertIndex === -1) insertIndex = prevList.length;
      }

      const newList = [...prevList];
      newList.splice(insertIndex, 0, newItem);
      return newList;
    });
  };

  const handleAddItem = (newItem, setNewItem) => {
    const item = newItem.trim();
    if (item) {
      const ratedPattern = /^[01],[01],/;
      if (!ratedPattern.test(item)) {
        setList1(prev => [item, ...prev]);
        setNewItem('');
        setSelectedIndex1(0);
        return true;
      } else {
        setNotification({
          open: true,
          message: 'Cannot add rated items to List 1'
        });
      }
    }
    return false;
  };

  const handleRemoveItem = (listNumber, selectedIndex, setTrashedItems) => {
    if (listNumber === 1 && selectedIndex1 !== null) {
      const itemToTrash = list1[selectedIndex1];
      setTrashedItems(prev => [itemToTrash, ...prev]);
      setList1(prevList => {
        const newList = prevList.filter((_, idx) => idx !== selectedIndex1);
        setSelectedIndex1(newList.length > 0 ? Math.min(selectedIndex1, newList.length - 1) : null);
        return newList;
      });
    } else if (listNumber === 2 && selectedIndex2 !== null) {
      const itemToTrash = list2[selectedIndex2];
      setTrashedItems(prev => [itemToTrash, ...prev]);
      setList2(prevList => {
        const newList = prevList.filter((_, idx) => idx !== selectedIndex2);
        setSelectedIndex2(newList.length > 0 ? Math.min(selectedIndex2, newList.length - 1) : null);
        return newList;
      });
    } else if (listNumber === 3 && selectedIndex3 !== null) {
      const itemToTrash = list3[selectedIndex3];
      setTrashedItems(prev => [itemToTrash, ...prev]);
      setList3(prevList => {
        const newList = prevList.filter((_, idx) => idx !== selectedIndex3);
        setSelectedIndex3(newList.length > 0 ? Math.min(selectedIndex3, newList.length - 1) : null);
        return newList;
      });
    }
  };

  return {
    list1,
    list2,
    list3,
    setList1,
    setList2,
    setList3,
    selectedIndex1,
    selectedIndex2,
    selectedIndex3,
    setSelectedIndex1,
    setSelectedIndex2,
    setSelectedIndex3,
    peakCount1,
    peakCount2,
    peakCount3,
    setPeakCount1,
    setPeakCount2,
    setPeakCount3,
    handleMoveToList2,
    handleMoveToList3,
    handleAddItem,
    handleRemoveItem
  };
};

export default useListManagement;