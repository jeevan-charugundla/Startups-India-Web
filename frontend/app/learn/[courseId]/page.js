'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiGet, apiPost } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';

/* ═══════ SVG ICONS ═══════ */
function LessonIcon({ type, size = 16, color = 'currentColor' }) {
  const p = {
    width: size,
    height: size,
    fill: 'none',
    stroke: color,
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    viewBox: '0 0 24 24',
  };
  switch (type) {
    case 'video':
      return (
        <svg {...p}>
          <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
      );
    case 'reading':
      return (
        <svg {...p}>
          <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
        </svg>
      );
    case 'assignment':
      return (
        <svg {...p}>
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
      );
    case 'quiz':
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      );
    case 'live_session':
      return (
        <svg {...p}>
          <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      );
    default:
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      );
  }
}
const ChevronDown = ({ size = 16, color = 'currentColor' }) => (
  <svg
    width={size}
    height={size}
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    viewBox="0 0 24 24"
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);
const ChevronLeft = ({ size = 16, color = 'currentColor' }) => (
  <svg
    width={size}
    height={size}
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    viewBox="0 0 24 24"
  >
    <polyline points="15 18 9 12 15 6" />
  </svg>
);
const ChevronRight = ({ size = 16, color = 'currentColor' }) => (
  <svg
    width={size}
    height={size}
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    viewBox="0 0 24 24"
  >
    <polyline points="9 18 15 12 9 6" />
  </svg>
);
const CheckIcon = ({ size = 16, color = 'currentColor' }) => (
  <svg
    width={size}
    height={size}
    fill="none"
    stroke={color}
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    viewBox="0 0 24 24"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

function formatFileSize(bytes) {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
const LockIcon = ({ size = 16, color = 'currentColor' }) => (
  <svg
    width={size}
    height={size}
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    viewBox="0 0 24 24"
  >
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0110 0v4" />
  </svg>
);
const MenuIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg
    width={size}
    height={size}
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    viewBox="0 0 24 24"
  >
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);
const XIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg
    width={size}
    height={size}
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    viewBox="0 0 24 24"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const ArrowRight = ({ size = 16, color = 'currentColor' }) => (
  <svg
    width={size}
    height={size}
    fill="none"
    stroke={color}
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    viewBox="0 0 24 24"
  >
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);
const ClockIcon = ({ size = 16, color = 'currentColor' }) => (
  <svg
    width={size}
    height={size}
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    viewBox="0 0 24 24"
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);
const ShieldIcon = ({ size = 16, color = 'currentColor' }) => (
  <svg
    width={size}
    height={size}
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    viewBox="0 0 24 24"
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);
const TrophyIcon = ({ size = 16, color = 'currentColor' }) => (
  <svg
    width={size}
    height={size}
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    viewBox="0 0 24 24"
  >
    <path d="M6 9H4.5a2.5 2.5 0 010-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 000-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22" />
    <path d="M18 2H6v7a6 6 0 0012 0V2z" />
  </svg>
);
const FireIcon = ({ size = 16, color = 'currentColor' }) => (
  <svg
    width={size}
    height={size}
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    viewBox="0 0 24 24"
  >
    <path d="M12 12c2-2.96 0-7-1-8 0 3.038-1.773 4.741-3 6-1.226 1.26-2 3.24-2 5a6 6 0 1012 0c0-1.532-1.056-3.94-2-5-1.786 3-2 2-4 2z" />
  </svg>
);
const BookmarkIcon = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
  </svg>
);
const EditIcon = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);
const TrashIcon = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

const PlayIcon = ({ size = 16, color = 'currentColor' }) => (
  <svg
    width={size}
    height={size}
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    viewBox="0 0 24 24"
  >
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);

const fmt = s => {
  const m = Math.floor(s / 60),
    sec = s % 60;
  return `${m}:${sec < 10 ? '0' : ''}${sec}`;
};

function getAllLessonsFlat(modules) {
  const r = [];
  (modules || []).forEach(mod => {
    if (mod.isUnlocked)
      (mod.lessons || []).forEach(l =>
        r.push({ ...l, moduleTitle: mod.title, moduleId: mod._id, moduleNumber: mod.moduleNumber })
      );
  });
  return r;
}

