import { useEffect } from 'react';

const useKeyboardNavigation = ({
  isInputFocused,
  activeList,
  list1,
  list2,
  list3,
  selectedIndex1,
  selectedIndex2,
  selectedIndex3,
  sliderValue,
  setSelectedIndex1,
  setSelectedIndex2,
  setSelectedIndex3,
  setActiveList,
  setSliderValue,
  handleMoveToList2,
  handleMoveToList3,
  handleRemoveItem
}) => {
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
              const containerRect = listElement.closest('.MuiList-root').getBoundingClientRect();
              const itemRect = itemElement.getBoundingClientRect();

              const isAbove = itemRect.top < containerRect.top;
              const isBelow = itemRect.bottom > containerRect.bottom;

              if (isAbove || isBelow) {
                const scrollOffset = isAbove
                  ? itemRect.top - containerRect.top
                  : itemRect.bottom - containerRect.bottom;

                listElement.closest('.MuiList-root').scrollBy({
                  top: scrollOffset,
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
};

export default useKeyboardNavigation;