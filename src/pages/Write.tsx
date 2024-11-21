import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Novel, Chapter } from '../types';
import { PlusCircle, Edit, BookOpen, Trash2 } from 'lucide-react';
import EditNovelModal from '../components/EditNovelModal';
import AddChapterModal from '../components/AddChapterModal';
import EditChapterModal from '../components/EditChapterModal';
import CreateNovelModal from '../components/CreateNovelModal';
import { useNavigate } from 'react-router-dom';
import NovelCard from '../components/NovelCard';

export default function Write() {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [myNovels, setMyNovels] = useState<Novel[]>([]);
  const [showNewNovelForm, setShowNewNovelForm] = useState(false);
  const [editingNovel, setEditingNovel] = useState<Novel | null>(null);
  const [editingChapter, setEditingChapter] = useState<{novel: Novel, chapter: Chapter} | null>(null);
  const [addingChapterToNovel, setAddingChapterToNovel] = useState<Novel | null>(null);
  const [lastChapterNumbers, setLastChapterNumbers] = useState<Record<string, number>>({});
  const [expandedNovel, setExpandedNovel] = useState<string | null>(null);
  const [chapters, setChapters] = useState<Record<string, Chapter[]>>({});

  useEffect(() => {
    if (!userProfile) {
      navigate('/auth');
      return;
    }

    const fetchMyNovels = async () => {
      try {
        // Fetch novels
        const { data: novels, error: novelsError } = await supabase
          .from('Novels')
          .select('*')
          .eq('upload_by', userProfile.user_id);

        if (novelsError) throw novelsError;
        setMyNovels(novels);

        // Fetch chapters for each novel
        const chapterData: Record<string, Chapter[]> = {};
        const chapterNumbers: Record<string, number> = {};
        
        for (const novel of novels) {
          const { data: chaptersData, error: chaptersError } = await supabase
            .from('Chapters')
            .select('*')
            .eq('novel_id', novel.novel_id)
            .order('chapter_number', { ascending: true });

          if (chaptersError) throw chaptersError;
          
          chapterData[novel.novel_id] = chaptersData;
          chapterNumbers[novel.novel_id] = chaptersData.length > 0 
            ? Math.max(...chaptersData.map(c => c.chapter_number))
            : 0;
        }
        
        setChapters(chapterData);
        setLastChapterNumbers(chapterNumbers);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchMyNovels();
  }, [userProfile, navigate]);

  const handleDeleteNovel = async (novelId: string) => {
    if (!confirm('Are you sure you want to delete this novel? This action cannot be undone.')) {
      return;
    }

    try {
      // Delete all chapters first
      const { error: chaptersError } = await supabase
        .from('Chapters')
        .delete()
        .eq('novel_id', novelId);

      if (chaptersError) throw chaptersError;

      // Then delete the novel
      const { error: novelError } = await supabase
        .from('Novels')
        .delete()
        .eq('novel_id', novelId);

      if (novelError) throw novelError;

      setMyNovels(prev => prev.filter(novel => novel.novel_id !== novelId));
    } catch (error) {
      console.error('Error deleting novel:', error);
    }
  };

  const handleDeleteChapter = async (novelId: string, chapterId: string) => {
    if (!confirm('Are you sure you want to delete this chapter? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('Chapters')
        .delete()
        .eq('chapter_id', chapterId);

      if (error) throw error;

      setChapters(prev => ({
        ...prev,
        [novelId]: prev[novelId].filter(chapter => chapter.chapter_id !== chapterId)
      }));
    } catch (error) {
      console.error('Error deleting chapter:', error);
    }
  };

  const handleChapterClick = (novelId: string, chapterId: string) => {
    navigate(`/novel/${novelId}/chapter/${chapterId}`);
  };

  if (!userProfile) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Novels</h1>
        <button
          onClick={() => setShowNewNovelForm(true)}
          className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600"
        >
          <PlusCircle className="h-5 w-5" />
          Create New Novel
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {myNovels.map(novel => (
          <div key={novel.novel_id} className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex gap-6">
              <div className="w-48">
                <NovelCard novel={novel} />
              </div>
              
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold mb-2">{novel.title}</h3>
                    <p className="text-gray-600 mb-2">by {novel.author}</p>
                    <div className="flex gap-2 mb-4">
                      {novel.genre.map(g => (
                        <span key={g} className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
                          {g}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setAddingChapterToNovel(novel)}
                      className="flex items-center gap-1 text-orange-500 hover:text-orange-600"
                    >
                      <BookOpen className="h-4 w-4" />
                      Add Chapter
                    </button>
                    <button 
                      onClick={() => setEditingNovel(novel)}
                      className="flex items-center gap-1 text-orange-500 hover:text-orange-600"
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteNovel(novel.novel_id)}
                      className="flex items-center gap-1 text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                </div>

                <div className="mt-4">
                  <h4 className="font-semibold mb-2">Chapters</h4>
                  <div className="space-y-2">
                    {chapters[novel.novel_id]?.map(chapter => (
                      <div 
                        key={chapter.chapter_id} 
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                        onClick={() => handleChapterClick(novel.novel_id, chapter.chapter_id)}
                      >
                        <div>
                          <span className="font-medium">Chapter {chapter.chapter_number}:</span>
                          <span className="ml-2">{chapter.title}</span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingChapter({ novel, chapter });
                            }}
                            className="text-orange-500 hover:text-orange-600"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteChapter(novel.novel_id, chapter.chapter_id);
                            }}
                            className="text-red-500 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showNewNovelForm && (
        <CreateNovelModal
          isOpen={showNewNovelForm}
          onClose={() => setShowNewNovelForm(false)}
          onCreated={() => {
            // Refresh novels list
            if (userProfile) {
              const fetchMyNovels = async () => {
                const { data } = await supabase
                  .from('Novels')
                  .select('*')
                  .eq('upload_by', userProfile.user_id);
                if (data) setMyNovels(data);
              };
              fetchMyNovels();
            }
          }}
        />
      )}

      {editingNovel && (
        <EditNovelModal
          novel={editingNovel}
          isOpen={!!editingNovel}
          onClose={() => setEditingNovel(null)}
          onUpdate={() => {
            // Refresh novels list
            if (userProfile) {
              const fetchMyNovels = async () => {
                const { data } = await supabase
                  .from('Novels')
                  .select('*')
                  .eq('upload_by', userProfile.user_id);
                if (data) setMyNovels(data);
              };
              fetchMyNovels();
            }
          }}
        />
      )}

      {addingChapterToNovel && (
        <AddChapterModal
          novelId={addingChapterToNovel.novel_id}
          isOpen={!!addingChapterToNovel}
          onClose={() => setAddingChapterToNovel(null)}
          lastChapterNumber={lastChapterNumbers[addingChapterToNovel.novel_id] || 0}
          onAdd={() => {
            // Update last chapter number and refresh chapters
            setLastChapterNumbers(prev => ({
              ...prev,
              [addingChapterToNovel.novel_id]: (prev[addingChapterToNovel.novel_id] || 0) + 1
            }));
          }}
        />
      )}

      {editingChapter && (
        <EditChapterModal
          novelId={editingChapter.novel.novel_id}
          chapter={editingChapter.chapter}
          isOpen={!!editingChapter}
          onClose={() => setEditingChapter(null)}
          onUpdate={() => {
            // Refresh chapters
            const fetchChapters = async () => {
              const { data } = await supabase
                .from('Chapters')
                .select('*')
                .eq('novel_id', editingChapter.novel.novel_id)
                .order('chapter_number', { ascending: true });
              
              if (data) {
                setChapters(prev => ({
                  ...prev,
                  [editingChapter.novel.novel_id]: data
                }));
              }
            };
            fetchChapters();
          }}
        />
      )}
    </div>
  );
}