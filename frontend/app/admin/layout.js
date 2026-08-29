'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import '../../styles/admin-panel.css';
import { clearLoggedInFlag } from '@/lib/api';
import { signOut } from '@/lib/auth';

const PushToast = dynamic(() => import('@/components/ui/PushToast'), { ssr: false });

// The admin panel is served at /{ADMIN_SLUG}/* via Next.js middleware rewrite.
// All in-app navigations (router.push/replace) must use the slug path so the
// browser URL never exposes /admin. The middleware rewrites it to /admin/* internally.
const ADMIN_SLUG = process.env.NEXT_PUBLIC_ADMIN_SLUG || 'ctrl-x9k2m3-panel';
const ADMIN_BASE = `/${ADMIN_SLUG}`;

const navSections = [
  {
    title: 'Overview',
    items: [
      { id: 'dashboard', label: 'Dashboard', href: `${ADMIN_BASE}/dashboard`, icon: 'grid' },
      { id: 'monitoring', label: 'Monitoring', href: `${ADMIN_BASE}/monitoring`, icon: 'activity' },
    ],
  },
  {
    title: 'Management',
    items: [
      { id: 'users', label: 'Users', href: `${ADMIN_BASE}/users`, icon: 'users' },
      { id: 'courses', label: 'Courses', href: `${ADMIN_BASE}/courses`, icon: 'book' },
      { id: 'enrollments', label: 'Enrollments', href: `${ADMIN_BASE}/enrollments`, icon: 'clipboard' },
      { id: 'payments', label: 'Payments', href: `${ADMIN_BASE}/payments`, icon: 'credit-card' },
      { id: 'certificates', label: 'Certificates', href: `${ADMIN_BASE}/certificates`, icon: 'award' },
      { id: 'grants', label: 'Startup Grants', href: `${ADMIN_BASE}/grants`, icon: 'rocket' },
    ],
  },
  {
    title: 'Content',
    items: [
      { id: 'articles', label: 'Sources / Articles', href: `${ADMIN_BASE}/articles`, icon: 'edit' },
      { id: 'events', label: 'Events', href: `${ADMIN_BASE}/events`, icon: 'calendar' },
      { id: 'event-partners', label: 'Partners Library', href: `${ADMIN_BASE}/event-partners`, icon: 'handshake' },
      { id: 'testimonials', label: 'Testimonials', href: `${ADMIN_BASE}/testimonials`, icon: 'star' },
      {
        id: 'ecosystem',
        label: 'Ecosystem',
        icon: 'globe',
        group: true,
        children: [
          { id: 'eco-all',        label: 'All Entries',  href: `${ADMIN_BASE}/ecosystem`,                icon: 'layers' },
          { id: 'eco-mentors',    label: 'Mentors',      href: `${ADMIN_BASE}/mentors`,                  icon: 'mentors' },
          { id: 'eco-investors',  label: 'Investors',    href: `${ADMIN_BASE}/investors`,                icon: 'investors' },
          { id: 'eco-startups',   label: 'Startups',     href: `${ADMIN_BASE}/ecosystem?cat=startup`,    icon: 'zap' },
          { id: 'eco-corporates', label: 'Corporates',   href: `${ADMIN_BASE}/ecosystem?cat=corporate`,  icon: 'building' },
          { id: 'eco-partners',   label: 'Partners',     href: `${ADMIN_BASE}/ecosystem?cat=partner`,    icon: 'handshake' },
          { id: 'eco-academia',   label: 'Academia',     href: `${ADMIN_BASE}/ecosystem?cat=academia`,   icon: 'academia' },
          { id: 'eco-coworking',  label: 'Co-Working',   href: `${ADMIN_BASE}/ecosystem?cat=coworking`,  icon: 'monitor' },
        ],
      },
    ],
  },
  {
    title: 'Operations',
    items: [
      { id: 'campaigns', label: 'QR Campaigns', href: `${ADMIN_BASE}/campaigns`, icon: 'qr' },
      { id: 'leads', label: 'Leads / CRM', href: `${ADMIN_BASE}/leads`, icon: 'target' },
      { id: 'crm', label: 'Email Campaigns', href: `${ADMIN_BASE}/crm`, icon: 'bell' },
      { id: 'notifications', label: 'Notifications', href: `${ADMIN_BASE}/notifications`, icon: 'bell' },
      { id: 'settings', label: 'Settings', href: `${ADMIN_BASE}/settings`, icon: 'settings' },
    ],
  },
  {
    title: 'Command Center',
    items: [
      { id: 'security', label: 'Security', href: `${ADMIN_BASE}/security`, icon: 'shield' },
      { id: 'audit-logs', label: 'Audit Logs', href: `${ADMIN_BASE}/audit-logs`, icon: 'log' },
      { id: 'incidents', label: 'Incidents', href: `${ADMIN_BASE}/incidents`, icon: 'alert' },
      { id: 'infrastructure', label: 'Infrastructure', href: `${ADMIN_BASE}/infrastructure`, icon: 'server' },
    ],
  },
];