export default function CourseLearnPage() {
  const { courseId } = useParams();
  const router = useRouter();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeLesson, setActiveLesson] = useState(null);
  const [lessonDetail, setLessonDetail] = useState(null);
  const [lessonLoading, setLessonLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedModules, setExpandedModules] = useState({});
  const [selectedModule, setSelectedModule] = useState(null);
  const [showQuiz, setShowQuiz] = useState(null);
  const [quizData, setQuizData] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const videoRef = useRef(null);
  const activeLessonRef = useRef(null);
  const selectedModuleRef = useRef(null);
  const initialLoadDone = useRef(false);

  /* ── Notes tracking ── */
  const [notes, setNotes] = useState([]);
  const [noteText, setNoteText] = useState('');
  const [noteLoading, setNoteLoading] = useState(false);
  const [isNotesExpanded, setIsNotesExpanded] = useState(true);

  /* ── Time tracking ── */
  const [timeSpent, setTimeSpent] = useState(0);
  const [isTimerDone, setIsTimerDone] = useState(false);
  const [completing, setCompleting] = useState(false);
  const timerRef = useRef(null);
  const timeSpentRef = useRef(0);

  /* ── Video tracking ── */
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoWatched, setVideoWatched] = useState(0);
  const watchedIntervalsRef = useRef([]);

  const loadDashboard = useCallback(
    async (isRefresh = false) => {
      if (!isRefresh) setLoading(true);
      const { data, error } = await apiGet(`/api/v1/learn/${courseId}`);
      if (error) {
        if (error.status === 401) router.push('/login');
        if (!isRefresh) setLoading(false);
        return;
      }
      setDashboard(data);
      if (data?.modules?.length && !selectedModuleRef.current) {
        const first = data.modules.find(m => m.isUnlocked);
        if (first) {
          setExpandedModules(prev => ({ ...prev, [first._id]: true }));
          selectedModuleRef.current = first._id;
          setSelectedModule(first._id);
        }
      }
      if (!isRefresh) setLoading(false);
      initialLoadDone.current = true;
    },
    [courseId, router]
  );

  useEffect(() => {
    loadDashboard(false);
  }, [loadDashboard]);
  useEffect(() => {
    if (activeLessonRef.current)
      activeLessonRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [activeLesson]);

  /* ── Lesson timer: 90% of durationMinutes ── */
  useEffect(() => {
    if (lessonDetail && !lessonDetail.isCompleted) {
      const reqSec = (lessonDetail.durationMinutes || 0) * 60;
      setTimeSpent(0);
      timeSpentRef.current = 0;
      setIsTimerDone(reqSec <= 0);
      setCompleting(false);
      watchedIntervalsRef.current = [];
      setVideoWatched(0);

      timerRef.current = setInterval(() => {
        timeSpentRef.current += 1;
        setTimeSpent(timeSpentRef.current);
        if (reqSec > 0 && timeSpentRef.current >= Math.ceil(reqSec * 0.9)) setIsTimerDone(true);
      }, 1000);
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    } else {
      setTimeSpent(0);
      setIsTimerDone(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [lessonDetail]);

  /* ── Auto-complete for reading/resource when 90% time is reached ── */
  const toggleModule = modId => {
    setExpandedModules(prev => ({ ...prev, [modId]: !prev[modId] }));
    selectedModuleRef.current = modId;
    setSelectedModule(modId);
  };

  const fetchNotes = useCallback(async (lessonId) => {
    const { data, error } = await apiGet(`/api/v1/learning/notes?lessonId=${lessonId}`);
    if (!error && data) setNotes(data);
  }, []);

  const saveNote = async () => {
    if (!noteText.trim() || !activeLesson) return;
    setNoteLoading(true);
    const timestamp = videoRef.current ? Math.floor(videoRef.current.currentTime) : null;
    const { data, error } = await apiPost('/api/v1/learning/notes', {
      lessonId: activeLesson,
      content: noteText,
      timestamp,
      color: '#7A1F2B'
    });
    if (!error && data) {
      setNotes(prev => [...prev, data].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0)));
      setNoteText('');
    } else {
      alert(error?.message || 'Failed to capture insight');
    }
    setNoteLoading(false);
  };

  const deleteNote = async (id) => {
    if (!confirm('Discard this strategic insight?')) return;
    const { error } = await apiPost(`/api/v1/learning/notes/${id}`, { _method: 'DELETE' }); // Backend might use method override or direct DELETE
    // Checking if the backend expects DELETE method
    // Wait, I saw router.delete('/:id', authRequired, controller.deleteNote) in notes.routes.js
    // I should use apiPost with a custom method or better, just fetch with method DELETE.
    // My api helper might not support DELETE easily if it's just apiGet/apiPost.
    // Let's use fetch directly for delete to be safe.
    try {
      const res = await fetch(`/api/v1/learning/notes/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const json = await res.json();
      if (json.success) setNotes(prev => prev.filter(n => n._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const openLesson = useCallback(async (lessonId, lessonData) => {
    if (lessonData?.isLocked) return;
    setLessonLoading(true);
    setQuizResult(null);
    setCompleting(false);
    setNoteText('');
    const { data, error } = await apiGet(`/api/v1/learn/${courseId}/lesson/${lessonId}`);
    if (error) {
      if (error.status === 401) {
        router.push('/login');
        return;
      }
      if (error.message?.includes('previous lesson'))
        alert('Complete the previous lesson first to unlock this one.');
      else alert(error.message || 'Cannot access lesson');
      setLessonLoading(false);
      return;
    }
    setLessonDetail(data);
    setActiveLesson(lessonId);
    setLessonLoading(false);
    fetchNotes(lessonId);
    if (window.innerWidth < 768) setSidebarOpen(false);
  }, [courseId, router, fetchNotes]);

  const doAutoComplete = useCallback(async lessonId => {
    setCompleting(true);
    const { error } = await apiPost(`/api/v1/learn/${courseId}/lesson/${lessonId}/complete`, {
      timeSpentSeconds: timeSpentRef.current,
    });
    if (error) {
      setCompleting(false);
      return;
    }
    setLessonDetail(prev => (prev ? { ...prev, isCompleted: true } : prev));
    if (timerRef.current) clearInterval(timerRef.current);
    // Refresh dashboard then auto-open next lesson
    const { data } = await apiGet(`/api/v1/learn/${courseId}`);
    if (data) {
      setDashboard(data);
      const all = getAllLessonsFlat(data.modules);
      const idx = all.findIndex(l => l._id === lessonId);
      if (idx >= 0 && idx < all.length - 1 && !all[idx + 1].isLocked) {
        setTimeout(() => openLesson(all[idx + 1]._id, all[idx + 1]), 1200);
      }
    }
  }, [courseId, openLesson]);

  useEffect(() => {
    if (isTimerDone && lessonDetail && !lessonDetail.isCompleted && !completing) {
      const ct = lessonDetail.contentType;
      if (ct === 'reading' || ct === 'resource') {
        doAutoComplete(lessonDetail._id);
      }
    }
  }, [isTimerDone, lessonDetail, completing, doAutoComplete]);

  /* ── Video: track how much user watched, auto-complete at 90% ── */
  const handleVideoTimeUpdate = () => {
    if (!videoRef.current || !lessonDetail || lessonDetail.isCompleted) return;
    const v = videoRef.current;
    const dur = v.duration || 0;
    if (dur <= 0) return;

    // Track watched intervals (handles seeking)
    const ct = Math.floor(v.currentTime);
    const intervals = watchedIntervalsRef.current;
    if (!intervals.includes(ct)) intervals.push(ct);

    const uniqueSeconds = intervals.length;
    const pctWatched = (uniqueSeconds / Math.ceil(dur)) * 100;
    setVideoWatched(Math.min(Math.round(pctWatched), 100));

    // Auto-complete when 90% of video watched
    if (pctWatched >= 90 && !completing) {
      doAutoComplete(lessonDetail._id);
    }
  };

  const handleVideoLoadedMetadata = () => {
    if (videoRef.current) setVideoDuration(Math.ceil(videoRef.current.duration));
  };

  const handleVideoEnded = () => {
    if (lessonDetail && !lessonDetail.isCompleted && !completing) doAutoComplete(lessonDetail._id);
  };

  const navigateLesson = dir => {
    if (!dashboard?.modules) return;
    const all = getAllLessonsFlat(dashboard.modules);
    
    // If no active lesson, find index based on current module overview
    let idx = all.findIndex(l => String(l._id) === String(activeLesson));
    
    if (idx < 0 && selectedModule) {
      // Find first lesson of selected module
      const mod = dashboard.modules.find(m => String(m._id) === String(selectedModule));
      if (mod && mod.lessons?.length) {
        if (dir > 0) {
          // "Next" from module overview goes to first lesson of module
          const firstId = mod.lessons[0]._id;
          idx = all.findIndex(l => String(l._id) === String(firstId)) - 1;
        } else {
          // "Prev" from module overview goes to last lesson of previous module
          const firstId = mod.lessons[0]._id;
          idx = all.findIndex(l => String(l._id) === String(firstId));
        }
      }
    }

    if (idx < 0 && dir > 0) {
      // If still not found and going next, start from first lesson
      openLesson(all[0]._id, all[0]);
      return;
    }

    const t = idx + dir;
    if (t < 0 || t >= all.length) return;
    if (all[t].isLocked) return;
    openLesson(all[t]._id, all[t]);
  };

  const openQuiz = async moduleId => {
    setQuizLoading(true);
    setQuizResult(null);
    setQuizAnswers({});
    const { data, error } = await apiGet(`/api/v1/learn/${courseId}/module/${moduleId}/quiz`);
    if (error) {
      if (error.status === 401) {
        router.push('/login');
        return;
      }
      alert(error.message || 'Quiz not available');
      setQuizLoading(false);
      return;
    }
    setQuizData(data);
    setShowQuiz(moduleId);
    setQuizLoading(false);
  };

  const submitQuiz = async () => {
    if (!showQuiz || !quizData) return;
    setQuizLoading(true);
    const answers = quizData.questions.map((_, qi) => ({
      questionIndex: qi,
      selectedOption: quizAnswers[qi] ?? -1,
    }));
    const { data, error } = await apiPost(`/api/v1/learn/${courseId}/module/${showQuiz}/quiz`, {
      answers,
    });
    if (error) {
      if (error.status === 401) {
        router.push('/login');
        return;
      }
      alert(error.message);
      setQuizLoading(false);
      return;
    }
    setQuizResult(data);
    setQuizLoading(false);
    loadDashboard(true);
  };

  /* ═══════ SIDEBAR ═══════ */
  const renderSidebar = (modules, overallProgress, isPreStart = false) => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fff' }}>
      <div style={{ padding: '2rem 1.5rem', borderBottom: '1px solid #f8f8f8' }}>
        <Link
          href="/dashboard/my-courses"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            fontSize: '0.7rem',
            color: '#C5975B',
            fontWeight: 800,
            textDecoration: 'none',
            marginBottom: 16,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          <ChevronLeft size={12} color="#C5975B" /> BACK TO PORTFOLIO
        </Link>
        <h2
          style={{
            fontSize: '1.1rem',
            fontWeight: 900,
            color: '#111',
            lineHeight: 1.3,
            margin: '0 0 1.5rem',
            letterSpacing: '-0.02em',
          }}
        >
          {dashboard.course?.title}
        </h2>
        
        <div style={{ background: '#fafafa', padding: '16px', borderRadius: '16px', border: '1px solid #f0f0f0' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 10,
            }}
          >
            <span
              style={{
                fontSize: '0.6rem',
                fontWeight: 900,
                color: '#aaa',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              Mastery Progress
            </span>
            <span style={{ fontSize: '0.85rem', fontWeight: 900, color: '#7A1F2B' }}>
              {overallProgress}%
            </span>
          </div>
          <div style={{ height: 6, background: '#eee', borderRadius: 999, overflow: 'hidden' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${overallProgress}%` }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              style={{
                height: '100%',
                background: 'linear-gradient(90deg, #7A1F2B, #C5975B)',
                borderRadius: 999,
              }}
            />
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 24 }}>
        {modules.map((mod, mi) => {
          const locked = !mod.isUnlocked;
          const expanded = !!expandedModules[mod._id];
          const done = (mod.lessons || []).filter(l => l.isCompleted).length;
          const total = (mod.lessons || []).length;
          const active = selectedModule === mod._id && !locked;
          const needsQuiz = mod.allLessonsComplete && mod.quiz && !mod.quizPassed;

          return (
            <div key={mod._id} style={{ borderBottom: '1px solid #f8f8f8' }}>
              <button
                onClick={() => !locked && toggleModule(mod._id)}
                className={`module-item ${locked ? 'locked' : ''}`}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '1.25rem 1.5rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 16,
                  background: active ? 'rgba(197,151,91,0.03)' : 'transparent',
                  border: 'none',
                  cursor: locked ? 'not-allowed' : 'pointer',
                  opacity: locked ? 0.4 : 1,
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.8rem',
                    fontWeight: 900,
                    flexShrink: 0,
                    marginTop: 2,
                    background: locked ? '#f0f0f0' : mod.progress === 100 ? '#ecfdf5' : 'rgba(122,31,43,0.05)',
                    color: locked ? '#ccc' : mod.progress === 100 ? '#059669' : '#7A1F2B',
                    border: mod.progress === 100 ? 'none' : locked ? 'none' : '1px solid rgba(122,31,43,0.1)',
                  }}
                >
                  {locked ? (
                    <LockIcon size={14} color="#ccc" />
                  ) : mod.progress === 100 ? (
                    <CheckIcon size={16} color="#059669" />
                  ) : (
                    mod.moduleNumber || mi + 1
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span
                      style={{
                        fontSize: '0.6rem',
                        fontWeight: 900,
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        color: '#C5975B',
                      }}
                    >
                      Module {mod.moduleNumber || mi + 1}
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: '0.9rem',
                      fontWeight: 800,
                      color: locked ? '#bbb' : '#111',
                      margin: 0,
                      lineHeight: 1.4,
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {mod.title}
                  </p>
                  
                  {!locked && total > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
                      <div
                        style={{
                          flex: 1,
                          height: 3,
                          background: '#eee',
                          borderRadius: 999,
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            background: mod.progress === 100 ? '#059669' : '#C5975B',
                            borderRadius: 999,
                            width: (mod.progress || 0) + '%',
                            transition: 'width 0.5s',
                          }}
                        />
                      </div>
                      <span
                        style={{
                          fontSize: '0.65rem',
                          color: '#999',
                          fontWeight: 800,
                          flexShrink: 0,
                        }}
                      >
                        {done}/{total}
                      </span>
                    </div>
                  )}
                </div>
                {!locked && (
                  <span
                    style={{
                      marginTop: 8,
                      transform: expanded ? 'rotate(180deg)' : 'rotate(0)',
                      transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      flexShrink: 0,
                    }}
                  >
                    <ChevronDown size={14} color="#ccc" />
                  </span>
                )}
              </button>

              <AnimatePresence>
                {expanded && !locked && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div style={{ paddingBottom: 8 }}>
                      {(mod.lessons || []).map(lesson => {
                        const isActive = activeLesson === lesson._id;
                        const isDone = lesson.isCompleted;
                        const isLocked = lesson.isLocked;
                        return (
                          <button
                            key={lesson._id}
                            ref={isActive ? activeLessonRef : null}
                            onClick={() =>
                              !isPreStart && !isLocked && openLesson(lesson._id, lesson)
                            }
                            disabled={isPreStart || isLocked}
                            style={{
                              width: '100%',
                              textAlign: 'left',
                              padding: '0.65rem 1.25rem 0.65rem 2.8rem',
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: 10,
                              fontSize: '0.82rem',
                              background: isActive
                                ? 'linear-gradient(90deg, rgba(122,31,43,0.06), transparent)'
                                : 'transparent',
                              borderLeft: isActive ? '3px solid #7A1F2B' : '3px solid transparent',
                              border: 'none',
                              borderLeft: isActive ? '3px solid #7A1F2B' : '3px solid transparent',
                              cursor: isPreStart || isLocked ? 'not-allowed' : 'pointer',
                              opacity: isLocked ? 0.4 : 1,
                              transition: 'all 0.2s',
                            }}
                          >
                            <span
                              style={{
                                width: 22,
                                height: 22,
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                marginTop: 1,
                                background: isDone
                                  ? '#059669'
                                  : isLocked
                                    ? '#f0f0f0'
                                    : 'transparent',
                                border: isDone
                                  ? 'none'
                                  : isLocked
                                    ? '2px solid #ddd'
                                    : isActive
                                      ? '2px solid #7A1F2B'
                                      : '2px solid #ddd',
                              }}
                            >
                              {isDone ? (
                                <CheckIcon size={12} color="#fff" />
                              ) : isLocked ? (
                                <LockIcon size={10} color="#ccc" />
                              ) : (
                                <LessonIcon
                                  type={lesson.contentType}
                                  size={10}
                                  color={isActive ? '#7A1F2B' : '#bbb'}
                                />
                              )}
                            </span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p
                                style={{
                                  margin: 0,
                                  color: isLocked
                                    ? '#ccc'
                                    : isActive
                                      ? '#7A1F2B'
                                      : isDone
                                        ? '#999'
                                        : '#444',
                                  fontWeight: isActive ? 700 : 500,
                                  lineHeight: 1.4,
                                }}
                              >
                                {lesson.title}
                              </p>
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 6,
                                  marginTop: 4,
                                  flexWrap: 'wrap',
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: '0.6rem',
                                    color: '#bbb',
                                    textTransform: 'capitalize',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 3,
                                  }}
                                >
                                  <LessonIcon type={lesson.contentType} size={10} color="#ccc" />{' '}
                                  {(lesson.contentType || 'lesson').replace('_', ' ')}
                                </span>
                                {lesson.durationMinutes > 0 && (
                                  <span
                                    style={{
                                      fontSize: '0.6rem',
                                      color: '#ccc',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 2,
                                    }}
                                  >
                                    <ClockIcon size={9} color="#ccc" /> {lesson.durationMinutes}m
                                  </span>
                                )}
                                {isLocked && (
                                  <span
                                    style={{
                                      fontSize: '0.55rem',
                                      color: '#d97706',
                                      fontWeight: 600,
                                    }}
                                  >
                                    Complete previous first
                                  </span>
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                      {/* Quiz button */}
                      {mod.quiz && !isPreStart && (
                        <button
                          onClick={() => (mod.allLessonsComplete ? openQuiz(mod._id) : null)}
                          disabled={!mod.allLessonsComplete}
                          style={{
                            width: '100%',
                            textAlign: 'left',
                            padding: '0.65rem 1.25rem 0.65rem 2.8rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            border: 'none',
                            background: 'transparent',
                            cursor: mod.allLessonsComplete ? 'pointer' : 'not-allowed',
                            opacity: mod.allLessonsComplete ? 1 : 0.4,
                          }}
                        >
                          <span
                            style={{
                              width: 22,
                              height: 22,
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: mod.quizPassed ? '#059669' : '#fff7ed',
                              border: mod.quizPassed ? 'none' : '2px solid #d97706',
                            }}
                          >
                            {mod.quizPassed ? (
                              <CheckIcon size={12} color="#fff" />
                            ) : (
                              <LessonIcon type="quiz" size={10} color="#d97706" />
                            )}
                          </span>
                          <div style={{ flex: 1 }}>
                            <p
                              style={{
                                margin: 0,
                                fontSize: '0.82rem',
                                fontWeight: 600,
                                color: mod.quizPassed ? '#059669' : '#d97706',
                              }}
                            >
                              {mod.quiz.title || 'Module Quiz'}
                            </p>
                            <p style={{ margin: '2px 0 0', fontSize: '0.6rem', color: '#bbb' }}>
                              {mod.quiz.questionCount} Qs ·{' '}
                              {mod.quizPassed
                                ? 'Passed'
                                : !mod.allLessonsComplete
                                  ? 'Complete all lessons'
                                  : '75% required'}
                            </p>
                            {mod.quizAttempt && !mod.quizPassed && (
                              <p
                                style={{
                                  margin: '2px 0 0',
                                  fontSize: '0.55rem',
                                  color: '#ef4444',
                                  fontWeight: 600,
                                }}
                              >
                                Last: {mod.quizAttempt.percentage}% - Need 75%
                              </p>
                            )}
                          </div>
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );

  /* ═══════ MODULE DETAIL PANEL ═══════ */
  const renderModuleDetail = (mod, isPreStart = false) => {
    if (!mod) return null;
    const done = (mod.lessons || []).filter(l => l.isCompleted).length;
    const total = (mod.lessons || []).length;
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ maxWidth: 1100, margin: '0 auto' }}
      >
        {/* Header card */}
        <div
          style={{
            background: 'linear-gradient(135deg, #7A1F2B, #4a131a)',
            borderRadius: '40px',
            padding: '4rem',
            marginBottom: '40px',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 30px 60px rgba(122,31,43,0.18)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: -50,
              right: -50,
              width: 400,
              height: 400,
              background: 'radial-gradient(circle, rgba(197,151,91,0.25) 0%, transparent 70%)',
              filter: 'blur(60px)',
            }}
          />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginBottom: 24,
              }}
            >
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  letterSpacing: '0.15em',
                  color: '#C5975B',
                  background: 'rgba(255,255,255,0.1)',
                  padding: '8px 20px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.15)',
                }}
              >
                Module {mod.moduleNumber}
              </span>
              {mod.weekNumber > 0 && (
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    color: 'rgba(255,255,255,0.6)',
                    background: 'rgba(0,0,0,0.1)',
                    padding: '8px 18px',
                    borderRadius: '12px',
                  }}
                >
                  Week {mod.weekNumber}
                </span>
              )}
            </div>
            <h2
              style={{
                fontSize: '3.2rem',
                fontWeight: 900,
                color: '#fff',
                margin: '0 0 20px',
                lineHeight: 1,
                letterSpacing: '-0.04em',
              }}
            >
              {mod.title}
            </h2>
            {mod.description && (
              <p
                style={{
                  color: 'rgba(255,255,255,0.85)',
                  fontSize: '1.2rem',
                  lineHeight: 1.6,
                  margin: 0,
                  maxWidth: '800px',
                  fontWeight: 500,
                }}
              >
                {mod.description}
              </p>
            )}
            {!isPreStart && total > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: 40 }}>
                <div
                  style={{
                    flex: 1,
                    height: 10,
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: 999,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      background: '#C5975B',
                      borderRadius: 999,
                      width: (mod.progress || 0) + '%',
                      transition: 'width 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  />
                </div>
                <span
                  style={{ fontSize: '1rem', fontWeight: 900, color: '#fff', letterSpacing: '0.05em' }}
                >
                  {mod.progress}% COMPLETE
                </span>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem', marginBottom: '2.5rem' }}>
          {mod.whatYouLearn?.length > 0 && (
            <div
              style={{
                background: '#fff',
                border: '1px solid #f0e8e0',
                borderRadius: 24,
                padding: '2rem',
                height: '100%'
              }}
            >
              <h3
                style={{
                  fontSize: '1.1rem',
                  fontWeight: 800,
                  color: '#1a1a1a',
                  margin: '0 0 1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <span
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 12,
                    background: '#ecfdf5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <svg
                    width="18"
                    height="18"
                    fill="none"
                    stroke="#059669"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    viewBox="0 0 24 24"
                  >
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </span>{' '}
                Key Outcomes
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {mod.whatYouLearn.map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ marginTop: 4 }}><CheckIcon size={16} color="#059669" /></div>
                    <span style={{ fontSize: '0.95rem', color: '#444', lineHeight: 1.6, fontWeight: 500 }}>
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {mod.keyActivities?.length > 0 && (
            <div
              style={{
                background: '#fff',
                border: '1px solid #f0e8e0',
                borderRadius: 24,
                padding: '2rem',
                height: '100%'
              }}
            >
              <h3
                style={{
                  fontSize: '1.1rem',
                  fontWeight: 800,
                  color: '#1a1a1a',
                  margin: '0 0 1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <span
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 12,
                    background: '#fdf2f4',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <svg
                    width="18"
                    height="18"
                    fill="none"
                    stroke="#7A1F2B"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    viewBox="0 0 24 24"
                  >
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                </span>{' '}
                Milestones
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {mod.keyActivities.map((item, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      background: '#faf8f5',
                      borderRadius: 16,
                      padding: '1rem',
                    }}
                  >
                    <span
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 10,
                        background: '#7A1F2B',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 900,
                        flexShrink: 0,
                      }}
                    >
                      {i + 1}
                    </span>
                    <span style={{ fontSize: '0.92rem', color: '#333', fontWeight: 600 }}>
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {mod.deliverable && (
          <div
            style={{
              background: 'linear-gradient(135deg, #fffbeb, #fef3c7)',
              border: '1px solid #fde68a',
              borderRadius: 24,
              padding: '2rem 2.5rem',
              marginBottom: '2.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: 24
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                background: 'rgba(217,119,6,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <svg
                width="28"
                height="28"
                fill="none"
                stroke="#d97706"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                viewBox="0 0 24 24"
              >
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <div>
              <h3
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 900,
                  color: '#92400e',
                  margin: '0 0 4px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em'
                }}
              >
                Primary Deliverable
              </h3>
              <p style={{ fontSize: '1.2rem', fontWeight: 800, color: '#78350f', margin: 0 }}>
                {mod.deliverable}
              </p>
              {mod.deliverableDescription && (
                <p style={{ fontSize: '0.95rem', color: '#92400e', margin: '6px 0 0', opacity: 0.8, fontWeight: 500 }}>
                  {mod.deliverableDescription}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Lesson list */}
        {!isPreStart && total > 0 && (
          <div
            style={{
              background: '#fff',
              border: '1px solid #f0e8e0',
              borderRadius: 24,
              padding: '2.5rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
              <div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#1a1a1a', margin: '0 0 6px' }}>
                  Curriculum Repository
                </h3>
                <p style={{ fontSize: '0.9rem', color: '#999', margin: 0, fontWeight: 500 }}>
                  Strategic breakdown of phase objectives and tactical lessons.
                </p>
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#7A1F2B', background: 'rgba(122,31,43,0.05)', padding: '6px 14px', borderRadius: '10px' }}>
                {done} / {total} COMPLETED
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(450px, 1fr))', gap: '1rem' }}>
              {(mod.lessons || []).map(lesson => {
                const isLk = lesson.isLocked;
                return (
                  <button
                    key={lesson._id}
                    onClick={() => !isLk && openLesson(lesson._id, lesson)}
                    disabled={isLk}
                    className="lesson-btn"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16,
                      padding: '1.25rem',
                      borderRadius: 20,
                      background: isLk ? '#fafafa' : '#faf8f5',
                      border: '1px solid #f0e8e0',
                      cursor: isLk ? 'not-allowed' : 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      textAlign: 'left',
                      width: '100%',
                      opacity: isLk ? 0.6 : 1,
                    }}
                  >
                    <span
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 14,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        background: lesson.isCompleted ? '#ecfdf5' : isLk ? '#f0f0f0' : '#fff',
                        boxShadow: lesson.isCompleted || isLk ? 'none' : '0 4px 10px rgba(0,0,0,0.03)'
                      }}
                    >
                      {lesson.isCompleted ? (
                        <CheckIcon size={20} color="#059669" />
                      ) : isLk ? (
                        <LockIcon size={18} color="#ccc" />
                      ) : (
                        <LessonIcon type={lesson.contentType} size={20} color="#7A1F2B" />
                      )}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          fontSize: '1rem',
                          fontWeight: 700,
                          color: isLk ? '#bbb' : lesson.isCompleted ? '#999' : '#111',
                          margin: 0,
                          letterSpacing: '-0.01em'
                        }}
                      >
                        {lesson.title}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            color: '#bbb',
                            textTransform: 'capitalize',
                            fontWeight: 600
                          }}
                        >
                          {(lesson.contentType || 'lesson').replace('_', ' ')}
                        </span>
                        {lesson.durationMinutes > 0 && (
                          <span
                            style={{
                              fontSize: '0.75rem',
                              color: '#ccc',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                              fontWeight: 500
                            }}
                          >
                            <ClockIcon size={12} color="#ccc" /> {lesson.durationMinutes}m
                          </span>
                        )}
                      </div>
                    </div>
                    {!isLk && <div style={{ color: '#C5975B', transform: 'translateX(0)', transition: '0.3s' }} className="lesson-arrow"><ChevronRight size={20} /></div>}
                  </button>
                );
              })}
              
              {/* Quiz button in grid */}
              {mod.quiz && !isPreStart && (
                <button
                  onClick={() => (mod.allLessonsComplete ? openQuiz(mod._id) : null)}
                  disabled={!mod.allLessonsComplete}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    padding: '1.25rem',
                    borderRadius: 20,
                    background: mod.allLessonsComplete ? 'rgba(197,151,91,0.05)' : '#fafafa',
                    border: '1px solid rgba(197,151,91,0.2)',
                    cursor: mod.allLessonsComplete ? 'pointer' : 'not-allowed',
                    textAlign: 'left',
                    width: '100%',
                    opacity: mod.allLessonsComplete ? 1 : 0.4,
                  }}
                >
                  <span
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 14,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: mod.quizPassed ? '#ecfdf5' : '#fff',
                      border: mod.quizPassed ? 'none' : '1px solid rgba(197,151,91,0.3)',
                    }}
                  >
                    {mod.quizPassed ? (
                      <CheckIcon size={20} color="#059669" />
                    ) : (
                      <LessonIcon type="quiz" size={20} color="#C5975B" />
                    )}
                  </span>
                  <div style={{ flex: 1 }}>
                    <p
                      style={{
                        margin: 0,
                        fontSize: '1rem',
                        fontWeight: 800,
                        color: mod.quizPassed ? '#059669' : '#C5975B',
                      }}
                    >
                      {mod.quiz.title || 'Phase Assessment'}
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#999', fontWeight: 600 }}>
                      {mod.quiz.questionCount} Qs · {mod.quizPassed ? 'Verified' : '75% Required'}
                    </p>
                  </div>
                  {mod.allLessonsComplete && <ChevronRight size={20} color="#C5975B" />}
                </button>
              )}
            </div>
          </div>
        )}
      </motion.div>
    );
  };

  /* ═══════ CSS ═══════ */
  const pageStyles = `
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes pulseGold { 0% { box-shadow: 0 0 0 0 rgba(197,151,91,0.4); } 70% { box-shadow: 0 0 0 10px rgba(197,151,91,0); } 100% { box-shadow: 0 0 0 0 rgba(197,151,91,0); } }
    
    .learn-sidebar { scrollbar-width: thin; scrollbar-color: #C5975B transparent; }
    .learn-sidebar::-webkit-scrollbar { width: 4px; }
    .learn-sidebar::-webkit-scrollbar-thumb { background: #C5975B; border-radius: 999px; }
    
    .lesson-btn { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important; }
    .lesson-btn:hover:not(:disabled) { background: rgba(122,31,43,0.04) !important; border-color: rgba(122,31,43,0.1) !important; transform: translateX(4px); }
    
    .module-item { transition: all 0.3s ease; }
    .module-item:hover:not(.locked) { background: #fdfaf7 !important; }
    
    .video-container { position: relative; border-radius: 24px; overflow: hidden; background: #000; box-shadow: 0 20px 50px rgba(0,0,0,0.15); border: 1px solid rgba(122,31,43,0.1); }
    .premium-card { background: #fff; border-radius: 24px; border: 1px solid #f0f0f0; box-shadow: 0 10px 30px rgba(0,0,0,0.02); }
    
    .quiz-opt { transition: all 0.2s; cursor: pointer; border: 1px solid #f0f0f0; border-radius: 16px; padding: 16px 20px; background: #fff; }
    .quiz-opt:hover { border-color: #C5975B; background: rgba(197,151,91,0.04); }
    .quiz-opt-selected { border-color: #7A1F2B !important; background: rgba(122,31,43,0.05) !important; box-shadow: 0 4px 15px rgba(122,31,43,0.05); }
    
    .btn-premium { background: #7A1F2B; color: white; border: none; padding: 12px 24px; border-radius: 12px; font-weight: 800; cursor: pointer; transition: all 0.3s; }
    .btn-premium:hover { background: #922538; transform: translateY(-2px); box-shadow: 0 8px 25px rgba(122,31,43,0.2); }
    .btn-premium:disabled { background: #eee; color: #aaa; cursor: not-allowed; transform: none; box-shadow: none; }
    
    .accent-bar { width: 30px; height: 3px; background: #C5975B; border-radius: 2px; margin-bottom: 12px; }

    @media (min-width: 1024px) {
      .sidebar-overlay { display: none !important; }
    }
  `;

  /* ═══════ LOADING ═══════ */
  if (loading)
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: "'Inter',system-ui,sans-serif",
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ position: 'relative', width: 48, height: 48, margin: '0 auto 16px' }}>
            <div
              style={{
                width: 48,
                height: 48,
                border: '3px solid #f0e8e0',
                borderRadius: '50%',
                position: 'absolute',
              }}
            />
            <div
              style={{
                width: 48,
                height: 48,
                border: '3px solid transparent',
                borderTopColor: '#7A1F2B',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
                position: 'absolute',
              }}
            />
          </div>
          <p style={{ color: '#888', fontSize: '0.88rem', fontWeight: 600 }}>
            Loading your course...
          </p>
        </div>
      </div>
    );

  if (!dashboard)
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: "'Inter',system-ui,sans-serif",
        }}
      >
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 18,
              background: '#fdf2f4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <svg
              width="28"
              height="28"
              fill="none"
              stroke="#7A1F2B"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <p style={{ color: '#555', fontSize: '1.1rem', fontWeight: 700, margin: '0 0 8px' }}>
            Unable to load course
          </p>
          <button
            onClick={loadDashboard}
            style={{
              padding: '0.6rem 1.5rem',
              background: '#7A1F2B',
              color: '#fff',
              borderRadius: 12,
              border: 'none',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              marginTop: 12,
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    );

  /* ═══════ NOT ENROLLED ═══════ */
  if (dashboard.state === 'not_enrolled')
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          fontFamily: "'Inter',system-ui,sans-serif",
        }}
      >
        <style dangerouslySetInnerHTML={{ __html: pageStyles }} />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: '#fff',
            border: '1px solid #f0e8e0',
            borderRadius: 24,
            padding: '3rem',
            maxWidth: 480,
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 8px 30px rgba(0,0,0,0.04)',
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              background: '#fdf2f4',
              borderRadius: 18,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
            }}
          >
            <LockIcon size={28} color="#7A1F2B" />
          </div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#1a1a1a', margin: '0 0 8px' }}>
            {dashboard.course?.title}
          </h1>
          <p style={{ color: '#888', fontSize: '0.9rem', margin: '0 0 24px' }}>
            Enroll to access the learning content.
          </p>
          <p style={{ fontSize: '1.8rem', fontWeight: 900, color: '#1a1a1a', margin: '0 0 24px' }}>
            {dashboard.course?.priceInr ? `₹${Math.round(dashboard.course.priceInr / 100).toLocaleString('en-IN')}` : 'Free'}
          </p>
          <a
            href={`/courses/${dashboard.course?.slug || courseId}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '0.85rem 2rem',
              background: 'linear-gradient(135deg, #7A1F2B, #922538)',
              color: '#fff',
              borderRadius: 14,
              fontWeight: 700,
              textDecoration: 'none',
              fontSize: '0.9rem',
              boxShadow: '0 6px 20px rgba(122,31,43,0.25)',
            }}
          >
            View Course & Enroll <ArrowRight size={16} color="#fff" />
          </a>
        </motion.div>
      </div>
    );

  /* ═══════ PRE-START ═══════ */
  if (dashboard.state === 'pre_start') {
    const startDate = dashboard.course?.startDate ? new Date(dashboard.course.startDate) : null;
    const preMods = (dashboard.course?.modules || []).map((m, i) => ({
      ...m,
      isUnlocked: false,
      lessons: [],
      progress: 0,
      moduleNumber: m.moduleNumber || i + 1,
    }));
    return (
      <div
        style={{
          display: 'flex',
          minHeight: '100vh',
          background: '#faf8f5',
          fontFamily: "'Inter',system-ui,sans-serif",
        }}
      >
        <style dangerouslySetInnerHTML={{ __html: pageStyles }} />
        <aside
          className="learn-sidebar"
          style={{
            width: 320,
            background: '#fff',
            borderRight: '1px solid #f0e8e0',
            flexShrink: 0,
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform 0.3s',
            boxShadow: '2px 0 12px rgba(0,0,0,0.02)',
          }}
        >
          {renderSidebar(preMods, 0, true)}
        </aside>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div
            style={{
              background: '#fff',
              borderBottom: '1px solid #f0e8e0',
              padding: '0.75rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              position: 'sticky',
              top: 0,
              zIndex: 20,
            }}
          >
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
            >
              <MenuIcon size={20} color="#888" />
            </button>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#555' }}>
              Course Preview
            </span>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
            <div style={{ maxWidth: 780, margin: '0 auto' }}>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  background: 'linear-gradient(135deg, #7A1F2B, #922538)',
                  borderRadius: 20,
                  padding: '2rem 2.25rem',
                  marginBottom: 24,
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: -30,
                    right: -30,
                    width: 150,
                    height: 150,
                    background:
                      'radial-gradient(circle, rgba(197,151,91,0.25) 0%, transparent 70%)',
                    filter: 'blur(30px)',
                  }}
                />
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <h1
                    style={{
                      fontSize: '1.6rem',
                      fontWeight: 900,
                      color: '#fff',
                      margin: '0 0 8px',
                    }}
                  >
                    Welcome! You&apos;re Enrolled
                  </h1>
                  <p
                    style={{
                      color: 'rgba(255,255,255,0.75)',
                      fontSize: '0.9rem',
                      margin: '0 0 20px',
                      lineHeight: 1.6,
                    }}
                  >
                    {dashboard.course?.preStartMessage || 'The course will begin shortly.'}
                  </p>
                  {startDate && (
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 10,
                        background: 'rgba(255,255,255,0.1)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        borderRadius: 14,
                        padding: '0.7rem 1.2rem',
                        backdropFilter: 'blur(8px)',
                      }}
                    >
                      <svg
                        width="18"
                        height="18"
                        fill="none"
                        stroke="#C5975B"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      <div>
                        <p
                          style={{
                            fontSize: '0.6rem',
                            color: 'rgba(255,255,255,0.5)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                            fontWeight: 700,
                            margin: 0,
                          }}
                        >
                          Starts on
                        </p>
                        <p
                          style={{ color: '#fff', fontWeight: 800, fontSize: '0.88rem', margin: 0 }}
                        >
                          {startDate.toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* How it works */}
              <div
                style={{
                  background: '#fff',
                  border: '1px solid #f0e8e0',
                  borderRadius: 18,
                  padding: '1.75rem',
                  marginBottom: 24,
                }}
              >
                <h3
                  style={{
                    fontSize: '1rem',
                    fontWeight: 800,
                    color: '#1a1a1a',
                    margin: '0 0 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <ShieldIcon size={18} color="#7A1F2B" /> How This Course Works
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {[
                    {
                      t: 'Sequential Learning',
                      d: 'Complete each lesson in order',
                      ic: <ArrowRight size={14} color="#7A1F2B" />,
                    },
                    {
                      t: 'Watch 90% Video',
                      d: 'Must watch 90% of video duration',
                      ic: <PlayIcon size={14} color="#7A1F2B" />,
                    },
                    {
                      t: 'Time Required',
                      d: 'Spend 90% of required time on readings',
                      ic: <ClockIcon size={14} color="#7A1F2B" />,
                    },
                    {
                      t: 'Quiz Gate (75%)',
                      d: 'Score 75%+ on quiz to unlock next module',
                      ic: <LessonIcon type="quiz" size={14} color="#7A1F2B" />,
                    },
                  ].map((r, i) => (
                    <div
                      key={i}
                      style={{
                        background: '#faf8f5',
                        borderRadius: 14,
                        padding: '1rem',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 10,
                      }}
                    >
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 8,
                          background: '#fdf2f4',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {r.ic}
                      </div>
                      <div>
                        <p
                          style={{
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            color: '#333',
                            margin: '0 0 3px',
                          }}
                        >
                          {r.t}
                        </p>
                        <p
                          style={{ fontSize: '0.72rem', color: '#999', margin: 0, lineHeight: 1.5 }}
                        >
                          {r.d}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: 12,
                  marginBottom: 24,
                }}
              >
                {[
                  {
                    label: 'Modules',
                    value: dashboard.course?.totalModules || preMods.length,
                    color: '#7A1F2B',
                    bg: '#fdf2f4',
                  },
                  {
                    label: 'Duration',
                    value: `${dashboard.course?.durationWeeks || 0} wk`,
                    color: '#059669',
                    bg: '#ecfdf5',
                  },
                  {
                    label: 'Level',
                    value: dashboard.course?.difficultyLevel || 'Beginner',
                    color: '#d97706',
                    bg: '#fffbeb',
                  },
                  {
                    label: 'Language',
                    value: dashboard.course?.language || 'English',
                    color: '#7c3aed',
                    bg: '#f5f3ff',
                  },
                ].map((s, i) => (
                  <div
                    key={i}
                    style={{
                      background: '#fff',
                      border: '1px solid #f0e8e0',
                      borderRadius: 16,
                      padding: '1.15rem',
                      textAlign: 'center',
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: s.bg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 8px',
                      }}
                    >
                      <span style={{ fontSize: '0.82rem', fontWeight: 900, color: s.color }}>
                        {typeof s.value === 'number' ? s.value : s.value.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <p
                      style={{
                        fontSize: '0.85rem',
                        fontWeight: 800,
                        color: '#333',
                        margin: '0 0 2px',
                        textTransform: 'capitalize',
                      }}
                    >
                      {s.value}
                    </p>
                    <p style={{ fontSize: '0.65rem', color: '#aaa', margin: 0, fontWeight: 600 }}>
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>

              {dashboard.course?.description && (
                <div
                  style={{
                    background: '#fff',
                    border: '1px solid #f0e8e0',
                    borderRadius: 18,
                    padding: '1.75rem',
                    marginBottom: 24,
                  }}
                >
                  <h3
                    style={{
                      fontSize: '1rem',
                      fontWeight: 800,
                      color: '#1a1a1a',
                      margin: '0 0 12px',
                    }}
                  >
                    About This Course
                  </h3>
                  <p
                    style={{
                      color: '#666',
                      fontSize: '0.9rem',
                      lineHeight: 1.7,
                      margin: 0,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {dashboard.course.description}
                  </p>
                </div>
              )}
              <div style={{ textAlign: 'center', paddingTop: 8 }}>
                <Link
                  href="/dashboard/my-courses"
                  style={{
                    color: '#7A1F2B',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <ChevronLeft size={14} color="#7A1F2B" /> Back to My Courses
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ═══════ ACTIVE LEARNING ═══════ */
  const { modules = [], progress = {} } = dashboard;
  const overallProgress = progress.percentage || 0;
  const currentModule =
    modules.find(m => m._id === selectedModule) || modules.find(m => m.isUnlocked) || modules[0];

  const allLessons = getAllLessonsFlat(modules);
  const curIdx = allLessons.findIndex(l => String(l._id) === String(activeLesson));
  const hasPrev = curIdx > 0 || (curIdx === -1 && selectedModule && allLessons.length > 0);
  const hasNext =
    (curIdx >= 0 && curIdx < allLessons.length - 1 && !allLessons[curIdx + 1]?.isLocked) ||
    (curIdx === -1 && selectedModule && allLessons.length > 0);

  const reqSec = lessonDetail ? (lessonDetail.durationMinutes || 0) * 60 : 0;
  const timerPct = reqSec > 0 ? Math.min((timeSpent / Math.ceil(reqSec * 0.9)) * 100, 100) : 100;
  const isVideoLesson = lessonDetail?.contentType === 'video' || !!lessonDetail?.videoUrl;

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: '#ffffff',
        fontFamily: "'Inter',system-ui,sans-serif",
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: pageStyles }} />
      {/* Mobile-only overlay: remove blur as requested */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.05)', zIndex: 30 }}
        />
      )}

      <aside
        className="learn-sidebar"
        style={{
          width: 360,
          background: '#fff',
          borderRight: '1px solid #f5f0eb',
          flexShrink: 0,
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          position: 'sticky',
          top: 0,
          zIndex: 35,
          boxShadow: '4px 0 24px rgba(0,0,0,0.02)',
          overflowY: 'auto',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          marginLeft: sidebarOpen ? 0 : -360,
          opacity: sidebarOpen ? 1 : 0
        }}
      >
        {renderSidebar(modules, overallProgress)}
      </aside>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: '#fafafa' }}>
        {/* Top bar */}
        <div
          style={{
            background: 'rgba(255,255,255,0.8)',
            backdropFilter: 'blur(30px)',
            borderBottom: '1px solid rgba(0,0,0,0.04)',
            padding: '1.25rem 3rem',
            display: 'flex',
            alignItems: 'center',
            gap: 20,
            position: 'sticky',
            top: 0,
            zIndex: 40,
            boxShadow: '0 4px 30px rgba(0,0,0,0.02)',
          }}
        >
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              background: '#f8f8f8',
              border: '1px solid #eee',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
            }}
          >
            <MenuIcon size={18} color="#555" />
          </button>
          
          <div style={{ height: '24px', width: '1px', background: '#eee', margin: '0 4px' }} />

          {lessonDetail ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '10px',
                  background: 'rgba(122,31,43,0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <LessonIcon type={lessonDetail.contentType} size={16} color="#7A1F2B" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#C5975B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Current Lesson
                </span>
                <span
                  style={{
                    fontSize: '0.95rem',
                    fontWeight: 800,
                    color: '#111',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {lessonDetail.title}
                </span>
              </div>

              {lessonDetail.isCompleted && (
                <span
                  style={{
                    marginLeft: 'auto',
                    fontSize: '0.7rem',
                    fontWeight: 900,
                    background: '#ecfdf5',
                    color: '#059669',
                    padding: '6px 14px',
                    borderRadius: 10,
                    flexShrink: 0,
                    textTransform: 'uppercase',
                    letterSpacing: '0.02em',
                  }}
                >
                  SUCCESSFULLY COMPLETED
                </span>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Course Curriculum
              </span>
              <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#111' }}>
                {currentModule?.title || 'Knowledge Repository'}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '3rem 4rem' }}>
          {lessonLoading ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '60vh',
                gap: 16,
              }}
            >
              <div style={{ position: 'relative', width: 40, height: 40 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    border: '3px solid #f0e8e0',
                    borderRadius: '50%',
                    position: 'absolute',
                  }}
                />
                <div
                  style={{
                    width: 40,
                    height: 40,
                    border: '3px solid transparent',
                    borderTopColor: '#7A1F2B',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                    position: 'absolute',
                  }}
                />
              </div>
              <p style={{ color: '#888', fontSize: '0.85rem', fontWeight: 600 }}>
                Loading lesson...
              </p>
            </div>
          ) : lessonDetail ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ maxWidth: 1280, margin: '0 auto' }}
            >
              {/* Video */}
              {lessonDetail.videoUrl ? (
                <div className="video-container">
                  <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', background: 'linear-gradient(180deg, rgba(0,0,0,0.4) 0%, transparent 20%, transparent 80%, rgba(0,0,0,0.6) 100%)', zIndex: 1 }} />
                  <video
                    ref={videoRef}
                    src={lessonDetail.videoUrl}
                    controls
                    onTimeUpdate={handleVideoTimeUpdate}
                    onLoadedMetadata={handleVideoLoadedMetadata}
                    onEnded={handleVideoEnded}
                    style={{ width: '100%', display: 'block', position: 'relative', zIndex: 0 }}
                    controlsList="nodownload"
                  />
                  {/* Premium overlay for video when paused or loading */}
                  <div style={{ position: 'absolute', bottom: 20, right: 24, zIndex: 2, background: 'rgba(122,31,43,0.9)', padding: '6px 12px', borderRadius: '8px', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#fff', letterSpacing: '0.05em' }}>PROPRIETARY CONTENT</span>
                  </div>
                </div>
              ) : lessonDetail.readingContent ? (
                <div
                  style={{
                    background: '#fff',
                    border: '1px solid #f0e8e0',
                    borderRadius: 20,
                    padding: '2.5rem',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        color: '#7A1F2B',
                        background: '#fdf2f4',
                        padding: '3px 10px',
                        borderRadius: 6,
                        textTransform: 'capitalize',
                      }}
                    >
                      {(lessonDetail.contentType || 'reading').replace('_', ' ')}
                    </span>
                    {lessonDetail.durationMinutes > 0 && (
                      <span style={{ fontSize: '0.68rem', color: '#aaa' }}>
                        {lessonDetail.durationMinutes} min read
                      </span>
                    )}
                  </div>
                  <h2
                    style={{
                      fontSize: '1.4rem',
                      fontWeight: 900,
                      color: '#1a1a1a',
                      margin: '0 0 24px',
                      lineHeight: 1.3,
                    }}
                  >
                    {lessonDetail.title}
                  </h2>
                  <div
                    style={{
                      color: '#555',
                      lineHeight: 1.8,
                      fontSize: '0.95rem',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {lessonDetail.readingContent}
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    background: '#fff',
                    border: '1px solid #f0e8e0',
                    borderRadius: 20,
                    padding: '3rem',
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 18,
                      background: '#f5f0eb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 16px',
                    }}
                  >
                    <LessonIcon type="reading" size={28} color="#ccc" />
                  </div>
                  <p style={{ color: '#999', fontWeight: 600 }}>
                    No content available for this lesson yet.
                  </p>
                </div>
              )}

              {lessonDetail.attachments?.length ? (
                <div
                  style={{
                    marginTop: 20,
                    background: '#fff',
                    border: '1px solid #f0e8e0',
                    borderRadius: 16,
                    padding: '1.25rem 1.5rem',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                      marginBottom: 12,
                      flexWrap: 'wrap',
                    }}
                  >
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#1a1a1a' }}>
                      Lesson Resources
                    </h3>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
                      {lessonDetail.attachments.length} file
                      {lessonDetail.attachments.length > 1 ? 's' : ''}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gap: 10 }}>
                    {lessonDetail.attachments.map(attachment => (
                      <a
                        key={attachment.key || attachment.fileUrl}
                        href={attachment.downloadUrl || attachment.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          gap: 12,
                          alignItems: 'center',
                          padding: '12px 14px',
                          borderRadius: 12,
                          border: '1px solid #f1e6db',
                          background: '#fdfaf7',
                          textDecoration: 'none',
                        }}
                      >
                        <div>
                          <div
                            style={{
                              color: '#1f2937',
                              fontSize: '0.88rem',
                              fontWeight: 700,
                              marginBottom: 4,
                            }}
                          >
                            {attachment.label || 'Download resource'}
                          </div>
                          <div style={{ color: '#7c6f64', fontSize: '0.75rem' }}>
                            {attachment.fileType || 'application/octet-stream'} •{' '}
                            {formatFileSize(attachment.size)}
                          </div>
                        </div>
                        <span style={{ color: '#7A1F2B', fontSize: '0.8rem', fontWeight: 800 }}>
                          Open
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Description */}
              {lessonDetail.description && (
                <div
                  style={{
                    marginTop: 20,
                    background: '#fff',
                    border: '1px solid #f0e8e0',
                    borderRadius: 14,
                    padding: '1.25rem 1.5rem',
                  }}
                >
                  <p style={{ color: '#777', fontSize: '0.9rem', lineHeight: 1.7, margin: 0 }}>
                    {lessonDetail.description}
                  </p>
                </div>
              )}

              {/* Completed badge */}
              {lessonDetail.isCompleted && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{
                    marginTop: 20,
                    background: '#ecfdf5',
                    border: '1px solid #bbf7d0',
                    borderRadius: 14,
                    padding: '1rem 1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: '#059669',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <CheckIcon size={18} color="#fff" />
                  </div>
                  <div>
                    <p
                      style={{ fontSize: '0.88rem', fontWeight: 700, color: '#059669', margin: 0 }}
                    >
                      Lesson Completed
                    </p>
                    <p style={{ fontSize: '0.72rem', color: '#065f46', margin: '2px 0 0' }}>
                      {lessonDetail.completedAt
                        ? `Completed ${new Date(lessonDetail.completedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`
                        : 'Great progress!'}
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Strategic Notes & Bookmarks Section */}
              <div
                style={{
                  marginTop: 32,
                  background: '#fff',
                  border: '1px solid #f0e8e0',
                  borderRadius: 24,
                  overflow: 'hidden',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.02)',
                }}
              >
                <button
                  onClick={() => setIsNotesExpanded(!isNotesExpanded)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1.25rem 1.5rem',
                    background: '#fff',
                    border: 'none',
                    cursor: 'pointer',
                    borderBottom: isNotesExpanded ? '1px solid #f8f8f8' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(197,151,91,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <BookmarkIcon size={16} color="#C5975B" />
                    </div>
                    <span style={{ fontSize: '1rem', fontWeight: 800, color: '#111', letterSpacing: '-0.01em' }}>Strategic Insight Repository</span>
                    <span style={{ fontSize: '0.7rem', fontWeight: 800, background: '#f5f0eb', color: '#888', padding: '2px 8px', borderRadius: 6 }}>{notes.length}</span>
                  </div>
                  <ChevronDown size={18} color="#ccc" style={{ transform: isNotesExpanded ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.3s' }} />
                </button>

                <AnimatePresence>
                  {isNotesExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div style={{ padding: '1.5rem' }}>
                        {/* Note Input */}
                        <div style={{ position: 'relative', marginBottom: 24 }}>
                          <textarea
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            placeholder="Capture a strategic insight or high-signal observation..."
                            style={{
                              width: '100%',
                              minHeight: 100,
                              padding: '1rem 1.25rem',
                              borderRadius: 16,
                              border: '1px solid #eee',
                              background: '#fafafa',
                              fontSize: '0.9rem',
                              fontFamily: 'inherit',
                              resize: 'vertical',
                              outline: 'none',
                              transition: 'all 0.2s',
                              color: '#333',
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#C5975B'}
                            onBlur={(e) => e.target.style.borderColor = '#eee'}
                          />
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                            <div style={{ fontSize: '0.75rem', color: '#999', display: 'flex', alignItems: 'center', gap: 6 }}>
                              <ClockIcon size={14} color="#ccc" />
                              {videoRef.current ? (
                                <span>Insight at {fmt(Math.floor(videoRef.current.currentTime))}</span>
                              ) : (
                                <span>General lesson insight</span>
                              )}
                            </div>
                            <button
                              onClick={saveNote}
                              disabled={!noteText.trim() || noteLoading}
                              className="btn-premium"
                              style={{ padding: '0.6rem 1.5rem', fontSize: '0.82rem' }}
                            >
                              {noteLoading ? 'Capturing...' : 'Capture Insight'}
                            </button>
                          </div>
                        </div>

                        {/* Notes List */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          {notes.length > 0 ? (
                            notes.map((note) => (
                              <div
                                key={note._id}
                                style={{
                                  padding: '1.25rem',
                                  background: '#fff',
                                  border: '1px solid #f0f0f0',
                                  borderRadius: 16,
                                  position: 'relative',
                                  transition: 'all 0.2s',
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    {note.timestamp !== null && (
                                      <button
                                        onClick={() => {
                                          if (videoRef.current) {
                                            videoRef.current.currentTime = note.timestamp;
                                            videoRef.current.play();
                                          }
                                        }}
                                        style={{
                                          background: 'rgba(122,31,43,0.08)',
                                          color: '#7A1F2B',
                                          border: 'none',
                                          padding: '4px 10px',
                                          borderRadius: 8,
                                          fontSize: '0.75rem',
                                          fontWeight: 800,
                                          cursor: 'pointer',
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: 6,
                                        }}
                                      >
                                        <PlayIcon size={12} color="#7A1F2B" /> {fmt(note.timestamp)}
                                      </button>
                                    )}
                                    <span style={{ fontSize: '0.7rem', color: '#aaa', fontWeight: 600 }}>
                                      {new Date(note.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                    </span>
                                  </div>
                                  <button
                                    onClick={() => deleteNote(note._id)}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#ddd', transition: 'color 0.2s' }}
                                    onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                                    onMouseLeave={(e) => e.currentTarget.style.color = '#ddd'}
                                  >
                                    <TrashIcon size={16} />
                                  </button>
                                </div>
                                <p style={{ fontSize: '0.92rem', color: '#444', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>
                                  {note.content}
                                </p>
                              </div>
                            ))
                          ) : (
                            <div style={{ textAlign: 'center', padding: '2rem 0', color: '#bbb', fontSize: '0.85rem', background: '#fafafa', borderRadius: 16, border: '1px dashed #eee' }}>
                              No strategic insights captured yet. Start typing above.
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Nav buttons */}
              <div style={{ marginTop: '4rem', padding: '2rem 0', borderTop: '1px solid #f0e8e0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
                <button
                  onClick={() => navigateLesson(-1)}
                  disabled={!hasPrev}
                  className="nav-btn-v2"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '1rem 2rem',
                    background: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '16px',
                    color: hasPrev ? '#1a1a1a' : '#cbd5e1',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    cursor: hasPrev ? 'pointer' : 'not-allowed',
                    transition: 'all 0.3s ease',
                    boxShadow: hasPrev ? '0 4px 12px rgba(0,0,0,0.05)' : 'none'
                  }}
                >
                  <ChevronLeft size={18} color={hasPrev ? '#1a1a1a' : '#cbd5e1'} /> Previous
                </button>

                <div style={{ height: 32, width: 1, background: '#e2e8f0' }} />

                <button
                  onClick={() => navigateLesson(1)}
                  disabled={!hasNext}
                  className="nav-btn-v2-primary"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '1rem 3rem',
                    background: hasNext && lessonDetail.isCompleted 
                      ? 'linear-gradient(135deg, #7A1F2B, #922538)' 
                      : hasNext ? '#1a1a1a' : '#f1f5f9',
                    border: 'none',
                    borderRadius: '16px',
                    color: hasNext ? '#fff' : '#94a3b8',
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    cursor: hasNext ? 'pointer' : 'not-allowed',
                    transition: 'all 0.3s ease',
                    boxShadow: hasNext ? '0 10px 25px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  {hasNext && lessonDetail.isCompleted ? 'Next Phase Objective' : 'Next Lesson'}
                  <ChevronRight size={18} color={hasNext ? '#fff' : '#94a3b8'} />
                </button>
              </div>
            </motion.div>
          ) : currentModule ? (
            <div style={{ maxWidth: 1100, margin: '0 auto' }}>
              {renderModuleDetail(currentModule)}
              
              {/* Universal Nav buttons for module overview */}
              <div style={{ marginTop: '4rem', padding: '2rem 0', borderTop: '1px solid #f0e8e0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
                <button
                  onClick={() => navigateLesson(-1)}
                  disabled={!hasPrev}
                  className="nav-btn-v2"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '1rem 2rem',
                    background: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '16px',
                    color: hasPrev ? '#1a1a1a' : '#cbd5e1',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    cursor: hasPrev ? 'pointer' : 'not-allowed',
                    transition: 'all 0.3s ease',
                    boxShadow: hasPrev ? '0 4px 12px rgba(0,0,0,0.05)' : 'none'
                  }}
                >
                  <ChevronLeft size={18} color={hasPrev ? '#1a1a1a' : '#cbd5e1'} /> Previous
                </button>

                <div style={{ height: 32, width: 1, background: '#e2e8f0' }} />

                <button
                  onClick={() => navigateLesson(1)}
                  disabled={!hasNext}
                  className="nav-btn-v2-primary"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '1rem 3rem',
                    background: hasNext ? '#1a1a1a' : '#f1f5f9',
                    border: 'none',
                    borderRadius: '16px',
                    color: hasNext ? '#fff' : '#94a3b8',
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    cursor: hasNext ? 'pointer' : 'not-allowed',
                    transition: 'all 0.3s ease',
                    boxShadow: hasNext ? '0 10px 25px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  Start Phase Lesson
                  <ChevronRight size={18} color={hasNext ? '#fff' : '#94a3b8'} />
                </button>
              </div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '60vh',
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 18,
                  background: '#f5f0eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 20,
                }}
              >
                <LessonIcon type="reading" size={28} color="#ccc" />
              </div>
              <p style={{ color: '#555', fontSize: '1rem', fontWeight: 700, margin: '0 0 4px' }}>
                Select a module to explore
              </p>
              <p style={{ color: '#aaa', fontSize: '0.85rem' }}>
                Click on a module in the sidebar to see its details
              </p>
            </motion.div>
          )}
        </div>
      </div>

      {/* ═══════ QUIZ MODAL ═══════ */}
      <AnimatePresence>
        {showQuiz && quizData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setShowQuiz(null);
              setQuizData(null);
              setQuizResult(null);
            }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(122,31,43,0.15)',
              backdropFilter: 'blur(12px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 100,
              padding: 20,
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              style={{
                background: '#fff',
                border: '1px solid rgba(0,0,0,0.05)',
                borderRadius: 32,
                padding: '2.5rem',
                maxWidth: 600,
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 30px 70px rgba(122,31,43,0.2)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 24,
                }}
              >
                <div>
                  <p
                    style={{
                      fontSize: '0.7rem',
                      color: '#C5975B',
                      fontWeight: 900,
                      textTransform: 'uppercase',
                      letterSpacing: '0.15em',
                      margin: '0 0 6px',
                    }}
                  >
                    EXAMINATION PHASE
                  </p>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#111', margin: 0, letterSpacing: '-0.02em' }}>
                    {quizData.title || 'Knowledge Assessment'}
                  </h2>
                </div>
                <button
                  onClick={() => {
                    setShowQuiz(null);
                    setQuizData(null);
                    setQuizResult(null);
                  }}
                  style={{
                    background: '#f8f8f8',
                    border: '1px solid #eee',
                    padding: 10,
                    borderRadius: 12,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s',
                  }}
                >
                  <XIcon size={20} color="#888" />
                </button>
              </div>

              {quizResult ? (
                <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                  <div
                    style={{
                      width: 100,
                      height: 100,
                      borderRadius: '30px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 24px',
                      background: quizResult.passed ? 'rgba(5,150,105,0.1)' : 'rgba(239,68,68,0.1)',
                      boxShadow: quizResult.passed ? '0 10px 20px rgba(5,150,105,0.1)' : '0 10px 20px rgba(239,68,68,0.1)',
                    }}
                  >
                    {quizResult.passed ? (
                      <TrophyIcon size={48} color="#059669" />
                    ) : (
                      <svg width="48" height="48" fill="none" stroke="#ef4444" strokeWidth="2.5" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="15" y1="9" x2="9" y2="15" />
                        <line x1="9" y1="9" x2="15" y2="15" />
                      </svg>
                    )}
                  </div>
                  <h3
                    style={{
                      fontSize: '1.8rem',
                      fontWeight: 900,
                      color: quizResult.passed ? '#059669' : '#ef4444',
                      margin: '0 0 12px',
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {quizResult.passed ? 'ASSESSMENT PASSED' : 'ASSESSMENT FAILED'}
                  </h3>
                  <div style={{ background: '#fafafa', borderRadius: '20px', padding: '20px', border: '1px solid #f0f0f0', marginBottom: 24 }}>
                    <p style={{ fontSize: '1.2rem', fontWeight: 900, color: '#111', margin: '0 0 4px' }}>
                      Mastery Score: {quizResult.percentage}%
                    </p>
                    <p style={{ color: '#888', fontSize: '0.85rem', fontWeight: 600, margin: 0 }}>
                      Correct Responses: {quizResult.score} / {quizResult.totalQuestions}
                    </p>
                  </div>

                  {quizResult.passed ? (
                    <button
                      onClick={() => {
                        setShowQuiz(null);
                        setQuizData(null);
                        setQuizResult(null);
                      }}
                      className="btn-premium"
                      style={{ width: '100%', padding: '1.1rem' }}
                    >
                      CONTINUE TO NEXT MODULE
                    </button>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <p style={{ fontSize: '0.85rem', color: '#ef4444', fontWeight: 700 }}>
                         REQUIRED PROFICIENCY: 75%
                      </p>
                      <button
                        onClick={() => {
                          setQuizResult(null);
                          setQuizAnswers({});
                        }}
                        className="btn-premium"
                        style={{ width: '100%', padding: '1.1rem' }}
                      >
                        RETRY ASSESSMENT
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div
                    style={{
                      background: 'rgba(122,31,43,0.04)',
                      border: '1px solid rgba(122,31,43,0.1)',
                      borderRadius: 16,
                      padding: '1.25rem',
                      marginBottom: 24,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16,
                    }}
                  >
                    <div style={{ width: 36, height: 36, borderRadius: 12, background: '#7A1F2B', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <ShieldIcon size={18} color="#fff" />
                    </div>
                    <div>
                      <p style={{ fontSize: '0.85rem', fontWeight: 900, color: '#7A1F2B', margin: 0 }}>
                        75% ACCURACY REQUIRED
                      </p>
                      <p style={{ fontSize: '0.7rem', color: '#666', margin: '2px 0 0', fontWeight: 500 }}>
                        All questions must be answered to complete the phase.
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {quizData.questions?.map((q, qi) => (
                      <div
                        key={qi}
                        style={{
                          paddingBottom: 24,
                          borderBottom: qi === quizData.questions.length - 1 ? 'none' : '1px solid #f0f0f0',
                        }}
                      >
                        <p
                          style={{
                            fontWeight: 900,
                            color: '#111',
                            fontSize: '1rem',
                            margin: '0 0 20px',
                            lineHeight: 1.4,
                            letterSpacing: '-0.02em',
                          }}
                        >
                          <span style={{ color: '#7A1F2B', marginRight: 12 }}>{qi + 1}.</span>
                          {q.question}
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          {q.options?.map((opt, oi) => (
                            <button
                              key={oi}
                              className={`quiz-opt ${quizAnswers[qi] === oi ? 'quiz-opt-selected' : ''}`}
                              onClick={() => setQuizAnswers(prev => ({ ...prev, [qi]: oi }))}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 14,
                                padding: '1.1rem 1.5rem',
                                borderRadius: 16,
                                border: '1px solid #eee',
                                background: '#fff',
                                cursor: 'pointer',
                                textAlign: 'left',
                                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                                fontSize: '0.95rem',
                                color: '#444',
                                fontWeight: quizAnswers[qi] === oi ? 800 : 500,
                              }}
                            >
                              <div
                                style={{
                                  width: 20,
                                  height: 20,
                                  borderRadius: '50%',
                                  border: quizAnswers[qi] === oi ? '2px solid #7A1F2B' : '2px solid #ddd',
                                  background: quizAnswers[qi] === oi ? '#7A1F2B' : 'transparent',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0,
                                }}
                              >
                                {quizAnswers[qi] === oi && (
                                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />
                                )}
                              </div>
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={submitQuiz}
                    disabled={quizLoading}
                    className="btn-premium"
                    style={{
                      width: '100%',
                      padding: '1.25rem',
                      fontSize: '1.1rem',
                      letterSpacing: '0.05em',
                      marginTop: 12,
                    }}
                  >
                    {quizLoading ? 'VALIDATING RESPONSES...' : 'SUBMIT ASSESSMENT'}
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
