import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://spokznxzouupldbrkvlj.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwb2t6bnh6b3V1cGxkYnJrdmxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1MzQ4NDEsImV4cCI6MjA3MzExMDg0MX0.8neyQRJxhdJ1YRfJCafmkVgvLgolwXPL8mB5WTn6d1E';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Authentication helpers
export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};