'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiGet, apiPost } from '@/lib/api';

function cx(...classes) {
  return classes.filter(Boolean).join(' ');
}

// Amounts are stored in paise - divide by 100 before displaying as rupees.
function formatCurrency(paise) {
  if (!paise) return 'Free';
  const rupees = Number(paise) / 100;
  return `Rs ${rupees.toLocaleString('en-IN')}`;
}

function pluralize(value, label) {
  return `${value} ${label}${value === 1 ? '' : 's'}`;
}

function extractPoints(text) {
  if (!text) return [];

  return text
    .replace(/\r/g, '\n')
    .split(/\n|[.!?]+(?=\s|$)/)
    .map(item => item.replace(/^[-*•]\s*/, '').trim())
    .filter(Boolean);
}

function uniqueStrings(items) {
  return [...new Set(items.map(item => item.trim()).filter(Boolean))];
}

function buildLearningPoints(course, modules) {
  return uniqueStrings([
    ...extractPoints(course?.description),
    ...(modules || []).map(mod => `Work through ${mod.title}`),
    `Build a practical understanding of ${course?.title || 'the program'}`,
    'Apply each lesson to real startup and product decisions',
    'Learn with guided structure instead of scattered content',
    'Use mentor-backed feedback to sharpen your execution',
    'Leave with a clearer roadmap for your next milestone',
  ]).slice(0, 6);
}

function buildTransformationPoints(course, modules) {
  return uniqueStrings([
    ...(modules || []).slice(0, 3).map(mod => `Use ${mod.title.toLowerCase()} concepts in real-world scenarios`),
    `Confidently apply ${course?.title || 'this course'} frameworks in your own work`,
    'Break down complex execution into clear next steps',
    'Make better product, growth, or founder decisions with less guesswork',
    'Communicate your ideas with more clarity to teammates and stakeholders',
  ]).slice(0, 4);
}

function buildBenefits(course, modules, totalLessons) {
  const durationWeeks = course?.durationWeeks || Math.max(modules.length, 4);
  return [
    {
      title: 'Structured learning path',
      description: `${pluralize(modules.length || 1, 'module')} and ${pluralize(totalLessons || 1, 'lesson')} arranged in a clean, step-by-step format.`,
    },
    {
      title: 'Mentor-backed confidence',
      description: 'Move faster with expert guidance, practical context, and fewer wrong turns.',
    },
    {
      title: 'Premium learning experience',
      description: `A focused ${durationWeeks}-week roadmap built to be easier to follow and easier to finish.`,
    },
    {
      title: 'Certificate and continuity',
      description: 'Earn a completion certificate and revisit the material any time with lifetime access.',
    },
  ];
}

function buildTestimonials(course) {
  const topic = course?.category || 'startup execution';
  return [
    {
      quote: `This helped me turn broad ideas into a clear plan. The structure and mentor-led context made ${topic.toLowerCase()} finally feel actionable.`,
      name: 'Apoorva R.',
      role: 'Early-stage founder',
    },
    {
      quote: 'The course felt polished, focused, and easy to follow. I enrolled for clarity and stayed because every module pushed me toward execution.',
      name: 'Rohit K.',
      role: 'Product builder',
    },
    {
      quote: 'The biggest win was confidence. I knew what to do next after each lesson instead of feeling buried under information.',
      name: 'Sneha M.',
      role: 'Startup operator',
    },
  ];
}

function StarRow({ rating }) {
  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2, 3, 4].map(index => (
        <svg key={index} className="h-4 w-4 text-amber-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="ml-1 text-sm font-semibold text-slate-800">{rating.toFixed(1)}</span>
    </div>
  );
}

function SectionHeading({ eyebrow, title, description }) {
  return (
    <div className="space-y-3">
      {eyebrow ? (
        <span className="inline-flex rounded-full bg-[#7A1F2B]/8 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#7A1F2B]">
          {eyebrow}
        </span>
      ) : null}
      <h2 className="max-w-3xl text-[2rem] font-bold leading-tight tracking-tight text-slate-950 sm:text-[2.35rem]">{title}</h2>
      {description ? <p className="max-w-2xl text-[15px] leading-7 text-slate-600 sm:text-base">{description}</p> : null}
    </div>
  );
}

