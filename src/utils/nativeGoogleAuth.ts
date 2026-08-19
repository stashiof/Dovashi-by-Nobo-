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
 * Native In-App Google Sign In with Seamless OAuth Fallback:
 * - Attempts Native Google Play Services login first.
 * - If native SHA-1 check fails (Code 10) or native error occurs, automatically uses Supabase OAuth so login never fails.
 */
export async function performGoogleSignIn(): Promise<{ success: boolean; error?: string; user?: any }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { success: false, error: 'ডাটাবেজ সংযোগ পাওয়া যায়নি।' };
  }

  // 1. Android Native Platform Flow
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
      
      // Handle user explicit cancellation
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
          error: 'Google Developer Error (Code 10): SHA-1 ফিঙ্গারপ্রিন্ট অথবা Google Web Client ID ভুল আছে। দয়া করে গিটহাব সিক্রেট চেক করুন।'
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
