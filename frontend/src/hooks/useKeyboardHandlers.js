import { useEffect } from 'react';

const useKeyboardHandlers = ({
  setSliderValue,
  selectedIndex1,
  selectedIndex2,
  selectedIndex3,
  list1,
  list2,
  list3,
  handleMoveToList2,
  handleMoveToList3,
  handleUndoDelete,
  setActiveList,
  handleSelectItem,
  setGodBarText
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowLeft") {
        setSliderValue(0);
      } else if (e.key === "ArrowRight") {
        setSliderValue(1);
      } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        navigateList(e.key === "ArrowUp" ? "up" : "down");
      } else if (e.key === "Enter") {
        handleEnterKey();
      } else if (e.ctrlKey && e.key === "z") {
        handleUndoDelete();
      } else if (e.key === "[") {
        setActiveList((prev) => (prev === 1 ? 3 : prev - 1));
      } else if (e.key === "]") {
        setActiveList((prev) => (prev === 3 ? 1 : prev + 1));
      }
    };

    const handleEnterKey = () => {
      if (selectedIndex1 !== null) {
        handleMoveToList2();
        if (list1.length > 0) {
          const nextIndex = selectedIndex1 < list1.length ? selectedIndex1 : list1.length - 1;
          handleSelectItem(1, nextIndex);
        }
      } else if (selectedIndex2 !== null) {
        handleMoveToList3();
        if (list2.length > 0) {
          const nextIndex = selectedIndex2 < list2.length ? selectedIndex2 : list2.length - 1;
          handleSelectItem(2, nextIndex);
        }
      }
    };

    const navigateList = (direction) => {
      const increment = direction === "up" ? -1 : 1;
      // ... rest of navigation logic
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    setSliderValue,
    selectedIndex1,
    selectedIndex2,
    selectedIndex3,
    list1,
    list2,
    list3,
    handleMoveToList2,
    handleMoveToList3,
    handleUndoDelete,
    setActiveList,
    handleSelectItem,
    setGodBarText
  ]);
};

export default useKeyboardHandlers;