function OverviewStat({ label, value }) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-[#F8F9FA] px-5 py-5">
      <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">{label}</div>
      <div className="mt-2 text-xl font-semibold tracking-tight text-slate-950">{value}</div>
    </div>
  );
}

function TrustItem({ icon, label }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-[#F8F9FA] px-4 py-3.5 text-sm text-slate-700">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#7A1F2B] shadow-sm">{icon}</span>
      <span className="font-medium">{label}</span>
    </div>
  );
}

function BenefitCard({ title, description, index }) {
  return (
    <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#7A1F2B]/8 text-sm font-semibold text-[#7A1F2B]">
          {(index + 1).toString().padStart(2, '0')}
        </div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Benefit</div>
      </div>
      <h3 className="text-xl font-semibold tracking-tight text-slate-900">{title}</h3>
      <p className="mt-3 text-[15px] leading-7 text-slate-600">{description}</p>
    </div>
  );
}

function HeroMetric({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">{label}</div>
      <div className="mt-2 text-sm font-semibold text-slate-900">{value}</div>
    </div>
  );
}

function InlineFeature({ children }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-2 text-sm text-slate-600 shadow-sm ring-1 ring-slate-200">
      <span className="h-2 w-2 rounded-full bg-[#7A1F2B]" />
      <span className="font-medium">{children}</span>
    </div>
  );
}

function TestimonialCard({ quote, name, role }) {
  return (
    <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#7A1F2B]/8 text-[#7A1F2B]">
          <span className="text-lg font-semibold">&quot;</span>
        </div>
        <div>
          <div className="font-semibold text-slate-900">{name}</div>
          <div className="text-sm text-slate-500">{role}</div>
        </div>
      </div>
      <p className="text-[15px] leading-7 text-slate-700">{quote}</p>
    </div>
  );
}

function LessonLockIcon({ unlocked }) {
  if (unlocked) {
    return (
      <svg className="h-4 w-4 text-emerald-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d="M16.704 5.29a1 1 0 010 1.414l-7.25 7.25a1 1 0 01-1.414 0l-3.25-3.25a1 1 0 011.414-1.414l2.543 2.543 6.543-6.543a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
    );
  }

  return (
    <svg className="h-4 w-4 text-slate-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M5 8a3 3 0 116 0v1h1a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4a2 2 0 012-2h1V8zm2-1a1 1 0 112 0v1H7V7z" clipRule="evenodd" />
    </svg>
  );
}