function NavIcon({ name, size = 18 }) {
  const props = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  };
  const icons = {
    grid: (
      <svg {...props}>
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
    rocket: (
      <svg {...props}>
        <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
        <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
        <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
        <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
      </svg>
    ),
    users: (
      <svg {...props}>
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87" />
        <path d="M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
    book: (
      <svg {...props}>
        <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
      </svg>
    ),
    clipboard: (
      <svg {...props}>
        <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" />
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      </svg>
    ),
    'credit-card': (
      <svg {...props}>
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
        <line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    ),
    award: (
      <svg {...props}>
        <circle cx="12" cy="8" r="7" />
        <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
      </svg>
    ),
    edit: (
      <svg {...props}>
        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    ),
    calendar: (
      <svg {...props}>
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
    star: (
      <svg {...props}>
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
    target: (
      <svg {...props}>
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
      </svg>
    ),
    bell: (
      <svg {...props}>
        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 01-3.46 0" />
      </svg>
    ),
    settings: (
      <svg {...props}>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
      </svg>
    ),
    chevron: (
      <svg {...props}>
        <polyline points="15 18 9 12 15 6" />
      </svg>
    ),
    'chevron-right': (
      <svg {...props}>
        <polyline points="9 18 15 12 9 6" />
      </svg>
    ),
    'log-out': (
      <svg {...props}>
        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </svg>
    ),
    search: (
      <svg {...props}>
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
    activity: (
      <svg {...props}>
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
    shield: (
      <svg {...props}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    log: (
      <svg {...props}>
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
    alert: (
      <svg {...props}>
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    server: (
      <svg {...props}>
        <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
        <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
        <line x1="6" y1="6" x2="6.01" y2="6" />
        <line x1="6" y1="18" x2="6.01" y2="18" />
      </svg>
    ),
    globe: (
      <svg {...props}>
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
    layers: (
      <svg {...props}>
        <polygon points="12 2 2 7 12 12 22 7 12 2" />
        <polyline points="2 17 12 22 22 17" />
        <polyline points="2 12 12 17 22 12" />
      </svg>
    ),
    zap: (
      <svg {...props}><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
    ),
    building: (
      <svg {...props}>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18" /><path d="M9 21V9" />
      </svg>
    ),
    handshake: (
      <svg {...props}>
        <path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4c0-1.1.9-2 2-2h8a2 2 0 0 1 2 2v5z" />
        <path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1" />
      </svg>
    ),
    academia: (
      <svg {...props}>
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <path d="M6 12v5c0 0 2.5 2 6 2s6-2 6-2v-5" />
      </svg>
    ),
    monitor: (
      <svg {...props}>
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8m-4-4v4" />
      </svg>
    ),
    mentors: (
      <svg {...props}>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    investors: (
      <svg {...props}>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4m0 4h.01" />
        <line x1="12" y1="6" x2="12" y2="6.01" />
        <path d="M15 10a3 3 0 1 0-6 0c0 1.4.8 2.6 2 3.2L12 14" />
      </svg>
    ),
    'chevron-down': (
      <svg {...props}><polyline points="6 9 12 15 18 9" /></svg>
    ),
    qr: (
      <svg {...props}>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <path d="M14 14h2v2h-2zM18 14h3v2h-3zM14 18h3v3h-3zM18 18h3v3h-3z" />
      </svg>
    ),
  };
  return icons[name] || null;
}

// Helper to clear all admin session data
function clearAdminSession() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('admin_session');
  localStorage.removeItem('admin_session_expiry');
  localStorage.removeItem('refresh_token');
  clearLoggedInFlag();
}

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [openGroups, setOpenGroups] = useState({ ecosystem: true });

  // Detect login page - usePathname() may return either the rewritten or slug path
  const isLoginPage = pathname === '/admin/login' || pathname === `/${ADMIN_SLUG}/login`;

  useEffect(() => {
    if (isLoginPage) {
      setChecking(false);
      setIsAdmin(true);
      return;
    }

    const API_BASE =
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      'http://localhost:5000';

    // Server-side admin role verification - never trust localStorage alone
    async function verifyAdminRole(accessToken) {
      try {
        const res = await fetch(`${API_BASE}/api/v1/auth/me`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const json = await res.json();
        if (res.ok && json.data?.user?.role === 'admin') {
          return true;
        }
      } catch {
        /* verification failed */
      }
      return false;
    }

    async function verifySession() {
      let token = localStorage.getItem('access_token');

      // Check if access token is expired; if so, treat it as missing/null to trigger refresh
      if (token) {
        try {
          const parts = token.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
            if (payload.exp && Date.now() >= payload.exp * 1000) {
              token = null;
            }
          }
        } catch {
          token = null;
        }
      }

      // Fast client-side check: 24hr session expiry
      const expiry = Number(localStorage.getItem('admin_session_expiry') || '0');
      if (expiry > 0 && Date.now() > expiry) {
        clearAdminSession();
        router.replace(`${ADMIN_BASE}/login`);
        setChecking(false);
        return;
      }

      // Try refreshing access token if missing
      if (!token) {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          try {
            const res = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refreshToken }),
              credentials: 'include',
            });
            const json = await res.json();
            if (res.ok && json.data?.session?.access_token) {
              token = json.data.session.access_token;
              localStorage.setItem('access_token', token);
              if (json.data.session.refresh_token) {
                localStorage.setItem('refresh_token', json.data.session.refresh_token);
              }
            }
          } catch {
            /* fall through */
          }
        }
      }

      // No token even after refresh attempt → redirect
      if (!token) {
        clearAdminSession();
        router.replace(`${ADMIN_BASE}/login`);
        setChecking(false);
        return;
      }

      // ✅ Server-side verification: confirm role === 'admin' via JWT
      const isVerifiedAdmin = await verifyAdminRole(token);
      if (!isVerifiedAdmin) {
        clearAdminSession();
        router.replace(`${ADMIN_BASE}/login`);
        setChecking(false);
        return;
      }

      setIsAdmin(true);
      setChecking(false);
    }

    verifySession();
  }, [pathname, router, isLoginPage]);

  if (checking) {
    return (
      <div className="admin-loading">
        <div className="admin-spinner" />
      </div>
    );
  }

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (!isAdmin) return null;

  const handleLogout = async () => {
    await signOut();
    clearAdminSession();
    router.replace('/');
  };

  // pathname from usePathname() is the rewritten /admin/* path (what Next.js sees internally).
  // navSections hrefs are slug-based, so normalise before comparing.
  const normPathname = pathname.replace('/admin', ADMIN_BASE);
  const allItems = navSections.flatMap(s =>
    s.items.flatMap(i => (i.group ? i.children : [i]))
  );
  const activeId = allItems.find(i => normPathname.startsWith(i.href.split('?')[0]))?.id || 'dashboard';

  const toggleGroup = (id) => setOpenGroups(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="admin-layout">
      <aside className={`admin-sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fff"
              strokeWidth="2"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M9 9h6M9 15h6" />
            </svg>
          </div>
          <div>
            <div className="sidebar-brand-text">StartupIndia</div>
            <div className="sidebar-brand-sub">Admin Panel</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navSections.map(section => (
            <div key={section.title}>
              <div className="nav-section-title">{section.title}</div>
              {section.items.map(item => {
                if (item.group) {
                  const isOpen = openGroups[item.id];
                  const hasActiveChild = item.children.some(c => activeId === c.id);
                  return (
                    <div key={item.id} className="nav-group">
                      <button
                        className={`nav-item nav-group-trigger ${hasActiveChild ? 'active' : ''}`}
                        onClick={() => toggleGroup(item.id)}
                        title={collapsed ? item.label : undefined}
                      >
                        <span className="nav-icon"><NavIcon name={item.icon} /></span>
                        <span className="nav-label">{item.label}</span>
                        {!collapsed && (
                          <span className={`nav-group-arrow ${isOpen ? 'open' : ''}`}>
                            <NavIcon name="chevron-down" size={14} />
                          </span>
                        )}
                      </button>
                      {isOpen && !collapsed && (
                        <div className="nav-group-children">
                          {item.children.map(child => (
                            <button
                              key={child.id}
                              className={`nav-item nav-child-item ${activeId === child.id ? 'active' : ''}`}
                              onClick={() => router.push(child.href)}
                              title={child.label}
                            >
                              <span className="nav-icon"><NavIcon name={child.icon} /></span>
                              <span className="nav-label">{child.label}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }
                return (
                  <button
                    key={item.id}
                    className={`nav-item ${activeId === item.id ? 'active' : ''}`}
                    onClick={() => router.push(item.href)}
                    title={collapsed ? item.label : undefined}
                  >
                    <span className="nav-icon"><NavIcon name={item.icon} /></span>
                    <span className="nav-label">{item.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button
            className="nav-item"
            onClick={() => setShowLogoutModal(true)}
            style={{ color: '#f87171' }}
          >
            <span className="nav-icon">
              <NavIcon name="log-out" />
            </span>
            <span className="nav-label">Logout</span>
          </button>
          <button className="sidebar-toggle" onClick={() => setCollapsed(!collapsed)}>
            <NavIcon name={collapsed ? 'chevron-right' : 'chevron'} />
          </button>
        </div>
      </aside>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={() => setShowLogoutModal(false)}
        >
          <div
            style={{
              background: '#1e1e2e',
              borderRadius: 16,
              padding: '36px 32px 28px',
              width: 380,
              maxWidth: '90vw',
              textAlign: 'center',
              boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
              position: 'relative',
              border: '1px solid rgba(255,255,255,0.08)',
              animation: 'adminLogoutIn 0.25s ease-out',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(248,113,113,0.15), rgba(239,68,68,0.2))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
              }}
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#f87171"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </div>
            <h3 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700, color: '#f1f5f9' }}>
              Sign Out of Admin?
            </h3>
            <p style={{ margin: '0 0 28px', fontSize: 14, color: '#94a3b8', lineHeight: 1.5 }}>
              Are you sure you want to sign out? Your admin session will be ended.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setShowLogoutModal(false)}
                style={{
                  flex: 1,
                  padding: '12px 0',
                  borderRadius: 10,
                  border: '1.5px solid rgba(255,255,255,0.1)',
                  background: 'transparent',
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#cbd5e1',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => {
                  e.target.style.background = 'rgba(255,255,255,0.05)';
                  e.target.style.borderColor = 'rgba(255,255,255,0.2)';
                }}
                onMouseLeave={e => {
                  e.target.style.background = 'transparent';
                  e.target.style.borderColor = 'rgba(255,255,255,0.1)';
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                style={{
                  flex: 1,
                  padding: '12px 0',
                  borderRadius: 10,
                  border: 'none',
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#fff',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 8px rgba(239,68,68,0.3)',
                }}
                onMouseEnter={e => (e.target.style.opacity = '0.9')}
                onMouseLeave={e => (e.target.style.opacity = '1')}
              >
                Yes, Sign Out
              </button>
            </div>
          </div>
          <style
            dangerouslySetInnerHTML={{
              __html: `
            @keyframes adminLogoutIn {
              from { opacity: 0; transform: scale(0.9) translateY(10px); }
              to { opacity: 1; transform: scale(1) translateY(0); }
            }
          `,
            }}
          />
        </div>
      )}

      <main
        className="admin-main"
        style={{
          marginLeft: collapsed ? 'var(--admin-sidebar-collapsed)' : 'var(--admin-sidebar-width)',
        }}
      >
        {children}
      </main>

      <PushToast />
    </div>
  );
}
