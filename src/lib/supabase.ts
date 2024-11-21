import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hhrwzfyutuhvengndjyn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhocnd6Znl1dHVodmVuZ25kanluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzIwOTM3MjIsImV4cCI6MjA0NzY2OTcyMn0.JI2IwtLwrWWnRKrAuumNoFhCWPZgxiWNfMgvFlKuKe0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function uploadProfilePicture(file: File, userId: string) {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;

    const { error: uploadError, data } = await supabase.storage
      .from('profile_pictures')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('profile_pictures')
      .getPublicUrl(fileName);

    return publicUrl;
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    throw error;
  }
}

export async function uploadNovelCover(file: File, novelId: string) {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${novelId}-${Date.now()}.${fileExt}`;

    const { error: uploadError, data } = await supabase.storage
      .from('novel_covers')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('novel_covers')
      .getPublicUrl(fileName);

    return publicUrl;
  } catch (error) {
    console.error('Error uploading novel cover:', error);
    throw error;
  }
}