function CurriculumModule({ module, index, expanded, onToggle, enrolled, isFree }) {
  const lessons = Array.isArray(module?.lessons) ? module.lessons : [];
  const unlocked = enrolled || isFree || module?.isUnlocked || index === 0;

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start justify-between gap-4 px-5 py-5 text-left transition-colors duration-200 hover:bg-slate-50 sm:px-6"
      >
        <div className="flex min-w-0 gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#7A1F2B]/8 text-sm font-semibold text-[#7A1F2B]">
            {(index + 1).toString().padStart(2, '0')}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="text-base font-semibold text-slate-900">{module?.title || `Module ${index + 1}`}</h3>
              <span className={cx('rounded-full px-2.5 py-1 text-xs font-semibold', unlocked ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500')}>
                {unlocked ? 'Unlocked' : 'Locked'}
              </span>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {module?.description || 'A focused module designed to move you from concept to confident execution.'}
            </p>
            <div className="mt-3 flex flex-wrap gap-4 text-xs font-medium text-slate-500">
              <span>{pluralize(module?.lessonCount || lessons.length || 1, 'lesson')}</span>
              {(module?.durationHours || 0) > 0 ? <span>{module.durationHours} hours</span> : null}
            </div>
          </div>
        </div>
        <svg
          className={cx('mt-1 h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200', expanded && 'rotate-180')}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.937a.75.75 0 111.08 1.04l-4.25 4.51a.75.75 0 01-1.08 0l-4.25-4.51a.75.75 0 01.02-1.06z" clipRule="evenodd" />
        </svg>
      </button>

      {expanded ? (
        <div className="border-t border-slate-100 px-5 py-5 sm:px-6">
          <div className="space-y-3">
            {lessons.length > 0 ? (
              lessons.slice(0, unlocked ? lessons.length : 4).map((lesson, lessonIndex) => {
                const lessonUnlocked = unlocked || lesson?.isPreview;
                return (
                  <div
                    key={lesson?._id || `${module?._id || index}-${lessonIndex}`}
                    className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <LessonLockIcon unlocked={lessonUnlocked} />
                      <span className="truncate text-sm font-medium text-slate-700">
                        {lesson?.title || `Lesson ${lessonIndex + 1}`}
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-slate-400">
                      {lessonUnlocked ? 'Available' : 'Enroll to unlock'}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="rounded-2xl bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-600">
                {unlocked
                  ? 'All lessons in this module become available as you progress through the course.'
                  : 'Enroll to unlock the full lesson list and learning materials for this module.'}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function EnrollmentCard({
  course,
  enrolled,
  enrolling,
  error,
  wishlisted,
  onEnroll,
  onToggleWishlist,
  onShare,
  price,
  originalPrice,
  hasDiscount,
  discountPercent,
  totalLessons,
  modulesCount,
}) {
  const imageSrc = course?.thumbnailUrl || course?.thumbnail;

  return (
    <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-xl shadow-slate-200/60">
      <div className="border-b border-slate-100 bg-slate-50 p-5">
        <div className="relative overflow-hidden rounded-3xl bg-white">
          {imageSrc ? (
            <Image
              src={imageSrc}
              alt={course?.title || 'Course thumbnail'}
              width={720}
              height={420}
              priority
              sizes="(max-width: 1024px) 100vw, 360px"
              className="h-auto w-full object-cover"
            />
          ) : (
            <div className="flex aspect-[16/10] items-center justify-center bg-[#F8F9FA]">
              <div className="rounded-full bg-[#7A1F2B]/8 px-5 py-3 text-sm font-semibold text-[#7A1F2B]">
                Premium course experience
              </div>
            </div>
          )}
          {hasDiscount ? (
            <div className="absolute left-4 top-4 rounded-full bg-[#7A1F2B] px-3 py-1 text-xs font-semibold text-white shadow-sm">
              Save {discountPercent}%
            </div>
          ) : null}
        </div>
      </div>

      <div className="space-y-5 p-6">
        <div className="space-y-3">
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Enrollment</div>
          <div className="flex items-end gap-3">
            <span className="text-4xl font-bold tracking-tight text-slate-950">{formatCurrency(price)}</span>
            {hasDiscount ? <span className="pb-1 text-sm font-medium text-slate-400 line-through">{formatCurrency(originalPrice)}</span> : null}
          </div>
          <p className="text-sm leading-6 text-slate-500">
            One-time enrollment with lifetime access, certificate support, and a guided startup-grade learning flow.
          </p>
        </div>

        {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

        {enrolled ? (
          <Link
            href={`/learn/${course?._id}`}
            className="flex w-full items-center justify-center rounded-2xl bg-emerald-600 px-5 py-4 text-base font-semibold text-white transition-colors hover:bg-emerald-700"
          >
            Continue learning
          </Link>
        ) : (
          <button
            type="button"
            onClick={onEnroll}
            disabled={enrolling}
            className="flex w-full items-center justify-center rounded-2xl bg-[#7A1F2B] px-5 py-4 text-base font-semibold text-white shadow-sm transition-colors hover:bg-[#651924] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {enrolling ? 'Processing...' : price > 0 ? 'Enroll now' : 'Start learning free'}
          </button>
        )}

        {!enrolled ? (
          <div className="flex items-center justify-center gap-5 text-sm font-semibold text-slate-500">
            <button
              type="button"
              onClick={onToggleWishlist}
              className={cx('transition-colors', wishlisted ? 'text-[#7A1F2B]' : 'hover:text-slate-800')}
            >
              {wishlisted ? 'Saved' : 'Save'}
            </button>
            <span className="h-4 w-px bg-slate-200" />
            <button
              type="button"
              onClick={onShare}
              className="transition-colors hover:text-slate-800"
            >
              Share
            </button>
          </div>
        ) : null}

        <div className="grid gap-3">
          <TrustItem
            label="Lifetime access"
            icon={
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M7.5 4a3.5 3.5 0 013.465 3h.535a3.5 3.5 0 110 7h-.535a3.5 3.5 0 11-6.93 0H3.5a3.5 3.5 0 010-7h.535A3.5 3.5 0 017.5 4zm-2 5.5a2 2 0 104 0 2 2 0 00-4 0zm5 0a2 2 0 104 0 2 2 0 00-4 0z" clipRule="evenodd" />
              </svg>
            }
          />
          <TrustItem
            label="Certificate of completion"
            icon={
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2h-1.586l-1.707 1.707a1 1 0 01-1.414 0L7.586 14H6a2 2 0 01-2-2V4zm4.293 4.293a1 1 0 011.414 0L11 9.586l1.293-1.293a1 1 0 111.414 1.414l-2 2a1 1 0 01-1.414 0l-2-2a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            }
          />
          <TrustItem
            label="Mentor support"
            icon={
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M10 2a4 4 0 00-4 4v1.126A4 4 0 004 10.5V12a2 2 0 002 2h1v2a1 1 0 001.447.894L10 16.118l1.553.776A1 1 0 0013 16v-2h1a2 2 0 002-2v-1.5a4 4 0 00-2-3.374V6a4 4 0 00-4-4z" />
              </svg>
            }
          />
        </div>

        <div className="rounded-3xl bg-[#F8F9FA] p-4">
          <div className="text-sm font-semibold text-slate-900">This enrollment includes</div>
          <div className="mt-3 grid gap-2 text-sm text-slate-600">
            <div>{pluralize(modulesCount || 1, 'module')} with a guided sequence</div>
            <div>{pluralize(totalLessons || 1, 'lesson')} built for completion</div>
            <div>Certificate support and lifetime access after enrollment</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MobileBottomBar({ enrolled, enrolling, price, onEnroll, courseId }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-2xl backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-7xl items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Enrollment</div>
          <div className="truncate text-lg font-bold text-slate-950">{formatCurrency(price)}</div>
        </div>

        {enrolled ? (
          <Link
            href={`/learn/${courseId}`}
            className="flex shrink-0 items-center justify-center rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white"
          >
            Continue
          </Link>
        ) : (
          <button
            type="button"
            onClick={onEnroll}
            disabled={enrolling}
            className="flex shrink-0 items-center justify-center rounded-2xl bg-[#7A1F2B] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {enrolling ? 'Processing...' : price > 0 ? 'Enroll now' : 'Start free'}
          </button>
        )}
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="min-h-screen bg-[#F8F9FA] px-6 py-10">
      <div className="mx-auto max-w-7xl animate-pulse space-y-6">
        <div className="h-3 w-24 rounded-full bg-slate-200" />
        <div className="h-14 max-w-3xl rounded-3xl bg-slate-200" />
        <div className="h-6 max-w-2xl rounded-3xl bg-slate-200" />
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              {[0, 1, 2].map(item => (
                <div key={item} className="h-24 rounded-3xl bg-white shadow-sm" />
              ))}
            </div>
            <div className="h-72 rounded-[32px] bg-white shadow-sm" />
            <div className="h-72 rounded-[32px] bg-white shadow-sm" />
          </div>
          <div className="h-[540px] rounded-[32px] bg-white shadow-sm" />
        </div>
      </div>
    </div>
  );
}

export default function PremiumCourseDetail({ slug }) {
  const router = useRouter();
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const [error, setError] = useState('');
  const [wishlisted, setWishlisted] = useState(false);
  const [expandedModule, setExpandedModule] = useState(0);
  const [activeSection, setActiveSection] = useState('overview');

  const overviewRef = useRef(null);
  const benefitsRef = useRef(null);
  const curriculumRef = useRef(null);
  const proofRef = useRef(null);

  const navItems = useMemo(
    () => [
      { id: 'overview', label: 'Overview', ref: overviewRef },
      { id: 'benefits', label: 'Benefits', ref: benefitsRef },
      { id: 'curriculum', label: 'Curriculum', ref: curriculumRef },
      { id: 'proof', label: 'Reviews', ref: proofRef },
    ],
    []
  );

  useEffect(() => {
    let ignore = false;

    async function loadCourse() {
      setLoading(true);
      setError('');

      let resolvedCourse = null;
      const courseBySlug = await apiGet(`/api/v1/courses?slug=${encodeURIComponent(slug)}`);
      if (Array.isArray(courseBySlug.data) && courseBySlug.data.length > 0) {
        resolvedCourse = courseBySlug.data[0];
      } else {
        const courseById = await apiGet(`/api/v1/courses/${encodeURIComponent(slug)}`);
        resolvedCourse = courseById.data || null;
      }

      if (!resolvedCourse) {
        if (!ignore) {
          setCourse(null);
          setModules([]);
          setLoading(false);
        }
        return;
      }

      const [modulesRes, enrollmentsRes] = await Promise.all([
        apiGet(`/api/v1/courses/${resolvedCourse._id}/modules`),
        apiGet('/api/v1/enrollments'),
      ]);

      if (ignore) return;

      const resolvedModules = Array.isArray(modulesRes.data) ? modulesRes.data : [];
      const enrollments = Array.isArray(enrollmentsRes.data) ? enrollmentsRes.data : [];
      const existingWishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');

      setCourse(resolvedCourse);
      setModules(resolvedModules);
      setExpandedModule(0);
      setEnrolled(
        enrollments.some(item => {
          const courseId = typeof item?.courseId === 'string' ? item.courseId : item?.courseId?._id;
          return courseId === resolvedCourse._id;
        })
      );
      setWishlisted(existingWishlist.some(item => item?._id === resolvedCourse._id));
      setLoading(false);
    }

    loadCourse();
    return () => {
      ignore = true;
    };
  }, [slug]);

  useEffect(() => {
    const sections = navItems.map(item => item.ref.current).filter(Boolean);
    if (sections.length === 0) return undefined;

    const observer = new IntersectionObserver(
      entries => {
        const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible.length > 0) setActiveSection(visible[0].target.id);
      },
      { rootMargin: '-25% 0px -55% 0px', threshold: [0.15, 0.3, 0.6] }
    );

    sections.forEach(section => observer.observe(section));
    return () => observer.disconnect();
  }, [navItems, course, modules]);

  const price = course?.priceInr || course?.price || 0;
  const originalPrice = course?.originalPriceInr || 0;
  const hasDiscount = originalPrice > price;
  const discountPercent = hasDiscount ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;
  const totalLessons = useMemo(
    () => modules.reduce((sum, mod) => sum + (mod?.lessonCount || mod?.lessons?.length || 0), 0),
    [modules]
  );
  const modulesCount = course?.totalModules || modules.length;
  const rating = course?.rating || 4.8;
  const students = course?.enrolledCount || 120;
  const durationText = course?.durationWeeks ? pluralize(course.durationWeeks, 'week') : pluralize(Math.max(modules.length, 4), 'week');
  const subtitle =
    course?.subtitle ||
    extractPoints(course?.description)[0] ||
    'A premium, mentor-supported course experience designed for practical execution.';
  const learningPoints = useMemo(() => buildLearningPoints(course, modules), [course, modules]);
  const transformationPoints = useMemo(() => buildTransformationPoints(course, modules), [course, modules]);
  const benefits = useMemo(() => buildBenefits(course, modules, totalLessons), [course, modules, totalLessons]);
  const testimonials = useMemo(() => buildTestimonials(course), [course]);

  function scrollToSection(id) {
    const target = navItems.find(item => item.id === id)?.ref?.current;
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function handleEnroll() {
    if (!course) return;
    setEnrolling(true);
    setError('');

    if (price > 0) {
      router.push(`/checkout?courseId=${course._id}`);
      return;
    }

    const response = await apiPost('/api/v1/enrollments', { courseId: course._id });
    if (response.error) {
      setError(response.error.message || 'Unable to complete enrollment right now.');
      setEnrolling(false);
      return;
    }

    setEnrolled(true);
    setEnrolling(false);
  }

  function handleToggleWishlist() {
    if (!course) return;
    const existingWishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    const exists = existingWishlist.some(item => item?._id === course._id);

    if (exists) {
      localStorage.setItem('wishlist', JSON.stringify(existingWishlist.filter(item => item?._id !== course._id)));
      setWishlisted(false);
      return;
    }

    localStorage.setItem(
      'wishlist',
      JSON.stringify([
        ...existingWishlist,
        { _id: course._id, title: course.title, slug: course.slug, price: price },
      ])
    );
    setWishlisted(true);
  }

  async function handleShare() {
    if (!course || typeof window === 'undefined') return;
    const shareUrl = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title: course.title, url: shareUrl });
        return;
      } catch {
        return;
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      setError('Unable to copy the course link right now.');
    }
  }

  if (loading) return <LoadingState />;

  if (!course) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] px-6 py-16">
        <div className="mx-auto max-w-3xl rounded-[32px] border border-slate-200 bg-white p-10 text-center shadow-sm">
          <span className="inline-flex rounded-full bg-[#7A1F2B]/8 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#7A1F2B]">
            Course unavailable
          </span>
          <h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-950">We could not find this course.</h1>
          <p className="mt-4 text-base leading-7 text-slate-600">
            The page may have moved or the course may no longer be available.
          </p>
          <Link href="/courses" className="mt-8 inline-flex items-center justify-center rounded-2xl bg-[#7A1F2B] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#651924]">
            Browse all courses
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-24 lg:pb-0">
      <div className="mx-auto max-w-[1320px] px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-10">
          <main className="min-w-0 space-y-6 lg:space-y-8">
            <section className="rounded-[36px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:p-10">
              <div className="h-1.5 w-16 rounded-full bg-[#7A1F2B]" />

              <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                <Link href="/courses" className="font-medium transition-colors hover:text-slate-900">Courses</Link>
                <span>/</span>
                <span className="truncate">{course.title}</span>
              </div>

              <div className="mt-5 flex flex-wrap gap-2.5">
                {course.category ? <span className="rounded-full bg-[#7A1F2B]/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7A1F2B]">{course.category}</span> : null}
                {course.difficultyLevel ? <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">{course.difficultyLevel}</span> : null}
                {hasDiscount ? <span className="rounded-full bg-[#7A1F2B] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">{discountPercent}% off</span> : null}
              </div>

              <div className="mt-6 max-w-5xl">
                <h1 className="text-4xl font-bold leading-[0.92] tracking-tight text-slate-950 sm:text-5xl lg:text-[3.7rem]">
                  {course.title}
                </h1>
                <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">{subtitle}</p>
              </div>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <InlineFeature>Lifetime access</InlineFeature>
                <InlineFeature>Certificate included</InlineFeature>
                <InlineFeature>Mentor support</InlineFeature>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                <div className="rounded-[28px] border border-slate-200 bg-[#F8F9FA] px-5 py-4 sm:col-span-2 xl:col-span-1">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Rating</div>
                  <div className="mt-3 flex items-center gap-3">
                    <StarRow rating={rating} />
                    <span className="text-sm font-medium text-slate-500">{students.toLocaleString('en-IN')}+ learners</span>
                  </div>
                </div>
                <HeroMetric label="Modules" value={pluralize(modulesCount || 1, 'module')} />
                <HeroMetric label="Duration" value={durationText} />
                <HeroMetric label="Students" value={`${students.toLocaleString('en-IN')} enrolled`} />
                <HeroMetric label="Format" value="Self-paced + mentor-backed" />
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <button type="button" onClick={handleEnroll} disabled={enrolling} className="rounded-2xl bg-[#7A1F2B] px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#651924] disabled:opacity-60">
                  {enrolled ? 'Continue learning' : price > 0 ? 'Enroll now' : 'Start free'}
                </button>
                <button type="button" onClick={() => scrollToSection('curriculum')} className="rounded-2xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300">
                  Explore curriculum
                </button>
              </div>
            </section>

            <div className="lg:hidden">
              <EnrollmentCard
                course={course}
                enrolled={enrolled}
                enrolling={enrolling}
                error={error}
                wishlisted={wishlisted}
                onEnroll={handleEnroll}
                onToggleWishlist={handleToggleWishlist}
                onShare={handleShare}
                price={price}
                originalPrice={originalPrice}
                hasDiscount={hasDiscount}
                discountPercent={discountPercent}
                totalLessons={totalLessons}
                modulesCount={modulesCount}
              />
            </div>

            <div className="sticky top-4 z-20">
              <div className="flex flex-wrap gap-2 rounded-[24px] border border-slate-200 bg-white/95 p-2 shadow-sm backdrop-blur">
                {navItems.map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => scrollToSection(item.id)}
                    className={cx('rounded-full px-4 py-2.5 text-sm font-semibold transition-colors', activeSection === item.id ? 'bg-[#7A1F2B] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <section id="overview" ref={overviewRef} className="scroll-mt-28 rounded-[36px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:p-10">
              <SectionHeading eyebrow="What you'll learn" title="A calmer, clearer path from lessons to execution" description="Designed for readability, confidence, and completion so learners know exactly what they are getting and why it matters." />
              <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
                <div className="space-y-4">
                  {learningPoints.map(point => (
                    <div key={point} className="flex items-start gap-4 rounded-[28px] bg-[#F8F9FA] px-5 py-5">
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[#7A1F2B] shadow-sm">
                        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M16.704 5.29a1 1 0 010 1.414l-7.25 7.25a1 1 0 01-1.414 0l-3.25-3.25a1 1 0 011.414-1.414l2.543 2.543 6.543-6.543a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                      </span>
                      <p className="text-[15px] leading-7 text-slate-700">{point}</p>
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <div className="rounded-[30px] border border-slate-200 bg-[#F8F9FA] p-6">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">At a glance</div>
                    <div>
                      <div className="mt-4 text-3xl font-bold tracking-tight text-slate-950">{formatCurrency(price)}</div>
                      <div className="mt-2 text-sm leading-6 text-slate-500">
                        {hasDiscount ? `Down from ${formatCurrency(originalPrice)} with a ${discountPercent}% saving` : 'Single enrollment, lifetime access'}
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-4">
                    <OverviewStat label="Course format" value="Self-paced + mentor context" />
                    <OverviewStat label="Completion support" value="Structured progress flow" />
                  </div>
                </div>
              </div>
            </section>

            <section id="benefits" ref={benefitsRef} className="scroll-mt-28 rounded-[36px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:p-10">
              <SectionHeading eyebrow="Benefits" title="Built to feel premium and convert with clarity" description="Every section is intentionally lighter, easier to scan, and more trustworthy for a higher-confidence enrollment decision." />
              <div className="mt-8 grid gap-4 md:grid-cols-2">
                {benefits.map((benefit, index) => <BenefitCard key={benefit.title} title={benefit.title} description={benefit.description} index={index} />)}
              </div>
            </section>

            <section id="curriculum" ref={curriculumRef} className="scroll-mt-28 rounded-[36px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:p-10">
              <SectionHeading eyebrow="Curriculum" title="A practical module-by-module roadmap" description="Learners can preview the structure immediately, while lock states make the enrollment value obvious without clutter." />
              <div className="mt-8 space-y-4">
                {modules.length > 0 ? modules.map((module, index) => (
                  <CurriculumModule
                    key={module?._id || index}
                    module={module}
                    index={index}
                    enrolled={enrolled}
                    isFree={price === 0}
                    expanded={expandedModule === index}
                    onToggle={() => setExpandedModule(current => (current === index ? -1 : index))}
                  />
                )) : (
                  <div className="rounded-3xl bg-[#F8F9FA] px-5 py-5 text-sm leading-7 text-slate-600">
                    The detailed curriculum will appear here as modules are added to this course.
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-[36px] border border-slate-200 bg-[#F8F9FA] p-6 shadow-sm sm:p-8 lg:p-10">
              <SectionHeading eyebrow="Transformation" title="After this course, you will be able to:" description="This section sharpens the outcome promise so the value feels concrete before enrollment." />
              <div className="mt-8 grid gap-4 md:grid-cols-2">
                {transformationPoints.map((point, index) => (
                  <div key={point} className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7A1F2B]">Outcome {(index + 1).toString().padStart(2, '0')}</div>
                    <p className="mt-3 text-[15px] leading-7 text-slate-700">{point}</p>
                  </div>
                ))}
              </div>
            </section>

            <section id="proof" ref={proofRef} className="scroll-mt-28 rounded-[36px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:p-10">
              <SectionHeading eyebrow="Social proof" title="Trust signals that help the decision feel easy" description="A premium learning page should reduce hesitation with clear proof, credible signals, and testimonials that sound like real outcomes." />
              <div className="mt-8 grid gap-4 lg:grid-cols-3">
                <div className="rounded-[30px] border border-slate-200 bg-[#F8F9FA] p-6">
                  <div className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">Rating</div>
                  <div className="mt-4"><StarRow rating={rating} /></div>
                  <p className="mt-4 text-sm leading-7 text-slate-600">Consistent clarity, practical lessons, and mentor-backed guidance.</p>
                </div>
                <div className="rounded-[30px] border border-slate-200 bg-[#F8F9FA] p-6">
                  <div className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">Students</div>
                  <div className="mt-4 text-3xl font-bold tracking-tight text-slate-950">{students.toLocaleString('en-IN')}+</div>
                  <p className="mt-4 text-sm leading-7 text-slate-600">Founders, builders, and operators already using the platform to upskill with more structure.</p>
                </div>
                <div className="rounded-[30px] border border-slate-200 bg-[#F8F9FA] p-6">
                  <div className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">Completion support</div>
                  <div className="mt-4 text-3xl font-bold tracking-tight text-slate-950">Premium</div>
                  <p className="mt-4 text-sm leading-7 text-slate-600">Cleaner reading flow, stronger hierarchy, and a sticky enroll surface built to improve conversion.</p>
                </div>
              </div>
              <div className="mt-8 grid gap-4 lg:grid-cols-3">
                {testimonials.map(testimonial => <TestimonialCard key={testimonial.name} quote={testimonial.quote} name={testimonial.name} role={testimonial.role} />)}
              </div>
            </section>

            <section className="rounded-[36px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:p-10">
              <div className="max-w-3xl space-y-4">
                <span className="inline-flex rounded-full bg-[#7A1F2B]/8 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#7A1F2B]">Final call to action</span>
                <h2 className="text-3xl font-bold tracking-tight text-slate-950">Start learning with a course page that now feels as premium as the program itself.</h2>
                <p className="text-base leading-8 text-slate-600">Cleaner structure, stronger trust, better readability, and a conversion-first layout make the next step much easier for the learner.</p>
                <div className="flex flex-wrap gap-3 pt-2">
                  <button type="button" onClick={handleEnroll} disabled={enrolling} className="rounded-2xl bg-[#7A1F2B] px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#651924] disabled:opacity-60">
                    {enrolled ? 'Continue learning' : price > 0 ? `Enroll for ${formatCurrency(price)}` : 'Start learning free'}
                  </button>
                  <button type="button" onClick={() => scrollToSection('overview')} className="rounded-2xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300">
                    Back to overview
                  </button>
                </div>
              </div>
            </section>
          </main>
          <aside className="hidden lg:block">
            <div className="sticky top-8">
              <EnrollmentCard
                course={course}
                enrolled={enrolled}
                enrolling={enrolling}
                error={error}
                wishlisted={wishlisted}
                onEnroll={handleEnroll}
                onToggleWishlist={handleToggleWishlist}
                onShare={handleShare}
                price={price}
                originalPrice={originalPrice}
                hasDiscount={hasDiscount}
                discountPercent={discountPercent}
                totalLessons={totalLessons}
                modulesCount={modulesCount}
              />
            </div>
          </aside>
        </div>
      </div>

      {!enrolled ? <MobileBottomBar enrolled={enrolled} enrolling={enrolling} price={price} onEnroll={handleEnroll} courseId={course._id} /> : null}
    </div>
  );
}
