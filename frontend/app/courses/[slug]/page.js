'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { apiGet, apiPost, isLoggedIn } from '@/lib/api';
import { motion, AnimatePresence, useInView } from 'framer-motion';

/* ═══════════════════════════════════════════════
   INLINE SVG ICONS - no emojis
   ═══════════════════════════════════════════════ */
const Icons = {
  back: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  ),
  arrow: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
    </svg>
  ),
  check: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  checkCircle: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  modules: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  ),
  video: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  ),
  clock: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  users: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
    </svg>
  ),
  bolt: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  star: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  ),
  heart: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  ),
  heartFill: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  ),
  shield: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  certificate: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138z" />
    </svg>
  ),
  mentor: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  chart: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  globe: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  infinity: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.178 8c5.096 0 5.096 8 0 8-5.095 0-7.133-8-12.739-8-4.585 0-4.585 8 0 8 5.606 0 7.644-8 12.74-8z" />
    </svg>
  ),
  play: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
    </svg>
  ),
  lock: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  ),
  chevDown: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  ),
  book: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  trophy: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  ),
  share: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
    </svg>
  ),
  eye: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ),
  bolt: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  sparkle: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744l.311 1.242 1.242.311a1 1 0 010 1.406l-1.242.311-.311 1.242a1 1 0 01-1.934 0l-.311-1.242-1.242-.311a1 1 0 010-1.406l1.242-.311L12.033 2.744A1 1 0 0112 2z" />
    </svg>
  ),
};

/* ──── Animated Counter ──── */
function AnimatedCounter({ target, suffix = '' }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const end = parseInt(target, 10) || 0;
    const duration = 1400;
    const step = Math.max(1, Math.floor(end / (duration / 16)));
    const timer = setInterval(() => {
      start += step;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else setCount(start);
    }, 16);
    return () => clearInterval(timer);
  }, [isInView, target]);
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

/* ──── Premium Skeleton ──── */
function DetailSkeleton() {
  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <div className="h-[400px] bg-[#1A1A1A] animate-pulse" />
      <div className="max-w-7xl mx-auto px-4 py-20 flex flex-col lg:flex-row gap-12">
        <div className="flex-1 space-y-6">
          <div className="h-12 bg-gray-200 rounded-2xl w-3/4 animate-pulse" />
          <div className="h-6 bg-gray-200 rounded-xl w-full animate-pulse" />
          <div className="h-6 bg-gray-200 rounded-xl w-2/3 animate-pulse" />
          <div className="h-[300px] bg-white rounded-[2rem] animate-pulse" />
        </div>
        <div className="w-full lg:w-[400px] h-[500px] bg-white rounded-[2.5rem] animate-pulse" />
      </div>
    </div>
  );
}

