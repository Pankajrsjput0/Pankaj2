import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { GENRES, Novel } from '../types';
import NovelCard from '../components/NovelCard';

export default function Explore() {
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [novels, setNovels] = useState<Novel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNovels = async () => {
      try {
        let query = supabase
          .from('Novels')
          .select('*')
          .order('views', { ascending: false })
          .limit(20);

        if (selectedGenre !== 'All') {
          query = query.contains('genre', [selectedGenre]);
        }

        const { data, error } = await query;

        if (error) throw error;
        setNovels(data as Novel[]);
      } catch (error) {
        console.error('Error fetching novels:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNovels();
  }, [selectedGenre]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Explore Novels</h1>

      <div className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() => setSelectedGenre('All')}
          className={`genre-button ${selectedGenre === 'All' ? 'active' : 'bg-white'}`}
        >
          All
        </button>
        {GENRES.map(genre => (
          <button
            key={genre}
            onClick={() => setSelectedGenre(genre)}
            className={`genre-button ${selectedGenre === genre ? 'active' : 'bg-white'}`}
          >
            {genre}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
        </div>
      ) : novels.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {novels.map(novel => (
            <NovelCard key={novel.novel_id} novel={novel} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-600">No novels available in {selectedGenre === 'All' ? 'the library' : `the ${selectedGenre} genre`}.</p>
        </div>
      )}
    </div>
  );
}