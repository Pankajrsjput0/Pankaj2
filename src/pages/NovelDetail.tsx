import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Novel, Chapter } from '../types';
import { BookOpen, Heart, Share2, Eye, Edit } from 'lucide-react';

export default function NovelDetail() {
  const { id } = useParams();
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [novel, setNovel] = useState<Novel | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInLibrary, setIsInLibrary] = useState(false);
  const [savingToLibrary, setSavingToLibrary] = useState(false);

  useEffect(() => {
    const fetchNovel = async () => {
      if (!id) return;

      try {
        // Fetch novel details
        const { data: novelData, error: novelError } = await supabase
          .from('Novels')
          .select('*')
          .eq('novel_id', id)
          .single();

        if (novelError) throw novelError;
        setNovel(novelData);

        // Increment view count
        await supabase.rpc('increment_novel_views', { novel_id: id });

        // Fetch chapters
        const { data: chaptersData, error: chaptersError } = await supabase
          .from('Chapters')
          .select('*')
          .eq('novel_id', id)
          .order('chapter_number', { ascending: true });

        if (chaptersError) throw chaptersError;
        setChapters(chaptersData || []);

        // Check if novel is in user's library
        if (userProfile) {
          const { data: libraryData } = await supabase
            .from('Library')
            .select('*')
            .eq('user_id', userProfile.user_id)
            .eq('novel_id', id)
            .single();

          setIsInLibrary(!!libraryData);
        }
      } catch (error) {
        console.error('Error fetching novel:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNovel();
  }, [id, userProfile]);

  const toggleLibrary = async () => {
    if (!userProfile || !novel) {
      navigate('/auth');
      return;
    }

    try {
      setSavingToLibrary(true);
      if (isInLibrary) {
        await supabase
          .from('Library')
          .delete()
          .eq('user_id', userProfile.user_id)
          .eq('novel_id', novel.novel_id);
      } else {
        await supabase
          .from('Library')
          .insert([{
            user_id: userProfile.user_id,
            novel_id: novel.novel_id
          }]);
      }
      setIsInLibrary(!isInLibrary);
    } catch (error) {
      console.error('Error updating library:', error);
    } finally {
      setSavingToLibrary(false);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: novel?.title,
        text: `Check out "${novel?.title}" on Mantra Novels!`,
        url: window.location.href
      });
    } catch (error) {
      console.error('Error sharing:', error);
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const isAuthor = userProfile?.user_id === novel?.upload_by;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!novel) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <p className="text-center text-gray-600">Novel not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Left: Cover Image */}
        <div className="w-full md:w-64 flex-shrink-0">
          {novel.novel_coverpage ? (
            <img
              src={novel.novel_coverpage}
              alt={novel.title}
              className="w-full rounded-lg shadow-lg"
            />
          ) : (
            <div className="w-full h-96 md:h-[400px] bg-gradient-to-br from-orange-400 to-pink-500 rounded-lg shadow-lg p-6 flex flex-col justify-center items-center text-white">
              <h3 className="text-2xl font-bold text-center mb-4">{novel.title}</h3>
              <p className="text-lg opacity-90">by {novel.author}</p>
            </div>
          )}
        </div>

        {/* Right: Novel Info */}
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">{novel.title}</h1>
              <p className="text-xl text-gray-600 mb-4">by {novel.author}</p>
            </div>
            {isAuthor && (
              <Link
                to={`/write`}
                className="flex items-center gap-2 text-orange-500 hover:text-orange-600"
              >
                <Edit className="h-5 w-5" />
                Edit Novel
              </Link>
            )}
          </div>

          <div className="flex gap-4 mb-6">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-gray-500" />
              <span>{chapters.length} Chapters</span>
            </div>
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-gray-500" />
              <span>{novel.views} Views</span>
            </div>
          </div>

          <div className="flex gap-4 mb-8">
            {novel.genre.map((g) => (
              <span
                key={g}
                className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm"
              >
                {g}
              </span>
            ))}
          </div>

          <div className="flex gap-4 mb-8">
            {chapters.length > 0 && (
              <Link
                to={`/novel/${novel.novel_id}/chapter/${chapters[0].chapter_id}`}
                className="flex items-center gap-2 px-6 py-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition-colors"
              >
                <BookOpen className="h-5 w-5" />
                Start Reading
              </Link>
            )}
            <button
              onClick={toggleLibrary}
              disabled={savingToLibrary}
              className={`flex items-center gap-2 px-6 py-2 border rounded-full transition-colors ${
                isInLibrary
                  ? 'bg-orange-500 text-white border-orange-500'
                  : 'border-orange-500 text-orange-500 hover:bg-orange-50'
              } ${savingToLibrary ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Heart className={`h-5 w-5 ${isInLibrary ? 'fill-current' : ''}`} />
              {savingToLibrary ? 'Saving...' : (isInLibrary ? 'In Library' : 'Add to Library')}
            </button>
            <button 
              onClick={handleShare}
              className="flex items-center gap-2 px-6 py-2 border border-gray-300 text-gray-700 rounded-full hover:bg-gray-50 transition-colors"
            >
              <Share2 className="h-5 w-5" />
              Share
            </button>
          </div>

          <div className="prose max-w-none">
            <h3 className="text-xl font-semibold mb-4">Synopsis</h3>
            <p className="text-gray-700 whitespace-pre-line">{novel.story}</p>
          </div>
        </div>
      </div>

      {/* Chapters List */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6">Chapters</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {chapters.map((chapter) => (
            <Link
              key={chapter.chapter_id}
              to={`/novel/${novel.novel_id}/chapter/${chapter.chapter_id}`}
              className="p-4 border rounded-lg hover:border-orange-500 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">Chapter {chapter.chapter_number}</h3>
                  <p className="text-gray-600">{chapter.title}</p>
                </div>
                {isAuthor && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(`/write/chapter/${chapter.chapter_id}/edit`);
                    }}
                    className="text-orange-500 hover:text-orange-600"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                <Eye className="h-4 w-4" />
                <span>{chapter.views || 0}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}