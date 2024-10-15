// src/components/Product.jsx

import React from 'react';
import { useState, useEffect } from 'react';
import '../styles/Product.css';

const Product = () => {
    // State for the new idea input
    const [newIdea, setNewIdea] = useState('');

    // State for the slider value (importance or urgency)
    const [sliderValue, setSliderValue] = useState(0);

    // State for the lists
    const [list1, setList1] = useState([]); // List of ideas
    const [list2, setList2] = useState([]); // List of { importance, idea }
    const [list3, setList3] = useState([]); // List of { importance, urgency, idea }

    // State for the selected item indices
    const [selectedIndex1, setSelectedIndex1] = useState(null);
    const [selectedIndex2, setSelectedIndex2] = useState(null);
    const [selectedIndex3, setSelectedIndex3] = useState(null);

    // State for the "god bar" text
    const [godBarText, setGodBarText] = useState('');

    const handleAddIdea = (e) => {
        if (e.key === 'Enter' && newIdea.trim() !== '') {
            setList1([newIdea.trim(), ...list1]);
            setNewIdea('');
        }
    };

    const handleSelectItem = (listNumber, index) => {
        if (listNumber === 1) {
            setSelectedIndex1(index);
            setSelectedIndex2(null);
            setSelectedIndex3(null);
            setGodBarText(list1[index]);
        } else if (listNumber === 2) {
            setSelectedIndex1(null);
            setSelectedIndex2(index);
            setSelectedIndex3(null);
            setGodBarText(list2[index].idea);
        } else if (listNumber === 3) {
            setSelectedIndex1(null);
            setSelectedIndex2(null);
            setSelectedIndex3(index);
            setGodBarText(list3[index].idea);
        }
    };

    const handleMoveToList2 = () => {
        if (selectedIndex1 !== null) {
            const idea = list1[selectedIndex1];
            const importance = sliderValue;
            setList2([{ importance, idea }, ...list2]);
            setList1(list1.filter((_, idx) => idx !== selectedIndex1));
            setSelectedIndex1(null);
            setGodBarText('');
        }
    };

    const handleMoveToList3 = () => {
        if (selectedIndex2 !== null) {
            const { importance, idea } = list2[selectedIndex2];
            const urgency = sliderValue;
            setList3([{ importance, urgency, idea }, ...list3]);
            setList2(list2.filter((_, idx) => idx !== selectedIndex2));
            setSelectedIndex2(null);
            setGodBarText('');
        }
    };

    const handleRemoveIdea = (listNumber) => {
        if (listNumber === 1 && selectedIndex1 !== null) {
            setList1(list1.filter((_, idx) => idx !== selectedIndex1));
            setSelectedIndex1(null);
            setGodBarText('');
        } else if (listNumber === 2 && selectedIndex2 !== null) {
            setList2(list2.filter((_, idx) => idx !== selectedIndex2));
            setSelectedIndex2(null);
            setGodBarText('');
        } else if (listNumber === 3 && selectedIndex3 !== null) {
            setList3(list3.filter((_, idx) => idx !== selectedIndex3));
            setSelectedIndex3(null);
            setGodBarText('');
        }
    };
    const handleSortList = (listNumber) => {
        if (listNumber === 2) {
            const sortedList = [...list2].sort((a, b) => {
                return b.importance - a.importance || a.idea.localeCompare(b.idea);
            });
            setList2(sortedList);
        } else if (listNumber === 3) {
            const sortedList = [...list3].sort((a, b) => {
                return (
                    b.importance - a.importance ||
                    b.urgency - a.urgency ||
                    a.idea.localeCompare(b.idea)
                );
            });
            setList3(sortedList);
        }
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowLeft') {
                setSliderValue(0);
            } else if (e.key === 'ArrowRight') {
                setSliderValue(1);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    useEffect(() => {
        localStorage.setItem('list1', JSON.stringify(list1));
    }, [list1]);

    useEffect(() => {
        localStorage.setItem('list2', JSON.stringify(list2));
    }, [list2]);

    useEffect(() => {
        localStorage.setItem('list3', JSON.stringify(list3));
    }, [list3]);

    useEffect(() => {
        const storedList1 = JSON.parse(localStorage.getItem('list1'));
        const storedList2 = JSON.parse(localStorage.getItem('list2'));
        const storedList3 = JSON.parse(localStorage.getItem('list3'));

        if (storedList1) setList1(storedList1);
        if (storedList2) setList2(storedList2);
        if (storedList3) setList3(storedList3);
    }, []);


    // The rest of your component code...

    return (
        <div>

            <div className="product">
                <div className="god-bar">
                    <p>{godBarText}</p>
                </div>
            </div>
            <div className="input-section">
                <input
                    type="text"
                    placeholder="Enter an idea..."
                    value={newIdea}
                    onChange={(e) => setNewIdea(e.target.value)}
                    onKeyDown={handleAddIdea}
                />
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="1"
                    value={sliderValue}
                    onChange={(e) => setSliderValue(Number(e.target.value))}
                />
            </div>

            <div className="lists">
                {/* List 1 */}
                <div className="list">
                    <h2>List 1</h2>
                    <ul>
                        {list1.map((idea, index) => (
                            <li
                                key={index}
                                className={selectedIndex1 === index ? 'selected' : ''}
                                onClick={() => handleSelectItem(1, index)}
                            >
                                {idea}
                            </li>
                        ))}
                    </ul>
                    <button onClick={handleMoveToList2}>Move to List 2</button>
                    <button onClick={() => handleRemoveIdea(1)}>Remove</button>
                </div>

                {/* List 2 */}
                <div className="list">
                    <h2>List 2</h2>
                    <button onClick={() => handleSortList(2)}>Sort</button>
                    <ul>
                        {list2.map((item, index) => (
                            <li
                                key={index}
                                className={selectedIndex2 === index ? 'selected' : ''}
                                onClick={() => handleSelectItem(2, index)}
                            >
                                {item.importance} | {item.idea}
                            </li>
                        ))}
                    </ul>
                    <button onClick={handleMoveToList3}>Move to List 3</button>
                    <button onClick={() => handleRemoveIdea(2)}>Remove</button>
                </div>

                {/* List 3 */}
                <div className="list">
                    <h2>List 3</h2>
                    <button onClick={() => handleSortList(3)}>Sort</button>
                    <ul>
                        {list3.map((item, index) => (
                            <li
                                key={index}
                                className={selectedIndex3 === index ? 'selected' : ''}
                                onClick={() => handleSelectItem(3, index)}
                            >
                                {item.importance} | {item.urgency} | {item.idea}
                            </li>
                        ))}
                    </ul>
                    <button onClick={() => handleRemoveIdea(3)}>Remove</button>
                </div>
            </div>

        </div>

    );
};


export default Product;
