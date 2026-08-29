'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api';
import UploadProgressPanel from '@/components/admin/UploadProgressPanel';
import { deleteUploadedFile, resolveUploadFolder, useS3DirectUpload } from '@/lib/s3Upload';

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [editCourse, setEditCourse] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [builderCourse, setBuilderCourse] = useState(null);
  const [form, setForm] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: 20 });
    if (search) params.set('search', search);
    if (statusFilter) params.set('status', statusFilter);
    const { data } = await apiGet(`/api/v1/admin/courses?${params}`);
    if (data) {
      setCourses(data.courses || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    }
    setLoading(false);
  }, [page, search, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const handleTogglePublish = async course => {
    const action = course.isPublished ? 'unpublish' : 'publish';
    if (!confirm(`Are you sure you want to ${action} "${course.title}"?`)) return;
    await apiPatch(`/api/v1/admin/courses/${course._id}`, { isPublished: !course.isPublished });
    load();
  };

  const handleDelete = async id => {
    if (!confirm('Delete this course and all its modules/lessons permanently?')) return;
    await apiDelete(`/api/v1/admin/courses/${id}`);
    load();
  };

  const handleEdit = course => {
    setEditCourse(course);
    setForm({
      title: course.title,
      subtitle: course.subtitle || '',
      description: course.description || '',
      // DB stores paise - show rupees in the form
      priceInr: course.priceInr ? course.priceInr / 100 : 0,
      originalPriceInr: course.originalPriceInr ? course.originalPriceInr / 100 : 0,
      category: course.category || '',
      level: course.level || '',
      difficultyLevel: course.difficultyLevel || 'beginner',
      durationWeeks: course.durationWeeks || 0,
      startDate: course.startDate ? course.startDate.slice(0, 10) : '',
      endDate: course.endDate ? course.endDate.slice(0, 10) : '',
      preStartMessage: course.preStartMessage || '',
      enrollmentStatus: course.enrollmentStatus || 'open',
      thumbnailUrl: course.thumbnailUrl || '',
    });
  };

  // Convert rupees → paise before sending to the backend
  function toPaise(rupees) {
    return Math.round(Number(rupees || 0) * 100);
  }

  const handleSave = async () => {
    if (!editCourse) return;
    if (!confirm(`Save changes to "${editCourse.title}"?`)) return;
    const payload = { ...form };
    // Convert rupees → paise before saving
    payload.priceInr = toPaise(form.priceInr);
    payload.originalPriceInr = toPaise(form.originalPriceInr);
    if (payload.startDate) payload.startDate = new Date(payload.startDate).toISOString();
    else payload.startDate = null;
    if (payload.endDate) payload.endDate = new Date(payload.endDate).toISOString();
    else payload.endDate = null;
    await apiPatch(`/api/v1/admin/courses/${editCourse._id}`, payload);
    setEditCourse(null);
    load();
  };

  const handleCreate = async () => {
    if (!form.title) return alert('Course title is required.');
    if (!confirm(`Create new course "${form.title}"?`)) return;
    const payload = { ...form };
    // Convert rupees → paise before saving
    payload.priceInr = toPaise(form.priceInr);
    payload.originalPriceInr = toPaise(form.originalPriceInr);
    if (payload.startDate) payload.startDate = new Date(payload.startDate).toISOString();
    else payload.startDate = null;
    if (payload.endDate) payload.endDate = new Date(payload.endDate).toISOString();
    else payload.endDate = null;
    const { data, error } = await apiPost('/api/v1/admin/courses', payload);
    if (error) return alert(error.message);
    setShowCreate(false);
    setForm({});
    load();
  };

  // If builder is open, show full course builder
  if (builderCourse) {
    return (
      <CourseBuilder
        courseId={builderCourse._id}
        courseTitle={builderCourse.title}
        onBack={() => {
          setBuilderCourse(null);
          load();
        }}
      />
    );
  }

  const courseFormFields = (
    <>
      <div className="admin-form-group">
        <label>Title *</label>
        <input
          value={form.title || ''}
          onChange={e => setForm({ ...form, title: e.target.value })}
        />
      </div>
      <div className="admin-form-group">
        <label>Subtitle</label>
        <input
          value={form.subtitle || ''}
          onChange={e => setForm({ ...form, subtitle: e.target.value })}
        />
      </div>
      <div className="admin-form-group">
        <label>Description</label>
        <textarea
          rows={3}
          value={form.description || ''}
          onChange={e => setForm({ ...form, description: e.target.value })}
          style={{ width: '100%', resize: 'vertical' }}
        />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="admin-form-group">
          <label>Price (₹)</label>
          <input
            type="number"
            value={form.priceInr || 0}
            onChange={e => setForm({ ...form, priceInr: Number(e.target.value) })}
          />
        </div>
        <div className="admin-form-group">
          <label>Original Price (₹) - pre-discount</label>
          <input
            type="number"
            value={form.originalPriceInr || 0}
            onChange={e => setForm({ ...form, originalPriceInr: Number(e.target.value) })}
          />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="admin-form-group">
          <label>Category</label>
          <input
            value={form.category || ''}
            onChange={e => setForm({ ...form, category: e.target.value })}
          />
        </div>
        <div className="admin-form-group">
          <label>Difficulty</label>
          <select
            value={form.difficultyLevel || 'beginner'}
            onChange={e => setForm({ ...form, difficultyLevel: e.target.value })}
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="admin-form-group">
          <label>Duration (weeks)</label>
          <input
            type="number"
            value={form.durationWeeks || 0}
            onChange={e => setForm({ ...form, durationWeeks: Number(e.target.value) })}
          />
        </div>
        <div className="admin-form-group">
          <label>Enrollment Status</label>
          <select
            value={form.enrollmentStatus || 'open'}
            onChange={e => setForm({ ...form, enrollmentStatus: e.target.value })}
          >
            <option value="open">Open</option>
            <option value="closed">Closed</option>
            <option value="coming_soon">Coming Soon</option>
          </select>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="admin-form-group">
          <label>Cohort Start Date</label>
          <input
            type="date"
            value={form.startDate || ''}
            onChange={e => setForm({ ...form, startDate: e.target.value })}
          />
        </div>
        <div className="admin-form-group">
          <label>Cohort End Date</label>
          <input
            type="date"
            value={form.endDate || ''}
            onChange={e => setForm({ ...form, endDate: e.target.value })}
          />
        </div>
      </div>
      <div className="admin-form-group">
        <label>Pre-Start Welcome Message</label>
        <textarea
          rows={2}
          value={form.preStartMessage || ''}
          onChange={e => setForm({ ...form, preStartMessage: e.target.value })}
          style={{ width: '100%', resize: 'vertical' }}
        />
      </div>
      <div className="admin-form-group">
        <label>Thumbnail URL</label>
        <input
          value={form.thumbnailUrl || ''}
          onChange={e => setForm({ ...form, thumbnailUrl: e.target.value })}
        />
      </div>
    </>
  );

  return (
    <div className="admin-page">
      <div
        className="admin-topbar"
        style={{
          margin: '-28px -28px 24px',
          padding: '18px 28px',
          background: '#fff',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Course Management</h1>
          <span style={{ fontSize: 13, color: '#64748b' }}>{total} courses</span>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            setShowCreate(true);
            setForm({ difficultyLevel: 'beginner', enrollmentStatus: 'open' });
          }}
        >
          + Create Course
        </button>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search courses..."
          value={search}
          onChange={e => {
            setSearch(e.target.value);
            setPage(1);
          }}
          style={{
            padding: '8px 14px',
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            fontSize: 13,
            width: 280,
            outline: 'none',
          }}
        />
        <select
          value={statusFilter}
          onChange={e => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          style={{
            padding: '8px 14px',
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            fontSize: 13,
            outline: 'none',
          }}
        >
          <option value="">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      {loading ? (
        <div className="admin-loading">
          <div className="admin-spinner" />
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Price</th>
                <th>Cohort</th>
                <th>Status</th>
                <th>Enrolled</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses.map(c => (
                <tr key={c._id}>
                  <td style={{ fontWeight: 600, maxWidth: 220 }}>{c.title}</td>
                  <td style={{ color: '#64748b' }}>{c.category || '-'}</td>
                  <td style={{ fontWeight: 600 }}>
                    {c.priceInr ? `₹${(c.priceInr / 100).toLocaleString('en-IN')}` : 'Free'}
                  </td>
                  <td style={{ fontSize: 12, color: '#64748b' }}>
                    {c.startDate ? new Date(c.startDate).toLocaleDateString() : '-'}
                  </td>
                  <td>
                    <span className={`badge ${c.isPublished ? 'badge-green' : 'badge-yellow'}`}>
                      {c.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td>{c.enrolledCount || 0}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => setBuilderCourse(c)}
                      >
                        Builder
                      </button>
                      <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(c)}>
                        Edit
                      </button>
                      <button
                        className="btn btn-sm"
                        style={{
                          background: c.isPublished ? '#fef3c7' : '#d1fae5',
                          color: c.isPublished ? '#b45309' : '#059669',
                        }}
                        onClick={() => handleTogglePublish(c)}
                      >
                        {c.isPublished ? 'Unpublish' : 'Publish'}
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c._id)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {courses.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                    No courses found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {pages > 1 && (
            <div className="admin-pagination">
              <span>
                Page {page} of {pages}
              </span>
              <div className="pagination-btns">
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                  Previous
                </button>
                <button disabled={page >= pages} onClick={() => setPage(p => p + 1)}>
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Course Modal */}
      {showCreate && (
        <div className="admin-modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <div className="admin-modal-header">
              <h2>Create New Course</h2>
              <button className="admin-modal-close" onClick={() => setShowCreate(false)}>
                ✕
              </button>
            </div>
            <div className="admin-modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              {courseFormFields}
            </div>
            <div className="admin-modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleCreate} disabled={!form.title}>
                Create Course
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Course Modal */}
      {editCourse && (
        <div className="admin-modal-overlay" onClick={() => setEditCourse(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <div className="admin-modal-header">
              <h2>Edit Course</h2>
              <button className="admin-modal-close" onClick={() => setEditCourse(null)}>
                ✕
              </button>
            </div>
            <div className="admin-modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              {courseFormFields}
            </div>
            <div className="admin-modal-footer">
              <button className="btn btn-secondary" onClick={() => setEditCourse(null)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSave}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// COURSE BUILDER COMPONENT - Modules, Lessons, Quizzes, S3 Upload
// ──────────────────────────────────────────────────────────────────
function CourseBuilder({ courseId, courseTitle, onBack }) {
  const [modules, setModules] = useState([]);
  const [lessons, setLessons] = useState({});
  const [quizzes, setQuizzes] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeModule, setActiveModule] = useState(null);
  const [showModuleForm, setShowModuleForm] = useState(false);
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [showQuizForm, setShowQuizForm] = useState(false);
  const [editModule, setEditModule] = useState(null);
  const [editLesson, setEditLesson] = useState(null);
  const [moduleForm, setModuleForm] = useState({});
  const [lessonForm, setLessonForm] = useState({});
  const [quizForm, setQuizForm] = useState({
    title: 'Module Quiz',
    passingScore: 70,
    questions: [],
  });

  // Course Materials state
  const [materials, setMaterials] = useState([]);
  const [materialsLoading, setMaterialsLoading] = useState(false);

  // Course Exam state
  const [courseExam, setCourseExam] = useState(null);
  const [examLoading, setExamLoading] = useState(false);
  const [examSaving, setExamSaving] = useState(false);
  const [showExamForm, setShowExamForm] = useState(false);
  const [examForm, setExamForm] = useState({
    title: '', description: '', timeLimit: 60, passingScore: 60,
    maxAttempts: 1, violationLimit: 3, randomizeQuestions: false, status: 'draft',
  });
  const [examQuestions, setExamQuestions] = useState([]);

  const { uploadState, startUpload, retryUpload, resetUploadState } = useS3DirectUpload();

  const loadModules = useCallback(async () => {
    setLoading(true);
    const { data } = await apiGet(`/api/v1/admin/courses/${courseId}/modules`);
    const mods = data || [];
    setModules(mods);

    const lessonResponses = await Promise.all(
      mods.map(mod => apiGet(`/api/v1/admin/modules/${mod._id}/lessons`))
    );
    const quizResponses = await Promise.all(
      mods.map(mod => apiGet(`/api/v1/admin/modules/${mod._id}/quiz`))
    );

    const lessonMap = {};
    const quizMap = {};
    mods.forEach((mod, index) => {
      lessonMap[mod._id] = lessonResponses[index]?.data || [];
      quizMap[mod._id] = quizResponses[index]?.data || null;
    });

    setLessons(lessonMap);
    setQuizzes(quizMap);
    if (mods.length > 0) {
      setActiveModule(prev => prev || mods[0]);
    }
    setLoading(false);
  }, [courseId]);

  useEffect(() => {
    loadModules();
  }, [loadModules]);

  const loadMaterials = useCallback(async () => {
    setMaterialsLoading(true);
    const { data } = await apiGet(`/api/v1/admin/courses/${courseId}`);
    setMaterials(data?.materials || []);
    setMaterialsLoading(false);
  }, [courseId]);

  const loadCourseExam = useCallback(async () => {
    setExamLoading(true);
    const { data } = await apiGet(`/api/v1/assessments?type=exam&courseId=${courseId}`);
    const exams = Array.isArray(data) ? data : [];
    const exam = exams.find(e => String(e.courseId) === String(courseId) || e.courseId?._id === courseId) || exams[0] || null;
    setCourseExam(exam);
    if (exam) {
      setExamForm({
        title: exam.title || '',
        description: exam.description || '',
        timeLimit: exam.timeLimit || 60,
        passingScore: exam.passingScore || 60,
        maxAttempts: exam.maxAttempts || 1,
        violationLimit: exam.violationLimit || 3,
        randomizeQuestions: exam.randomizeQuestions || false,
        status: exam.status || 'draft',
      });
      setExamQuestions((exam.questions || []).map(q => ({
        ...q,
        options: (q.options || []).map(o => ({ ...o })),
      })));
    } else {
      setExamForm({ title: `${courseTitle} - Final Exam`, description: '', timeLimit: 60, passingScore: 60, maxAttempts: 1, violationLimit: 3, randomizeQuestions: false, status: 'draft' });
      setExamQuestions([]);
    }
    setExamLoading(false);
  }, [courseId, courseTitle]);

  const handleUploadMaterial = async (file) => {
    if (!file) return;
    if (!confirm(`Upload "${file.name}" as a course material?`)) return;
    try {
      const uploaded = await startUpload({
        file,
        folder: 'documents',
        courseId,
        label: 'course material',
        onUploaded: async (confirmedUpload) => {
          const { error } = await apiPost(`/api/v1/admin/courses/${courseId}/materials`, {
            title: file.name,
            fileUrl: confirmedUpload.fileUrl,
            fileKey: confirmedUpload.key,
            fileType: confirmedUpload.fileType || file.type,
            size: confirmedUpload.size || file.size,
          });
          if (error) throw new Error(error.message);
        },
      });
      await loadMaterials();
    } catch (err) {
      alert(`Upload failed: ${err.message}`);
    }
  };

  const handleDeleteMaterial = async (materialId) => {
    if (!confirm('Remove this material?')) return;
    const { error } = await apiDelete(`/api/v1/admin/courses/${courseId}/materials/${materialId}`);
    if (error) return alert(error.message);
    setMaterials(prev => prev.filter(m => m._id !== materialId));
  };

  const handleSaveExam = async () => {
    if (!examForm.title.trim()) return alert('Exam title is required.');
    if (examQuestions.length === 0) return alert('Add at least one question.');
    for (const [qi, q] of examQuestions.entries()) {
      if (!q.text?.trim()) { alert(`Question ${qi + 1} is missing text.`); return; }
      if (!q.options?.some(o => o.isCorrect)) { alert(`Question ${qi + 1} needs a correct answer.`); return; }
    }
    setExamSaving(true);
    const payload = {
      ...examForm, type: 'exam', courseId,
      questions: examQuestions.map(q => ({ ...q, options: q.options.filter(o => o.text?.trim()) })),
    };
    let err;
    if (courseExam) {
      ({ error: err } = await apiPatch(`/api/v1/assessments/${courseExam._id}`, payload));
    } else {
      ({ error: err } = await apiPost('/api/v1/assessments', payload));
    }
    setExamSaving(false);
    if (err) return alert(err.message || 'Failed to save exam');
    setShowExamForm(false);
    loadCourseExam();
  };

  const handleDeleteExam = async () => {
    if (!courseExam) return;
    if (!confirm('Delete the course exam permanently?')) return;
    await apiDelete(`/api/v1/assessments/${courseExam._id}`);
    setCourseExam(null);
    setExamQuestions([]);
  };

  // Exam question helpers
  const addExamQuestion = () => setExamQuestions(prev => [...prev, {
    text: '', type: 'mcq', points: 1, explanation: '',
    options: [{ text: '', isCorrect: false }, { text: '', isCorrect: false }, { text: '', isCorrect: false }, { text: '', isCorrect: false }],
  }]);

  const removeExamQuestion = (qi) => setExamQuestions(prev => prev.filter((_, i) => i !== qi));

  const updateExamQuestion = (qi, field, value) => setExamQuestions(prev =>
    prev.map((q, i) => i === qi ? { ...q, [field]: value } : q)
  );

  const updateExamOption = (qi, oi, field, value) => setExamQuestions(prev =>
    prev.map((q, i) => {
      if (i !== qi) return q;
      const opts = q.options.map((o, j) => {
        if (j !== oi) return field === 'isCorrect' && q.type === 'mcq' ? { ...o, isCorrect: false } : o;
        return { ...o, [field]: value };
      });
      return { ...q, options: opts };
    })
  );

  // ── Module CRUD ──
  const handleCreateModule = async () => {
    if (!moduleForm.title) return alert('Module title is required.');
    if (!confirm(`Create module "${moduleForm.title}"?`)) return;
    const { error } = await apiPost('/api/v1/admin/modules', { ...moduleForm, courseId });
    if (error) return alert(error.message);
    setShowModuleForm(false);
    setModuleForm({});
    loadModules();
  };

  const handleUpdateModule = async () => {
    if (!editModule) return;
    if (!confirm(`Save changes to module "${moduleForm.title || editModule.title}"?`)) return;
    await apiPatch(`/api/v1/admin/modules/${editModule._id}`, moduleForm);
    setEditModule(null);
    setModuleForm({});
    loadModules();
  };

  const handleDeleteModule = async id => {
    if (!confirm('Delete this module and all its lessons?')) return;
    await apiDelete(`/api/v1/admin/modules/${id}`);
    if (activeModule?._id === id) setActiveModule(null);
    loadModules();
  };

  const getVideoDuration = file =>
    new Promise((resolve, reject) => {
      if (!file) return resolve(0);
      const url = URL.createObjectURL(file);
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.src = url;
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(url);
        resolve(video.duration);
      };
      video.onerror = err => {
        URL.revokeObjectURL(url);
        reject(err);
      };
    });

  const formatDuration = seconds => {
    if (!seconds || Number.isNaN(Number(seconds))) return '';
    const totalSec = Math.round(seconds);
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins}m ${secs}s`;
  };

  const formatFileSize = bytes => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleVideoFileSelect = async file => {
    if (!file) return;
    try {
      const durationSec = await getVideoDuration(file);
      const durationMin = Math.ceil(durationSec / 60);
      setLessonForm(prev => ({
        ...prev,
        videoFile: file,
        videoFileName: file.name,
        videoDurationSeconds: Math.round(durationSec),
        durationMinutes: durationMin,
        contentType: 'video',
      }));
    } catch (err) {
      console.warn('Could not read video duration', err);
      setLessonForm(prev => ({
        ...prev,
        videoFile: file,
        videoFileName: file.name,
        contentType: 'video',
      }));
    }
  };

  // ── Lesson CRUD ──
  const handleCourseThumbnailUpload = async file => {
    if (!file) return;
    if (!confirm(`Upload image "${file.name}" as the course thumbnail?`)) return;

    try {
      await startUpload({
        file,
        folder: 'images',
        courseId,
        label: 'course thumbnail',
        onUploaded: async uploadedFile => {
          const { error } = await apiPatch(`/api/v1/admin/courses/${courseId}`, {
            thumbnailUrl: uploadedFile.fileUrl,
            thumbnailKey: uploadedFile.key,
          });

          if (error) {
            throw new Error(error.message);
          }
        },
      });

      await loadModules();
    } catch (err) {
      alert(`Thumbnail upload failed: ${err.message}`);
    }
  };

  const uploadLessonVideo = async ({ file, lessonId, moduleId }) => {
    const durationSec =
      lessonForm.videoDurationSeconds || Math.round((await getVideoDuration(file)) || 0);
    const durationMin = Math.ceil(durationSec / 60);

    const uploadedFile = await startUpload({
      file,
      folder: 'videos',
      courseId,
      moduleId,
      label: 'lesson video',
      onUploaded: async confirmedUpload => {
        const { error } = await apiPatch(`/api/v1/admin/lessons/${lessonId}`, {
          videoUrl: confirmedUpload.fileUrl,
          videoKey: confirmedUpload.key,
          videoDurationSeconds: durationSec,
          durationMinutes: durationMin,
        });

        if (error) {
          throw new Error(error.message);
        }
      },
    });

    setLessonForm(prev => ({
      ...prev,
      videoUrl: uploadedFile.fileUrl,
      videoKey: uploadedFile.key,
      videoDurationSeconds: durationSec,
      durationMinutes: durationMin,
    }));
  };

  const handleVideoUpload = async (file, lessonId, options = {}) => {
    if (!file) return;

    if (!options.skipConfirm && !confirm(`Upload video "${file.name}" to this lesson?`)) {
      return;
    }

    try {
      const targetModuleId = options.moduleId || activeModule?._id;
      await uploadLessonVideo({ file, lessonId, moduleId: targetModuleId });
      await loadModules();
    } catch (err) {
      alert(`Upload failed: ${err.message}`);
    }
  };

  const handleLessonResourceUpload = async (file, lesson) => {
    if (!file || !lesson) return;
    if (!confirm(`Upload "${file.name}" as a lesson resource?`)) return;

    const currentAttachments = Array.isArray(lesson.attachments) ? lesson.attachments : [];
    const folder = resolveUploadFolder(file);

    try {
      const uploadedFile = await startUpload({
        file,
        folder,
        courseId,
        moduleId: lesson.moduleId || activeModule?._id,
        label: 'lesson resource',
        onUploaded: async confirmedUpload => {
          const nextAttachments = [
            ...currentAttachments,
            {
              label: file.name,
              fileUrl: confirmedUpload.fileUrl,
              key: confirmedUpload.key,
              fileType: confirmedUpload.fileType,
              size: confirmedUpload.size,
            },
          ];

          const { error } = await apiPatch(`/api/v1/admin/lessons/${lesson._id}`, {
            attachments: nextAttachments,
          });

          if (error) {
            throw new Error(error.message);
          }
        },
      });

      if (editLesson?._id === lesson._id) {
        setLessonForm(prev => ({
          ...prev,
          attachments: [
            ...(Array.isArray(prev.attachments) ? prev.attachments : []),
            {
              label: file.name,
              fileUrl: uploadedFile.fileUrl,
              key: uploadedFile.key,
              fileType: uploadedFile.fileType,
              size: uploadedFile.size,
            },
          ],
        }));
      }

      await loadModules();
    } catch (err) {
      alert(`Resource upload failed: ${err.message}`);
    }
  };

  const removeAttachmentFromDraft = async attachment => {
    if (!attachment?.key) return;

    setLessonForm(prev => ({
      ...prev,
      attachments: (prev.attachments || []).filter(item => item.key !== attachment.key),
    }));

    if (!editLesson?._id) {
      try {
        await deleteUploadedFile({
          key: attachment.key,
          courseId,
          moduleId: activeModule?._id,
        });
      } catch (error) {
        console.warn('Could not delete unattached resource after removal', error);
      }
    }
  };

  const handleCreateLesson = async () => {
    if (!activeModule) return;
    if (!lessonForm.title) return alert('Lesson title is required.');
    if (!confirm(`Create lesson "${lessonForm.title}"?`)) return;

    const { videoFile, videoFileName, ...lessonData } = lessonForm;
    const payload = {
      ...lessonData,
      moduleId: activeModule._id,
      videoDurationSeconds: lessonForm.videoDurationSeconds || 0,
      durationMinutes: lessonForm.durationMinutes || 0,
      attachments: lessonForm.attachments || [],
    };

    const { data, error } = await apiPost('/api/v1/admin/lessons', payload);
    if (error) return alert(error.message);

    if (lessonForm.videoFile && data && data._id) {
      await handleVideoUpload(lessonForm.videoFile, data._id, {
        skipConfirm: true,
        moduleId: activeModule._id,
      });
    }

    setShowLessonForm(false);
    setLessonForm({});
    loadModules();
  };

  const handleUpdateLesson = async () => {
    if (!editLesson) return;
    if (!confirm(`Save changes to lesson "${lessonForm.title || editLesson.title}"?`)) return;

    if (lessonForm.videoFile) {
      await handleVideoUpload(lessonForm.videoFile, editLesson._id, {
        skipConfirm: true,
        moduleId: activeModule?._id,
      });
    }

    const { videoFile, videoFileName, ...lessonData } = lessonForm;
    const { error } = await apiPatch(`/api/v1/admin/lessons/${editLesson._id}`, {
      ...lessonData,
      videoDurationSeconds: lessonForm.videoDurationSeconds || 0,
      durationMinutes: lessonForm.durationMinutes || 0,
      attachments: lessonForm.attachments || [],
    });
    if (error) return alert(error.message);
    setEditLesson(null);
    setLessonForm({});
    loadModules();
  };

  const handleDeleteLesson = async id => {
    if (!confirm('Delete this lesson?')) return;
    await apiDelete(`/api/v1/admin/lessons/${id}`);
    loadModules();
  };

  // ── S3 Video Upload ──

  // ── Quiz CRUD ──
  const handleSaveQuiz = async () => {
    if (!activeModule) return;
    if (quizForm.questions.length === 0) return alert('Add at least one question.');
    if (!confirm(`Save quiz with ${quizForm.questions.length} question(s) for this module?`))
      return;
    const { error } = await apiPost('/api/v1/admin/quizzes', {
      moduleId: activeModule._id,
      ...quizForm,
    });
    if (error) return alert(error.message);
    setShowQuizForm(false);
    loadModules();
  };

  const handleDeleteQuiz = async moduleId => {
    if (!confirm('Delete this quiz?')) return;
    await apiDelete(`/api/v1/admin/modules/${moduleId}/quiz`);
    loadModules();
  };

  const addQuestion = () => {
    setQuizForm(prev => ({
      ...prev,
      questions: [...prev.questions, { question: '', options: ['', '', '', ''], correctOption: 0 }],
    }));
  };

  const updateQuestion = (qi, field, value) => {
    setQuizForm(prev => {
      const q = [...prev.questions];
      q[qi] = { ...q[qi], [field]: value };
      return { ...prev, questions: q };
    });
  };

  const updateOption = (qi, oi, value) => {
    setQuizForm(prev => {
      const q = [...prev.questions];
      const opts = [...q[qi].options];
      opts[oi] = value;
      q[qi] = { ...q[qi], options: opts };
      return { ...prev, questions: q };
    });
  };

  const removeQuestion = qi => {
    setQuizForm(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== qi),
    }));
  };

  if (loading)
    return (
      <div className="admin-loading">
        <div className="admin-spinner" />
      </div>
    );

  const activeLessons = activeModule ? lessons[activeModule._id] || [] : [];
  const activeQuiz = activeModule ? quizzes[activeModule._id] || null : null;

  return (
    <div className="admin-page">
      {/* Header */}
      <div
        style={{
          margin: '-28px -28px 24px',
          padding: '18px 28px',
          background: '#fff',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button className="btn btn-secondary btn-sm" onClick={onBack}>
            ← Back
          </button>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Course Builder</h1>
            <span style={{ fontSize: 13, color: '#64748b' }}>{courseTitle}</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button 
            className="btn btn-sm"
            onClick={() => { setActiveModule('MATERIALS'); loadMaterials(); }}
            style={{ 
              background: activeModule === 'MATERIALS' ? '#16a34a' : '#fff',
              color: activeModule === 'MATERIALS' ? '#fff' : '#475569',
              border: '1px solid #e2e8f0',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 14px'
            }}
          >
            📎 Materials
          </button>
          <button 
            className="btn btn-sm"
            onClick={() => { setActiveModule('EXAM'); loadCourseExam(); }}
            style={{ 
              background: activeModule === 'EXAM' ? '#ea580c' : '#fff',
              color: activeModule === 'EXAM' ? '#fff' : '#475569',
              border: '1px solid #e2e8f0',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 14px'
            }}
          >
            ⚡ Final Exam
          </button>
          <div style={{ width: 1, height: 24, background: '#e2e8f0', margin: '0 4px' }} />
          <label
            className="btn btn-secondary btn-sm"
            style={{ cursor: 'pointer', position: 'relative' }}
          >
            Upload Thumbnail
            <input
              type="file"
              accept="image/*"
              style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
              onChange={e => handleCourseThumbnailUpload(e.target.files?.[0])}
            />
          </label>
        </div>
      </div>

      <UploadProgressPanel
        uploadState={uploadState}
        onRetry={() => retryUpload().catch(err => alert(`Upload failed: ${err.message}`))}
        onDismiss={resetUploadState}
      />

      <div
        style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 24, minHeight: '60vh' }}
      >
        {/* Module Sidebar */}
        <div
          style={{
            background: '#fff',
            borderRadius: 12,
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '14px 16px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ fontWeight: 700, fontSize: 14 }}>Modules ({modules.length})</span>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => {
                setShowModuleForm(true);
                setModuleForm({});
              }}
            >
              + Add
            </button>
          </div>
          {modules.map((mod, i) => (
            <div
              key={mod._id}
              onClick={() => setActiveModule(mod)}
              style={{
                padding: '12px 16px',
                cursor: 'pointer',
                borderBottom: '1px solid #f1f5f9',
                background: activeModule?._id === mod._id ? '#eff6ff' : '#fff',
                borderLeft:
                  activeModule?._id === mod._id ? '3px solid #3b82f6' : '3px solid transparent',
              }}
            >
              <div style={{ fontWeight: 600, fontSize: 13, color: '#1e293b' }}>
                Week {mod.weekNumber}: {mod.title}
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                {(lessons[mod._id] || []).length} lessons {quizzes[mod._id] ? '• Quiz ✓' : ''}
                {mod.unlockAfterDays > 0 ? ` • Unlocks day ${mod.unlockAfterDays}` : ''}
              </div>
              <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                <button
                  className="btn btn-secondary"
                  style={{ padding: '2px 8px', fontSize: 11 }}
                  onClick={e => {
                    e.stopPropagation();
                    setEditModule(mod);
                    setModuleForm({
                      title: mod.title,
                      weekNumber: mod.weekNumber,
                      description: mod.description,
                      unlockAfterDays: mod.unlockAfterDays || 0,
                      durationHours: mod.durationHours || 0,
                    });
                  }}
                >
                  Edit
                </button>
                <button
                  className="btn btn-danger"
                  style={{ padding: '2px 8px', fontSize: 11 }}
                  onClick={e => {
                    e.stopPropagation();
                    handleDeleteModule(mod._id);
                  }}
                >
                  Del
                </button>
              </div>
            </div>
          ))}
          {modules.length === 0 && (
            <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
              No modules yet. Click + Add.
            </div>
          )}

        </div>

        {/* Main Content Area */}
        <div
          style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 24 }}
        >
          {activeModule === 'MATERIALS' ? (
            <MaterialsPanel
              courseId={courseId}
              materials={materials}
              loading={materialsLoading}
              uploadState={uploadState}
              onUpload={handleUploadMaterial}
              onDelete={handleDeleteMaterial}
            />
          ) : activeModule === 'EXAM' ? (
            <ExamPanel
              exam={courseExam}
              loading={examLoading}
              saving={examSaving}
              showForm={showExamForm}
              setShowForm={setShowExamForm}
              examForm={examForm}
              setExamForm={setExamForm}
              examQuestions={examQuestions}
              onSave={handleSaveExam}
              onDelete={handleDeleteExam}
              onAddQuestion={addExamQuestion}
              onRemoveQuestion={removeExamQuestion}
              onUpdateQuestion={updateExamQuestion}
              onUpdateOption={updateExamOption}
            />
          ) : activeModule ? (
            <>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 20,
                }}
              >
                <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
                  Week {activeModule.weekNumber}: {activeModule.title}
                </h2>
              </div>

              {/* Lessons Section */}
              <div style={{ marginBottom: 28 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 12,
                  }}
                >
                  <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>
                    Lessons ({activeLessons.length})
                  </h3>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      setShowLessonForm(true);
                      setLessonForm({ contentType: 'video', attachments: [] });
                    }}
                  >
                    + Add Lesson
                  </button>
                </div>
                {activeLessons.map((lesson, li) => (
                  <div
                    key={lesson._id}
                    style={{
                      padding: '12px 16px',
                      border: '1px solid #e2e8f0',
                      borderRadius: 8,
                      marginBottom: 8,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>
                        {li + 1}. {lesson.title}
                      </div>
                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                        {lesson.contentType}{' '}
                        {lesson.videoDurationSeconds
                          ? `• ${formatDuration(lesson.videoDurationSeconds)}`
                          : ''}
                        {lesson.durationMinutes && !lesson.videoDurationSeconds
                          ? `• ${lesson.durationMinutes} min`
                          : ''}
                        {lesson.videoUrl ? ' • Video attached' : ''}
                        {lesson.attachments?.length ? ` • ${lesson.attachments.length} resources` : ''}
                        {lesson.isPreview ? ' • Preview' : ''}
                      </div>
                      {lesson.attachments?.length ? (
                        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                          {lesson.attachments
                            .map(
                              item =>
                                `${item.label || item.fileType || 'Resource'} (${formatFileSize(item.size)})`
                            )
                            .join(' • ')}
                        </div>
                      ) : null}
                    </div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <label
                        className="btn btn-secondary btn-sm"
                        style={{ cursor: 'pointer', position: 'relative' }}
                      >
                        {uploadState.status === 'uploading' || uploadState.status === 'verifying'
                          ? 'Uploading...'
                          : 'Video'}
                        <input
                          type="file"
                          accept="video/*"
                          style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
                          onChange={e => handleVideoUpload(e.target.files?.[0], lesson._id)}
                        />
                      </label>
                      <label
                        className="btn btn-secondary btn-sm"
                        style={{ cursor: 'pointer', position: 'relative' }}
                      >
                        Resource
                        <input
                          type="file"
                          accept="application/pdf,image/*"
                          style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
                          onChange={e => handleLessonResourceUpload(e.target.files?.[0], lesson)}
                        />
                      </label>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          setEditLesson(lesson);
                          setLessonForm({
                            title: lesson.title,
                            description: lesson.description || '',
                            contentType: lesson.contentType,
                            durationMinutes: lesson.durationMinutes || 0,
                            isPreview: lesson.isPreview || false,
                            videoUrl: lesson.videoUrl || '',
                            videoKey: lesson.videoKey || '',
                            attachments: lesson.attachments || [],
                          });
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeleteLesson(lesson._id)}
                      >
                        Del
                      </button>
                    </div>
                  </div>
                ))}
                {activeLessons.length === 0 && (
                  <div style={{ textAlign: 'center', padding: 20, color: '#94a3b8', fontSize: 13 }}>
                    No lessons yet.
                  </div>
                )}
              </div>

              {/* Quiz Section */}
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 12,
                  }}
                >
                  <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Module Quiz</h3>
                  {!activeQuiz && (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => {
                        setShowQuizForm(true);
                        setQuizForm({ title: 'Module Quiz', passingScore: 70, questions: [] });
                      }}
                    >
                      + Create Quiz
                    </button>
                  )}
                </div>
                {activeQuiz ? (
                  <div
                    style={{
                      padding: 16,
                      border: '1px solid #e2e8f0',
                      borderRadius: 8,
                      background: '#f8fafc',
                    }}
                  >
                    <div style={{ fontWeight: 600 }}>{activeQuiz.title}</div>
                    <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
                      {activeQuiz.questions?.length || 0} questions • Passing:{' '}
                      {activeQuiz.passingScore}%
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          setShowQuizForm(true);
                          setQuizForm({
                            title: activeQuiz.title,
                            passingScore: activeQuiz.passingScore,
                            questions: activeQuiz.questions || [],
                          });
                        }}
                      >
                        Edit Quiz
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeleteQuiz(activeModule._id)}
                      >
                        Delete Quiz
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: 20, color: '#94a3b8', fontSize: 13 }}>
                    No quiz configured for this module.
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
              Select a module from the left
            </div>
          )}
        </div>
      </div>

      {/* Module Create/Edit Modal */}
      {(showModuleForm || editModule) && (
        <div
          className="admin-modal-overlay"
          onClick={() => {
            setShowModuleForm(false);
            setEditModule(null);
          }}
        >
          <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="admin-modal-header">
              <h2>{editModule ? 'Edit Module' : 'Add Module'}</h2>
              <button
                className="admin-modal-close"
                onClick={() => {
                  setShowModuleForm(false);
                  setEditModule(null);
                }}
              >
                ✕
              </button>
            </div>
            <div className="admin-modal-body">
              <div className="admin-form-group">
                <label>Title *</label>
                <input
                  value={moduleForm.title || ''}
                  onChange={e => setModuleForm({ ...moduleForm, title: e.target.value })}
                />
              </div>
              <div className="admin-form-group">
                <label>Week Number</label>
                <input
                  type="number"
                  value={moduleForm.weekNumber || ''}
                  onChange={e =>
                    setModuleForm({ ...moduleForm, weekNumber: Number(e.target.value) })
                  }
                />
              </div>
              <div className="admin-form-group">
                <label>Description</label>
                <textarea
                  rows={2}
                  value={moduleForm.description || ''}
                  onChange={e => setModuleForm({ ...moduleForm, description: e.target.value })}
                  style={{ width: '100%' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="admin-form-group">
                  <label>Unlock After Days</label>
                  <input
                    type="number"
                    value={moduleForm.unlockAfterDays || 0}
                    onChange={e =>
                      setModuleForm({ ...moduleForm, unlockAfterDays: Number(e.target.value) })
                    }
                  />
                </div>
                <div className="admin-form-group">
                  <label>Duration (hours)</label>
                  <input
                    type="number"
                    value={moduleForm.durationHours || 0}
                    onChange={e =>
                      setModuleForm({ ...moduleForm, durationHours: Number(e.target.value) })
                    }
                  />
                </div>
              </div>
            </div>
            <div className="admin-modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowModuleForm(false);
                  setEditModule(null);
                }}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={editModule ? handleUpdateModule : handleCreateModule}
                disabled={!moduleForm.title}
              >
                {editModule ? 'Save' : 'Create Module'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lesson Create/Edit Modal */}
      {(showLessonForm || editLesson) && (
        <div
          className="admin-modal-overlay"
          onClick={() => {
            setShowLessonForm(false);
            setEditLesson(null);
          }}
        >
          <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="admin-modal-header">
              <h2>{editLesson ? 'Edit Lesson' : 'Add Lesson'}</h2>
              <button
                className="admin-modal-close"
                onClick={() => {
                  setShowLessonForm(false);
                  setEditLesson(null);
                }}
              >
                ✕
              </button>
            </div>
            <div className="admin-modal-body">
              <div className="admin-form-group">
                <label>Title *</label>
                <input
                  value={lessonForm.title || ''}
                  onChange={e => setLessonForm({ ...lessonForm, title: e.target.value })}
                />
              </div>
              <div className="admin-form-group">
                <label>Description</label>
                <textarea
                  rows={2}
                  value={lessonForm.description || ''}
                  onChange={e => setLessonForm({ ...lessonForm, description: e.target.value })}
                  style={{ width: '100%' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="admin-form-group">
                  <label>Type</label>
                  <select
                    value={lessonForm.contentType || 'video'}
                    onChange={e => setLessonForm({ ...lessonForm, contentType: e.target.value })}
                  >
                    <option value="video">Video</option>
                    <option value="reading">Reading</option>
                    <option value="assignment">Assignment</option>
                    <option value="resource">Resource</option>
                  </select>
                </div>
                <div className="admin-form-group">
                  <label>Duration (minutes)</label>
                  <input
                    type="number"
                    value={lessonForm.durationMinutes || 0}
                    onChange={e =>
                      setLessonForm({ ...lessonForm, durationMinutes: Number(e.target.value) })
                    }
                  />
                </div>
              </div>
              <div className="admin-form-group">
                <label>Video URL (or upload after creating)</label>
                <input
                  value={lessonForm.videoUrl || ''}
                  onChange={e => setLessonForm({ ...lessonForm, videoUrl: e.target.value })}
                />
              </div>
              <div className="admin-form-group">
                <label>Upload Video File</label>
                <input
                  type="file"
                  accept="video/*"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) handleVideoFileSelect(file);
                  }}
                />
                {lessonForm.videoFileName ? (
                  <div style={{ marginTop: 8, fontSize: 12, color: '#475569' }}>
                    Selected file: {lessonForm.videoFileName}
                  </div>
                ) : null}
                {lessonForm.videoDurationSeconds ? (
                  <div style={{ marginTop: 4, fontSize: 12, color: '#0f766e' }}>
                    Detected duration: {formatDuration(lessonForm.videoDurationSeconds)} (
                    {lessonForm.durationMinutes} minutes)
                  </div>
                ) : null}
              </div>
              {lessonForm.attachments?.length ? (
                <div className="admin-form-group">
                  <label>Attached Resources</label>
                  <div style={{ display: 'grid', gap: 8 }}>
                    {lessonForm.attachments.map(attachment => (
                      <div
                        key={attachment.key}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: 12,
                          padding: '10px 12px',
                          border: '1px solid #e2e8f0',
                          borderRadius: 8,
                          background: '#f8fafc',
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a' }}>
                            {attachment.label || attachment.fileType || 'Resource'}
                          </div>
                          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                            {attachment.fileType || 'application/octet-stream'} •{' '}
                            {formatFileSize(attachment.size)}
                          </div>
                        </div>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => removeAttachmentFromDraft(attachment)}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
              <div className="admin-form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={lessonForm.isPreview || false}
                    onChange={e => setLessonForm({ ...lessonForm, isPreview: e.target.checked })}
                  />
                  Free Preview Lesson
                </label>
              </div>
            </div>
            <div className="admin-modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowLessonForm(false);
                  setEditLesson(null);
                }}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={editLesson ? handleUpdateLesson : handleCreateLesson}
                disabled={!lessonForm.title}
              >
                {editLesson ? 'Save' : 'Create Lesson'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quiz Builder Modal */}
      {showQuizForm && (
        <div className="admin-modal-overlay" onClick={() => setShowQuizForm(false)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 640 }}>
            <div className="admin-modal-header">
              <h2>Quiz Builder</h2>
              <button className="admin-modal-close" onClick={() => setShowQuizForm(false)}>
                ✕
              </button>
            </div>
            <div className="admin-modal-body" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 12,
                  marginBottom: 16,
                }}
              >
                <div className="admin-form-group">
                  <label>Quiz Title</label>
                  <input
                    value={quizForm.title || ''}
                    onChange={e => setQuizForm({ ...quizForm, title: e.target.value })}
                  />
                </div>
                <div className="admin-form-group">
                  <label>Passing Score (%)</label>
                  <input
                    type="number"
                    value={quizForm.passingScore || 70}
                    onChange={e =>
                      setQuizForm({ ...quizForm, passingScore: Number(e.target.value) })
                    }
                  />
                </div>
              </div>
              {quizForm.questions.map((q, qi) => (
                <div
                  key={qi}
                  style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: 8,
                    padding: 14,
                    marginBottom: 12,
                    background: '#f8fafc',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 8,
                    }}
                  >
                    <span style={{ fontWeight: 600, fontSize: 13 }}>Question {qi + 1}</span>
                    <button
                      className="btn btn-danger"
                      style={{ padding: '2px 8px', fontSize: 11 }}
                      onClick={() => removeQuestion(qi)}
                    >
                      Remove
                    </button>
                  </div>
                  <div className="admin-form-group">
                    <input
                      placeholder="Question text"
                      value={q.question || ''}
                      onChange={e => updateQuestion(qi, 'question', e.target.value)}
                    />
                  </div>
                  {q.options.map((opt, oi) => (
                    <div
                      key={oi}
                      style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}
                    >
                      <input
                        type="radio"
                        name={`correct-${qi}`}
                        checked={q.correctOption === oi}
                        onChange={() => updateQuestion(qi, 'correctOption', oi)}
                      />
                      <input
                        placeholder={`Option ${oi + 1}`}
                        value={opt}
                        onChange={e => updateOption(qi, oi, e.target.value)}
                        style={{ flex: 1 }}
                      />
                    </div>
                  ))}
                </div>
              ))}
              <button className="btn btn-secondary" onClick={addQuestion} style={{ width: '100%' }}>
                + Add Question
              </button>
            </div>
            <div className="admin-modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowQuizForm(false)}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSaveQuiz}
                disabled={quizForm.questions.length === 0}
              >
                Save Quiz
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// COURSE MATERIALS PANEL
// ──────────────────────────────────────────────────────────────────
function MaterialsPanel({ materials, loading, uploadState, onUpload, onDelete }) {
  const formatSize = b => {
    if (!b) return '';
    if (b < 1024) return `${b} B`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>📎 Course Materials</h2>
        <label className="btn btn-primary btn-sm" style={{ cursor: 'pointer', position: 'relative' }}>
          {uploadState.status === 'uploading' ? 'Uploading...' : '+ Upload Material'}
          <input
            type="file"
            accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,image/*"
            style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
            onChange={e => onUpload(e.target.files?.[0])}
          />
        </label>
      </div>
      <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>
        Upload PDFs, slides, or documents. Students enrolled in this course can view these under Notes → Course Materials.
      </p>
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Loading...</div>
      ) : materials.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8', border: '2px dashed #e2e8f0', borderRadius: 12, fontSize: 13 }}>
          No materials uploaded yet. Upload PDFs or documents above.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {materials.map(m => (
            <div key={m._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', border: '1px solid #e2e8f0', borderRadius: 10, background: '#f8fafc' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                  {m.fileType?.includes('pdf') ? '📄' : m.fileType?.includes('image') ? '🖼️' : '📋'}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>{m.title}</div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                    {formatSize(m.size)}{m.uploadedAt ? ` • ${new Date(m.uploadedAt).toLocaleDateString()}` : ''}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <a href={m.fileUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">View</a>
                <button className="btn btn-danger btn-sm" onClick={() => onDelete(m._id)}>Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// FINAL EXAM PANEL
// ──────────────────────────────────────────────────────────────────
function ExamPanel({ exam, loading, saving, showForm, setShowForm, examForm, setExamForm, examQuestions, onSave, onDelete, onAddQuestion, onRemoveQuestion, onUpdateQuestion, onUpdateOption }) {
  if (loading) return <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Loading exam...</div>;

  const totalPts = examQuestions.reduce((s, q) => s + (q.points || 1), 0);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>⚡ Final Exam</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          {exam && !showForm && (
            <>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowForm(true)}>Edit Exam</button>
              <button className="btn btn-danger btn-sm" onClick={onDelete}>Delete</button>
            </>
          )}
          {!exam && !showForm && (
            <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>+ Create Exam</button>
          )}
        </div>
      </div>

      <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>
        One final exam per course, delivered in fullscreen mode with anti-cheat enforcement. Students access it after completing all modules.
      </p>

      {exam && !showForm && (
        <div style={{ padding: 20, border: '1px solid #e2e8f0', borderRadius: 12, background: '#f8fafc', marginBottom: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 12 }}>{exam.title}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 10 }}>
            {[
              ['Questions', exam.questions?.length || 0],
              ['Duration', `${exam.timeLimit || '-'} min`],
              ['Pass Score', `${exam.passingScore || 0}%`],
              ['Attempts', exam.maxAttempts || 1],
              ['Violations', exam.violationLimit || 3],
              ['Status', exam.status],
            ].map(([label, val]) => (
              <div key={label} style={{ textAlign: 'center', padding: 10, border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff' }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>{val}</div>
                <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!exam && !showForm && (
        <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8', border: '2px dashed #e2e8f0', borderRadius: 12, fontSize: 13 }}>
          No final exam created yet. Click "Create Exam" to add one.
        </div>
      )}

      {showForm && (
        <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: 14 }}>{exam ? 'Edit Exam' : 'Create Final Exam'}</span>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>{examQuestions.length} questions · {totalPts} pts</span>
          </div>

          <div style={{ padding: 20, maxHeight: '60vh', overflowY: 'auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              <div style={{ gridColumn: '1 / -1' }} className="admin-form-group">
                <label>Exam Title *</label>
                <input value={examForm.title} onChange={e => setExamForm({ ...examForm, title: e.target.value })} />
              </div>
              <div className="admin-form-group">
                <label>Duration (minutes)</label>
                <input type="number" min={1} value={examForm.timeLimit} onChange={e => setExamForm({ ...examForm, timeLimit: Number(e.target.value) })} />
              </div>
              <div className="admin-form-group">
                <label>Passing Score (%)</label>
                <input type="number" min={0} max={100} value={examForm.passingScore} onChange={e => setExamForm({ ...examForm, passingScore: Number(e.target.value) })} />
              </div>
              <div className="admin-form-group">
                <label>Max Attempts</label>
                <input type="number" min={1} value={examForm.maxAttempts} onChange={e => setExamForm({ ...examForm, maxAttempts: Number(e.target.value) })} />
              </div>
              <div className="admin-form-group">
                <label>Violation Limit (auto-submit)</label>
                <input type="number" min={1} max={10} value={examForm.violationLimit} onChange={e => setExamForm({ ...examForm, violationLimit: Number(e.target.value) })} />
              </div>
              <div className="admin-form-group">
                <label>Status</label>
                <select value={examForm.status} onChange={e => setExamForm({ ...examForm, status: e.target.value })}>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" id="examRandomize" checked={examForm.randomizeQuestions} onChange={e => setExamForm({ ...examForm, randomizeQuestions: e.target.checked })} />
                <label htmlFor="examRandomize" style={{ fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Randomize question order</label>
              </div>
            </div>

            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Questions ({examQuestions.length})</div>
              {examQuestions.map((q, qi) => (
                <div key={qi} style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 14, marginBottom: 12, background: '#f8fafc' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>Q{qi + 1}</span>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <input type="number" min={1} value={q.points || 1} onChange={e => onUpdateQuestion(qi, 'points', Number(e.target.value))} style={{ width: 50, padding: '2px 6px', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 12, textAlign: 'center' }} title="Points" />
                      <span style={{ fontSize: 12, color: '#94a3b8' }}>pts</span>
                      {examQuestions.length > 1 && <button className="btn btn-danger" style={{ padding: '2px 8px', fontSize: 11 }} onClick={() => onRemoveQuestion(qi)}>✕</button>}
                    </div>
                  </div>
                  <div className="admin-form-group">
                    <input placeholder="Question text..." value={q.text || ''} onChange={e => onUpdateQuestion(qi, 'text', e.target.value)} />
                  </div>
                  {(q.options || []).map((opt, oi) => (
                    <div key={oi} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                      <input
                        type="radio"
                        name={`exam-correct-${qi}`}
                        checked={!!opt.isCorrect}
                        onChange={() => onUpdateOption(qi, oi, 'isCorrect', true)}
                        title="Mark as correct"
                      />
                      <input
                        placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                        value={opt.text || ''}
                        onChange={e => onUpdateOption(qi, oi, 'text', e.target.value)}
                        style={{ flex: 1 }}
                      />
                    </div>
                  ))}
                  <div className="admin-form-group" style={{ marginTop: 8 }}>
                    <input placeholder="Explanation (optional)" value={q.explanation || ''} onChange={e => onUpdateQuestion(qi, 'explanation', e.target.value)} style={{ fontSize: 12 }} />
                  </div>
                </div>
              ))}
              <button className="btn btn-secondary" style={{ width: '100%' }} onClick={onAddQuestion}>+ Add Question</button>
            </div>
          </div>

          <div style={{ padding: '12px 20px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: 8, background: '#f8fafc' }}>
            <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={onSave} disabled={saving}>
              {saving ? 'Saving...' : exam ? 'Save Changes' : 'Create Exam'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
