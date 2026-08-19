import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { UserStats } from '../types';

const SUPABASE_URL_STORAGE = 'dovashi_supabase_url';
const SUPABASE_KEY_STORAGE = 'dovashi_supabase_anon_key';

export interface UserProfileData {
  id: string;
  email: string;
  full_name?: string;
  gemini_api_key?: string;
  stats_data?: UserStats;
  updated_at?: string;
}

export function getSupabaseConfig(): { url: string; anonKey: string } {
  try {
    const customUrl = localStorage.getItem(SUPABASE_URL_STORAGE) || '';
    const customKey = localStorage.getItem(SUPABASE_KEY_STORAGE) || '';
    
    const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
    const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

    return {
      url: customUrl.trim() || envUrl.trim(),
      anonKey: customKey.trim() || envKey.trim(),
    };
  } catch (e) {
    return { url: '', anonKey: '' };
  }
}

export function saveSupabaseConfig(url: string, anonKey: string): void {
  try {
    if (url.trim()) {
      localStorage.setItem(SUPABASE_URL_STORAGE, url.trim());
    } else {
      localStorage.removeItem(SUPABASE_URL_STORAGE);
    }

    if (anonKey.trim()) {
      localStorage.setItem(SUPABASE_KEY_STORAGE, anonKey.trim());
    } else {
      localStorage.removeItem(SUPABASE_KEY_STORAGE);
    }
    
    // Reset client instance
    supabaseClientInstance = null;
  } catch (e) {
    console.error('Failed to save Supabase config', e);
  }
}

let supabaseClientInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const { url, anonKey } = getSupabaseConfig();
  if (!url || !anonKey) {
    return null;
  }

  if (!supabaseClientInstance) {
    try {
      supabaseClientInstance = createClient(url, anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      });
    } catch (err) {
      console.error('Failed to initialize Supabase client:', err);
      return null;
    }
  }

  return supabaseClientInstance;
}

export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = getSupabaseConfig();
  return Boolean(url && anonKey);
}

// SQL setup script for user to copy into Supabase SQL Editor
export const SUPABASE_SQL_SCHEMA = `-- 1. Create profiles table
create table if not exists public.user_profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  gemini_api_key text,
  stats_data jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Enable Row Level Security (RLS)
alter table public.user_profiles enable row level security;

-- 3. Setup RLS Security Policies
create policy "Users can view own profile" 
  on public.user_profiles for select 
  using (auth.uid() = id);

create policy "Users can update own profile" 
  on public.user_profiles for update 
  using (auth.uid() = id);

create policy "Users can insert own profile" 
  on public.user_profiles for insert 
  with check (auth.uid() = id);

-- 4. Enable Realtime updates (Optional)
alter publication supabase_realtime add table public.user_profiles;`;

// Sync current user's profile and progress to Supabase
export async function syncUserDataToSupabase(
  user: User,
  stats: UserStats,
  geminiApiKey: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { success: false, error: 'Supabase কনফিগার করা হয়নি' };
  }

  try {
    const payload = {
      id: user.id,
      email: user.email || '',
      full_name: user.user_metadata?.full_name || stats.userName || 'English Learner',
      gemini_api_key: geminiApiKey || '',
      stats_data: stats,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('user_profiles')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.error('Supabase sync error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Supabase sync exception:', err);
    return { success: false, error: err.message || 'ডাটা সিঙ্ক ব্যর্থ হয়েছে' };
  }
}

// Fetch user profile from Supabase
export async function fetchUserDataFromSupabase(
  userId: string
): Promise<{ success: boolean; data?: UserProfileData; error?: string }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { success: false, error: 'Supabase কনফিগার করা হয়নি' };
  }

  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is not found / row not created yet
      console.error('Supabase fetch error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data as UserProfileData };
  } catch (err: any) {
    console.error('Supabase fetch exception:', err);
    return { success: false, error: err.message || 'ডাটা লোড ব্যর্থ হয়েছে' };
  }
}
