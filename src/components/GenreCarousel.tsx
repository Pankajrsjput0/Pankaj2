import React, { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { GENRES } from '../types';

interface GenreCarouselProps {
  selectedGenre: string;
  onGenreSelect: (genre: string) => void;
}

export default function GenreCarousel({ selectedGenre, onGenreSelect }: GenreCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    
    const scrollAmount = 200;
    const newScrollLeft = direction === 'left' 
      ? scrollRef.current.scrollLeft - scrollAmount
      : scrollRef.current.scrollLeft + scrollAmount;
    
    scrollRef.current.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth'
    });
  };

  const handleScroll = () => {
    if (!scrollRef.current) return;
    
    setShowLeftArrow(scrollRef.current.scrollLeft > 0);
    setShowRightArrow(
      scrollRef.current.scrollLeft < 
      scrollRef.current.scrollWidth - scrollRef.current.clientWidth
    );
  };

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex items-center space-x-2 overflow-x-auto scrollbar-hide py-4 px-2"
      >
        <button
          className={`genre-button ${selectedGenre === 'All' ? 'active' : 'bg-white'}`}
          onClick={() => onGenreSelect('All')}
        >
          All
        </button>
        {GENRES.map((genre) => (
          <button
            key={genre}
            className={`genre-button ${selectedGenre === genre ? 'active' : 'bg-white'}`}
            onClick={() => onGenreSelect(genre)}
          >
            {genre}
          </button>
        ))}
      </div>
      
      {showLeftArrow && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 bg-white p-2 rounded-full shadow-lg z-10"
        >
          <ChevronLeft className="h-6 w-6 text-gray-600" />
        </button>
      )}
      
      {showRightArrow && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 bg-white p-2 rounded-full shadow-lg z-10"
        >
          <ChevronRight className="h-6 w-6 text-gray-600" />
        </button>
      )}
    </div>
  );
}