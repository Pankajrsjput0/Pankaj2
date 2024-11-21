import React, { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { GENRES, UserProfile } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface EditProfileModalProps {
  userProfile: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export default function EditProfileModal({ 
  userProfile, 
  isOpen, 
  onClose, 
  onUpdate 
}: EditProfileModalProps) {
  const [formData, setFormData] = useState({
    username: userProfile.username,
    bio: userProfile.bio || '',
    interest_genre: userProfile.interest_genre
  });
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    try {
      let profile_picture = userProfile.profile_picture;

      if (profilePicture) {
        const fileExt = profilePicture.name.split('.').pop();
        const filePath = `${uuidv4()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('profile_pictures')
          .upload(filePath, profilePicture);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from('profile_pictures')
          .getPublicUrl(filePath);

        profile_picture = data.publicUrl;
      }

      const { error } = await supabase
        .from('Users')
        .update({
          ...formData,
          profile_picture,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userProfile.user_id);

      if (error) throw error;
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full relative">
        <button onClick={onClose} className="absolute right-4 top-4 text-gray-500 hover:text-gray-700">
          <X className="h-6 w-6" />
        </button>

        <h2 className="text-2xl font-bold mb-6">Edit Profile</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Profile Picture</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setProfilePicture(e.target.files?.[0] || null)}
              className="mt-1 block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-orange-50 file:text-orange-700
                hover:file:bg-orange-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Username</label>
            <input
              type="text"
              required
              value={formData.username}
              onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Bio</label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Favorite Genres (max 3)
            </label>
            <div className="flex flex-wrap gap-2">
              {GENRES.map(genre => (
                <button
                  key={genre}
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      interest_genre: prev.interest_genre.includes(genre)
                        ? prev.interest_genre.filter(g => g !== genre)
                        : prev.interest_genre.length < 3
                        ? [...prev.interest_genre, genre]
                        : prev.interest_genre
                    }));
                  }}
                  className={`px-3 py-1 rounded-full text-sm ${
                    formData.interest_genre.includes(genre)
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              disabled={uploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
              disabled={uploading}
            >
              {uploading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}