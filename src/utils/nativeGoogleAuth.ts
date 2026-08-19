import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { Browser } from '@capacitor/browser';
import { App } from '@capacitor/app';
import { getSupabaseClient } from './supabase';

let isGoogleAuthInitialized = false;

export async function initGoogleAuth() {
  if (isGoogleAuthInitialized) return;
  try {
    if (Capacitor.isNativePlatform()) {
      GoogleAuth.initialize({
        clientId: '348785349910-o3e8g44mvdn85t03l8b7k8q29g65r1u9.apps.googleusercontent.com',
        scopes: ['profile', 'email'],
        grantOfflineAccess: true,
      });
      isGoogleAuthInitialized = true;
    }
  } catch (err) {
    console.warn('GoogleAuth initialize warning:', err);
  }
}

/**
 * Native Google Sign In that keeps the user inside the app
 * On Android, it brings up the native Google account picker bottom sheet with all Gmail accounts.
 * On Web, it performs standard OAuth.
 */
export async function performGoogleSignIn(): Promise<{ success: boolean; error?: string; user?: any }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { success: false, error: 'ডাটাবেজ সংযোগ পাওয়া যায়নি।' };
  }

  // 1. Android / iOS Native Platform Flow
  if (Capacitor.isNativePlatform()) {
    try {
      await initGoogleAuth();
      // Trigger native Google Account bottom sheet picker
      const googleUser = await GoogleAuth.signIn();
      
      if (googleUser && googleUser.authentication?.idToken) {
        // Sign in to Supabase using native Google ID Token
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: googleUser.authentication.idToken,
        });

        if (error) throw error;
        return { success: true, user: data.user };
      }
    } catch (nativeErr: any) {
      console.warn('Native GoogleAuth failed, trying In-App Browser flow:', nativeErr);
      
      // Fallback 2: In-App Browser flow (never opens external standalone browser app)
      try {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: 'com.nobo.dovashi://auth-callback',
            skipBrowserRedirect: true,
          },
        });

        if (error) throw error;
        if (data?.url) {
          // Open in In-App Chrome Custom Tab
          await Browser.open({ url: data.url, windowName: '_self' });
          return { success: true };
        }
      } catch (browserErr: any) {
        console.error('In-App Browser auth error:', browserErr);
        return { success: false, error: nativeErr.message || browserErr.message || 'গুগল সাইন ইন সম্পন্ন করা সম্ভব হয়নি।' };
      }
    }
  }

  // 2. Web Browser Platform Flow (Cloudflare Pages, Preview, etc.)
  try {
    const redirectUrl = typeof window !== 'undefined' && window.location.origin && !window.location.origin.includes('localhost')
      ? window.location.origin
      : window.location.href.split('#')[0];

    const { data, error } = await supabase.auth.signInWithOAuth({
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

// Listen to deep links from Android when returning from In-App browser
if (typeof window !== 'undefined' && Capacitor.isNativePlatform()) {
  App.addListener('appUrlOpen', async (event) => {
    try {
      await Browser.close();
    } catch (e) {
      // ignore
    }

    if (event.url) {
      const supabase = getSupabaseClient();
      if (supabase && event.url.includes('#access_token=')) {
        const hash = event.url.split('#')[1];
        if (hash) {
          const params = new URLSearchParams(hash);
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');
          if (accessToken && refreshToken) {
            await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
          }
        }
      }
    }
  });
}
