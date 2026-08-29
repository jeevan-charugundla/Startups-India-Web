'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Header from './Header';
import Footer from './Footer';
import { MAINTENANCE_MODE } from '@/config/maintenance';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { isLoggedIn, clearLoggedInFlag } from '@/lib/api';

const PushToast = dynamic(() => import('@/components/ui/PushToast'), { ssr: false });

const ADMIN_SLUG = process.env.NEXT_PUBLIC_ADMIN_SLUG || 'ctrl-x9k2m3-panel';

// Routes that are fully public - no onboarding check needed.
const ONBOARDING_EXEMPT = [
  '/onboarding',
  '/login',
  '/signup',
  '/signin',
  '/forgot-password',
  '/reset-password',
  '/terms',
  '/privacy',
  '/cookies',
];

// Onboarding is required for account workflows, not for public content.
// Keep marketing, event, ecosystem, and other informational pages discoverable.
const ONBOARDING_PROTECTED = [
  '/dashboard',
  '/learn',
  '/checkout',
  '/profile',
  '/settings',
];

// ── Blocking screen shown while the /me check is in-flight ───────────────────
function CheckingScreen() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f8fafc',
    }}>
      <div style={{
        width: '32px', height: '32px',
        border: '3px solid #fee2e2',
        borderTop: '3px solid #dc2626',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Screen shown when onboarding is incomplete - redirects after 3s ──────────
function OnboardingBlockScreen() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval);
          router.replace('/onboarding');
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [router]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f8fafc',
      fontFamily: 'var(--font-poppins, system-ui, sans-serif)',
    }}>
      <div style={{
        textAlign: 'center',
        padding: '48px 32px',
        maxWidth: '460px',
        background: '#ffffff',
        borderRadius: '20px',
        border: '1.5px solid #fee2e2',
        boxShadow: '0 8px 32px rgba(220,38,38,0.08)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Progress bar */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0,
          height: '3px',
          background: '#dc2626',
          width: `${((3 - countdown) / 3) * 100}%`,
          transition: 'width 1s linear',
        }} />

        {/* Icon */}
        <div style={{
          width: '72px', height: '72px', borderRadius: '50%',
          background: '#fef2f2', border: '2px solid #fecaca',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
          fontSize: '32px',
        }}>
          🔒
        </div>

        <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', marginBottom: '10px' }}>
          Complete Your Setup First
        </h2>
        <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.7, marginBottom: '8px' }}>
          You need to finish setting up your profile before you can access this page.
        </p>
        <p style={{ fontSize: '13px', color: '#dc2626', fontWeight: 600, marginBottom: '28px' }}>
          Redirecting to onboarding in {countdown}s...
        </p>

        <Link
          href="/onboarding"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: '#dc2626',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: '14px',
            padding: '12px 28px',
            borderRadius: '10px',
            textDecoration: 'none',
            boxShadow: '0 4px 12px rgba(220,38,38,0.25)',
          }}
        >
          Complete Onboarding →
        </Link>
      </div>
    </div>
  );
}

// ── Gate component - wraps children and controls what renders ─────────────────
// States:
//   'checking'  - /me call in flight, render nothing (prevents flash)
//   'blocked'   - onboarding_completed is false, render block screen
//   'allowed'   - onboarding done or exempt route, render children normally
//
// IMPORTANT: initial state is 'allowed' so SSR and the first client render
// produce identical HTML (no hydration mismatch). The gate switches to
// 'checking' inside useEffect - which only runs on the client, after hydration.
function OnboardingGate({ children }) {
  const pathname = usePathname();
  const [gateState, setGateState] = useState('allowed'); // 'allowed' on server & first paint

  // Compute exempt synchronously - same value used in both render and effect
  const isExempt =
    !pathname ||
    ONBOARDING_EXEMPT.some((p) => pathname === p || pathname.startsWith(p + '/')) ||
    pathname.startsWith(`/${ADMIN_SLUG}`) ||
    !ONBOARDING_PROTECTED.some((p) => pathname === p || pathname.startsWith(p + '/'));

  useEffect(() => {
    // Exempt routes pass through immediately - no API call at all
    if (isExempt) {
      setGateState('allowed');
      return;
    }

    // Not logged in - public page, let it render
    if (!isLoggedIn()) {
      setGateState('allowed');
      return;
    }

    // Logged in on a protected page - block render while we verify onboarding
    setGateState('checking');

    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
    const meToken = typeof window !== 'undefined' ? sessionStorage.getItem('_at') : null;
    fetch(`${apiBase}/api/v1/auth/me`, {
      credentials: 'include',
      headers: meToken ? { Authorization: `Bearer ${meToken}` } : {},
    })
      .then((r) => {
        // Session expired - clear flag and let the page render as public
        if (r.status === 401) {
          clearLoggedInFlag();
          setGateState('allowed');
          return null;
        }
        return r.json();
      })
      .then((data) => {
        if (!data) return; // handled above (401 case)
        const user = data?.data?.user;
        if (user && user.onboarding_completed === false) {
          setGateState('blocked');
        } else {
          setGateState('allowed');
        }
      })
      .catch(() => {
        // Network error - don't block the user
        setGateState('allowed');
      });
  }, [pathname, isExempt]);

  if (gateState === 'checking') return <CheckingScreen />;
  if (gateState === 'blocked') return <OnboardingBlockScreen />;
  return <>{children}</>;
}

// ── Main layout ───────────────────────────────────────────────────────────────
export default function ConditionalLayout({ children }) {
  const pathname = usePathname();

  if (MAINTENANCE_MODE) {
    return <>{children}</>;
  }

  const authPages = ['/login', '/signup', '/signin'];
  const isAuthPage = authPages.includes(pathname);
  const isDashboardPage = pathname?.startsWith('/dashboard');
  const isCourseDetailPage = pathname?.startsWith('/courses/') && pathname !== '/courses';
  const isLearnPage = pathname?.startsWith('/learn');
  const isCheckoutPage = pathname?.startsWith('/checkout');
  const isMentorDashboard = pathname?.startsWith('/mentor/dashboard');
  const isAdminPage = pathname?.startsWith('/admin') || pathname?.startsWith(`/${ADMIN_SLUG}`);
  const isOnboardingPage = pathname?.startsWith('/onboarding');

  const noLayout = isAuthPage || isDashboardPage || isCourseDetailPage || isLearnPage ||
    isCheckoutPage || isMentorDashboard || isAdminPage || isOnboardingPage;

  if (noLayout) {
    return (
      <OnboardingGate>
        {children}
      </OnboardingGate>
    );
  }

  return (
    <OnboardingGate>
      <Header />
      <main className="main-content">{children}</main>
      <Footer />
      <PushToast />
    </OnboardingGate>
  );
}
