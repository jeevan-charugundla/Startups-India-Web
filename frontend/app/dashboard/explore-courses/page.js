'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useDashboard } from '@/contexts/DashboardProvider';

const LevelIcon = ({ level }) => {
  const key = (level || 'beginner').toLowerCase();
  if (key === 'intermediate')
    return (
      <svg
        width="12"
        height="12"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        viewBox="0 0 24 24"
      >
        <path d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    );
  if (key === 'advanced')
    return (
      <svg
        width="12"
        height="12"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        viewBox="0 0 24 24"
      >
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2z" />
      </svg>
    );
  return (
    <svg
      width="12"
      height="12"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      viewBox="0 0 24 24"
    >
      <path d="M12 22c4-4 8-7.5 8-12a8 8 0 10-16 0c0 4.5 4 8 8 12z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
};

const LEVEL_COLORS = {
  beginner: { bg: '#d1fae5', text: '#059669' },
  intermediate: { bg: '#dbeafe', text: '#2563eb' },
  advanced: { bg: '#fce7f3', text: '#db2777' },
};

function getLevelStyle(level) {
  const key = (level || 'beginner').toLowerCase();
  return LEVEL_COLORS[key] || LEVEL_COLORS.beginner;
}

const SORT_OPTIONS = [
  { value: 'default', label: 'Recommended' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'newest', label: 'Newest First' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
];

function CourseImage({ src, alt, title, i }) {
  const [imgSrc, setImgSrc] = useState(src);
  const [isBroken, setIsBroken] = useState(false);

  if (isBroken || !imgSrc) {
    return (
      <div
        style={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: [
            'linear-gradient(135deg,#8b5cf6,#d946ef)',
            'linear-gradient(135deg,#3b82f6,#06b6d4)',
            'linear-gradient(135deg,#f59e0b,#ef4444)',
            'linear-gradient(135deg,#10b981,#14b8a6)',
          ][i % 4],
        }}
      >
        <span
          style={{
            fontSize: '3.5rem',
            color: '#fff',
            fontWeight: 900,
            opacity: 0.9,
          }}
        >
          {title?.charAt(0) || 'C'}
        </span>
      </div>
    );
  }

  return (
    <Image
      src={imgSrc}
      alt={alt || 'Course'}
      fill
      className="ex-thumb-img"
      style={{ objectFit: 'cover' }}
      sizes="(max-width: 640px) 100vw, 33vw"
      onError={() => {
        setIsBroken(true);
      }}
    />
  );
}

function SkeletonCard() {
  return (
    <div
      style={{
        background: 'var(--dashboard-bg)',
        borderRadius: '24px',
        border: '1px solid #f3f4f6',
        overflow: 'hidden',
        height: '420px',
      }}
      className="animate-pulse"
    >
      <div style={{ height: '200px', background: 'linear-gradient(135deg, #e5e7eb, #f3f4f6)' }} />
      <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <div
            style={{ height: '24px', background: '#e5e7eb', borderRadius: '999px', width: '80px' }}
          />
          <div
            style={{ height: '24px', background: '#f3f4f6', borderRadius: '999px', width: '60px' }}
          />
        </div>
        <div style={{ height: '22px', background: '#e5e7eb', borderRadius: '6px', width: '85%' }} />
        <div
          style={{ height: '16px', background: '#f3f4f6', borderRadius: '4px', width: '100%' }}
        />
        <div style={{ height: '16px', background: '#f3f4f6', borderRadius: '4px', width: '60%' }} />
        <div
          style={{
            height: '48px',
            background: '#e5e7eb',
            borderRadius: '12px',
            width: '100%',
            marginTop: 'auto',
          }}
        />
      </div>
    </div>
  );
}

export default function ExplorePage() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  const { courses, enrolledCourses, wishlist, setWishlist, certificates, isLoading, refresh } =
    useDashboard();
  const [search, setSearch] = useState(initialSearch);

  useEffect(() => {
    const q = searchParams.get('search');
    if (q !== null) setSearch(q);
  }, [searchParams]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [sortBy, setSortBy] = useState('default');
  const [viewMode, setViewMode] = useState('grid');
  const [previewId, setPreviewId] = useState(null);
  const catScrollRef = useRef(null);

  const wishlistSet = useMemo(() => new Set(wishlist.map(w => w._id || w.id)), [wishlist]);

  const toggleWishlist = async id => {
    const { apiPost } = await import('@/lib/api');
    const res = await apiPost(`/api/v1/courses/${id}/wishlist`, {});
    if (!res.error) {
      refresh(); // Sync everything
    }
  };

  const enrolledIds = useMemo(
    () => new Set(enrolledCourses?.map(e => e.courseId) || []),
    [enrolledCourses]
  );

  const certifiedIds = useMemo(
    () => new Set(certificates?.map(c => c.courseId) || []),
    [certificates]
  );

  const categories = useMemo(() => {
    const allCourses = courses || [];
    const cats = new Set(allCourses.map(c => c.category).filter(Boolean));
    return ['All', ...Array.from(cats)];
  }, [courses]);

  const filtered = useMemo(() => {
    const allCourses = courses || [];
    let result = allCourses.filter(c => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        c.title?.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q) ||
        c.category?.toLowerCase().includes(q);
      const matchesCategory = activeCategory === 'All' || c.category === activeCategory;
      return matchesSearch && matchesCategory;
    });

    switch (sortBy) {
      case 'popular':
        result = [...result].sort((a, b) => (b.enrolledCount || 0) - (a.enrolledCount || 0));
        break;
      case 'rating':
        result = [...result].sort((a, b) => (b.rating || 4.8) - (a.rating || 4.8));
        break;
      case 'newest':
        result = [...result].sort(
          (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
        );
        break;
      case 'price-low':
        result = [...result].sort(
          (a, b) => (a.priceInr || a.price || 0) - (b.priceInr || b.price || 0)
        );
        break;
      case 'price-high':
        result = [...result].sort(
          (a, b) => (b.priceInr || b.price || 0) - (a.priceInr || a.price || 0)
        );
        break;
      default:
        break;
    }
    return result;
  }, [courses, search, activeCategory, sortBy]);

  const totalEnrolled = enrolledCourses?.length || 0;
  const totalCerts = certificates?.length || 0;
  const allCourses = courses || [];
  const freeCount = allCourses.filter(c => !(c.priceInr || c.price)).length || 0;
  const noCourses = allCourses.length === 0;

  if (isLoading) {
    return (
      <div
        style={{
          padding: '2rem 2.5rem',
          maxWidth: '1280px',
          margin: '0 auto',
          fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        }}
      >
        <div
          style={{
            height: '160px',
            background: 'linear-gradient(135deg, #e5e7eb, #f3f4f6)',
            borderRadius: '24px',
            marginBottom: '2rem',
          }}
          className="animate-pulse"
        />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '2rem',
          }}
        >
          {[1, 2, 3, 4, 5, 6].map(i => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: '0 0 3rem 0',
        maxWidth: '1280px',
        margin: '0 auto',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes fadeInUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes pulseGlow { 0%,100% { box-shadow: 0 0 0 0 rgba(59,130,246,0.3); } 50% { box-shadow: 0 0 0 8px rgba(59,130,246,0); } }
        @keyframes float { 0%,100%{ transform:translateY(0); } 50%{ transform:translateY(-6px); } }
        .ex-card { animation: fadeInUp .45s ease-out both; transition: all .35s cubic-bezier(.4,0,.2,1); border-radius: 12px !important; }
        .ex-card:hover { transform: translateY(-10px) scale(1.015); box-shadow: 0 30px 60px -15px rgba(0,0,0,.18); }
        .ex-card:hover .ex-thumb-img { transform: scale(1.08); }
        .cat-pill { transition: all .25s; cursor: pointer; border-radius: 8px !important; }
        .cat-pill:hover { background: #f3f4f6 !important; transform: scale(1.04); }
        .action-btn { transition: all .2s cubic-bezier(.4,0,.2,1); border-radius: 10px !important; }
        .action-btn:hover { filter: brightness(1.08); transform: scale(1.025); }
        .heart-btn { transition: all .2s; }
        .heart-btn:hover { transform: scale(1.25); }
        .search-box:focus-within { border-color: #3b82f6 !important; box-shadow: 0 0 0 4px rgba(59,130,246,0.12) !important; }
        .search-box { border-radius: 12px !important; }
        .sort-select:focus { border-color: #3b82f6 !important; outline: none; box-shadow: 0 0 0 4px rgba(59,130,246,0.12); }
        .sort-select { border-radius: 10px !important; }
        .view-btn { transition: all .15s; }
        .view-btn:hover { background: #e5e7eb !important; }
        .stat-card { transition: all .3s; }
        .stat-card:hover { transform: translateY(-3px); box-shadow: 0 8px 25px -5px rgba(0,0,0,0.1); }
        .ex-thumb-img { transition: transform .6s cubic-bezier(.4,0,.2,1); }
        .price-badge { animation: pulseGlow 2s infinite; }
          .ex-list-card { transition: all 0.3s ease; border-radius: 12px !important; }
          .ex-list-card:hover { transform: translateY(-5px); box-shadow: 0 20px 40px -10px rgba(0,0,0,0.12); border-color: #3b82f6 !important; }
          @media (max-width: 768px) {
            .ex-list-card { 
              display: grid !important; 
              grid-template-columns: 110px 1fr 40px !important; 
              height: 120px !important; 
              align-items: stretch !important; 
              overflow: hidden !important; 
            }
            .ex-list-thumb { width: 110px !important; height: 120px !important; flex-shrink: 0 !important; }
            .ex-list-thumb span { font-size: 0.55rem !important; padding: 0.15rem 0.35rem !important; top: 4px !important; left: 4px !important; z-index: 10; }
            .ex-list-content { 
              padding: 0 0.85rem !important; 
              display: flex !important; 
              flex-direction: column !important; 
              justify-content: center !important; 
              align-items: flex-start !important;
              min-width: 0 !important; 
              overflow: hidden !important;
              text-align: left !important;
            }
            .ex-list-content h3 { font-size: 0.8rem !important; margin: 0 0 2px 0 !important; white-space: nowrap !important; overflow: hidden !important; text-overflow: ellipsis !important; width: 100% !important; text-align: left !important; }
            .ex-list-content p { display: none !important; }
            .ex-list-meta { 
              gap: 4px !important; 
              margin-top: 2px !important; 
              display: flex !important; 
              align-items: center !important; 
              justify-content: flex-start !important;
              overflow: hidden !important;
              white-space: nowrap !important;
              width: 100% !important;
            }
            .ex-list-meta span { font-size: 0.5rem !important; padding: 1px 4px !important; flex-shrink: 0 !important; max-width: 70px; overflow: hidden; text-overflow: ellipsis; }
            .ex-list-meta svg { width: 9px !important; height: 9px !important; flex-shrink: 0 !important; }
            .ex-list-actions { 
              display: flex !important; 
              width: 100% !important;
              padding: 0 6px 0 0 !important; 
              border: none !important; 
              background: transparent !important;
              flex-direction: row !important;
              align-items: center !important;
              justify-content: center !important;
              position: static !important;
            }
            .ex-list-actions .action-btn { width: 30px !important; height: 30px !important; padding: 0 !important; border-radius: 6px !important; flex-shrink: 0 !important; }
            .ex-list-actions .action-btn:nth-child(2) { display: none !important; }
            .heart-btn { top: 4px !important; right: 4px !important; }
            .heart-btn svg { width: 14px !important; height: 14px !important; }
            .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
            .toolbar-row { 
              flex-direction: column !important; 
              align-items: stretch !important;
              gap: 0.75rem !important;
            }
            .search-box { 
              min-width: 100% !important; 
              flex: none !important;
            }
            .search-box input {
              padding: 0.7rem 1rem 0.7rem 2.5rem !important;
              font-size: 0.875rem !important;
            }
            .sort-select {
              padding: 0.7rem 1rem !important;
              font-size: 0.875rem !important;
              min-width: 0 !important;
              flex: 1;
            }
            .toolbar-actions {
              display: flex !important;
              width: 100%;
              gap: 0.75rem !important;
              align-items: center;
            }
            .view-toggle-container {
              flex-shrink: 0;
            }
            .explore-grid-view { grid-template-columns: 1fr !important; }
          }
        @media (max-width: 480px) {
          .stats-grid { grid-template-columns: 1fr !important; }
          .explore-grid-view { padding: 0 !important; }
        }
      `,
        }}
      />

      {/* Main Content Area */}
      <div className="explore-content-container">
        <style
          dangerouslySetInnerHTML={{
            __html: `
          .explore-content-container { padding: 0.75rem 2.5rem 0; }
          @media (max-width: 768px) {
            .explore-content-container { padding: 0.5rem 1rem 0; }
          }
        `,
          }}
        />
        {/* Search + Sort + View Toolbar */}
        <div
          className="toolbar-row"
          style={{
            display: 'flex',
            gap: '1rem',
            alignItems: 'center',
            marginBottom: '1.5rem',
            flexWrap: 'wrap',
          }}
        >
          {/* Search */}
          <div
            className="search-box"
            style={{
              position: 'relative',
              flex: '1 1 320px',
              minWidth: '280px',
              background: 'var(--dashboard-bg)',
              border: '2px solid #e5e7eb',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              transition: 'all 0.2s',
            }}
          >
            <svg
              style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#9ca3af',
                pointerEvents: 'none',
              }}
              width="18"
              height="18"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search by title, category, or keyword..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '0.875rem 1rem 0.875rem 2.75rem',
                background: 'transparent',
                border: 'none',
                fontSize: '0.95rem',
                outline: 'none',
                color: '#111827',
              }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{
                  marginRight: '0.75rem',
                  background: '#f3f4f6',
                  border: 'none',
                  borderRadius: '50%',
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0,
                  color: '#6b7280',
                  fontSize: '14px',
                  fontWeight: 700,
                }}
              >
                &#x2715;
              </button>
            )}
          </div>

          <div
            className="toolbar-actions"
            style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}
          >
            {/* Sort */}
            <select
              className="sort-select"
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              style={{
                padding: '0.875rem 1rem',
                border: '2px solid #e5e7eb',
                borderRadius: '12px',
                fontSize: '0.9rem',
                fontWeight: 600,
                background: '#fff',
                color: '#374151',
                cursor: 'pointer',
                minWidth: '170px',
              }}
            >
              {SORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>

            {/* View Toggle */}
            <div
              className="view-toggle-container"
              style={{
                display: 'flex',
                background: 'var(--dashboard-bg)',
                borderRadius: '12px',
                padding: '4px',
              }}
            >
              <button
                className="view-btn"
                onClick={() => setViewMode('grid')}
                style={{
                  padding: '0.6rem 0.75rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: viewMode === 'grid' ? '#fff' : 'transparent',
                  color: viewMode === 'grid' ? '#111827' : '#9ca3af',
                  cursor: 'pointer',
                  boxShadow: viewMode === 'grid' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <svg
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="7" height="7" rx="1" />
                </svg>
              </button>
              <button
                className="view-btn"
                onClick={() => setViewMode('list')}
                style={{
                  padding: '0.6rem 0.75rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: viewMode === 'list' ? '#fff' : 'transparent',
                  color: viewMode === 'list' ? '#111827' : '#9ca3af',
                  cursor: 'pointer',
                  boxShadow: viewMode === 'list' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <svg
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <line x1="8" y1="6" x2="21" y2="6" />
                  <line x1="8" y1="12" x2="21" y2="12" />
                  <line x1="8" y1="18" x2="21" y2="18" />
                  <line x1="3" y1="6" x2="3.01" y2="6" />
                  <line x1="3" y1="12" x2="3.01" y2="12" />
                  <line x1="3" y1="18" x2="3.01" y2="18" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Category Scroller */}
        <div
          ref={catScrollRef}
          style={{
            display: 'flex',
            gap: '0.5rem',
            overflowX: 'auto',
            paddingBottom: '0.25rem',
            marginBottom: '1.5rem',
            scrollbarWidth: 'none',
          }}
        >
          {categories.map(cat => {
            const isActive = activeCategory === cat;
            const allCourses = courses || [];
            const count =
              cat === 'All' ? allCourses.length : allCourses.filter(c => c.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={!isActive ? 'cat-pill' : ''}
                style={{
                  padding: '0.6rem 1.25rem',
                  borderRadius: '999px',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  whiteSpace: 'nowrap',
                  border: isActive ? '2px solid #111827' : '2px solid #e5e7eb',
                  background: isActive ? '#111827' : 'var(--dashboard-bg)',
                  color: isActive ? '#fff' : '#4b5563',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                {cat}
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    background: isActive ? 'rgba(255,255,255,0.2)' : '#f3f4f6',
                    color: isActive ? '#fff' : '#9ca3af',
                    padding: '0.15rem 0.5rem',
                    borderRadius: '999px',
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Active Filter Chips + Result Count */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.9rem', color: '#6b7280', fontWeight: 600 }}>
              Showing <span style={{ color: '#111827', fontWeight: 800 }}>{filtered.length}</span>{' '}
              of {(courses || []).length} courses
            </span>
            {(search || activeCategory !== 'All' || sortBy !== 'default') && (
              <button
                onClick={() => {
                  setSearch('');
                  setActiveCategory('All');
                  setSortBy('default');
                }}
                style={{
                  padding: '0.35rem 0.75rem',
                  background: '#fef2f2',
                  color: '#ef4444',
                  border: '1px solid #fecaca',
                  borderRadius: '999px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                }}
              >
                <span>&#x2715;</span> Clear all
              </button>
            )}
          </div>
        </div>

        {/* Empty State */}
        {filtered.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '5rem 2rem',
              background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
              borderRadius: '24px',
              border: '2px dashed #cbd5e1',
            }}
          >
            <div style={{ marginBottom: '1rem', animation: 'float 3s ease-in-out infinite' }}>
              <svg
                width="64"
                height="64"
                fill="none"
                stroke="#94a3b8"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </div>
            <h3
              style={{
                fontSize: '1.5rem',
                fontWeight: 800,
                color: '#111827',
                marginBottom: '0.5rem',
              }}
            >
              {noCourses ? 'No courses available yet' : 'No courses match your criteria'}
            </h3>
            <p
              style={{
                color: '#64748b',
                fontSize: '1rem',
                marginBottom: '1.5rem',
                maxWidth: '420px',
                margin: '0 auto 1.5rem',
              }}
            >
              {noCourses
                ? 'This page displays live courses created through the admin panel only. Please add new courses in the admin dashboard to populate this page.'
                : 'Try adjusting your search, category, or sort options to discover more courses.'}
            </p>
            <button
              onClick={() => {
                setSearch('');
                setActiveCategory('All');
                setSortBy('default');
              }}
              style={{
                padding: '0.75rem 2rem',
                background: '#3b82f6',
                color: '#fff',
                borderRadius: '12px',
                border: 'none',
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: '0.95rem',
              }}
            >
              Reset Everything
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          /* ===== GRID VIEW ===== */
          <div
            className="explore-grid-view"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: '1.75rem',
            }}
          >
            {filtered.map((course, i) => {
              const isEnrolled = enrolledIds.has(course._id);
              const isCertified = certifiedIds.has(course._id);
              const price = Math.round((course.priceInr || course.price || 0) / 100);
              const thumbnailUrl = course.thumbnailUrl || course.thumbnail;
              const levelStyle = getLevelStyle(course.level);
              const isWishlisted = wishlistSet.has(course._id);

              return (
                <div
                  key={course._id}
                  className="ex-card"
                  style={{
                    background: isCertified
                      ? 'linear-gradient(135deg, #fffbeb, #fff)'
                      : isEnrolled
                        ? 'linear-gradient(135deg, #f0fdf4, #fff)'
                        : 'var(--dashboard-bg)',
                    borderRadius: '24px',
                    border: isCertified
                      ? '2px solid #fbbf24'
                      : isEnrolled
                        ? '2px solid #86efac'
                        : '1px solid #e5e7eb',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    animationDelay: i * 0.06 + 's',
                    position: 'relative',
                  }}
                >
                  {/* Thumbnail */}
                  <div
                    style={{
                      position: 'relative',
                      height: '200px',
                      background: '#f1f5f9',
                      overflow: 'hidden',
                    }}
                  >
                    <CourseImage
                      src={thumbnailUrl}
                      alt={course.title}
                      title={course.title}
                      i={i}
                    />

                    {/* Top row: price + wishlist */}
                    <div
                      style={{
                        position: 'absolute',
                        top: '0.75rem',
                        left: '0.75rem',
                        right: '0.75rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                      }}
                    >
                      <span
                        className={price > 0 ? 'price-badge' : ''}
                        style={{
                          background: price > 0 ? '#111827' : '#10b981',
                          color: '#fff',
                          padding: '0.35rem 0.75rem',
                          borderRadius: '10px',
                          fontSize: '0.8rem',
                          fontWeight: 800,
                          backdropFilter: 'blur(10px)',
                        }}
                      >
                        {price > 0 ? '\u20B9' + price.toLocaleString() : 'FREE'}
                      </span>
                      <button
                        className="heart-btn"
                        onClick={e => {
                          e.preventDefault();
                          toggleWishlist(course._id);
                        }}
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          border: 'none',
                          background: 'rgba(255,255,255,0.9)',
                          backdropFilter: 'blur(10px)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.1rem',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        }}
                      >
                        {isWishlisted ? (
                          <svg
                            width="18"
                            height="18"
                            fill="#e11d48"
                            stroke="#e11d48"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                          >
                            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                          </svg>
                        ) : (
                          <svg
                            width="18"
                            height="18"
                            fill="none"
                            stroke="#d1d5db"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                          >
                            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                          </svg>
                        )}
                      </button>
                    </div>

                    {/* Status badges */}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '0.75rem',
                        right: '0.75rem',
                        display: 'flex',
                        gap: '0.4rem',
                      }}
                    >
                      {isCertified && (
                        <span
                          style={{
                            background: '#f59e0b',
                            color: '#fff',
                            padding: '0.3rem 0.65rem',
                            borderRadius: '999px',
                            fontSize: '0.7rem',
                            fontWeight: 800,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.2rem',
                            boxShadow: '0 2px 8px rgba(245,158,11,0.3)',
                          }}
                        >
                          <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7-6.3-4.6L5.7 21 8 14l-6-4.6h7.6z" />
                          </svg>{' '}
                          CERTIFIED
                        </span>
                      )}
                      {isEnrolled && !isCertified && (
                        <span
                          style={{
                            background: '#10b981',
                            color: '#fff',
                            padding: '0.3rem 0.65rem',
                            borderRadius: '999px',
                            fontSize: '0.7rem',
                            fontWeight: 800,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.2rem',
                            boxShadow: '0 2px 8px rgba(16,185,129,0.3)',
                          }}
                        >
                          <svg
                            width="12"
                            height="12"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            viewBox="0 0 24 24"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          ENROLLED
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body */}
                  <div
                    style={{
                      padding: '1.25rem 1.5rem 1.5rem',
                      display: 'flex',
                      flexDirection: 'column',
                      flex: 1,
                    }}
                  >
                    {/* Meta */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '0.75rem',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          color: levelStyle.text,
                          background: levelStyle.bg,
                          padding: '0.3rem 0.7rem',
                          borderRadius: '6px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                        }}
                      >
                        <LevelIcon level={course.level} /> {course.level || 'Beginner'}
                      </span>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          color: '#6b7280',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                        }}
                      >
                        <svg
                          width="13"
                          height="13"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          viewBox="0 0 24 24"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                        {course.duration || '8 weeks'}
                      </div>
                    </div>

                    {course.category && (
                      <span
                        style={{
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          color: '#3b82f6',
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          marginBottom: '0.4rem',
                          display: 'inline-block',
                        }}
                      >
                        {course.category}
                      </span>
                    )}

                    <h3
                      style={{
                        fontSize: '1.2rem',
                        fontWeight: 800,
                        color: '#111827',
                        marginBottom: '0.5rem',
                        lineHeight: 1.35,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {course.title}
                    </h3>

                    <p
                      style={{
                        fontSize: '0.88rem',
                        color: '#6b7280',
                        margin: '0 0 1rem 0',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        lineHeight: 1.55,
                      }}
                    >
                      {course.description ||
                        'Master the fundamentals and advance your career with this comprehensive curriculum.'}
                    </p>

                    {/* Stats Bar */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '0.85rem 0',
                        borderTop: '1px solid #f3f4f6',
                        borderBottom: '1px solid #f3f4f6',
                        marginBottom: '1.25rem',
                        marginTop: 'auto',
                      }}
                    >
                      <div style={{ textAlign: 'center', flex: 1 }}>
                        <p
                          style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#111827' }}
                        >
                          {course.lessonsCount || course.modulesCount || 8}
                        </p>
                        <p
                          style={{
                            margin: 0,
                            fontSize: '0.6rem',
                            fontWeight: 700,
                            color: '#9ca3af',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                          }}
                        >
                          Modules
                        </p>
                      </div>
                      <div style={{ width: '1px', background: '#f3f4f6' }} />
                      <div style={{ textAlign: 'center', flex: 1 }}>
                        <p
                          style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#111827' }}
                        >
                          {course.enrolledCount || 0}
                        </p>
                        <p
                          style={{
                            margin: 0,
                            fontSize: '0.6rem',
                            fontWeight: 700,
                            color: '#9ca3af',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                          }}
                        >
                          Students
                        </p>
                      </div>
                      <div style={{ width: '1px', background: '#f3f4f6' }} />
                      <div style={{ textAlign: 'center', flex: 1 }}>
                        <p
                          style={{
                            margin: 0,
                            fontSize: '1rem',
                            fontWeight: 800,
                            color: '#111827',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.2rem',
                          }}
                        >
                          <svg
                            width="13"
                            height="13"
                            fill="#fbbf24"
                            stroke="#fbbf24"
                            viewBox="0 0 24 24"
                          >
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                          </svg>
                          {course.rating || '4.8'}
                        </p>
                        <p
                          style={{
                            margin: 0,
                            fontSize: '0.6rem',
                            fontWeight: 700,
                            color: '#9ca3af',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                          }}
                        >
                          Rating
                        </p>
                      </div>
                    </div>

                    {/* CTA */}
                    {isEnrolled ? (
                      <Link
                        href={isCertified ? '/dashboard/certificates' : '/learn/' + course._id}
                        style={{ textDecoration: 'none' }}
                      >
                        <button
                          className="action-btn"
                          style={{
                            width: '100%',
                            padding: '0.8rem',
                            background: isCertified
                              ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                              : 'linear-gradient(135deg, #10b981, #059669)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '14px',
                            fontSize: '0.95rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: '0.5rem',
                          }}
                        >
                          {isCertified ? 'View Certificate' : 'Continue Learning'}
                          <svg
                            width="16"
                            height="16"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            viewBox="0 0 24 24"
                          >
                            <path d="M5 12h14" />
                            <path d="m12 5 7 7-7 7" />
                          </svg>
                        </button>
                      </Link>
                    ) : (
                      <Link
                        href={`/checkout?courseId=${course._id}`}
                        style={{ textDecoration: 'none' }}
                      >
                        <button
                          className="action-btn"
                          style={{
                            width: '100%',
                            padding: '0.8rem',
                            background: 'linear-gradient(135deg, #e11d48, #be123c)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '14px',
                            fontSize: '0.95rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: '0.5rem',
                          }}
                        >
                          Enroll Now
                          <svg
                            width="16"
                            height="16"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            viewBox="0 0 24 24"
                          >
                            <path d="M5 12h14" />
                            <path d="m12 5 7 7-7 7" />
                          </svg>
                        </button>
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ===== LIST VIEW ===== */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filtered.map((course, i) => {
              const isEnrolled = enrolledIds.has(course._id);
              const isCertified = certifiedIds.has(course._id);
              const price = Math.round((course.priceInr || course.price || 0) / 100);
              const thumbnailUrl = course.thumbnailUrl || course.thumbnail;
              const levelStyle = getLevelStyle(course.level);
              const isWishlisted = wishlistSet.has(course._id);

              return (
                <div
                  key={course._id}
                  className="ex-list-card"
                  style={{
                    background: 'var(--dashboard-bg)',
                    borderRadius: '20px',
                    border: isEnrolled ? '2px solid #86efac' : '1px solid #e5e7eb',
                    overflow: 'hidden',
                    display: 'flex',
                    animationDelay: i * 0.04 + 's',
                    position: 'relative',
                  }}
                >
                  {/* Left Thumbnail */}
                  <div
                    className="ex-list-thumb"
                    style={{
                      position: 'relative',
                      width: '220px',
                      minHeight: '180px',
                      flexShrink: 0,
                      overflow: 'hidden',
                    }}
                  >
                    {thumbnailUrl ? (
                      <Image
                        src={thumbnailUrl}
                        alt={course.title || 'Course'}
                        fill
                        className="ex-thumb-img"
                        style={{ objectFit: 'cover' }}
                        sizes="220px"
                      />
                    ) : (
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: [
                            'linear-gradient(135deg,#8b5cf6,#d946ef)',
                            'linear-gradient(135deg,#3b82f6,#06b6d4)',
                            'linear-gradient(135deg,#f59e0b,#ef4444)',
                            'linear-gradient(135deg,#10b981,#14b8a6)',
                          ][i % 4],
                        }}
                      >
                        <span
                          style={{
                            fontSize: '2.5rem',
                            color: '#fff',
                            fontWeight: 900,
                            opacity: 0.9,
                          }}
                        >
                          {course.title?.charAt(0) || 'C'}
                        </span>
                      </div>
                    )}
                    <span
                      style={{
                        position: 'absolute',
                        top: '0.6rem',
                        left: '0.6rem',
                        background: price > 0 ? '#111827' : '#10b981',
                        color: '#fff',
                        padding: '0.3rem 0.6rem',
                        borderRadius: '8px',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                      }}
                    >
                      {price > 0 ? '\u20B9' + price.toLocaleString() : 'FREE'}
                    </span>
                  </div>

                  {/* Right Content */}
                  <div
                    style={{
                      flex: 1,
                      padding: '1.25rem 1.5rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginBottom: '0.5rem',
                        flexWrap: 'wrap',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.65rem',
                          fontWeight: 800,
                          color: levelStyle.text,
                          background: levelStyle.bg,
                          padding: '0.25rem 0.6rem',
                          borderRadius: '6px',
                          textTransform: 'uppercase',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.2rem',
                        }}
                      >
                        <LevelIcon level={course.level} /> {course.level || 'Beginner'}
                      </span>
                      {course.category && (
                        <span
                          style={{
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            color: '#3b82f6',
                            background: '#eff6ff',
                            padding: '0.25rem 0.6rem',
                            borderRadius: '6px',
                            textTransform: 'uppercase',
                          }}
                        >
                          {course.category}
                        </span>
                      )}
                      {isEnrolled && (
                        <span
                          style={{
                            fontSize: '0.65rem',
                            fontWeight: 800,
                            color: '#10b981',
                            background: '#d1fae5',
                            padding: '0.25rem 0.6rem',
                            borderRadius: '6px',
                          }}
                        >
                          ✓ ENROLLED
                        </span>
                      )}
                      {isCertified && (
                        <span
                          style={{
                            fontSize: '0.65rem',
                            fontWeight: 800,
                            color: '#f59e0b',
                            background: '#fef3c7',
                            padding: '0.25rem 0.6rem',
                            borderRadius: '6px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.2rem',
                          }}
                        >
                          <svg width="10" height="10" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7-6.3-4.6L5.7 21 8 14l-6-4.6h7.6z" />
                          </svg>{' '}
                          CERTIFIED
                        </span>
                      )}
                    </div>

                    <h3
                      style={{
                        fontSize: '1.15rem',
                        fontWeight: 800,
                        color: '#111827',
                        margin: '0 0 0.4rem',
                        lineHeight: 1.3,
                      }}
                    >
                      {course.title}
                    </h3>
                    <p
                      style={{
                        fontSize: '0.85rem',
                        color: '#6b7280',
                        margin: '0 0 0.75rem',
                        display: '-webkit-box',
                        WebkitLineClamp: 1,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        lineHeight: 1.5,
                      }}
                    >
                      {course.description || 'Master the fundamentals and advance your career.'}
                    </p>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1.5rem',
                        flexWrap: 'wrap',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.8rem',
                          color: '#6b7280',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                        }}
                      >
                        <svg
                          width="14"
                          height="14"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                        {course.duration || '8 weeks'}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: 600 }}>
                        {course.lessonsCount || course.modulesCount || 8} modules
                      </span>
                      <span style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: 600 }}>
                        {course.enrolledCount || 0} students
                      </span>
                      <span
                        style={{
                          fontSize: '0.8rem',
                          color: '#111827',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.2rem',
                        }}
                      >
                        <svg
                          width="13"
                          height="13"
                          fill="#fbbf24"
                          stroke="#fbbf24"
                          viewBox="0 0 24 24"
                        >
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                        {course.rating || '4.8'}
                      </span>

                      <div
                        style={{
                          marginLeft: 'auto',
                          display: 'flex',
                          gap: '0.5rem',
                          alignItems: 'center',
                        }}
                      >
                        <button
                          className="heart-btn"
                          onClick={() => toggleWishlist(course._id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '1.1rem',
                            padding: '0.25rem',
                          }}
                        >
                          {isWishlisted ? (
                            <svg
                              width="16"
                              height="16"
                              fill="#e11d48"
                              stroke="#e11d48"
                              strokeWidth="2"
                              viewBox="0 0 24 24"
                            >
                              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                            </svg>
                          ) : (
                            <svg
                              width="16"
                              height="16"
                              fill="none"
                              stroke="#d1d5db"
                              strokeWidth="2"
                              viewBox="0 0 24 24"
                            >
                              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                            </svg>
                          )}
                        </button>
                        {isEnrolled ? (
                          <Link
                            href={isCertified ? '/dashboard/certificates' : '/learn/' + course._id}
                            style={{ textDecoration: 'none' }}
                          >
                            <button
                              className="action-btn"
                              style={{
                                padding: '0.6rem 1.25rem',
                                background: isCertified ? '#f59e0b' : '#10b981',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '10px',
                                fontSize: '0.85rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {isCertified ? 'View Cert' : 'Continue'}
                            </button>
                          </Link>
                        ) : (
                          <Link
                            href={'/courses/' + (course.slug || course._id)}
                            style={{ textDecoration: 'none' }}
                          >
                            <button
                              className="action-btn"
                              style={{
                                padding: '0.6rem 1.25rem',
                                background: '#e11d48',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '10px',
                                fontSize: '0.85rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              Enroll Now
                            </button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
