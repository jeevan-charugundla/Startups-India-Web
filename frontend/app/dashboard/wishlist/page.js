'use client';

import { useState } from 'react';
import { useDashboard } from '@/contexts/DashboardProvider';
import { apiPost } from '@/lib/api';
import Link from 'next/link';
import Image from 'next/image';
import Icon from '@/components/ui/Icon';

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

export default function WishlistPage() {
  const { wishlist, enrolledCourses, certificates, isLoading, refresh } = useDashboard();
  const [viewMode, setViewMode] = useState('grid'); // Default to grid

  async function handleRemove(id) {
    const res = await apiPost(`/api/v1/courses/${id}/wishlist`, {});
    if (!res.error) {
      refresh();
    }
  }

  const enrolledIds = new Set(enrolledCourses?.map(e => e.courseId) || []);
  const certifiedIds = new Set(certificates?.map(c => c.courseId) || []);

  if (isLoading) {
    return (
      <div style={{ padding: '2rem 2.5rem', maxWidth: '1280px', margin: '0 auto' }}>
        <div style={{ height: '40px', width: '200px', background: '#e5e7eb', borderRadius: '12px', marginBottom: '2rem' }} className="animate-pulse" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '2rem' }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ height: '420px', background: '#f3f4f6', borderRadius: '24px' }} className="animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="wishlist-container">
      <style dangerouslySetInnerHTML={{ __html: `
        .wishlist-container { padding: 0.75rem 2.5rem 3rem; maxWidth: 1280px; margin: 0 auto; min-height: 100vh; }
        @keyframes fadeInUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulseGlow { 0%,100% { box-shadow: 0 0 0 0 rgba(59,130,246,0.3); } 50% { box-shadow: 0 0 0 8px rgba(59,130,246,0); } }
        .ex-card { animation: fadeInUp .45s ease-out both; transition: all .35s cubic-bezier(.4,0,.2,1); }
        .ex-card:hover { transform: translateY(-8px); box-shadow: 0 20px 40px -10px rgba(0,0,0,.12); }
        .ex-card:hover .ex-thumb-img { transform: scale(1.08); }
        .ex-thumb-img { transition: transform .6s cubic-bezier(.4,0,.2,1); }
        .price-badge { animation: pulseGlow 2s infinite; }
        .heart-btn:hover { transform: scale(1.2); transition: all 0.2s; }
        .action-btn { transition: all 0.2s cubic-bezier(.4,0,.2,1); }
        .action-btn:hover { filter: brightness(1.1); transform: scale(1.02); }
        .view-btn { transition: all 0.2s; }
        .view-btn:hover { background: #f1f5f9; }

        @media (max-width: 1024px) {
          .wishlist-container { padding: 1rem 1.5rem; }
          .list-view-card { flex-direction: column !important; }
          .list-thumb { width: 100% !important; height: 180px !important; }
        }

        @media (max-width: 768px) {
          .wishlist-container { padding: 0.5rem 1rem 2rem; }
          .wishlist-header { flex-direction: column; align-items: flex-start !important; gap: 1rem; }
          .wishlist-grid { grid-template-columns: 1fr !important; gap: 1.25rem !important; }
        }
      `}} />

      <div className="wishlist-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 900, color: '#111827', letterSpacing: '-0.025em', margin: 0 }}>
          My Wishlist
        </h1>
        
        {/* View Toggles */}
        {wishlist.length > 0 && (
          <div style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <button 
              className="view-btn" 
              onClick={() => setViewMode('grid')}
              style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: 'none', background: viewMode === 'grid' ? '#fff' : 'transparent', color: viewMode === 'grid' ? '#111827' : '#9ca3af', cursor: 'pointer', boxShadow: viewMode === 'grid' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.85rem' }}
            >
              <Icon name="dashboard" size={16} /> Grid
            </button>
            <button 
              className="view-btn" 
              onClick={() => setViewMode('list')}
              style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: 'none', background: viewMode === 'list' ? '#fff' : 'transparent', color: viewMode === 'list' ? '#111827' : '#9ca3af', cursor: 'pointer', boxShadow: viewMode === 'list' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.85rem' }}
            >
              <Icon name="list" size={16} /> List
            </button>
          </div>
        )}
      </div>

      {wishlist.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '6rem 2rem', background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)', borderRadius: '24px', border: '2px dashed #cbd5e1' }}>
          <div style={{ marginBottom: '1.5rem', opacity: 0.5 }}>
            <Icon name="heart" size={64} color="#94a3b8" />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827', marginBottom: '0.75rem' }}>Your wishlist is empty</h2>
          <p style={{ color: '#64748b', marginBottom: '2rem', fontSize: '1rem', maxWidth: '400px', margin: '0 auto 2rem' }}>
            Save the programs that inspire you. Explore our courses to find your next milestone.
          </p>
          <Link href="/dashboard/explore-courses" className="action-btn" style={{ display: 'inline-flex', alignItems: 'center', background: '#111827', color: '#fff', padding: '0.875rem 2rem', borderRadius: '14px', fontWeight: 700, textDecoration: 'none', gap: '8px' }}>
            Browse Catalog <Icon name="arrowRight" size={18} />
          </Link>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="wishlist-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.75rem' }}>
          {wishlist.map((course, i) => {
            const isEnrolled = enrolledIds.has(course._id || course.id);
            const isCertified = certifiedIds.has(course._id || course.id);
            const price = Math.round((course.priceInr || course.price || 0) / 100);
            const levelStyle = getLevelStyle(course.level);

            return (
              <div
                key={course._id || course.id}
                className="ex-card"
                style={{
                  background: isCertified ? 'linear-gradient(135deg, #fffbeb, #fff)' : isEnrolled ? 'linear-gradient(135deg, #f0fdf4, #fff)' : '#fff',
                  borderRadius: '24px',
                  border: isCertified ? '2px solid #fbbf24' : isEnrolled ? '2px solid #86efac' : '1px solid #e5e7eb',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  animationDelay: i * 0.06 + 's',
                  position: 'relative'
                }}
              >
                {/* Thumbnail */}
                <div style={{ position: 'relative', height: '200px', background: '#f1f5f9', overflow: 'hidden' }}>
                  {course.thumbnailUrl || course.thumbnail ? (
                    <Image
                      src={course.thumbnailUrl || course.thumbnail}
                      alt={course.title}
                      fill
                      className="ex-thumb-img"
                      style={{ objectFit: 'cover' }}
                      sizes="(max-width: 640px) 100vw, 33vw"
                    />
                  ) : (
                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#7A1F2B,#9B3040)' }}>
                      <span style={{ fontSize: '3.5rem', color: '#fff', fontWeight: 900, opacity: 0.9 }}>
                        {course.title?.charAt(0) || 'C'}
                      </span>
                    </div>
                  )}

                  <div style={{ position: 'absolute', top: '0.75rem', left: '0.75rem', right: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span className={price > 0 ? 'price-badge' : ''} style={{ background: price > 0 ? '#111827' : '#10b981', color: '#fff', padding: '0.35rem 0.75rem', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 800 }}>
                      {price > 0 ? '\u20B9' + price.toLocaleString() : 'FREE'}
                    </span>
                    <button
                      className="heart-btn"
                      onClick={() => handleRemove(course._id || course.id)}
                      style={{ width: '36px', height: '36px', borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                    >
                      <svg width="18" height="18" fill="#e11d48" stroke="#e11d48" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div style={{ padding: '1.25rem 1.5rem 1.5rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 800, color: levelStyle.text, background: levelStyle.bg, padding: '0.3rem 0.7rem', borderRadius: '6px', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <LevelIcon level={course.level} /> {course.level || 'Beginner'}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#111827', marginBottom: '0.5rem', lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {course.title}
                  </h3>

                  <p style={{ fontSize: '0.88rem', color: '#6b7280', margin: '0 0 1.25rem 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.55 }}>
                    {course.description}
                  </p>

                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: 'auto' }}>
                    <Link
                      href={`/dashboard/explore-courses?preview=${course._id || course.id}`}
                      className="action-btn"
                      style={{ flex: 1, textAlign: 'center', background: '#111827', color: '#fff', padding: '0.85rem', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 700, textDecoration: 'none' }}
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* LIST VIEW */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {wishlist.map((course, i) => {
            const isEnrolled = enrolledIds.has(course._id || course.id);
            const isCertified = certifiedIds.has(course._id || course.id);
            const price = Math.round((course.priceInr || course.price || 0) / 100);
            const levelStyle = getLevelStyle(course.level);

            return (
              <div
                key={course._id || course.id}
                className="ex-card list-view-card"
                style={{
                  background: '#fff',
                  borderRadius: '20px',
                  border: isEnrolled ? '2px solid #86efac' : '1px solid #e5e7eb',
                  overflow: 'hidden',
                  display: 'flex',
                  animationDelay: i * 0.04 + 's',
                  position: 'relative'
                }}
              >
                {/* Left Thumbnail */}
                <div className="list-thumb" style={{ position: 'relative', width: '240px', minHeight: '160px', flexShrink: 0, overflow: 'hidden' }}>
                  {course.thumbnailUrl || course.thumbnail ? (
                    <Image
                      src={course.thumbnailUrl || course.thumbnail}
                      alt={course.title}
                      fill
                      className="ex-thumb-img"
                      style={{ objectFit: 'cover' }}
                      sizes="240px"
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#7A1F2B,#9B3040)' }}>
                      <span style={{ fontSize: '2.5rem', color: '#fff', fontWeight: 900, opacity: 0.9 }}>
                        {course.title?.charAt(0) || 'C'}
                      </span>
                    </div>
                  )}
                  <span style={{ position: 'absolute', top: '0.6rem', left: '0.6rem', background: price > 0 ? '#111827' : '#10b981', color: '#fff', padding: '0.3rem 0.6rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800 }}>
                    {price > 0 ? '\u20B9' + price.toLocaleString() : 'FREE'}
                  </span>
                </div>

                {/* Right Content */}
                <div style={{ flex: 1, padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: 800, color: levelStyle.text, background: levelStyle.bg, padding: '0.25rem 0.6rem', borderRadius: '6px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                      <LevelIcon level={course.level} /> {course.level || 'Beginner'}
                    </span>
                    {course.category && (
                      <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#3b82f6', background: '#eff6ff', padding: '0.25rem 0.6rem', borderRadius: '6px', textTransform: 'uppercase' }}>
                        {course.category}
                      </span>
                    )}
                  </div>

                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#111827', margin: '0 0 0.4rem', lineHeight: 1.3 }}>
                    {course.title}
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: '0 0 1rem', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {course.description}
                  </p>

                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <Link
                      href={`/dashboard/explore-courses?preview=${course._id || course.id}`}
                      className="action-btn"
                      style={{ background: '#111827', color: '#fff', padding: '0.6rem 1.5rem', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 700, textDecoration: 'none' }}
                    >
                      View Details
                    </Link>
                    <button
                      className="heart-btn"
                      onClick={() => handleRemove(course._id || course.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <svg width="20" height="20" fill="#e11d48" stroke="#e11d48" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

