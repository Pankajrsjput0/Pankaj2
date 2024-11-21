import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { UserProfile } from '../types';
import { uploadProfilePicture } from '../lib/supabase';

interface AuthContextType {
  user: any;
  userProfile: UserProfile | null;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  register: (email: string, password: string) => Promise<{ error?: string }>;
  completeProfile: (profileData: {
    username: string;
    age: number;
    interestGenres: string[];
    bio: string;
    profilePicture: File | null;
  }) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  loading: boolean;
  needsProfileCompletion: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsProfileCompletion, setNeedsProfileCompletion] = useState(false);

  useEffect(() => {
    let mounted = true;

    // Check for existing session
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted) {
          setUser(session?.user ?? null);
          if (session?.user) {
            await fetchUserProfile(session.user.id);
          }
          setLoading(false);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchUserProfile(session.user.id);
      } else {
        setUserProfile(null);
        setNeedsProfileCompletion(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('Users')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return { error: error.message };
      }

      if (profile) {
        if (profile.username) {
          setUserProfile(profile as UserProfile);
          setNeedsProfileCompletion(false);
        } else {
          setNeedsProfileCompletion(true);
        }
      }
      return {};
    } catch (error: any) {
      console.error('Error in fetchUserProfile:', error);
      return { error: error.message };
    }
  };

  const register = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) return { error: error.message };
      
      if (data.user) {
        // Wait for the database trigger to complete
        await new Promise(resolve => setTimeout(resolve, 1000));
        const profileResult = await fetchUserProfile(data.user.id);
        if (profileResult.error) {
          return { error: profileResult.error };
        }
        return {};
      }
      
      return { error: 'Registration failed' };
    } catch (error: any) {
      console.error('Registration error:', error);
      return { error: error.message };
    }
  };

  const completeProfile = async (profileData: {
    username: string;
    age: number;
    interestGenres: string[];
    bio: string;
    profilePicture: File | null;
  }) => {
    if (!user) return { error: 'No user found' };

    try {
      let profilePictureUrl = null;
      if (profileData.profilePicture) {
        try {
          profilePictureUrl = await uploadProfilePicture(profileData.profilePicture, user.id);
        } catch (error: any) {
          return { error: 'Failed to upload profile picture: ' + error.message };
        }
      }

      const { error: updateError } = await supabase
        .from('Users')
        .update({
          username: profileData.username,
          age: profileData.age,
          interest_genre: profileData.interestGenres,
          bio: profileData.bio,
          profile_picture: profilePictureUrl,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (updateError) return { error: updateError.message };

      const profileResult = await fetchUserProfile(user.id);
      if (profileResult.error) {
        return { error: profileResult.error };
      }

      return {};
    } catch (error: any) {
      console.error('Error completing profile:', error);
      return { error: error.message };
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) return { error: error.message };
      
      if (data.user) {
        const profileResult = await fetchUserProfile(data.user.id);
        if (profileResult.error) {
          return { error: profileResult.error };
        }
        return {};
      }

      return { error: 'Login failed' };
    } catch (error: any) {
      console.error('Login error:', error);
      return { error: error.message };
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setUserProfile(null);
      setNeedsProfileCompletion(false);
    } catch (error: any) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const value = {
    user,
    userProfile,
    login,
    register,
    completeProfile,
    logout,
    loading,
    needsProfileCompletion
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}