import React, { useState, useEffect } from 'react';
import {
  X,
  Cloud,
  CheckCircle2,
  AlertCircle,
  Database,
  Lock,
  Mail,
  User as UserIcon,
  LogOut,
  RefreshCw,
  Copy,
  Check,
  KeyRound,
  ExternalLink,
  ShieldCheck,
  Smartphone,
  Layers,
  ArrowRight,
  Globe,
  Info
} from 'lucide-react';
import { User } from '@supabase/supabase-js';
import {
  getSupabaseClient,
  isSupabaseConfigured,
  getSupabaseConfig,
  saveSupabaseConfig,
  syncUserDataToSupabase,
  fetchUserDataFromSupabase,
  SUPABASE_SQL_SCHEMA
} from '../utils/supabase';
import { UserStats } from '../types';
import { getUserApiKey, saveUserApiKey, saveUserStats } from '../utils/storage';

interface AuthSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  userStats: UserStats;
  setUserStats: (stats: UserStats) => void;
  onApiKeyUpdated?: () => void;
}

export const AuthSyncModal: React.FC<AuthSyncModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  setCurrentUser,
  userStats,
  setUserStats,
  onApiKeyUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'auth' | 'profile' | 'config' | 'google-setup' | 'sql'>('auth');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  
  // Auth Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  // Supabase Config State
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState('');
  const [configSuccess, setConfigSuccess] = useState(false);

  // Sync state
  const [syncing, setSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [syncStatusMsg, setSyncStatusMsg] = useState('');

  // Copy state
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const config = getSupabaseConfig();
      setSupabaseUrl(config.url);
      setSupabaseAnonKey(config.anonKey);
      setAuthError('');
      setAuthSuccess('');

      if (currentUser) {
        setActiveTab('profile');
      } else if (!isSupabaseConfigured()) {
        setActiveTab('config');
      } else {
        setActiveTab('auth');
      }
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabaseUrl.trim() || !supabaseAnonKey.trim()) {
      setAuthError('Supabase Project URL এবং Anon Key উভয়ই প্রয়োজন');
      return;
    }

    saveSupabaseConfig(supabaseUrl.trim(), supabaseAnonKey.trim());
    setConfigSuccess(true);
    setTimeout(() => {
      setConfigSuccess(false);
      setActiveTab(currentUser ? 'profile' : 'auth');
    }, 1200);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    setAuthLoading(true);

    const supabase = getSupabaseClient();
    if (!supabase) {
      setAuthError('Supabase এখনও কনফিগার করা হয়নি। অনুগ্রহ করে ডাটাবেজ সংযোগ ট্যাবে গিয়ে URL ও Key দিন।');
      setAuthLoading(false);
      return;
    }

    try {
      if (authMode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName.trim() || 'English Learner',
            },
          },
        });

        if (error) throw error;

        if (data.user) {
          setCurrentUser(data.user);
          setAuthSuccess('অ্যাকাউন্ট তৈরি সফল হয়েছে! ক্লাউডে ব্যাকআপ নেওয়া হচ্ছে...');
          // Initial sync
          const currentApiKey = getUserApiKey();
          await syncUserDataToSupabase(data.user, userStats, currentApiKey);
          setLastSyncTime(new Date().toLocaleTimeString());
          setActiveTab('profile');
        }
      } else {
        // Sign In
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) throw error;

        if (data.user) {
          setCurrentUser(data.user);
          setAuthSuccess('লগইন সফল হয়েছে! আপনার ক্লাউড ডাটা লোড করা হচ্ছে...');

          // Pull user profile and restore API key + stats
          const profileRes = await fetchUserDataFromSupabase(data.user.id);
          if (profileRes.success && profileRes.data) {
            const remoteData = profileRes.data;
            if (remoteData.gemini_api_key) {
              saveUserApiKey(remoteData.gemini_api_key);
              if (onApiKeyUpdated) onApiKeyUpdated();
            }
            if (remoteData.stats_data) {
              saveUserStats(remoteData.stats_data);
              setUserStats(remoteData.stats_data);
            }
          } else {
            // First time login for this existing user in Supabase, upload current stats
            const currentApiKey = getUserApiKey();
            await syncUserDataToSupabase(data.user, userStats, currentApiKey);
          }

          setLastSyncTime(new Date().toLocaleTimeString());
          setActiveTab('profile');
        }
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setAuthError(err.message || 'অথেনটিকেশন ব্যর্থ হয়েছে। তথ্য যাচাই করুন।');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthError('');
    setAuthSuccess('');
    setAuthLoading(true);

    const supabase = getSupabaseClient();
    if (!supabase) {
      setAuthError('Supabase এখনও কনফিগার করা হয়নি। অনুগ্রহ করে ডাটাবেজ সংযোগ ট্যাবে URL ও Key দিন।');
      setAuthLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (error) throw error;
    } catch (err: any) {
      console.error('Google Sign-in error:', err);
      setAuthError(err.message || 'গুগল সাইন-ইন শুরু করতে সমস্যা হয়েছে। Supabase ড্যাশবোর্ডে Google Provider এনাবল করা হয়েছে কি না নিশ্চিত হোন।');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    setCurrentUser(null);
    setActiveTab('auth');
    setAuthSuccess('সফলভাবে লগআউট করা হয়েছে।');
  };

  const handleManualSync = async () => {
    if (!currentUser) return;
    setSyncing(true);
    setSyncStatusMsg('');

    const currentApiKey = getUserApiKey();
    const res = await syncUserDataToSupabase(currentUser, userStats, currentApiKey);

    if (res.success) {
      setLastSyncTime(new Date().toLocaleTimeString());
      setSyncStatusMsg('ক্লাউডে সকল ডাটা ও এপিআই কি সফলভাবে সিঙ্ক হয়েছে!');
    } else {
      setSyncStatusMsg(`সিঙ্ক সমস্যা: ${res.error}`);
    }
    setSyncing(false);
  };

  const handleCopyText = (text: string, identifier: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(identifier);
    setTimeout(() => setCopiedItem(null), 2000);
  };

  // Derive Supabase callback URL from currently set Supabase URL
  const supabaseCallbackUrl = supabaseUrl
    ? `${supabaseUrl.replace(/\/$/, '')}/auth/v1/callback`
    : 'https://<your-project-ref>.supabase.co/auth/v1/callback';

  const appOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://ais-pre-fo3owuqjpczzsi5hj5eyh3-348785349910.asia-southeast1.run.app';

  const isConfigured = isSupabaseConfigured();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-100 font-['Hind_Siliguri',sans-serif]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/95 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Database className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold flex items-center gap-2 text-white">
                Supabase ক্লাউড ও গুগল সাইন-ইন
                {currentUser && (
                  <span className="text-[10px] sm:text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 font-medium">
                    লগইন আছেন
                  </span>
                )}
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
                অ্যাকাউন্ট, গুগল সাইন-ইন, API Key ও প্রগ্রেস অন্য ডিভাইসে সিঙ্ক
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 px-3 sm:px-5 bg-slate-900/50 text-xs sm:text-sm font-medium overflow-x-auto gap-1.5 py-2 shrink-0 scrollbar-none">
          {currentUser ? (
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 text-xs ${
                activeTab === 'profile'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <UserIcon className="w-3.5 h-3.5" /> প্রোফাইল ও সিঙ্ক
            </button>
          ) : (
            <button
              onClick={() => setActiveTab('auth')}
              className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 text-xs ${
                activeTab === 'auth'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Lock className="w-3.5 h-3.5" /> সাইন ইন / লগইন
            </button>
          )}

          <button
            onClick={() => setActiveTab('google-setup')}
            className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 text-xs ${
              activeTab === 'google-setup'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z" />
              <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
              <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15s.7 5.3 1.9 7.7l3.7-2.9z" />
              <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z" />
            </svg>
            Google OAuth তৈরি
          </button>

          <button
            onClick={() => setActiveTab('config')}
            className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 text-xs ${
              activeTab === 'config'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Database className="w-3.5 h-3.5" /> ডাটাবেজ সংযোগ
            {isConfigured && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('sql')}
            className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 text-xs ${
              activeTab === 'sql'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> SQL স্কিমা
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          
          {/* TAB 1: AUTH (Google & Email Login) */}
          {activeTab === 'auth' && (
            <div className="space-y-4">
              {!isConfigured && (
                <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-2.5 text-amber-200 text-xs">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-amber-300">Supabase প্রজেক্ট লিংক করা হয়নি</p>
                    <p className="mt-0.5 text-amber-200/80">
                      লগইন বা গুগল সাইন ইন করার পূর্বে "ডাটাবেজ সংযোগ" ট্যাবে আপনার Supabase URL ও Anon Key দিন।
                    </p>
                  </div>
                </div>
              )}

              {/* 1-Click Google Sign In Button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={authLoading}
                className="w-full py-3 px-4 bg-white hover:bg-slate-100 text-slate-900 font-bold rounded-2xl text-xs sm:text-sm transition-all flex items-center justify-center gap-2.5 shadow-md hover:shadow-lg active:scale-[0.99] border border-slate-200"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z" />
                  <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
                  <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15s.7 5.3 1.9 7.7l3.7-2.9z" />
                  <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z" />
                </svg>
                <span>Google অ্যাকাউন্ট দিয়ে সরাসরি সাইন ইন করুন</span>
              </button>

              <div className="flex items-center gap-3 my-2">
                <div className="flex-1 h-[1px] bg-slate-800"></div>
                <span className="text-[11px] text-slate-500 uppercase font-semibold">অথবা ইমেইল ও পাসওয়ার্ড দিয়ে</span>
                <div className="flex-1 h-[1px] bg-slate-800"></div>
              </div>

              {/* Mode Toggle */}
              <div className="grid grid-cols-2 bg-slate-950 p-1 rounded-2xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => { setAuthMode('signin'); setAuthError(''); }}
                  className={`py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    authMode === 'signin'
                      ? 'bg-slate-800 text-emerald-400 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  লগইন করুন
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthMode('signup'); setAuthError(''); }}
                  className={`py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    authMode === 'signup'
                      ? 'bg-slate-800 text-emerald-400 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  নতুন অ্যাকাউন্ট
                </button>
              </div>

              {authError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span>{authError}</span>
                    {authError.includes('Google') && (
                      <p className="mt-1 text-[11px] text-slate-400">
                        গুগল ক্লায়েন্ট আইডি সেটআপ করতে উপরের <strong>"Google OAuth তৈরি"</strong> ট্যাব দেখুন।
                      </p>
                    )}
                  </div>
                </div>
              )}

              {authSuccess && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{authSuccess}</span>
                </div>
              )}

              <form onSubmit={handleAuth} className="space-y-3">
                {authMode === 'signup' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      আপনার নাম
                    </label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="যেমন: ফাহিম মিয়া"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    ইমেইল এড্রেস
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="yourname@gmail.com"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    পাসওয়ার্ড
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full mt-1 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-semibold rounded-xl text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30"
                >
                  {authLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      প্রক্রিয়াধীন...
                    </>
                  ) : authMode === 'signup' ? (
                    <>
                      অ্যাকাউন্ট তৈরি ও সিঙ্ক শুরু করুন
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  ) : (
                    <>
                      লগইন করুন ও ক্লাউড ডাটা আনুন
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: GOOGLE OAUTH SETUP GUIDE */}
          {activeTab === 'google-setup' && (
            <div className="space-y-4 text-xs">
              <div className="p-3.5 bg-indigo-950/40 border border-indigo-500/30 rounded-2xl flex items-start gap-3">
                <div className="p-2 bg-indigo-500/20 rounded-xl text-indigo-300 shrink-0 mt-0.5">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">Google OAuth Client ID তৈরি ও সেটআপ নির্দেশিকা</h4>
                  <p className="text-indigo-200/80 mt-1 leading-relaxed">
                    গুগল দিয়ে ১-ক্লিকে সাইন ইন চালু করতে Google Cloud Console থেকে একটি <strong>OAuth Client ID</strong> তৈরি করে Supabase-এ যুক্ত করতে হবে। নিচে ধাপগুলো দেওয়া হলো:
                  </p>
                </div>
              </div>

              {/* Step 1 */}
              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-400">ধাপ ১: Google Cloud Console-এ যান</span>
                  <a
                    href="https://console.cloud.google.com/apis/credentials"
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-lg font-semibold flex items-center gap-1 transition-colors"
                  >
                    Credentials পেজ খুলুন <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  1. <strong>Create Credentials</strong> বাটনে ক্লিক করে <strong>OAuth client ID</strong> নির্বাচন করুন।<br />
                  2. Application type: <strong>Web application</strong> বেছে নিন।
                </p>
              </div>

              {/* Step 2: Authorized Javascript Origins */}
              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl space-y-2.5">
                <span className="font-bold text-emerald-400">ধাপ ২: Authorized JavaScript origins যোগ করুন</span>
                <p className="text-slate-400">Google Cloud Console-এ "Authorized JavaScript origins"-এ নিচের URL গুলো অ্যাড করুন:</p>
                
                {/* Dev URL */}
                <div className="flex items-center justify-between p-2 bg-slate-900 rounded-xl border border-slate-800 font-mono text-[11px]">
                  <span className="text-slate-300 truncate mr-2">{appOrigin}</span>
                  <button
                    onClick={() => handleCopyText(appOrigin, 'appOrigin')}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md shrink-0 flex items-center gap-1"
                  >
                    {copiedItem === 'appOrigin' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copiedItem === 'appOrigin' ? 'কপি হয়েছে' : 'কপি'}
                  </button>
                </div>

                {/* Supabase URL Origin */}
                {supabaseUrl && (
                  <div className="flex items-center justify-between p-2 bg-slate-900 rounded-xl border border-slate-800 font-mono text-[11px]">
                    <span className="text-slate-300 truncate mr-2">{supabaseUrl.replace(/\/$/, '')}</span>
                    <button
                      onClick={() => handleCopyText(supabaseUrl.replace(/\/$/, ''), 'supabaseOrigin')}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md shrink-0 flex items-center gap-1"
                    >
                      {copiedItem === 'supabaseOrigin' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      {copiedItem === 'supabaseOrigin' ? 'কপি হয়েছে' : 'কপি'}
                    </button>
                  </div>
                )}
              </div>

              {/* Step 3: Authorized redirect URIs */}
              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl space-y-2.5">
                <span className="font-bold text-amber-400">ধাপ ৩: Authorized redirect URIs (সবচেয়ে গুরুত্বপূর্ণ)</span>
                <p className="text-slate-300 leading-relaxed">
                  Google Cloud Console-এ <strong>"Authorized redirect URIs"</strong> ফিল্ডে ঠিক নিচের Callback URL-টি পেস্ট করুন:
                </p>
                <div className="flex items-center justify-between p-2 bg-slate-900 rounded-xl border border-amber-500/30 font-mono text-[11px] text-amber-300">
                  <span className="truncate mr-2">{supabaseCallbackUrl}</span>
                  <button
                    onClick={() => handleCopyText(supabaseCallbackUrl, 'callbackUrl')}
                    className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-md shrink-0 flex items-center gap-1 font-semibold"
                  >
                    {copiedItem === 'callbackUrl' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copiedItem === 'callbackUrl' ? 'কপি হয়েছে' : 'কপি করুন'}
                  </button>
                </div>
              </div>

              {/* Step 4: Supabase Dashboard */}
              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-400">ধাপ ৪: Supabase Dashboard-এ যুক্ত করুন</span>
                  <a
                    href="https://supabase.com/dashboard"
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg flex items-center gap-1 font-semibold"
                  >
                    Supabase ড্যাশবোর্ড <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  1. আপনার Supabase Dashboard &gt; <strong>Authentication</strong> &gt; <strong>Providers</strong> &gt; <strong>Google</strong>-এ যান।<br />
                  2. <strong>Enable Google</strong> চালু করুন।<br />
                  3. গুগল থেকে পাওয়া <strong>Client ID</strong> এবং <strong>Client Secret</strong> পেস্ট করে <strong>Save</strong> করুন।
                </p>
              </div>

              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>ব্যস! এবার ব্যবহারকারীরা যেকোনো ডিভাইস থেকে ১-ক্লিকেই গুগল দিয়ে লগইন করতে পারবে।</span>
              </div>
            </div>
          )}

          {/* TAB 3: PROFILE & CLOUD STATUS */}
          {activeTab === 'profile' && currentUser && (
            <div className="space-y-4">
              <div className="p-4 sm:p-5 bg-gradient-to-br from-emerald-950/40 via-slate-950 to-slate-900 border border-emerald-500/30 rounded-2xl relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 text-lg font-bold">
                      {currentUser.user_metadata?.avatar_url ? (
                        <img src={currentUser.user_metadata.avatar_url} alt="Avatar" className="w-full h-full rounded-2xl object-cover" />
                      ) : (
                        currentUser.email?.charAt(0).toUpperCase() || 'U'
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm sm:text-base">
                        {currentUser.user_metadata?.full_name || userStats.userName || 'English Learner'}
                      </h3>
                      <p className="text-xs text-slate-400 font-mono">{currentUser.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
                  >
                    <LogOut className="w-3.5 h-3.5" /> লগআউট
                  </button>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-800 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 bg-slate-900/80 rounded-xl border border-slate-800">
                    <div className="text-slate-400">সম্পন্ন লেভেল</div>
                    <div className="text-sm font-bold text-emerald-400 mt-0.5">
                      {userStats.completedLevelIds.length} / 300
                    </div>
                  </div>
                  <div className="p-2 bg-slate-900/80 rounded-xl border border-slate-800">
                    <div className="text-slate-400">মোট XP</div>
                    <div className="text-sm font-bold text-amber-400 mt-0.5">
                      {userStats.totalXp} XP
                    </div>
                  </div>
                  <div className="p-2 bg-slate-900/80 rounded-xl border border-slate-800">
                    <div className="text-slate-400">Gemini Key</div>
                    <div className="text-sm font-bold text-teal-400 mt-0.5 flex items-center justify-center gap-1">
                      {getUserApiKey() ? <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> : 'যুক্ত নেই'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Sync Status Banner */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col gap-3">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Cloud className="w-4 h-4 text-emerald-400" />
                    <span>ক্লাউড অটো-সিঙ্ক স্ট্যাটাস:</span>
                  </div>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1 text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5" /> অ্যাক্টিভ
                  </span>
                </div>

                {lastSyncTime && (
                  <p className="text-xs text-slate-500">
                    সর্বশেষ সফল সিঙ্ক: <span className="text-slate-300">{lastSyncTime}</span>
                  </p>
                )}

                {syncStatusMsg && (
                  <p className="text-xs text-emerald-400 bg-emerald-950/40 p-2 rounded-lg border border-emerald-500/20">
                    {syncStatusMsg}
                  </p>
                )}

                <button
                  onClick={handleManualSync}
                  disabled={syncing}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 font-semibold rounded-xl text-xs sm:text-sm transition-all flex items-center justify-center gap-2 border border-slate-700"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                  {syncing ? 'সিঙ্ক করা হচ্ছে...' : 'এখনই সব ডাটা ক্লাউডে সিঙ্ক করুন'}
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: SUPABASE CONFIGURATION */}
          {activeTab === 'config' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-slate-300 leading-relaxed">
                Supabase হলো একটি শক্তিশালী ক্লাউড ডাটাবেজ। <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-emerald-400 underline inline-flex items-center gap-0.5">supabase.com <ExternalLink className="w-3 h-3" /></a> থেকে আপনার প্রজেক্টের <strong>Project URL</strong> এবং <strong>anon public API Key</strong> নিচে দিয়ে সেভ করুন।
              </div>

              {configSuccess && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs sm:text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Supabase সফলভাবে কনফিগার ও লিংক করা হয়েছে!</span>
                </div>
              )}

              <form onSubmit={handleSaveConfig} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>Supabase Project URL</span>
                    <span className="text-slate-500 font-normal">https://xxxx.supabase.co</span>
                  </label>
                  <input
                    type="url"
                    required
                    value={supabaseUrl}
                    onChange={(e) => setSupabaseUrl(e.target.value)}
                    placeholder="https://your-project.supabase.co"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>Supabase Anon / Public Key</span>
                    <span className="text-slate-500 font-normal">eyJhbGciOi...</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={supabaseAnonKey}
                    onChange={(e) => setSupabaseAnonKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors font-mono resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20"
                >
                  <Check className="w-4 h-4" />
                  ডাটাবেজ সংযোগ সেভ করুন
                </button>
              </form>
            </div>
          )}

          {/* TAB 5: SQL SCHEMA */}
          {activeTab === 'sql' && (
            <div className="space-y-3.5">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300">
                আপনার Supabase ড্যাশবোর্ডে গিয়ে <strong>SQL Editor</strong>-এ নিচের কোডটি পেস্ট করে <strong>Run</strong> বাটনে চাপুন:
              </div>

              <div className="relative">
                <button
                  onClick={() => handleCopyText(SUPABASE_SQL_SCHEMA, 'sqlSchema')}
                  className="absolute right-3 top-3 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors z-10"
                >
                  {copiedItem === 'sqlSchema' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" /> কপি হয়েছে
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> কপি করুন
                    </>
                  )}
                </button>
                <pre className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-[11px] font-mono text-emerald-400/90 overflow-x-auto max-h-56 leading-relaxed">
                  {SUPABASE_SQL_SCHEMA}
                </pre>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 border-t border-slate-800 bg-slate-900/95 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs sm:text-sm transition-colors"
          >
            বন্ধ করুন
          </button>
        </div>

      </div>
    </div>
  );
};
