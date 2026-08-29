'use client';

import { useEffect, useRef, useCallback } from 'react';

const FCM_TOKEN_KEY    = 'fcm_device_token';
const FCM_ASKED_AT_KEY = 'fcm_permission_asked_at';
const FCM_COOLDOWN_MS  = 24 * 60 * 60 * 1000;

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || '';

async function sendTokenToBackend(token) {
  // Cookie is sent automatically via credentials: 'include' - no Bearer needed
  try {
    const res = await fetch(`${API_BASE}/api/v1/push/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ token }),
    });
    if (!res.ok) console.error('[FCM] subscribe failed:', res.status);
  } catch (err) {
    console.error('[FCM] subscribe error:', err);
  }
}

export function usePushNotification({ onMessage } = {}) {
  const unsubRef   = useRef(null);
  const runningRef = useRef(false);

  const init = useCallback(async (force = false) => {
    if (typeof window === 'undefined') return;
    if (runningRef.current) return;
    if (!('Notification' in window)) return;

    // ?reset_push=1 - clears stored token and cooldown, then re-subscribes
    if (force || new URLSearchParams(window.location.search).get('reset_push') === '1') {
      localStorage.removeItem(FCM_TOKEN_KEY);
      localStorage.removeItem(FCM_ASKED_AT_KEY);
      // Remove query param from URL without reload
      const url = new URL(window.location.href);
      url.searchParams.delete('reset_push');
      window.history.replaceState({}, '', url.toString());
    }

    const permission = Notification.permission;

    if (permission === 'denied') {
      window.dispatchEvent(new CustomEvent('fcm:blocked'));
      return;
    }

    if (permission === 'default') {
      const lastAsked = Number(localStorage.getItem(FCM_ASKED_AT_KEY) || '0');
      if (Date.now() - lastAsked < FCM_COOLDOWN_MS) return;
      localStorage.setItem(FCM_ASKED_AT_KEY, String(Date.now()));
    }

    runningRef.current = true;
    try {
      const firebaseLib = await import('@/lib/firebase');
      if (!firebaseLib || !firebaseLib.requestNotificationPermission) return;

      const token = await firebaseLib.requestNotificationPermission();
      if (!token) {
        return;
      }

      localStorage.setItem(FCM_TOKEN_KEY, token);

      // Register with backend - works for both guests and logged-in users
      await sendTokenToBackend(token);

      // Send config to service worker for background push
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.ready;
        reg.active?.postMessage({
          type: 'FIREBASE_CONFIG',
          config: {
            apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
            authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
            projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
            messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
            appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
          },
        });
      }

      if (typeof unsubRef.current === 'function') unsubRef.current();
      if (firebaseLib.onForegroundMessage) {
        const unsub = await firebaseLib.onForegroundMessage((payload) => {
          if (onMessage) onMessage(payload);
        });
        unsubRef.current = unsub;
      }
    } catch (err) {
      console.error('[FCM] init error:', err);
    } finally {
      runningRef.current = false;
    }
  }, [onMessage]);

  // When user logs in - re-send the stored token so it gets linked to their account
  const onLogin = useCallback(async () => {
    const token = localStorage.getItem(FCM_TOKEN_KEY);
    if (token) {
      await sendTokenToBackend(token);
    } else {
      await init();
    }
  }, [init]);

  useEffect(() => {
    init();
    window.addEventListener('user:login', onLogin);
    return () => {
      window.removeEventListener('user:login', onLogin);
      if (typeof unsubRef.current === 'function') unsubRef.current();
    };
  }, [init, onLogin]);
}