/* ──── Floating Particles ──── */
function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-white/10 rounded-full"
          style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
          animate={{ y: [0, -40, 0], opacity: [0.1, 0.4, 0.1] }}
          transition={{ duration: 4 + Math.random() * 4, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════ */
export default function CourseDetailPage() {
  const { slug } = useParams();
  const router = useRouter();

  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const [error, setError] = useState('');
  const [expandedModule, setExpandedModule] = useState(null);
  const [wishlisted, setWishlisted] = useState(false);
  const [showShareToast, setShowShareToast] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        let res = await apiGet(`/api/v1/courses?slug=${encodeURIComponent(slug)}`);
        let c = (res.data && Array.isArray(res.data) && res.data.length > 0) ? res.data[0] : null;
        if (!c) {
          res = await apiGet(`/api/v1/courses/${slug}`);
          c = res.data;
        }
        if (c) {
          setCourse(c);
          const modRes = await apiGet(`/api/v1/courses/${c._id}/modules`);
          setModules(modRes.data || []);
          
          if (isLoggedIn()) {
            const enrollRes = await apiGet('/api/v1/enrollments');
            if (enrollRes.data) {
              setEnrolled(enrollRes.data.some(e => (e.courseId?._id || e.courseId) === c._id));
            }
          }
          const list = JSON.parse(localStorage.getItem('wishlist') || '[]');
          setWishlisted(!!list.find(w => w._id === c._id));
        }
      } catch (e) { console.error(e); }
      setLoading(false);
    }
    load();
  }, [slug]);

  async function handleEnroll() {
    if (!course) return;
    setEnrolling(true);
    setError('');

    if (!isLoggedIn()) {
      router.push(`/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    if ((course.priceInr || course.price) > 0) {
      router.push(`/checkout?courseId=${course._id}`);
      return;
    }
    
    const res = await apiPost('/api/v1/enrollments', { courseId: course._id });
    if (res.error) {
      setError(res.error.message);
    } else {
      setEnrolled(true);
      router.push(`/learn/${course._id}`);
    }
    setEnrolling(false);
  }

  function toggleWishlist() {
    if (!course) return;
    const list = JSON.parse(localStorage.getItem('wishlist') || '[]');
    const idx = list.findIndex(c => c._id === course._id);
    if (idx > -1) {
      list.splice(idx, 1);
      setWishlisted(false);
    } else {
      list.push({ _id: course._id, title: course.title, price: priceInPaise, slug: course.slug });
      setWishlisted(true);
    }
    localStorage.setItem('wishlist', JSON.stringify(list));
  }

  function handleShare() {
    const url = window.location.href;
    if (navigator.share) navigator.share({ title: course.title, url });
    else {
      navigator.clipboard.writeText(url);
      setShowShareToast(true);
      setTimeout(() => setShowShareToast(false), 2500);
    }
  }

  // priceInr is stored in paise - divide by 100 for display
  const priceInPaise = course?.priceInr || course?.price || 0;
  const price = Math.round(priceInPaise / 100);
  const originalPriceInPaise = course?.originalPriceInr || 0;
  const hasDiscount = originalPriceInPaise > priceInPaise && originalPriceInPaise > 0;
  const discountPercent = hasDiscount ? Math.round(((originalPriceInPaise - priceInPaise) / originalPriceInPaise) * 100) : 0;
  const displayStudents = (course?.enrolledCount || 0) + 124;

  if (loading) return <DetailSkeleton />;
  if (!course) return <div className="min-h-screen flex items-center justify-center font-bold">Course Not Found</div>;

  const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://startupsindia.in';
  const courseUrl = `${BASE}/courses/${slug}`;
  const courseJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    '@id': `${courseUrl}#course`,
    name: course.title,
    description: course.shortDescription || course.description,
    url: courseUrl,
    image: course.thumbnailUrl || `${BASE}/assets/images/og-default.jpg`,
    inLanguage: 'en-IN',
    isAccessibleForFree: !course.priceInr || course.priceInr === 0,
    provider: {
      '@type': ['Organization', 'EducationalOrganization'],
      name: 'Startups India',
      url: BASE,
      logo: { '@type': 'ImageObject', url: `${BASE}/Startupsindia-favicon.png` },
    },
    educationalCredentialAwarded: 'Certificate of Completion - Startups India',
    coursePrerequisites: 'No prior experience required',
    offers: {
      '@type': 'Offer',
      price: course.priceInr ? course.priceInr / 100 : 0,
      priceCurrency: 'INR',
      availability: 'https://schema.org/InStock',
      url: courseUrl,
      seller: { '@type': 'Organization', name: 'Startups India', url: BASE },
    },
    hasCourseInstance: {
      '@type': 'CourseInstance',
      courseMode: 'online',
      instructor: {
        '@type': 'Person',
        name: course.instructorName || 'Startups India Expert',
        worksFor: { '@type': 'Organization', name: 'Startups India' },
      },
    },
    about: [
      { '@type': 'Thing', name: 'Entrepreneurship' },
      { '@type': 'Thing', name: 'Startup Building' },
      { '@type': 'Thing', name: 'Indian Startup Ecosystem' },
      ...(course.category ? [{ '@type': 'Thing', name: course.category }] : []),
    ],
    ...(course.enrolledCount > 5 ? {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: course.rating || 4.8,
        reviewCount: course.enrolledCount || 10,
        bestRating: 5,
        worstRating: 1,
      },
    } : {}),
  };
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: BASE },
      { '@type': 'ListItem', position: 2, name: 'Courses', item: `${BASE}/courses` },
      { '@type': 'ListItem', position: 3, name: course.title },
    ],
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] font-sans selection:bg-[#800000]/20">
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify(courseJsonLd) }} />
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      
      {/* SECTION 1: HERO */}
      <div className="relative bg-gradient-to-br from-[#1A1A1A] via-[#2A1A1A] to-[#1A1A1A] overflow-hidden">
        <FloatingParticles />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-24">
          <div className="flex flex-col lg:flex-row gap-12 items-center">
            
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} className="flex-1 text-center lg:text-left">
              <div className="flex flex-wrap justify-center lg:justify-start gap-3 mb-6">
                <span className="bg-[#800000] text-white text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-md shadow-lg shadow-[#800000]/20">
                  {course.category || 'Professional Program'}
                </span>
                <span className="bg-white/10 backdrop-blur-md text-white/80 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-md border border-white/10">
                  {course.difficultyLevel || 'Advanced'}
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black text-white mb-6 leading-[1.1] tracking-tight">{course.title}</h1>
              <p className="text-lg sm:text-xl text-white/60 mb-10 leading-relaxed max-w-3xl mx-auto lg:mx-0">
                {course.subtitle || 'Master the essential frameworks of venture creation and operational excellence with India\'s premier startup incubation program.'}
              </p>

              <div className="flex flex-wrap justify-center lg:justify-start items-center gap-6 mb-10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#C04040]">
                    <img src={course.instructorAvatar || 'https://i.pravatar.cc/150?u=instructor'} alt="Instructor" className="w-full h-full object-cover" />
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Instructor</p>
                    <p className="text-sm text-white font-bold">{course.instructorName || 'Founder Velocity Expert'}</p>
                  </div>
                </div>
                <div className="h-10 w-px bg-white/10 hidden sm:block" />
                <div className="flex items-center gap-3 text-left">
                  <div className="flex text-[#C04040]">{[1, 2, 3, 4, 5].map(i => <span key={i} className="w-4 h-4">{Icons.star}</span>)}</div>
                  <div>
                    <p className="text-sm text-white font-black">4.8/5.0</p>
                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Rating</p>
                  </div>
                </div>
                <div className="h-10 w-px bg-white/10 hidden sm:block" />
                <div className="flex items-center gap-3 text-left">
                  <p className="text-white text-xl font-black">{displayStudents}+</p>
                  <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest leading-tight">Students<br/>Enrolled</p>
                </div>
              </div>

              <div className="flex flex-wrap justify-center lg:justify-start gap-4">
                <button onClick={handleEnroll} className="px-10 py-5 bg-[#800000] text-white rounded-2xl font-black text-lg shadow-2xl shadow-[#800000]/40 hover:bg-[#A00000] transition-all transform hover:-translate-y-1 active:scale-95">
                  {enrolled ? 'Go to Dashboard' : (price > 0 ? `Enroll Now • ₹${price.toLocaleString()}` : 'Join Free Program')}
                </button>
                <button onClick={handleShare} className="px-6 py-5 bg-white/5 backdrop-blur-md text-white rounded-2xl font-bold border border-white/10 hover:bg-white/10 transition-all flex items-center gap-2">
                  {Icons.share} Share
                </button>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="hidden lg:block w-[420px] relative">
              <div className="relative z-10 rounded-[2.5rem] overflow-hidden border-8 border-white/5 shadow-2xl shadow-black/50 aspect-[4/5]">
                <img src={course.thumbnailUrl || course.thumbnail || 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80'} alt={course.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A] via-transparent to-transparent opacity-60" />
                <div className="absolute bottom-8 left-8 right-8 bg-white/10 backdrop-blur-xl p-6 rounded-3xl border border-white/10">
                  <p className="text-white text-sm font-bold italic">&quot;This program redefined how I look at operational scaling.&quot;</p>
                  <div className="mt-4 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#800000]" />
                    <span className="text-white/60 text-xs font-bold uppercase tracking-widest">Series A Founder</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* SECTION 2: DETAILS & CURRICULUM */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          <div className="lg:col-span-8 space-y-16">
            <section id="program-details">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-[#800000]/5 rounded-2xl flex items-center justify-center text-[#800000]">{Icons.book}</div>
                <h2 className="text-3xl font-black text-gray-900 tracking-tight">Program Details</h2>
              </div>
              <div className="bg-white rounded-[2rem] p-8 sm:p-12 shadow-sm border border-gray-100">
                <p className="text-gray-600 text-lg leading-relaxed mb-8 whitespace-pre-wrap">{course.description}</p>
                <div className="grid sm:grid-cols-2 gap-6 mt-10">
                  <div className="space-y-4">
                    <h4 className="font-black text-gray-900 uppercase tracking-widest text-xs">Core Learning Pillars</h4>
                    <ul className="space-y-3">
                      {['Strategic Market Entry', 'Unit Economics Mastery', 'Operational Scalability', 'Venture Capital Logic'].map((item, i) => (
                        <li key={i} className="flex items-center gap-3 text-gray-600 text-sm"><span className="w-1.5 h-1.5 rounded-full bg-[#800000]" /> {item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            <section id="curriculum">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#800000]/5 rounded-2xl flex items-center justify-center text-[#800000]">{Icons.modules}</div>
                  <h2 className="text-3xl font-black text-gray-900 tracking-tight">Curriculum</h2>
                </div>
                <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">{modules.length} Modules</p>
              </div>
              <div className="space-y-4">
                {modules.map((mod, i) => (
                  <div key={mod._id || i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:border-[#800000]/20 transition-all group">
                    <button onClick={() => setExpandedModule(expandedModule === i ? null : i)} className="w-full flex items-center justify-between p-6 text-left">
                      <div className="flex items-center gap-5">
                        <span className="text-2xl font-black text-gray-200 group-hover:text-[#800000]/20">{String(i + 1).padStart(2, '0')}</span>
                        <div>
                          <h3 className="font-bold text-gray-900 group-hover:text-[#800000]">{mod.title}</h3>
                          <p className="text-xs text-gray-400 mt-1 uppercase font-black tracking-widest">{mod.lessonCount || mod.lessons?.length || 0} Lessons</p>
                        </div>
                      </div>
                      <div className={`p-2 transition-all ${expandedModule === i ? 'rotate-180 text-[#800000]' : 'text-gray-300'}`}>{Icons.chevDown}</div>
                    </button>
                    <AnimatePresence>
                      {expandedModule === i && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="px-6 pb-6 border-t border-gray-50 pt-6">
                          <p className="text-sm text-gray-500 leading-relaxed italic">{mod.description || 'Comprehensive exploration of this core module.'}</p>
                          <div className="mt-4 text-[10px] font-black uppercase tracking-widest text-[#800000] bg-[#800000]/5 px-3 py-1.5 rounded-lg w-fit flex items-center gap-2">
                            {Icons.lock} Enroll to unlock lessons
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </section>

            <section id="benefits">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-[#800000]/5 rounded-2xl flex items-center justify-center text-[#800000]">{Icons.trophy}</div>
                <h2 className="text-3xl font-black text-gray-900 tracking-tight">Benefits</h2>
              </div>
              <div className="grid sm:grid-cols-2 gap-6">
                {[
                  { title: 'Certification', desc: 'Industry-standard accreditation.', icon: Icons.certificate },
                  { title: 'Mentorship', desc: 'Direct access to practitioners.', icon: Icons.mentor },
                  { title: 'Resources', desc: 'Founder tools & models.', icon: Icons.chart },
                  { title: 'Access', desc: 'Lifetime program updates.', icon: Icons.infinity }
                ].map((item, i) => (
                  <div key={i} className="bg-white p-8 rounded-[2rem] border border-gray-100 hover:shadow-xl transition-all group text-center sm:text-left">
                    <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-[#800000] group-hover:text-white transition-all mb-6 mx-auto sm:mx-0">{item.icon}</div>
                    <h3 className="font-bold text-gray-900 text-lg mb-2">{item.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            <section id="social-proof">
              <div className="bg-[#1A1A1A] rounded-[3rem] p-10 sm:p-16 text-center relative overflow-hidden">
                <h2 className="text-3xl font-black text-white mb-8 italic relative z-10">&quot;The gold standard for Indian startup education.&quot;</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 relative z-10">
                  <div><p className="text-4xl font-black text-white mb-2">{displayStudents}+</p><p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Students</p></div>
                  <div><p className="text-4xl font-black text-white mb-2">4.8/5</p><p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Rating</p></div>
                  <div><p className="text-4xl font-black text-white mb-2">95%</p><p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Completion</p></div>
                </div>
              </div>
            </section>
          </div>

          <aside className="lg:col-span-4 lg:sticky lg:top-12">
            <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl shadow-gray-200 border border-gray-100 overflow-hidden relative">
              {hasDiscount && <div className="absolute top-0 right-0 bg-[#800000] text-white text-[10px] font-black px-4 py-1.5 rounded-bl-2xl uppercase">OFFER {discountPercent}% OFF</div>}
              <div className="mb-8">
                <p className="text-[10px] font-black text-[#800000] uppercase tracking-widest mb-2">Program Access</p>
                <div className="flex items-baseline gap-4">
                  <span className="text-5xl font-black text-gray-900 tracking-tighter">{price > 0 ? `₹${price.toLocaleString('en-IN')}` : 'Free'}</span>
                  {hasDiscount && <span className="text-xl text-gray-400 line-through font-bold">₹{Math.round(originalPriceInPaise / 100).toLocaleString('en-IN')}</span>}
                </div>
              </div>
              <div className="space-y-4 mb-8">
                <button onClick={handleEnroll} disabled={enrolling} className="w-full py-5 bg-[#800000] text-white rounded-2xl font-black text-xl shadow-xl shadow-[#800000]/20 hover:bg-[#600000] transition-all flex items-center justify-center gap-3 disabled:opacity-50">
                  {enrolling ? <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin" /> : <>Enroll Now {Icons.arrow}</>}
                </button>
                {!enrolled && (
                  <button onClick={toggleWishlist} className={`w-full py-4 rounded-2xl font-bold text-sm border flex items-center justify-center gap-2 transition-all ${wishlisted ? 'border-[#800000]/20 text-[#800000] bg-[#800000]/5' : 'border-gray-100 text-gray-500 hover:bg-gray-50'}`}>
                    {wishlisted ? <>{Icons.heartFill} In Wishlist</> : <>{Icons.heart} Save for later</>}
                  </button>
                )}
              </div>
              {error && <div className="mb-6 p-4 bg-red-50 text-red-600 text-xs font-bold rounded-xl border border-red-100">{error}</div>}
              <div className="space-y-4 pt-8 border-t border-gray-100">
                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Enrollment includes:</p>
                {['Full lifetime access', 'Certificate of completion', 'Mentor community access', '7-day money-back guarantee'].map((t, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm text-gray-600 font-medium"><span className="text-[#800000]">{Icons.checkCircle}</span> {t}</div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>

      <div className="lg:hidden sticky bottom-0 z-50 bg-white/90 backdrop-blur-xl border-t border-gray-100 p-4 shadow-xl">
        <div className="flex items-center justify-between gap-6 max-w-lg mx-auto">
          <div><p className="text-[10px] font-black text-[#800000] uppercase">Price</p><p className="text-2xl font-black text-gray-900">₹{price.toLocaleString()}</p></div>
          <button onClick={handleEnroll} disabled={enrolling} className="flex-1 py-4 bg-[#800000] text-white rounded-2xl font-black text-sm">Enroll Now</button>
        </div>
      </div>

      <AnimatePresence>
        {showShareToast && (
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] bg-gray-900 text-white px-6 py-3 rounded-full shadow-2xl text-xs font-bold flex items-center gap-3">
            <span className="text-emerald-400">{Icons.checkCircle}</span> Link copied
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
