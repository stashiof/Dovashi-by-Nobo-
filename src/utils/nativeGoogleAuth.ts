import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { getSupabaseClient } from './supabase';

let isGoogleAuthInitialized = false;

export async function initGoogleAuth() {
  if (isGoogleAuthInitialized) return;
  try {
    if (Capacitor.isNativePlatform()) {
      GoogleAuth.initialize({
        clientId: '348785349910-o3e8g44mvdn85t03l8b7k8q29g65r1u9.apps.googleusercontent.com',
        scopes: ['profile', 'email'],
        grantOfflineAccess: false,
      });
      isGoogleAuthInitialized = true;
    }
  } catch (err) {
    console.warn('GoogleAuth initialize warning:', err);
  }
}

/**
 * Native In-App Google Sign In:
 * - On Android App: 100% inside app, never opens browser. Directly returns user token.
 * - On Web (Browser): Uses standard OAuth redirect.
 */
export async function performGoogleSignIn(): Promise<{ success: boolean; error?: string; user?: any }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { success: false, error: 'ডাটাবেজ সংযোগ পাওয়া যায়নি।' };
  }

  // 1. Android Native Platform Flow (Strictly In-App, NO Browser)
  if (Capacitor.isNativePlatform()) {
    try {
      await initGoogleAuth();
      
      // Trigger native Google Account bottom sheet picker
      const googleUser = await GoogleAuth.signIn();
      
      const idToken = googleUser?.authentication?.idToken || (googleUser as any)?.idToken;
      const accessToken = googleUser?.authentication?.accessToken || (googleUser as any)?.accessToken;

      if (!idToken) {
        throw new Error('গুগল থেকে আইডি টোকেন পাওয়া যায়নি।');
      }

      // Direct native login to Supabase using Google ID Token
      const authPayload: { provider: 'google'; token: string; access_token?: string } = {
        provider: 'google',
        token: idToken,
      };
      if (accessToken && typeof accessToken === 'string' && accessToken.length > 5) {
        authPayload.access_token = accessToken;
      }

      const { data, error } = await supabase.auth.signInWithIdToken(authPayload);

      if (error) {
        console.error('Supabase signInWithIdToken error:', error);
        throw error;
      }
      
      return { success: true, user: data.user };
    } catch (nativeErr: any) {
      console.error('Native GoogleAuth error:', nativeErr);
      
      // Handle user cancellation gracefully
      if (
        nativeErr?.message?.includes('cancel') ||
        nativeErr?.message?.includes('canceled') ||
        nativeErr?.message?.includes('12501') ||
        nativeErr?.code === '12501' ||
        nativeErr?.code === 12501
      ) {
        return { success: false, error: 'সাইন-ইন বাতিল করা হয়েছে।' };
      }

      // Developer error code 10 explanation
      if (nativeErr?.message?.includes('10:') || nativeErr?.code === '10' || nativeErr?.code === 10) {
        return {
          success: false,
          error: 'Google Cloud Console-এ SHA-1 সিঙ্ক হতে ৩-৫ মিনিট সময় নিচ্ছে। দয়া করে কিছুক্ষণ পর আবার চেষ্টা করুন।'
        };
      }

      return {
        success: false,
        error: nativeErr?.message || 'গুগল সাইন-ইন সম্পন্ন করা সম্ভব হয়নি।'
      };
    }
  }

  // 2. Web Browser Platform Flow (Cloudflare Pages, Preview, etc.)
  try {
    const redirectUrl = typeof window !== 'undefined' && window.location.origin && !window.location.origin.includes('localhost')
      ? window.location.origin
      : window.location.href.split('#')[0];

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
      },
    });

    if (error) throw error;
    return { success: true };
  } catch (webErr: any) {
    console.error('Web Google auth error:', webErr);
    return { success: false, error: webErr.message || 'গুগল সাইন ইন করা সম্ভব হয়নি।' };
  }
}
