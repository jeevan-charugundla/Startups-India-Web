'use client';

import { apiFetch, setLoggedInFlag, clearLoggedInFlag, isLoggedIn, setMemToken, clearMemToken } from './api';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
const ADMIN_SLUG = process.env.NEXT_PUBLIC_ADMIN_SLUG || 'ctrl-x9k2m3-panel';

let googleSignInInitialized = false;
let googleSignInCallback = null;

// ── Session flag helpers (re-exported for convenience) ───────────────────────
export { isLoggedIn, setLoggedInFlag, clearLoggedInFlag };

// ── storeSession ─────────────────────────────────────────────────────────────
// Cookie is set by the backend automatically (httpOnly).
// We just record the presence flag so UI checks work without reading the cookie.
function storeSession(result) {
  if (result.data?.user?.id) {
    setLoggedInFlag(result.data.user.id);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('user:login'));
    }
  }
  // Store token in-memory (+ sessionStorage) for Bearer auth on cross-origin calls
  if (result.data?.session?.access_token) {
    setMemToken(result.data.session.access_token);
  }
  return result;
}

// ── Auth functions ────────────────────────────────────────────────────────────

export async function signIn(email, password) {
  const result = await apiFetch('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  return storeSession(result);
}

export async function signUp({ email, password, fullName, phone }) {
  const result = await apiFetch('/api/v1/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password, fullName, ...(phone ? { phone } : {}) }),
  });
  return storeSession(result);
}

// ── Two-factor (SMS OTP) ─────────────────────────────────────────────────────

export async function verifyTwoFactor(pendingToken, code) {
  return storeSession(
    await apiFetch('/api/v1/auth/2fa/verify', {
      method: 'POST',
      body: JSON.stringify({ pendingToken, code }),
    })
  );
}

export async function resendTwoFactorCode(pendingToken) {
  return apiFetch('/api/v1/auth/2fa/resend', {
    method: 'POST',
    body: JSON.stringify({ pendingToken }),
  });
}

export async function verifyBackupCode(pendingToken, backupCode) {
  return storeSession(
    await apiFetch('/api/v1/auth/2fa/recovery', {
      method: 'POST',
      body: JSON.stringify({ pendingToken, backupCode }),
    })
  );
}

// ── Phone verification + 2FA management ─────────────────────────────────────

export async function sendPhoneOtp(phone) {
  return apiFetch('/api/v1/auth/phone/send-otp', {
    method: 'POST',
    body: JSON.stringify({ phone }),
  });
}

export async function verifyPhoneOtp(code) {
  return apiFetch('/api/v1/auth/phone/verify', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
}

export async function enableTwoFactor() {
  return apiFetch('/api/v1/auth/2fa/enable', { method: 'POST' });
}

export async function disableTwoFactor(password) {
  return apiFetch('/api/v1/auth/2fa/disable', {
    method: 'POST',
    body: JSON.stringify({ password }),
  });
}

export async function regenerateBackupCodes(password) {
  return apiFetch('/api/v1/auth/2fa/backup-codes', {
    method: 'POST',
    body: JSON.stringify({ password }),
  });
}

// ── Password reset ────────────────────────────────────────────────────────────

export async function requestPasswordReset(email) {
  return apiFetch('/api/v1/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword(token, password) {
  return apiFetch('/api/v1/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, password }),
  });
}

// ── Post-auth redirect logic ──────────────────────────────────────────────────
// Rules:
//   onboarding_completed = false  → /onboarding
//   role = admin                  → /{ADMIN_SLUG}/dashboard
//   role = mentor                 → /dashboard/mentor
//   role = investor               → /dashboard/investor
//   everything else               → fallback (/dashboard)

export function getPostAuthRedirect(userData, fallback = '/dashboard') {
  const user = userData?.user || userData;
  // Role check must come BEFORE onboarding check - admins, mentors, and investors
  // should never be redirected to the regular onboarding flow regardless of the flag.
  if (user?.role === 'admin') return `/${ADMIN_SLUG}/dashboard`;
  if (user?.role === 'mentor') return '/dashboard/mentor';
  if (user?.role === 'investor') return '/dashboard/investor';
  if (!user?.onboarding_completed) return '/onboarding';
  return fallback;
}

// ── Google Sign-In ────────────────────────────────────────────────────────────

export function initGoogleSignIn(containerElement, onResult) {
  if (!GOOGLE_CLIENT_ID) {
    onResult({ data: null, error: { message: 'Google Client ID is not configured.' } });
    return;
  }
  if (!containerElement) return;

  loadGoogleScript()
    .then(() => {
      if (!googleSignInInitialized || googleSignInCallback !== onResult) {
        googleSignInInitialized = true;
        googleSignInCallback = onResult;
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: async response => {
            const result = await apiFetch('/api/v1/auth/oauth/google', {
              method: 'POST',
              body: JSON.stringify({ idToken: response.credential }),
            });
            // Cookie is set by backend; just record the flag
            if (result.data?.user?.id) {
              setLoggedInFlag(result.data.user.id);
              if (result.data?.session?.access_token) {
                setMemToken(result.data.session.access_token);
              }
              window.dispatchEvent(new CustomEvent('user:login'));
            }
            googleSignInCallback(result);
          },
          ux_mode: 'popup',
        });
      }

      window.google.accounts.id.renderButton(containerElement, {
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'rectangular',
        width: containerElement.offsetWidth || 320,
      });
    })
    .catch(() => {
      onResult({ data: null, error: { message: 'Failed to load Google Sign-In.' } });
    });
}

// ── Sign out ──────────────────────────────────────────────────────────────────

export async function signOut() {
  try {
    await apiFetch('/api/v1/auth/logout', { method: 'POST' });
  } catch {
    // Continue with client-side cleanup regardless
  }
  if (typeof window !== 'undefined') {
    clearLoggedInFlag();
    clearMemToken();
    localStorage.removeItem('fcm_device_token');
    localStorage.removeItem('fcm_permission_asked_at');
    sessionStorage.clear();
    // Best-effort cookie clear for non-httpOnly cookies (httpOnly ones are
    // cleared server-side by the logout endpoint via res.clearCookie)
    document.cookie.split(';').forEach(c => {
      document.cookie = c
        .replace(/^ +/, '')
        .replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
    });
  }
  return { error: null };
}

// ── Current user ──────────────────────────────────────────────────────────────
// Cookie is sent automatically - just check if the flag says we're logged in.

export async function getCurrentUser() {
  if (!isLoggedIn()) return { data: null, error: { message: 'Not authenticated' } };
  return apiFetch('/api/v1/auth/me');
}

export async function resendVerificationEmail() {
  return { data: null, error: { message: 'Email verification is not available yet.' } };
}

// ── Internal: load Google Identity Services script ────────────────────────────

function loadGoogleScript() {
  return new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && window.google?.accounts?.id) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = () => reject(new Error('Failed to load Google Sign-In'));
    document.head.appendChild(script);
  });
}
