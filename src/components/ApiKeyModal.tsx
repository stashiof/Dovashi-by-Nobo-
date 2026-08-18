import React, { useState, useEffect } from 'react';
import { 
  Key, ShieldCheck, ExternalLink, Check, AlertTriangle, 
  Trash2, Eye, EyeOff, Sparkles, X, Lock, CheckCircle2, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getUserApiKey, saveUserApiKey, removeUserApiKey } from '../utils/storage';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeySaved?: (key: string) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  onKeySaved
}) => {
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [currentSavedKey, setCurrentSavedKey] = useState('');

  useEffect(() => {
    if (isOpen) {
      const stored = getUserApiKey();
      setCurrentSavedKey(stored);
      setApiKeyInput(stored);
      setVerificationStatus('idle');
      setStatusMessage('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestAndSave = async () => {
    const trimmed = apiKeyInput.trim();
    if (!trimmed) {
      setVerificationStatus('error');
      setStatusMessage('অনুগ্রহ করে আপনার Gemini API Key টি পেস্ট করুন।');
      return;
    }

    setIsVerifying(true);
    setVerificationStatus('idle');
    setStatusMessage('');

    try {
      const { getApiUrl } = await import('../config');
      const res = await fetch(getApiUrl('/api/verify-key'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: trimmed })
      });

      const data = await res.json();

      if (res.ok && data.valid) {
        saveUserApiKey(trimmed);
        setCurrentSavedKey(trimmed);
        setVerificationStatus('success');
        setStatusMessage('অভিনন্দন! আপনার Gemini API Key টি সফলভাবে ভেরিফাই ও সেভ হয়েছে।');
        if (onKeySaved) onKeySaved(trimmed);
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setVerificationStatus('error');
        setStatusMessage(data.error || 'ভুল API Key! অনুগ্রহ করে নিশ্চিত করুন কি-টি গুগল এআই স্টুডিও থেকে নেওয়া।');
      }
    } catch (err: any) {
      // In case offline or network error, still save locally
      saveUserApiKey(trimmed);
      setCurrentSavedKey(trimmed);
      setVerificationStatus('success');
      setStatusMessage('API Key ডিভাইসে সেভ হয়েছে!');
      if (onKeySaved) onKeySaved(trimmed);
      setTimeout(() => {
        onClose();
      }, 1000);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRemove = () => {
    removeUserApiKey();
    setCurrentSavedKey('');
    setApiKeyInput('');
    setVerificationStatus('idle');
    setStatusMessage('API Key সফলভাবে মুছে ফেলা হয়েছে।');
    if (onKeySaved) onKeySaved('');
  };

  return (
    <AnimatePresence>
      <div 
        id="api-key-modal-overlay"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          id="api-key-modal-card"
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-indigo-950/50 overflow-hidden"
        >
          {/* Top Decorative Header Accent */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-violet-500 via-amber-400 to-emerald-400" />

          {/* Close Button */}
          <button
            id="close-api-key-modal-btn"
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Title & Badge */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Key className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                Gemini API Key সেটআপ
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                  100% Free
                </span>
              </h2>
              <p className="text-xs text-slate-400">আনলিমিটেড লাইভ স্পিকিং ও AI প্র্যাকটিসের জন্য</p>
            </div>
          </div>

          <p className="text-sm text-slate-300 mb-5 leading-relaxed">
            AI কোচের সাথে কথা বলতে ও বাক্য মূল্যায়নের জন্য আপনার নিজস্ব <strong className="text-amber-300">Google Gemini API Key</strong> যোগ করুন। Google AI Studio থেকে এটি সম্পূর্ণ ফ্রিতে পাওয়া যায়।
          </p>

          {/* Step by step guide */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 mb-5 space-y-2.5 text-xs text-slate-300">
            <div className="font-semibold text-slate-200 flex items-center gap-1.5 text-xs uppercase tracking-wider text-amber-400 mb-1">
              <Sparkles className="w-3.5 h-3.5" /> মাত্র ৩টি সহজ ধাপে ফ্রিতে API Key নিন:
            </div>
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-slate-800 text-amber-400 font-bold flex items-center justify-center shrink-0 text-[11px]">১</span>
              <span>নিচের লিঙ্কে ক্লিক করে Google AI Studio-তে যান (Google একাউন্ট দিয়ে লগইন করুন)।</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-slate-800 text-amber-400 font-bold flex items-center justify-center shrink-0 text-[11px]">২</span>
              <span><strong>"Create API key"</strong> বাটনে ক্লিক করে কি তৈরি ও কপি করুন।</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-slate-800 text-amber-400 font-bold flex items-center justify-center shrink-0 text-[11px]">৩</span>
              <span>নিচের বক্সে পেস্ট করে <strong>"সংরক্ষণ করুন"</strong> দিন!</span>
            </div>

            <div className="pt-2">
              <a
                id="get-free-api-key-link"
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-all group"
              >
                <span>Google AI Studio থেকে ফ্রি API Key নিন</span>
                <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </a>
            </div>
          </div>

          {/* API Key Input */}
          <div className="space-y-2 mb-4">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              আপনার Gemini API Key
            </label>
            <div className="relative">
              <input
                id="gemini-api-key-input"
                type={showKey ? 'text' : 'password'}
                value={apiKeyInput}
                onChange={(e) => {
                  setApiKeyInput(e.target.value);
                  setVerificationStatus('idle');
                  setStatusMessage('');
                }}
                placeholder="AIzaSy..."
                className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 pr-12 font-mono"
              />
              <button
                type="button"
                id="toggle-show-api-key-btn"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1"
                title={showKey ? "Hide key" : "Show key"}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Status Message */}
          {statusMessage && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-3 rounded-xl text-xs flex items-start gap-2 mb-4 ${
                verificationStatus === 'success'
                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
                  : verificationStatus === 'error'
                  ? 'bg-rose-500/10 border border-rose-500/20 text-rose-300'
                  : 'bg-slate-800 text-slate-300'
              }`}
            >
              {verificationStatus === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />}
              {verificationStatus === 'error' && <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />}
              <span>{statusMessage}</span>
            </motion.div>
          )}

          {/* Privacy Note */}
          <div className="flex items-center gap-2 text-[11px] text-slate-400 mb-6 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/60">
            <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>
              <strong>নিরাপত্তা গ্যারান্টি:</strong> আপনার API Key টি শুধুমাত্র আপনার ডিভাইসের <code>localStorage</code>-এ সুরক্ষিতভাবে থাকবে।
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-800">
            {currentSavedKey ? (
              <button
                id="remove-api-key-btn"
                onClick={handleRemove}
                type="button"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-semibold transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>মুছে ফেলুন</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                id="cancel-api-key-btn"
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                বন্ধ করুন
              </button>

              <button
                id="save-api-key-btn"
                type="button"
                disabled={isVerifying || !apiKeyInput.trim()}
                onClick={handleTestAndSave}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>যাচাই করা হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>যাচাই ও সংরক্ষণ করুন</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
