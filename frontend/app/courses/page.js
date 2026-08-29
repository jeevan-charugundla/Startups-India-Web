'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { apiGet } from '@/lib/api';
import { motion } from 'framer-motion';

/* ──── Star Rating ──── */
function StarRating({ rating = 4.5, count }) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  return (
    <span className="inline-flex items-center gap-1">
      {[...Array(5)].map((_, i) => (
        <svg
          key={i}
          className="w-3.5 h-3.5"
          viewBox="0 0 20 20"
          fill={i < full ? '#F59E0B' : i === full && half ? 'url(#half)' : '#E5E7EB'}
        >
          <defs>
            <linearGradient id="half">
              <stop offset="50%" stopColor="#F59E0B" />
              <stop offset="50%" stopColor="#E5E7EB" />
            </linearGradient>
          </defs>
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="text-xs font-semibold text-gray-700 ml-0.5">{rating}</span>
      {count > 0 && <span className="text-xs text-gray-400">({count})</span>}
    </span>
  );
}

/* ──── Skeleton Card ──── */
function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 animate-pulse">
      <div className="h-48 bg-gray-200" />
      <div className="p-5 space-y-3">
        <div className="h-4 bg-gray-200 rounded w-20" />
        <div className="h-5 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-2/3" />
        <div className="flex justify-between pt-2">
          <div className="h-6 bg-gray-200 rounded w-16" />
          <div className="h-8 bg-gray-200 rounded-lg w-28" />
        </div>
      </div>
    </div>
  );
}

