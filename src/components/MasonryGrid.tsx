import React, { useState, useEffect, useMemo } from 'react';
import { Artwork } from '@/context/ArtworkContext';

interface MasonryGridProps {
  items: Artwork[];
  renderItem: (item: Artwork, index: number) => React.ReactNode;
  breakpoints?: { [key: string]: number };
}

export default function MasonryGrid({ items, renderItem, breakpoints = { default: 4, 1536: 4, 1280: 3, 1024: 3, 768: 2, 640: 1 } }: MasonryGridProps) {
  const [columns, setColumns] = useState(breakpoints.default);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width >= 1536) setColumns(breakpoints[1536] || breakpoints.default);
      else if (width >= 1280) setColumns(breakpoints[1280] || breakpoints.default);
      else if (width >= 1024) setColumns(breakpoints[1024] || breakpoints.default);
      else if (width >= 768) setColumns(breakpoints[768] || breakpoints.default);
      else if (width >= 640) setColumns(breakpoints[640] || breakpoints.default);
      else setColumns(breakpoints.default);
    };
    
    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoints]);

  const columnData = useMemo(() => {
    // Initialize empty columns and their running heights
    const cols: Artwork[][] = Array.from({ length: columns }, () => []);
    const heights: number[] = Array.from({ length: columns }, () => 0);

    items.forEach((item) => {
      // Find the shortest column
      let shortestColIndex = 0;
      let minHeight = heights[0];
      for (let i = 1; i < columns; i++) {
        if (heights[i] < minHeight) {
          minHeight = heights[i];
          shortestColIndex = i;
        }
      }

      // Add item to shortest column
      cols[shortestColIndex].push(item);

      // Estimate the height added (Aspect ratio logic: H / W)
      // + 60 for the text/padding of the card, etc.
      let estimatedHeight = 300; // Default fallback
      if (item.width && item.height) {
        estimatedHeight = (item.height / item.width) * 300 + 60;
      }
      heights[shortestColIndex] += estimatedHeight;
    });

    return cols;
  }, [items, columns]);

  return (
    <div className="flex w-full gap-6">
      {columnData.map((colItems, colIndex) => (
        <div key={colIndex} className="flex-1 flex flex-col gap-6 min-w-0">
          {colItems.map((item) => renderItem(item, items.indexOf(item)))}
        </div>
      ))}
    </div>
  );
}
