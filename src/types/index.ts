export const GENRES = [
  'Horror',
  'Fantasy',
  'Adventure',
  'Mystery',
  'Literary',
  'Dystopian',
  'Romance',
  'Sci-Fi',
  'Thriller',
  'Detective',
  'Urban',
  'Action',
  'ACG',
  'Games',
  'LGBT+',
  'War',
  'Realistic',
  'History',
  'Cherads',
  'General',
  'Teen',
  'Devotional',
  'Poetry'
] as const;

export type Genre = typeof GENRES[number];

export interface Novel {
  novel_id: string;
  title: string;
  author: string;
  views: number;
  leading_character: 'male' | 'female';
  upload_by: string;
  genre: Genre[];
  story: string;
  novel_coverpage?: string;
  created_at: string;
  updated_at?: string;
}

export interface Chapter {
  chapter_id: string;
  novel_id: string;
  title: string;
  content: string;
  chapter_number: number;
  views: number;
  created_at: string;
  updated_at?: string;
}

export interface UserProfile {
  user_id: string;
  username: string;
  email: string;
  profile_picture?: string;
  bio?: string;
  interest_genre: Genre[];
  created_at: string;
  updated_at?: string;
}

export interface ReadingProgress {
  user_id: string;
  novel_id: string;
  chapter_id: string;
  lastread_at: string;
}

export interface LibraryEntry {
  library_id: string;
  user_id: string;
  novel_id: string;
  created_at: string;
}