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
 * Native Google Sign In:
 * 1. On Android: Pops up native account bottom sheet
 * 2. If native direct token works -> Logs in directly to Supabase with ID token
 * 3. If native encounters signature error -> Opens Chrome Custom Tab and listens for deep link callback to automatically log in and close
 * 4. On Web: Standard OAuth redirect
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
      
      const idToken = googleUser?.authentication?.idToken || (googleUser as any)?.idToken;
      const accessToken = googleUser?.authentication?.accessToken || (googleUser as any)?.accessToken;

      if (idToken) {
        // Direct native sign in to Supabase using Google ID Token
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: idToken,
          access_token: accessToken,
        });

        if (error) {
          console.warn('Supabase signInWithIdToken failed, falling back:', error);
          throw error;
        }
        
        return { success: true, user: data.user };
      } else {
        throw new Error('Google ID Token পাওয়া যায়নি।');
      }
    } catch (nativeErr: any) {
      console.warn('Native GoogleAuth failed or threw, using deep link flow:', nativeErr);
      
      // User cancelled
      if (
        nativeErr?.message?.includes('cancel') ||
        nativeErr?.message?.includes('canceled') ||
        nativeErr?.message?.includes('12501') ||
        nativeErr?.code === '12501' ||
        nativeErr?.code === 12501
      ) {
        return { success: false, error: 'সাইন-ইন বাতিল করা হয়েছে।' };
      }

      // Fallback: In-App Browser flow (Custom Tab) with automatic deep link handling
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
          await Browser.open({ url: data.url, windowName: '_self' });
          return { success: true };
        }
      } catch (browserErr: any) {
        console.error('In-App Browser auth error:', browserErr);
        return {
          success: false,
          error: nativeErr?.message || browserErr?.message || 'গুগল সাইন ইন সম্পন্ন করা সম্ভব হয়নি।'
        };
      }
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

// Global deep link listener for Android app callback
if (typeof window !== 'undefined' && Capacitor.isNativePlatform()) {
  App.addListener('appUrlOpen', async (event) => {
    try {
      await Browser.close();
    } catch (e) {
      // ignore
    }

    if (event?.url) {
      console.log('Received deep link URL in Dovashi:', event.url);
      const supabase = getSupabaseClient();
      if (!supabase) return;

      try {
        // Handle PKCE Code exchange (?code=xyz)
        if (event.url.includes('code=')) {
          const rawUrl = event.url.replace('com.nobo.dovashi://', 'https://dovashi/');
          const urlObj = new URL(rawUrl);
          const code = urlObj.searchParams.get('code');
          if (code) {
            await supabase.auth.exchangeCodeForSession(code);
            console.log('Successfully exchanged OAuth code for session');
          }
        } 
        // Handle Token Hash (#access_token=xyz)
        else if (event.url.includes('access_token=')) {
          const hashOrQuery = event.url.includes('#') ? event.url.split('#')[1] : event.url.split('?')[1];
          if (hashOrQuery) {
            const params = new URLSearchParams(hashOrQuery);
            const accessToken = params.get('access_token');
            const refreshToken = params.get('refresh_token');
            if (accessToken && refreshToken) {
              await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });
              console.log('Successfully set Supabase session from deep link');
            }
          }
        }
      } catch (authErr) {
        console.error('Failed to parse and set session from deep link:', authErr);
      }
    }
  });
}
