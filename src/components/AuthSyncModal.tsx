import React, { useState, useEffect } from 'react';
import {
  X,
  Lock,
  Mail,
  User as UserIcon,
  LogOut,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Flame,
  Award
} from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { performGoogleSignIn } from '../utils/nativeGoogleAuth';
import {
  getSupabaseClient,
  syncUserDataToSupabase,
  fetchUserDataFromSupabase
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
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (currentUser) {
        setLoading(false);
        setSuccessMsg('সফলভাবে লগইন হয়েছে!');
        const timer = setTimeout(() => onClose(), 1000);
        return () => clearTimeout(timer);
      } else {
        setErrorMsg('');
        setSuccessMsg('');
      }
    }
  }, [isOpen, currentUser, onClose]);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await performGoogleSignIn();
      if (!res.success && res.error) {
        setErrorMsg(res.error);
      } else if (res.user) {
        setCurrentUser(res.user);
        setSuccessMsg('গুগল দিয়ে সফলভাবে লগইন হয়েছে!');
        setTimeout(() => onClose(), 1200);
      }
    } catch (err: any) {
      console.error('Google sign in error:', err);
      setErrorMsg(err.message || 'গুগল সাইন-ইন করা সম্ভব হয়নি।');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    const supabase = getSupabaseClient();
    if (!supabase) {
      setErrorMsg('সার্ভার সংযোগ পাওয়া যায়নি।');
      setLoading(false);
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
          setSuccessMsg('অ্যাকাউন্ট তৈরি সফল হয়েছে!');
          const currentApiKey = getUserApiKey();
          await syncUserDataToSupabase(data.user, userStats, currentApiKey);
          setTimeout(() => onClose(), 1200);
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) throw error;

        if (data.user) {
          setCurrentUser(data.user);
          setSuccessMsg('লগইন সফল হয়েছে!');

          // Restore user progress and settings from cloud
          const profileRes = await fetchUserDataFromSupabase(data.user.id);
          if (profileRes.success && profileRes.data) {
            const remote = profileRes.data;
            if (remote.gemini_api_key) {
              saveUserApiKey(remote.gemini_api_key);
              if (onApiKeyUpdated) onApiKeyUpdated();
            }
            if (remote.stats_data) {
              saveUserStats(remote.stats_data);
              setUserStats(remote.stats_data);
            }
          }
          setTimeout(() => onClose(), 1200);
        }
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setErrorMsg(err.message || 'ইমেইল বা পাসওয়ার্ড সঠিক নয়।');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    setCurrentUser(null);
    setSuccessMsg('সফলভাবে লগআউট করা হয়েছে।');
    setTimeout(() => onClose(), 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in font-['Hind_Siliguri',sans-serif]">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden text-slate-100 relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* LOGGED IN PROFILE VIEW */}
        {currentUser ? (
          <div className="p-6 sm:p-7 space-y-5">
            <div className="text-center pt-2">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 p-[2px] mx-auto shadow-lg shadow-emerald-500/20">
                <div className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center overflow-hidden">
                  {currentUser.user_metadata?.avatar_url ? (
                    <img src={currentUser.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold text-emerald-400 font-['Plus_Jakarta_Sans',sans-serif]">
                      {currentUser.email?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  )}
                </div>
              </div>
              <h3 className="text-lg font-bold text-white mt-3">
                {currentUser.user_metadata?.full_name || userStats.userName || 'English Learner'}
              </h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">{currentUser.email}</p>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-3 gap-2.5 bg-slate-950 p-3 rounded-2xl border border-slate-800/80 text-center text-xs">
              <div className="p-2">
                <Award className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                <div className="text-slate-400 text-[11px]">লেভেল</div>
                <div className="font-bold text-white text-sm mt-0.5">{userStats.completedLevelIds.length} / 300</div>
              </div>
              <div className="p-2 border-x border-slate-800/80">
                <Sparkles className="w-4 h-4 text-indigo-400 mx-auto mb-1" />
                <div className="text-slate-400 text-[11px]">মোট XP</div>
                <div className="font-bold text-indigo-300 text-sm mt-0.5">{userStats.totalXp}</div>
              </div>
              <div className="p-2">
                <Flame className="w-4 h-4 text-orange-400 mx-auto mb-1" />
                <div className="text-slate-400 text-[11px]">স্ট্রিক</div>
                <div className="font-bold text-orange-300 text-sm mt-0.5">{userStats.streakDays} দিন</div>
              </div>
            </div>

            {/* Cloud Sync Notice */}
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>আপনার সব প্রগ্রেস ক্লাউডে সুরক্ষিত ও ব্যাকআপ আছে।</span>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleSignOut}
              className="w-full py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" /> অ্যাকাউন্ট থেকে লগআউট করুন
            </button>
          </div>
        ) : (
          /* NOT LOGGED IN: CLEAN LOGIN & REGISTER FORM */
          <div className="p-6 sm:p-7 space-y-4">
            <div className="text-center space-y-1">
              <h2 className="text-xl font-bold text-white tracking-tight font-['Plus_Jakarta_Sans',sans-serif]">
                {authMode === 'signin' ? 'স্বাগতম দোভাষীতে' : 'নতুন অ্যাকাউন্ট খুলুন'}
              </h2>
              <p className="text-xs text-slate-400">
                যেকোনো ডিভাইস থেকে আপনার লেভেল ও প্রগ্রেস চালু রাখুন
              </p>
            </div>

            {/* 1-Click Google Sign In */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full py-3 px-4 bg-white hover:bg-slate-100 text-slate-900 font-bold rounded-2xl text-xs sm:text-sm transition-all flex items-center justify-center gap-2.5 shadow-md active:scale-[0.99] border border-slate-200"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z" />
                <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
                <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15s.7 5.3 1.9 7.7l3.7-2.9z" />
                <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z" />
              </svg>
              <span>Google দিয়ে এক ক্লিকে সাইন ইন</span>
            </button>

            <div className="flex items-center gap-3 my-3">
              <div className="flex-1 h-[1px] bg-slate-800"></div>
              <span className="text-[11px] text-slate-500 uppercase font-semibold">অথবা ইমেইল দিয়ে</span>
              <div className="flex-1 h-[1px] bg-slate-800"></div>
            </div>

            {/* Mode Switcher */}
            <div className="grid grid-cols-2 bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs font-semibold">
              <button
                type="button"
                onClick={() => { setAuthMode('signin'); setErrorMsg(''); }}
                className={`py-2 rounded-xl transition-all ${
                  authMode === 'signin'
                    ? 'bg-slate-800 text-emerald-400 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                লগইন
              </button>
              <button
                type="button"
                onClick={() => { setAuthMode('signup'); setErrorMsg(''); }}
                className={`py-2 rounded-xl transition-all ${
                  authMode === 'signup'
                    ? 'bg-slate-800 text-emerald-400 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                রেজিস্ট্রেশন
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Email & Password Form */}
            <form onSubmit={handleEmailAuth} className="space-y-3 pt-1">
              {authMode === 'signup' && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
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
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  ইমেইল
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="yourname@gmail.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
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
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 active:scale-[0.99]"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    প্রক্রিয়াধীন...
                  </>
                ) : authMode === 'signup' ? (
                  <>
                    রেজিস্ট্রেশন সম্পন্ন করুন
                    <ArrowRight className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    লগইন করুন
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};