/* ──── Course Card ──── */
function CourseCard({ course, index }) {
  const displayModules = 8;
  const displayLessons = 58;
  const displayStudents = '65+';
  // priceInr is stored in paise - divide by 100 for display
  const priceDisplay = Math.round((course.priceInr || course.price || 0) / 100);
  const originalPriceDisplay = course.originalPriceInr ? Math.round(course.originalPriceInr / 100) : 0;
  const hasDiscount =
    course.originalPriceInr && course.originalPriceInr > (course.priceInr || course.price || 0);
  const discountPct = hasDiscount
    ? Math.round(
        ((course.originalPriceInr - (course.priceInr || course.price)) / course.originalPriceInr) *
          100
      )
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
    >
      <Link href={`/courses/${course.slug || course._id}`} className="block group">
        <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
          {/* Thumbnail */}
          <div className="relative h-48 bg-gradient-to-br from-[#7A1F2B] to-[#5C1520] overflow-hidden">
            {course.thumbnailUrl || course.thumbnail ? (
              <Image
                src={course.thumbnailUrl || course.thumbnail}
                alt={course.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-5xl opacity-30">📚</span>
              </div>
            )}
            {hasDiscount && (
              <div className="absolute top-3 left-3 bg-[#7A1F2B] text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg">
                {discountPct}% OFF
              </div>
            )}
            {course.level && (
              <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-gray-700 text-xs font-medium px-2.5 py-1 rounded-full">
                {course.level}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-5">
            {course.category && (
              <span className="inline-block text-xs font-semibold text-[#7A1F2B] bg-[#7A1F2B]/8 px-2.5 py-1 rounded-full mb-3">
                {course.category}
              </span>
            )}
            <h3 className="font-bold text-gray-900 text-base leading-snug mb-2 line-clamp-2 group-hover:text-[#7A1F2B] transition-colors">
              {course.title}
            </h3>
            <p className="text-sm text-gray-500 leading-relaxed mb-3 line-clamp-2">
              {course.subtitle || course.description?.substring(0, 100)}
            </p>

            {/* Rating */}
            <div className="mb-3">
              <StarRating rating={course.rating || 4.5} count={65} />
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
              <span className="flex items-center gap-1">
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
                {displayModules} modules
              </span>
              <span className="flex items-center gap-1">
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14m-6 5H5a2 2 0 01-2-2V7a2 2 0 012-2h4m0 14V5m0 14h6a2 2 0 002-2v-5a2 2 0 00-2-2H9"
                  />
                </svg>
                {displayLessons} lessons
              </span>
              <span className="flex items-center gap-1">
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
                  />
                </svg>
                {displayStudents} students
              </span>
            </div>

            {/* Price + CTA */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-gray-900">
                  {priceDisplay > 0
                    ? `₹${priceDisplay.toLocaleString('en-IN')}`
                    : 'Free'}
                </span>
                {hasDiscount && (
                  <span className="text-sm text-gray-400 line-through">
                    ₹{originalPriceDisplay.toLocaleString('en-IN')}
                  </span>
                )}
              </div>
              <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#7A1F2B] text-white text-sm font-semibold rounded-lg group-hover:bg-[#5C1520] transition-colors">
                View Program
                <svg
                  className="w-4 h-4 group-hover:translate-x-0.5 transition-transform"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

/* ──── Filter Pill ──── */
function FilterPill({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${
        active
          ? 'bg-[#7A1F2B] text-white border-[#7A1F2B] shadow-md'
          : 'bg-white text-gray-600 border-gray-200 hover:border-[#7A1F2B]/30 hover:bg-[#7A1F2B]/5'
      }`}
    >
      {label}
    </button>
  );
}

/* ──── Main Page ──── */
export default function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    apiGet('/api/v1/courses').then(res => {
      setCourses(res.data || []);
      setLoading(false);
    });
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const categories = useMemo(
    () => [...new Set(courses.map(c => c.category).filter(Boolean))],
    [courses]
  );
  const difficulties = useMemo(
    () => [...new Set(courses.map(c => c.difficultyLevel || c.level).filter(Boolean))],
    [courses]
  );

  const filtered = useMemo(() => {
    let result = courses.filter(c => {
      const matchSearch =
        !debouncedSearch ||
        c.title?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        c.description?.toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchCat = !category || c.category === category;
      const matchDiff = !difficulty || c.difficultyLevel === difficulty || c.level === difficulty;
      return matchSearch && matchCat && matchDiff;
    });

    switch (sortBy) {
      case 'popular':
        result.sort((a, b) => (b.enrolledCount || 0) - (a.enrolledCount || 0));
        break;
      case 'price-low':
        result.sort((a, b) => (a.priceInr || a.price || 0) - (b.priceInr || b.price || 0));
        break;
      case 'price-high':
        result.sort((a, b) => (b.priceInr || b.price || 0) - (a.priceInr || a.price || 0));
        break;
      default: // newest
        result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    return result;
  }, [courses, debouncedSearch, category, difficulty, sortBy]);

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* Hero */}
      <div className="relative bg-gradient-to-br from-[#7A1F2B] via-[#5C1520] to-[#4A1019] overflow-hidden" style={{ paddingTop: 'calc(var(--header-h) + 24px)' }}>
        <div className="absolute inset-0 opacity-15">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#C5975B] rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-sm text-white/90 mb-6"
          >
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            Programs designed for startup founders
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="text-3xl sm:text-5xl font-extrabold text-white mb-4 tracking-tight"
          >
            Explore Our Programs
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-lg text-white/70 max-w-2xl mx-auto mb-8"
          >
            Master the skills you need to build, launch, and grow your startup
          </motion.p>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="max-w-xl mx-auto relative"
          >
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40"
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
              placeholder="Search programs by name, topic..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-transparent text-base"
            />
          </motion.div>
        </div>
      </div>

      {/* Filters + Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Filters bar */}
        <div className="flex flex-wrap items-center gap-3 mb-8">
          {/* Categories */}
          <FilterPill label="All" active={!category} onClick={() => setCategory('')} />
          {categories.map(cat => (
            <FilterPill
              key={cat}
              label={cat}
              active={category === cat}
              onClick={() => setCategory(category === cat ? '' : cat)}
            />
          ))}

          <div className="flex-1" />

          {/* Difficulty */}
          {difficulties.length > 0 && (
            <select
              value={difficulty}
              onChange={e => setDifficulty(e.target.value)}
              className="px-4 py-2 rounded-xl border border-gray-200 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#7A1F2B]/30"
            >
              <option value="">All Levels</option>
              {difficulties.map(d => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          )}

          {/* Sort */}
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="px-4 py-2 rounded-xl border border-gray-200 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#7A1F2B]/30"
          >
            <option value="newest">Newest First</option>
            <option value="popular">Most Popular</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
          </select>
        </div>

        {/* Results count */}
        {!loading && (
          <p className="text-sm text-gray-500 mb-6">
            Showing <span className="font-semibold text-gray-700">{filtered.length}</span> program
            {filtered.length !== 1 ? 's' : ''}
          </p>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No programs found</h3>
            <p className="text-gray-500 mb-6">Try adjusting your search or filters</p>
            <button
              onClick={() => {
                setSearch('');
                setCategory('');
                setDifficulty('');
              }}
              className="px-6 py-2.5 bg-[#7A1F2B] text-white rounded-xl font-medium hover:bg-[#5C1520] transition-colors"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((course, i) => (
              <CourseCard key={course._id} course={course} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
