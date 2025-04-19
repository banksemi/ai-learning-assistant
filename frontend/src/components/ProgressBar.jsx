import React, { useState, useEffect, useRef } from 'react';

const ProgressBar = ({ progress }) => {
  const [currentWidth, setCurrentWidth] = useState(0);
  const [previousWidth, setPreviousWidth] = useState(0);
  const [showHighlight, setShowHighlight] = useState(false);
  const timeoutRef = useRef(null); // Ref to store timeout ID

  // Use ref to track previous progress prop without causing extra renders
  const prevProgressRef = useRef();

  useEffect(() => {
    // Clear any existing timeout when progress changes
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    const newWidth = Math.max(0, Math.min(100, progress)); // Ensure width is between 0 and 100
    const oldWidth = prevProgressRef.current ?? 0; // Get previous width, default to 0

    setPreviousWidth(oldWidth); // Store the width *before* this update
    setCurrentWidth(newWidth);  // Set the target width for the main bar

    // Only show highlight if progress increased
    if (newWidth > oldWidth) {
      setShowHighlight(true);
      // Set a timeout to hide the highlight after a short duration
      // The CSS transition handles the fade-out effect
      timeoutRef.current = setTimeout(() => {
        setShowHighlight(false);
        timeoutRef.current = null; // Clear the ref after timeout runs
      }, 500); // Highlight state duration: 500ms
    } else {
        // If progress didn't increase (or decreased), ensure highlight is off
        setShowHighlight(false);
    }

    // Update the ref with the current progress for the next render
    prevProgressRef.current = newWidth;

    // Cleanup function to clear timeout if component unmounts during highlight
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [progress]); // Effect runs when progress prop changes

  // Calculate the width of the highlight bar (the difference)
  const highlightWidth = Math.max(0, currentWidth - previousWidth);

  return (
    // Parent needs to be relative for z-index context
    <div className="relative w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 overflow-hidden">
      {/* Highlight Bar (Lighter Indigo) - Lower z-index */}
      <div
        className={`absolute top-0 h-full bg-indigo-300 rounded-full transition-opacity duration-200 ease-out z-0 ${showHighlight ? 'opacity-100' : 'opacity-0'}`}
        style={{
          left: `${previousWidth}%`, // Starts where the old progress ended
          width: `${highlightWidth}%`, // Width is the amount of increase
        }}
      ></div>
      {/* Main Progress Bar (Primary Indigo) - Higher z-index */}
      <div
        // Added relative and z-10
        className="relative top-0 left-0 h-full bg-primary rounded-full transition-all duration-300 ease-out z-10"
        style={{ width: `${currentWidth}%` }}
        aria-valuenow={currentWidth}
        aria-valuemin="0"
        aria-valuemax="100"
      ></div>
    </div>
  );
};

export default ProgressBar;
