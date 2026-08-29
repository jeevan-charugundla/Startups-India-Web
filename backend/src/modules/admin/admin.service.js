const { User } = require('../users/user.model');
const { Course, Module, Lesson } = require('../courses/course.model');
const { ModuleQuiz } = require('../courses/moduleQuiz.model');
const { Enrollment, LessonProgress, ModuleQuizAttempt } = require('../enrollments/enrollment.model');
const { Payment } = require('../payments/payment.model');
const { Certificate } = require('../certificates/certificate.model');
const { Article } = require('../../models/Article');
const { ArticleView, ArticleLike, ArticleBookmark } = require('../../models/ArticleAnalytics');
const { Event, generateSlug } = require('../../models/Event');
const { EventRegistration } = require('../../models/EventRegistration');
const { Lead } = require('../../models/Lead');
const { Testimonial } = require('../../models/Testimonial');
const { Notification } = require('../../models/Notification');
const { Settings } = require('../../models/Settings');
const { EcosystemEntry } = require('../../models/EcosystemEntry');
const { Profile } = require('../profiles/profile.model');
const { ApiError } = require('../../utils/apiError');
const mediaService = require('../media/media.service');
const { Media } = require('../media/media.model');
const { cacheDel, cacheFlushPattern } = require('../../infrastructure/cache/redis');
const { invalidateEventCache } = require('../events/events.service');
const { extractS3Key } = require('../../utils/s3');
const { EvaluationPayment, GrantApplication } = require('../grants/grant.models');
const { EventPartner } = require('../../models/EventPartner');
const { escapeRegex, sanitizeSort } = require('../../utils/sanitizer');
const { sendEmail } = require('../../utils/emailService');
const { logger } = require('../../infrastructure/observability/logger');

function normalizeAttachments(attachments = []) {
  if (!Array.isArray(attachments)) return [];

  return attachments
    .filter(Boolean)
    .map(item => ({
      label: item.label || item.originalName || item.fileName || 'Attachment',
      fileUrl: item.fileUrl || item.url || '',
      key: item.key || extractS3Key(item.fileUrl || item.url || ''),
      fileType: item.fileType || item.contentType || 'application/octet-stream',
      size: Number(item.size || 0),
    }))
    .filter(item => item.fileUrl && item.key);
}

function collectLessonMediaKeys(lesson) {
  if (!lesson) return [];

  const keys = [];
  const videoKey = lesson.videoKey || extractS3Key(lesson.videoUrl || '');
  if (videoKey) keys.push(videoKey);

  for (const attachment of normalizeAttachments(lesson.attachments || [])) {
    keys.push(attachment.key);
  }

  return [...new Set(keys)];
}

// ─── ANALYTICS ──────────────────────────────────────────────────
async function getDashboardAnalytics() {
  const [
    totalUsers,
    totalCourses,
    totalEnrollments,
    totalRevenue,
    recentUsers,
    recentPayments,
    usersByRole,
    enrollmentTrend,
    revenueTrend,
    totalCertificates,
    totalLeads,
    activeEvents,
    pendingTestimonials,
  ] = await Promise.all([
    User.countDocuments(),
    Course.countDocuments(),
    Enrollment.countDocuments(),
    Payment.aggregate([
      { $match: { status: 'succeeded' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    User.find().sort({ createdAt: -1 }).limit(5).select('fullName email role createdAt').lean(),
    Payment.find({ status: 'succeeded' })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('userId', 'fullName email')
      .populate('courseId', 'title')
      .lean(),
    User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
    Enrollment.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: -1 } },
      { $limit: 30 },
    ]),
    Payment.aggregate([
      { $match: { status: 'succeeded' } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: -1 } },
      { $limit: 30 },
    ]),
    Certificate.countDocuments(),
    Lead.countDocuments(),
    Event.countDocuments({ status: { $in: ['upcoming', 'live'] } }),
    Testimonial.countDocuments({ status: 'pending' }),
  ]);

  return {
    overview: {
      totalUsers,
      totalCourses,
      totalEnrollments,
      totalRevenue: totalRevenue[0]?.total || 0,
      totalCertificates,
      totalLeads,
      activeEvents,
      pendingTestimonials,
    },
    recentUsers,
    recentPayments,
    usersByRole: usersByRole.reduce((acc, r) => {
      acc[r._id || 'user'] = r.count;
      return acc;
    }, {}),
    enrollmentTrend: enrollmentTrend.reverse(),
    revenueTrend: revenueTrend.reverse(),
  };
}

// ─── USERS ──────────────────────────────────────────────────────
const USER_SORT_FIELDS = ['createdAt', 'updatedAt', 'fullName', 'email', 'role'];
async function listUsers({ page = 1, limit = 20, search, role, sort = '-createdAt' }) {
  const query = {};
  if (search) {
    const safe = escapeRegex(search);
    query.$or = [
      { fullName: { $regex: safe, $options: 'i' } },
      { email: { $regex: safe, $options: 'i' } },
    ];
  }
  if (role) query.role = role;

  const safeSort = sanitizeSort(sort, USER_SORT_FIELDS, '-createdAt');
  const total = await User.countDocuments(query);
  const users = await User.find(query)
    .select('-passwordHash -refreshTokenHash')
    .sort(safeSort)
    .skip((page - 1) * limit)
    .limit(limit);

  return { users, total, page, pages: Math.ceil(total / limit) };
}

async function getUser(id) {
  const user = await User.findById(id).select('-passwordHash -refreshTokenHash');
  if (!user) throw new ApiError(404, 'User not found');

  const [enrollments, payments, lessonProgressCount, quizAttempts, certificates, profile] =
    await Promise.all([
      Enrollment.find({ userId: id })
        .populate('courseId', 'title slug thumbnailUrl priceInr')
        .sort({ createdAt: -1 }),
      Payment.find({ userId: id }).sort({ createdAt: -1 }).limit(20),
      LessonProgress.countDocuments({ userId: id, isCompleted: true }),
      ModuleQuizAttempt.find({ userId: id })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('courseId', 'title')
        .populate('moduleId', 'title'),
      Certificate.find({ userId: id }).sort({ createdAt: -1 }),
      Profile.findOne({ userId: id }).lean(),
    ]);

  const totalSpent = payments
    .filter(p => p.status === 'succeeded')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const stats = {
    totalEnrolled: enrollments.length,
    totalCompleted: enrollments.filter(e => e.completed).length,
    totalLessonsCompleted: lessonProgressCount,
    totalCertificates: certificates.length,
    totalSpentInr: totalSpent,
  };

  return { user, enrollments, payments, quizAttempts, certificates, stats, profile };
}

async function updateUser(id, updates) {
  const allowed = ['fullName', 'role', 'isActive', 'avatarUrl'];
  const filtered = {};
  for (const key of allowed) {
    if (updates[key] !== undefined) filtered[key] = updates[key];
  }
  const user = await User.findByIdAndUpdate(id, filtered, { new: true }).select(
    '-passwordHash -refreshTokenHash'
  );
  if (!user) throw new ApiError(404, 'User not found');
  return user;
}

async function deleteUser(id) {
  const user = await User.findByIdAndDelete(id);
  if (!user) throw new ApiError(404, 'User not found');
  await Enrollment.deleteMany({ userId: id });
  return { deleted: true };
}

// ─── COURSES ────────────────────────────────────────────────────
const COURSE_SORT_FIELDS = ['createdAt', 'updatedAt', 'title', 'priceInr', 'enrolledCount'];
async function listCourses({ page = 1, limit = 20, search, status, sort = '-createdAt' }) {
  const query = {};
  if (search) query.title = { $regex: escapeRegex(search), $options: 'i' };
  if (status === 'published') query.isPublished = true;
  if (status === 'draft') query.isPublished = false;

  const safeSort = sanitizeSort(sort, COURSE_SORT_FIELDS, '-createdAt');
  const total = await Course.countDocuments(query);
  const courses = await Course.find(query)
    .sort(safeSort)
    .skip((page - 1) * limit)
    .limit(limit);

  return { courses, total, page, pages: Math.ceil(total / limit) };
}

async function getCourse(id) {
  const course = await Course.findById(id);
  if (!course) throw new ApiError(404, 'Course not found');
  const enrollmentCount = await Enrollment.countDocuments({ courseId: id });
  const revenue = await Payment.aggregate([
    { $match: { courseId: course._id, status: 'succeeded' } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  return { course, enrollmentCount, revenue: revenue[0]?.total || 0 };
}

async function updateCourse(id, updates) {
  const existingCourse = await Course.findById(id).lean();
  if (!existingCourse) throw new ApiError(404, 'Course not found');

  const allowed = [
    'title',
    'slug',
    'subtitle',
    'description',
    'introCopy',
    'structureDescription',
    'durationWeeks',
    'totalModules',
    'category',
    'level',
    'thumbnailUrl',
    'thumbnailKey',
    'videoIntroUrl',
    'difficultyLevel',
    'language',
    'isPublished',
    'isFeatured',
    'enrollmentStatus',
    'priceInr',
    'originalPriceInr',
    'startDate',
    'endDate',
    'preStartMessage',
  ];
  const filtered = {};
  for (const key of allowed) {
    if (updates[key] !== undefined) filtered[key] = updates[key];
  }
  // Check slug uniqueness if slug is being changed
  if (filtered.slug) {
    const existing = await Course.findOne({ slug: filtered.slug, _id: { $ne: id } });
    if (existing) throw new ApiError(409, 'A course with this slug already exists');
  }

  const course = await Course.findByIdAndUpdate(id, filtered, { new: true });

  if (existingCourse.thumbnailKey && existingCourse.thumbnailKey !== course.thumbnailKey) {
    await mediaService.deleteMediaByKey(null, existingCourse.thumbnailKey, {
      courseId: id,
      reason: 'course.thumbnail.replaced',
    });
  }

  // Invalidate course caches
  cacheDel('courses:all', `course:${id}`, `course:${course.slug}`, `course:${id}:modules`).catch(
    () => {}
  );
  return course;
}

async function createCourse(data) {
  const slug =
    data.slug ||
    data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  const existing = await Course.findOne({ slug });
  if (existing) throw new ApiError(409, 'A course with this slug already exists');

  const course = await Course.create({
    slug,
    title: data.title,
    subtitle: data.subtitle || '',
    description: data.description || '',
    introCopy: data.introCopy || '',
    durationWeeks: data.durationWeeks || 0,
    totalModules: data.totalModules || 0,
    category: data.category || '',
    level: data.level || '',
    thumbnailUrl: data.thumbnailUrl || '',
    thumbnailKey: data.thumbnailKey || '',
    videoIntroUrl: data.videoIntroUrl || '',
    difficultyLevel: data.difficultyLevel || 'beginner',
    language: data.language || 'English',
    isPublished: data.isPublished || false,
    enrollmentStatus: data.enrollmentStatus || 'open',
    priceInr: data.priceInr || 0,
    originalPriceInr: data.originalPriceInr || null,
    startDate: data.startDate || null,
    endDate: data.endDate || null,
    preStartMessage: data.preStartMessage || '',
  });
  // Invalidate course list cache
  cacheDel('courses:all').catch(() => {});
  return course;
}

async function deleteCourse(id) {
  const course = await Course.findById(id).lean();
  if (!course) throw new ApiError(404, 'Course not found');

  const modules = await Module.find({ courseId: id }).select('_id').lean();
  const moduleIds = modules.map(m => m._id);

  const lessons = moduleIds.length
    ? await Lesson.find({ moduleId: { $in: moduleIds } }).select('videoKey videoUrl attachments').lean()
    : [];

  const lessonMediaKeys = lessons.flatMap(collectLessonMediaKeys);
  const courseMediaKeys = await Media.find({ courseId: id }).select('key fileKey').lean();
  const keysToDelete = [
    course.thumbnailKey,
    ...lessonMediaKeys,
    ...courseMediaKeys.map(item => item.key || item.fileKey),
  ].filter(Boolean);

  if (keysToDelete.length > 0) {
    await mediaService.deleteMediaByKeys(null, keysToDelete, {
      courseId: id,
      reason: 'course.deleted',
    });
  }

  // Cascade: delete modules, lessons, quizzes, and enrollments for this course
  if (moduleIds.length > 0) {
    await Lesson.deleteMany({ moduleId: { $in: moduleIds } });
    await ModuleQuiz.deleteMany({ moduleId: { $in: moduleIds } });
  }
  await Module.deleteMany({ courseId: id });
  await Course.findByIdAndDelete(id);
  // Invalidate course caches
  cacheDel('courses:all', `course:${id}`, `course:${course.slug}`, `course:${id}:modules`).catch(
    () => {}
  );
  // Flush module-lesson caches for deleted modules
  for (const mId of moduleIds) {
    cacheDel(`module:${mId}:lessons`).catch(() => {});
  }
  return { deleted: true };
}

// ─── PAYMENTS ───────────────────────────────────────────────────
async function listPayments({ page = 1, limit = 20, status, sort = '-createdAt' }) {
  // ── Map the UI status filter to each collection's vocabulary ─────────
  // EvaluationPayment uses 'paid' where Payment uses 'succeeded'.
  const paymentStatusFilter = status ? { status } : {};
  const grantStatusFilter = status
    ? { status: status === 'succeeded' ? 'paid' : status }
    : { status: { $in: ['created', 'paid', 'failed', 'expired'] } };

  const pageNum = Number(page);
  const limitNum = Number(limit);

  // ── Query both collections in parallel ───────────────────────────────
  const [regularPayments, evalPayments] = await Promise.all([
    Payment.find(paymentStatusFilter)
      .populate('userId', 'fullName email')
      .populate('courseId', 'title')
      .populate('eventId', 'title')
      .lean(),
    EvaluationPayment.find(grantStatusFilter)
      .populate('userId', 'fullName email')
      .populate('applicationId', 'applicationId startup')
      .lean(),
  ]);

  // ── Normalize EvaluationPayment rows to the same shape as Payment ────
  const normalizedGrant = evalPayments.map(ep => ({
    _id: ep._id,
    userId: ep.userId,
    courseId: null,
    // Surface the grant application reference so the UI can display it
    grantApplication: ep.applicationId
      ? {
          ref: ep.applicationId.applicationId,
          startup: ep.applicationId.startup?.name || null,
        }
      : null,
    provider: ep.provider,
    orderId: ep.orderId,
    paymentId: ep.paymentId,
    // Flat amount for display - use totalAmount (already in paise)
    amount: ep.totalAmount,
    currency: ep.currency,
    // Normalise status: 'paid' → 'succeeded' for consistent UI colouring
    status: ep.status === 'paid' ? 'succeeded' : ep.status,
    // Keep raw grant status for the badge label
    grantStatus: ep.status,
    type: 'grant_evaluation',
    invoiceNumber: ep.invoiceNumber,
    paidAt: ep.paidAt,
    createdAt: ep.createdAt,
    updatedAt: ep.updatedAt,
  }));

  // ── Merge, sort by createdAt desc, paginate ───────────────────────────
  const merged = [...regularPayments.map(p => ({ ...p, type: 'payment' })), ...normalizedGrant]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const total = merged.length;
  const paginated = merged.slice((pageNum - 1) * limitNum, pageNum * limitNum);

  return { payments: paginated, total, page: pageNum, pages: Math.ceil(total / limitNum) };
}

async function refundPayment(id) {
  const payment = await Payment.findById(id);
  if (!payment) throw new ApiError(404, 'Payment not found');
  if (payment.status === 'refunded') throw new ApiError(400, 'Already refunded');
  payment.status = 'refunded';
  await payment.save();
  return payment;
}

// ─── ENROLLMENTS ────────────────────────────────────────────────
const ENROLLMENT_SORT_FIELDS = ['createdAt', 'updatedAt', 'completionPercent'];
async function listEnrollments({ page = 1, limit = 20, search, sort = '-createdAt' }) {
  const query = {};
  if (search) {
    const safe = escapeRegex(search);
    const users = await User.find({
      $or: [
        { fullName: { $regex: safe, $options: 'i' } },
        { email: { $regex: safe, $options: 'i' } },
      ],
    }).select('_id');
    query.userId = { $in: users.map(u => u._id) };
  }
  const safeSort = sanitizeSort(sort, ENROLLMENT_SORT_FIELDS, '-createdAt');
  const total = await Enrollment.countDocuments(query);
  const enrollments = await Enrollment.find(query)
    .populate('userId', 'fullName email')
    .populate('courseId', 'title slug')
    .sort(safeSort)
    .skip((page - 1) * limit)
    .limit(limit);

  return { enrollments, total, page, pages: Math.ceil(total / limit) };
}

async function createEnrollment({ userId, courseId }) {
  const existing = await Enrollment.findOne({ userId, courseId });
  if (existing) throw new ApiError(409, 'User already enrolled');
  const enrollment = await Enrollment.create({ userId, courseId, paymentStatus: 'free' });
  // Increment enrolledCount on Course
  await Course.updateOne({ _id: courseId }, { $inc: { enrolledCount: 1 } });
  return enrollment;
}

// ─── CERTIFICATES ───────────────────────────────────────────────
async function listCertificates({ page = 1, limit = 20, sort = '-createdAt' }) {
  const total = await Certificate.countDocuments();
  const certificates = await Certificate.find()
    .populate('userId', 'fullName email')
    .populate('courseId', 'title')
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(limit);

  return { certificates, total, page, pages: Math.ceil(total / limit) };
}

async function revokeCertificate(id) {
  const cert = await Certificate.findByIdAndUpdate(id, { isVerified: false }, { new: true });
  if (!cert) throw new ApiError(404, 'Certificate not found');
  return cert;
}

// ─── ARTICLES ───────────────────────────────────────────────────────
const ARTICLE_SORT_FIELDS = ['createdAt', 'updatedAt', 'publishedAt', 'title', 'metrics.viewsCount'];
async function listArticles({ page = 1, limit = 20, status, category, search, sort = '-createdAt' }) {
  const query = {};
  if (status) query.status = status;
  if (category) query.category = category;
  if (search) {
    const safe = escapeRegex(search);
    query.$or = [
      { title: { $regex: safe, $options: 'i' } },
      { 'author.name': { $regex: safe, $options: 'i' } },
    ];
  }
  const safeSort = sanitizeSort(sort, ARTICLE_SORT_FIELDS, '-createdAt');
  const total = await Article.countDocuments(query);
  const articles = await Article.find(query)
    .sort(safeSort)
    .skip((page - 1) * limit)
    .limit(limit);
  return { articles, total, page, pages: Math.ceil(total / limit) };
}

async function getArticle(id) {
  const article = await Article.findById(id);
  if (!article) throw new ApiError(404, 'Article not found');
  return article;
}

async function createArticle(data) {
  if (!data.slug && data.title) {
    data.slug = data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
  
  // Calculate reading time roughly if not provided
  if (!data.readTime && data.content) {
    const words = data.content.replace(/<[^>]*>?/gm, '').split(/\s+/).length;
    data.readTime = Math.ceil(words / 200); // 200 words per min
  }
  
  if (data.status === 'published' && !data.publishedAt) {
    data.publishedAt = new Date();
  }

  const article = await Article.create(data);
  return article;
}

async function updateArticle(id, updates) {
  if (updates.status === 'published' && !updates.publishedAt) {
    updates.publishedAt = new Date();
  }
  if (!updates.readTime && updates.content) {
    const words = updates.content.replace(/<[^>]*>?/gm, '').split(/\s+/).length;
    updates.readTime = Math.ceil(words / 200);
  }
  const article = await Article.findByIdAndUpdate(id, updates, { new: true });
  if (!article) throw new ApiError(404, 'Article not found');
  return article;
}

async function deleteArticle(id) {
  const article = await Article.findByIdAndDelete(id);
  if (!article) throw new ApiError(404, 'Article not found');
  
  // Clean up analytics
  await ArticleView.deleteMany({ articleId: id });
  await ArticleLike.deleteMany({ articleId: id });
  await ArticleBookmark.deleteMany({ articleId: id });

  return { deleted: true };
}

async function duplicateArticle(id) {
  const article = await Article.findById(id).lean();
  if (!article) throw new ApiError(404, 'Article not found');

  delete article._id;
  delete article.createdAt;
  delete article.updatedAt;
  article.title = `${article.title} (Copy)`;
  article.slug = `${article.slug}-copy-${Date.now()}`;
  article.status = 'draft';
  article.publishedAt = null;
  article.metrics = {
    viewsCount: 0,
    uniqueViews: 0,
    likesCount: 0,
    sharesCount: 0,
    savesCount: 0,
    avgReadTime: 0,
    dropOffRate: 0,
  };

  const newArticle = await Article.create(article);
  return newArticle;
}

async function getArticleAnalytics(id) {
  const article = await Article.findById(id).select('title metrics status publishedAt');
  if (!article) throw new ApiError(404, 'Article not found');

  const totalViews = await ArticleView.countDocuments({ articleId: id });
  const uniqueViews = (await ArticleView.distinct('ipAddress', { articleId: id })).length;
  const totalLikes = await ArticleLike.countDocuments({ articleId: id });
  const totalBookmarks = await ArticleBookmark.countDocuments({ articleId: id });

  return {
    article,
    stats: {
      totalViews,
      uniqueViews,
      totalLikes,
      totalBookmarks,
      ...article.metrics
    }
  };
}

// ─── EVENTS ─────────────────────────────────────────────────────
async function listEvents({ page = 1, limit = 20, status, sort = '-date' }) {
  const query = {};
  if (status) query.status = status;
  const total = await Event.countDocuments(query);
  const events = await Event.find(query)
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  // Attach an accurate registration count from the EventRegistration collection
  // (source of truth for the Regs page), covering both logged-in and guest
  // registrations. The event.registrations array only holds logged-in users.
  const eventIds = events.map(e => e._id);
  if (eventIds.length) {
    const counts = await EventRegistration.aggregate([
      { $match: { event: { $in: eventIds }, attendanceStatus: { $ne: 'Cancelled' } } },
      { $group: { _id: '$event', count: { $sum: 1 } } },
    ]);
    const countMap = counts.reduce((acc, c) => {
      acc[String(c._id)] = c.count;
      return acc;
    }, {});
    events.forEach(e => {
      e.registrationCount = countMap[String(e._id)] || 0;
    });
  }

  return { events, total, page, pages: Math.ceil(total / limit) };
}

async function createEvent(data) {
  // Auto-generate slug from title if none supplied, then ensure uniqueness
  let slug = data.slug ? data.slug : generateSlug(data.title || '');
  if (slug) {
    // Append a short timestamp suffix if the slug already exists
    const existing = await Event.findOne({ slug }).lean();
    if (existing) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }
  }

  const event = await Event.create({ ...data, slug: slug || undefined });
  cacheFlushPattern('events:*').catch(() => {});
  return event;
}

async function updateEvent(id, updates) {
  // If admin changed the title and hasn't supplied a custom slug,
  // regenerate the slug from the new title
  if (updates.title && !updates.slug) {
    const current = await Event.findById(id).select('slug title').lean();
    if (current && generateSlug(current.title) === (current.slug || '')) {
      // Slug was auto-generated - keep it in sync with the new title
      updates.slug = generateSlug(updates.title);
    }
  }
  // Normalise any manually supplied slug
  if (updates.slug) {
    updates.slug = generateSlug(updates.slug);
  }

  const event = await Event.findByIdAndUpdate(id, updates, { new: true });
  if (!event) throw new ApiError(404, 'Event not found');
  // Flush all cache variants (old slug, new slug, id pointers, lists)
  await invalidateEventCache(String(event._id), event.slug || null).catch(() => {});
  return event;
}

async function deleteEvent(id) {
  const event = await Event.findByIdAndDelete(id);
  if (!event) throw new ApiError(404, 'Event not found');
  await invalidateEventCache(String(event._id), event.slug || null).catch(() => {});
  return { deleted: true };
}

async function duplicateEvent(id, userId) {
  const event = await Event.findById(id).lean();
  if (!event) throw new ApiError(404, 'Event not found');

  const { _id, createdAt, updatedAt, slug: origSlug, ...eventData } = event;
  eventData.title = `${eventData.title} (Copy)`;
  // Give the duplicate a fresh unique slug
  eventData.slug = `${origSlug || generateSlug(eventData.title)}-copy-${Date.now().toString(36)}`;
  eventData.status = 'upcoming';
  eventData.registrations = [];
  eventData.attendees = 0;
  eventData.createdBy = userId;

  const newEvent = await Event.create(eventData);
  cacheFlushPattern('events:*').catch(() => {});
  return newEvent;
}

/**
 * Self-healing reconciliation: for a given event, find every succeeded Razorpay
 * payment that does NOT have a matching EventRegistration and create it.
 *
 * This fixes the data-integrity gap where a payment succeeds but the inline
 * registerForEvent/registerGuestForEvent call failed (and was logged but swallowed).
 * Routing through the events service means the confirmation email also fires.
 *
 * Returns the number of registrations backfilled.
 */
async function reconcileEventRegistrations(eventId) {
  const eventsService = require('../events/events.service');
  const event = await Event.findById(eventId).lean();
  if (!event) return 0;

  const paidOk = await Payment.find({
    eventId,
    status: 'succeeded',
    // Only heal payments that have NEVER produced a registration. Once a payment
    // has been registered, it is marked (metadata.registeredAt) so that an admin
    // deleting the registration afterwards does NOT get it silently recreated.
    'metadata.registeredAt': { $exists: false },
  }).lean();
  if (!paidOk.length) return 0;

  let healed = 0;

  for (const p of paidOk) {
    try {
      if (p.userId) {
        // Logged-in user: registered if their id is in event.registrations OR a reg row exists
        const already = await EventRegistration.exists({ event: eventId, user: p.userId });
        if (already) {
          await markPaymentRegistered(p._id);
          continue;
        }
        await eventsService.registerForEvent(String(eventId), String(p.userId), {
          ticketTypeName: p.metadata?.ticketTypeName || null,
          ticketPrice: p.amount,
          couponUsed: p.metadata?.couponCode || '',
          fromVerifiedPayment: true,
          paymentOrderId: p.orderId,
        });
        await markPaymentRegistered(p._id);
        healed += 1;
      } else if (p.metadata?.isGuest && p.metadata?.guest?.email) {
        const email = String(p.metadata.guest.email).trim().toLowerCase();
        const already = await EventRegistration.exists({
          event: eventId,
          email,
          attendanceStatus: { $ne: 'Cancelled' },
        });
        if (already) {
          await markPaymentRegistered(p._id);
          continue;
        }
        await eventsService.registerGuestForEvent(String(eventId), p.metadata.guest, {
          ticketTypeName: p.metadata?.ticketTypeName || null,
          ticketPrice: p.amount,
          couponUsed: p.metadata?.couponCode || '',
          fromVerifiedPayment: true,
          paymentOrderId: p.orderId,
        });
        await markPaymentRegistered(p._id);
        healed += 1;
      }
    } catch (e) {
      // "Already registered" is expected/benign here; log anything else.
      if (!/already registered/i.test(e.message)) {
        console.error(`[reconcile] event=${eventId} payment=${p._id} error=${e.message}`);
      }
    }
  }

  return healed;
}

/**
 * Recompute an event's cached registration counters (guestRegistrations and each
 * ticketType.sold) from the actual EventRegistration rows. Fixes drift caused by
 * failed/raced attempts that incremented counters without a completed registration,
 * or by admin deletions. Also rebuilds the logged-in `registrations` array.
 * Returns the recomputed totals.
 */
async function recountEventRegistrations(eventId) {
  const event = await Event.findById(eventId);
  if (!event) throw new ApiError(404, 'Event not found');

  const regs = await EventRegistration.find({
    event: eventId,
    attendanceStatus: { $ne: 'Cancelled' },
  }).select('user ticketTypeName').lean();

  // Logged-in registrations array (unique user ids)
  const userIds = [...new Set(regs.filter(r => r.user).map(r => String(r.user)))];
  const guestCount = regs.filter(r => !r.user).length;

  // Per-ticket sold counts by ticketTypeName
  const soldByTicket = regs.reduce((acc, r) => {
    const name = r.ticketTypeName || 'General';
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {});

  event.registrations = userIds;
  event.guestRegistrations = guestCount;
  if (Array.isArray(event.ticketTypes)) {
    event.ticketTypes.forEach(t => {
      t.sold = soldByTicket[t.name] || 0;
    });
  }
  await event.save();
  await invalidateEventCache(String(event._id), event.slug || null).catch(() => {});

  return {
    total: regs.length,
    loggedInRegistrations: userIds.length,
    guestRegistrations: guestCount,
    soldByTicket,
  };
}

/** Stamp a Payment as having produced a registration (idempotency for reconcile). */
async function markPaymentRegistered(paymentId) {
  await Payment.updateOne(
    { _id: paymentId },
    { $set: { 'metadata.registeredAt': new Date().toISOString() } }
  ).catch(err => console.error(`[reconcile] failed to mark payment ${paymentId}: ${err.message}`));
}

const EVENT_REG_SORT_FIELDS = ['createdAt', 'fullName', 'email', 'attendanceStatus', 'paymentStatus'];
async function getEventRegistrations(id, { page = 1, limit = 20, search, status, paymentStatus, sort = '-createdAt' }) {
  // Heal any paid-but-unregistered attendees before listing (best-effort).
  await reconcileEventRegistrations(id).catch(err =>
    console.error(`[reconcile] failed for event=${id}: ${err.message}`)
  );

  const query = { event: id };
  if (search) {
    const safe = escapeRegex(search);
    query.$or = [
      { fullName: { $regex: safe, $options: 'i' } },
      { email: { $regex: safe, $options: 'i' } },
    ];
  }
  if (status) query.attendanceStatus = status;
  if (paymentStatus) query.paymentStatus = paymentStatus;
  sort = sanitizeSort(sort, EVENT_REG_SORT_FIELDS, '-createdAt');

  const total = await EventRegistration.countDocuments(query);
  const registrations = await EventRegistration.find(query)
    .populate('user', 'fullName email')
    .sort(sort)
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit));

  return { registrations, total, page: Number(page), pages: Math.ceil(total / Number(limit)) };
}

async function getEventAnalytics(id) {
  const event = await Event.findById(id).select('maxAttendees');
  if (!event) throw new ApiError(404, 'Event not found');

  const registrations = await EventRegistration.find({ event: id });

  const totalRegistrations = registrations.length;
  const remainingSeats = event.maxAttendees > 0 ? Math.max(0, event.maxAttendees - totalRegistrations) : null;
  const attendanceRate = totalRegistrations > 0 ? (registrations.filter(r => r.attendanceStatus === 'Attended').length / totalRegistrations) * 100 : 0;
  const refundCount = registrations.filter(r => r.paymentStatus === 'Refunded').length;

  const paymentStats = registrations.reduce((acc, r) => {
    acc[r.paymentStatus] = (acc[r.paymentStatus] || 0) + 1;
    return acc;
  }, {});

  const attendanceStats = registrations.reduce((acc, r) => {
    acc[r.attendanceStatus] = (acc[r.attendanceStatus] || 0) + 1;
    return acc;
  }, {});

  return {
    totalRegistrations,
    remainingSeats,
    attendanceRate: attendanceRate.toFixed(1),
    refundCount,
    paymentStats,
    attendanceStats
  };
}

// ─── LEADS/CRM ──────────────────────────────────────────────────
async function listLeads({ page = 1, limit = 20, status, sort = '-createdAt' }) {
  const query = {};
  if (status) query.status = status;
  const total = await Lead.countDocuments(query);
  const leads = await Lead.find(query)
    .populate('assignedTo', 'fullName email')
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(limit);
  return { leads, total, page, pages: Math.ceil(total / limit) };
}

async function createLead(data) {
  return Lead.create(data);
}

async function updateLead(id, updates) {
  const lead = await Lead.findByIdAndUpdate(id, updates, { new: true });
  if (!lead) throw new ApiError(404, 'Lead not found');
  return lead;
}

async function deleteLead(id) {
  const lead = await Lead.findByIdAndDelete(id);
  if (!lead) throw new ApiError(404, 'Lead not found');
  return { deleted: true };
}

// ─── TESTIMONIALS ───────────────────────────────────────────────
async function listTestimonials({ page = 1, limit = 20, status, sort = '-createdAt' }) {
  const query = {};
  if (status) query.status = status;
  const total = await Testimonial.countDocuments(query);
  const testimonials = await Testimonial.find(query)
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(limit);
  return { testimonials, total, page, pages: Math.ceil(total / limit) };
}

async function createTestimonial(data) {
  return Testimonial.create(data);
}

async function updateTestimonial(id, updates) {
  const t = await Testimonial.findByIdAndUpdate(id, updates, { new: true });
  if (!t) throw new ApiError(404, 'Testimonial not found');
  return t;
}

async function deleteTestimonial(id) {
  const t = await Testimonial.findByIdAndDelete(id);
  if (!t) throw new ApiError(404, 'Testimonial not found');
  return { deleted: true };
}

// ─── NOTIFICATIONS ──────────────────────────────────────────────
async function listNotifications({ page = 1, limit = 20, sort = '-createdAt' }) {
  const total = await Notification.countDocuments();
  const notifications = await Notification.find()
    .populate('sentBy', 'fullName')
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(limit);
  return { notifications, total, page, pages: Math.ceil(total / limit) };
}

async function createNotification(data) {
  return Notification.create(data);
}

async function deleteNotification(id) {
  const n = await Notification.findByIdAndDelete(id);
  if (!n) throw new ApiError(404, 'Notification not found');
  return { deleted: true };
}

// ─── NOTIFY EVENT REGISTRANTS ───────────────────────────────────
async function notifyEventRegistrants(eventId, { title, message, type = 'info', deliveryMethods = ['push'] }, sentBy) {
  const event = await Event.findById(eventId).lean();
  if (!event) throw new ApiError(404, 'Event not found');

  const registrations = await EventRegistration.find({ event: eventId }).lean();
  if (registrations.length === 0) throw new ApiError(400, 'No registrations found for this event');

  const result = { notified: registrations.length, emailed: 0, pushed: 0 };

  // ── In-App Notification ──
  if (deliveryMethods.includes('push')) {
    const userIds = registrations.map(r => r.user).filter(Boolean);
    await Notification.create({
      title,
      message,
      type,
      target: 'specific',
      recipients: userIds,
      sentBy,
    });
    result.pushed = userIds.length;
  }

  // ── Email Notification ──
  if (deliveryMethods.includes('email')) {
    const uniqueEmails = [...new Map(registrations.map(r => [r.email, r])).values()];

    const { getEventNotificationEmailTemplate } = require('../../utils/emailTemplates');
    
    // Send emails in batches of 50 to avoid SMTP rate limits
    const BATCH_SIZE = 50;
    for (let i = 0; i < uniqueEmails.length; i += BATCH_SIZE) {
      const batch = uniqueEmails.slice(i, i + BATCH_SIZE);
      const emailPromises = batch.map(reg => {
        const tpl = getEventNotificationEmailTemplate(event.title, message, reg.fullName);
        return sendEmail({
          to: reg.email,
          subject: `📢 ${event.title} - ${title}`,
          html: tpl.html,
          text: tpl.text,
        }).catch(err => {
          logger.error('Failed to send event notification email', { email: reg.email, error: err.message });
          return null;
        });
      });
      const results = await Promise.all(emailPromises);
      result.emailed += results.filter(Boolean).length;

      // Delay between batches (skip for last batch)
      if (i + BATCH_SIZE < uniqueEmails.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  logger.info('Event registrants notified', { eventId, ...result });
  return result;
}

// ─── SETTINGS ───────────────────────────────────────────────────
async function getSettings(category) {
  const query = category ? { category } : {};
  return Settings.find(query).sort({ key: 1 });
}

async function upsertSetting({ key, value, category, description, updatedBy }) {
  return Settings.findOneAndUpdate(
    { key },
    { value, category, description, updatedBy },
    { upsert: true, new: true }
  );
}

async function deleteSetting(key) {
  const s = await Settings.findOneAndDelete({ key });
  if (!s) throw new ApiError(404, 'Setting not found');
  return { deleted: true };
}

// ─── MONITORING ─────────────────────────────────────────────────
async function getMonitoringData() {
  const now = new Date();
  const day1 = new Date(now - 24 * 60 * 60 * 1000);
  const day7 = new Date(now - 7 * 24 * 60 * 60 * 1000);
  const day30 = new Date(now - 30 * 24 * 60 * 60 * 1000);
  const day90 = new Date(now - 90 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    newUsers24h,
    newUsers7d,
    newUsers30d,
    totalCourses,
    publishedCourses,
    totalEnrollments,
    enrollments24h,
    enrollments7d,
    totalPayments,
    payments24h,
    revenue30d,
    totalCertificates,
    certs7d,
    totalLeads,
    newLeads7d,
    leadsByStatus,
    totalEvents,
    upcomingEvents,
    totalArticles,
    publishedPosts,
    totalNotifications,
    pendingTestimonials,
    approvedTestimonials,
    userGrowth,
    enrollmentGrowth,
    revenueGrowth,
    topCourses,
    usersByRole,
    paymentsByStatus,
    dailySignups,
    dailyEnrollments,
    dailyRevenue,
  ] = await Promise.all([
    // Users
    User.countDocuments(),
    User.countDocuments({ createdAt: { $gte: day1 } }),
    User.countDocuments({ createdAt: { $gte: day7 } }),
    User.countDocuments({ createdAt: { $gte: day30 } }),
    // Courses
    Course.countDocuments(),
    Course.countDocuments({ isPublished: true }),
    // Enrollments
    Enrollment.countDocuments(),
    Enrollment.countDocuments({ createdAt: { $gte: day1 } }),
    Enrollment.countDocuments({ createdAt: { $gte: day7 } }),
    // Payments
    Payment.countDocuments(),
    Payment.countDocuments({ createdAt: { $gte: day1 } }),
    Payment.aggregate([
      { $match: { status: 'succeeded', createdAt: { $gte: day30 } } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
    // Certificates
    Certificate.countDocuments(),
    Certificate.countDocuments({ createdAt: { $gte: day7 } }),
    // Leads
    Lead.countDocuments(),
    Lead.countDocuments({ createdAt: { $gte: day7 } }),
    Lead.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    // Events
    Event.countDocuments(),
    Event.countDocuments({ status: { $in: ['upcoming', 'live'] } }),
    // Blog
    Article.countDocuments(),
    Article.countDocuments({ status: 'published' }),
    // Notifications
    Notification.countDocuments(),
    // Testimonials
    Testimonial.countDocuments({ status: 'pending' }),
    Testimonial.countDocuments({ status: 'approved' }),
    // Growth - users per month (last 6 months)
    User.aggregate([
      { $match: { createdAt: { $gte: new Date(now - 180 * 24 * 60 * 60 * 1000) } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    // Growth - enrollments per month (last 6 months)
    Enrollment.aggregate([
      { $match: { createdAt: { $gte: new Date(now - 180 * 24 * 60 * 60 * 1000) } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    // Growth - revenue per month (last 6 months)
    Payment.aggregate([
      {
        $match: {
          status: 'succeeded',
          createdAt: { $gte: new Date(now - 180 * 24 * 60 * 60 * 1000) },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    // Top courses by enrollment
    Enrollment.aggregate([
      { $group: { _id: '$courseId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'courses', localField: '_id', foreignField: '_id', as: 'course' } },
      { $unwind: { path: '$course', preserveNullAndEmptyArrays: true } },
      { $project: { _id: 1, count: 1, title: '$course.title' } },
    ]),
    // Users by role
    User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
    // Payments by status
    Payment.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 }, total: { $sum: '$amount' } } },
    ]),
    // Daily signups (last 30 days)
    User.aggregate([
      { $match: { createdAt: { $gte: day30 } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    // Daily enrollments (last 30 days)
    Enrollment.aggregate([
      { $match: { createdAt: { $gte: day30 } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    // Daily revenue (last 30 days)
    Payment.aggregate([
      { $match: { status: 'succeeded', createdAt: { $gte: day30 } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  // Conversion rate (enrollments / users)
  const conversionRate = totalUsers > 0 ? ((totalEnrollments / totalUsers) * 100).toFixed(1) : 0;
  // Avg revenue per paying user
  const totalSucceededPayments = paymentsByStatus.find(p => p._id === 'succeeded');
  const avgRevenuePerUser =
    totalSucceededPayments && totalSucceededPayments.count > 0
      ? Math.round(totalSucceededPayments.total / totalSucceededPayments.count)
      : 0;

  return {
    snapshot: {
      totalUsers,
      newUsers24h,
      newUsers7d,
      newUsers30d,
      totalCourses,
      publishedCourses,
      totalEnrollments,
      enrollments24h,
      enrollments7d,
      totalPayments,
      payments24h,
      revenue30d: revenue30d[0]?.total || 0,
      revenue30dCount: revenue30d[0]?.count || 0,
      totalCertificates,
      certs7d,
      totalLeads,
      newLeads7d,
      totalEvents,
      upcomingEvents,
      totalArticles,
      publishedPosts,
      totalNotifications,
      pendingTestimonials,
      approvedTestimonials,
      conversionRate: Number(conversionRate),
      avgRevenuePerUser,
    },
    distributions: {
      usersByRole: usersByRole.reduce((a, r) => {
        a[r._id || 'user'] = r.count;
        return a;
      }, {}),
      paymentsByStatus: paymentsByStatus.reduce((a, p) => {
        a[p._id || 'unknown'] = { count: p.count, total: p.total };
        return a;
      }, {}),
      leadsByStatus: leadsByStatus.reduce((a, l) => {
        a[l._id || 'new'] = l.count;
        return a;
      }, {}),
    },
    trends: {
      userGrowth,
      enrollmentGrowth,
      revenueGrowth,
      dailySignups,
      dailyEnrollments,
      dailyRevenue,
    },
    topCourses,
    serverTime: now.toISOString(),
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    nodeVersion: process.version,
  };
}

// ─── MODULE CRUD ────────────────────────────────────────────────
async function listModules(courseId) {
  return Module.find({ courseId }).sort({ sortOrder: 1 }).lean();
}

async function createModule(data) {
  const course = await Course.findById(data.courseId);
  if (!course) throw new ApiError(404, 'Course not found');

  const maxOrder = await Module.findOne({ courseId: data.courseId })
    .sort({ sortOrder: -1 })
    .select('sortOrder')
    .lean();

  const mod = await Module.create({
    courseId: data.courseId,
    moduleNumber: data.moduleNumber || (maxOrder ? maxOrder.sortOrder + 1 : 1),
    weekNumber: data.weekNumber || (maxOrder ? maxOrder.sortOrder + 1 : 1),
    title: data.title,
    description: data.description || '',
    whatYouLearn: data.whatYouLearn || [],
    keyActivities: data.keyActivities || [],
    deliverable: data.deliverable || '',
    deliverableDescription: data.deliverableDescription || '',
    durationHours: data.durationHours || 0,
    isLocked: data.isLocked || false,
    unlockAfterDays: data.unlockAfterDays || 0,
    sortOrder: data.sortOrder != null ? data.sortOrder : maxOrder ? maxOrder.sortOrder + 1 : 1,
  });
  cacheDel(`course:${data.courseId}:modules`).catch(() => {});
  return mod;
}

async function updateModule(id, updates) {
  const allowed = [
    'title',
    'description',
    'weekNumber',
    'moduleNumber',
    'whatYouLearn',
    'keyActivities',
    'deliverable',
    'deliverableDescription',
    'durationHours',
    'isLocked',
    'unlockAfterDays',
    'sortOrder',
  ];
  const filtered = {};
  for (const key of allowed) {
    if (updates[key] !== undefined) filtered[key] = updates[key];
  }
  const mod = await Module.findByIdAndUpdate(id, filtered, { new: true });
  if (!mod) throw new ApiError(404, 'Module not found');
  cacheDel(`course:${mod.courseId}:modules`).catch(() => {});
  return mod;
}

async function deleteModule(id) {
  const mod = await Module.findById(id).lean();
  if (!mod) throw new ApiError(404, 'Module not found');

  const lessons = await Lesson.find({ moduleId: id }).select('videoKey videoUrl attachments').lean();
  const mediaKeys = lessons.flatMap(collectLessonMediaKeys);
  if (mediaKeys.length > 0) {
    await mediaService.deleteMediaByKeys(null, mediaKeys, {
      courseId: mod.courseId,
      moduleId: id,
      reason: 'module.deleted',
    });
  }

  // Delete associated lessons and quiz
  await Lesson.deleteMany({ moduleId: id });
  await ModuleQuiz.deleteMany({ moduleId: id });
  await Module.findByIdAndDelete(id);
  cacheDel(`course:${mod.courseId}:modules`, `module:${id}:lessons`).catch(() => {});
  return { deleted: true };
}

async function reorderModules(courseId, orderedIds) {
  const ops = orderedIds.map((id, index) =>
    Module.updateOne({ _id: id, courseId }, { $set: { sortOrder: index + 1 } })
  );
  await Promise.all(ops);
  return Module.find({ courseId }).sort({ sortOrder: 1 }).lean();
}

// ─── LESSON CRUD ────────────────────────────────────────────────
async function listLessons(moduleId) {
  return Lesson.find({ moduleId }).sort({ sortOrder: 1 }).lean();
}

async function createLesson(data) {
  const mod = await Module.findById(data.moduleId);
  if (!mod) throw new ApiError(404, 'Module not found');

  const maxOrder = await Lesson.findOne({ moduleId: data.moduleId })
    .sort({ sortOrder: -1 })
    .select('sortOrder')
    .lean();

  const lesson = await Lesson.create({
    moduleId: data.moduleId,
    lessonNumber: data.lessonNumber || (maxOrder ? maxOrder.sortOrder + 1 : 1),
    title: data.title,
    description: data.description || '',
    contentType: data.contentType || 'video',
    videoUrl: data.videoUrl || '',
    videoKey: data.videoKey || '',
    videoDurationSeconds: data.videoDurationSeconds || 0,
    readingContent: data.readingContent || '',
    readingTimeMinutes: data.readingTimeMinutes || 0,
    attachments: normalizeAttachments(data.attachments || []),
    isPreview: data.isPreview || false,
    isMandatory: data.isMandatory !== false,
    durationMinutes: data.durationMinutes || 0,
    sortOrder: data.sortOrder != null ? data.sortOrder : maxOrder ? maxOrder.sortOrder + 1 : 1,
  });
  cacheDel(`module:${data.moduleId}:lessons`).catch(() => {});
  return lesson;
}

async function updateLesson(id, updates) {
  const existingLesson = await Lesson.findById(id).lean();
  if (!existingLesson) throw new ApiError(404, 'Lesson not found');

  const allowed = [
    'title',
    'description',
    'contentType',
    'videoUrl',
    'videoKey',
    'videoDurationSeconds',
    'readingContent',
    'readingTimeMinutes',
    'attachments',
    'isPreview',
    'isMandatory',
    'durationMinutes',
    'sortOrder',
    'lessonNumber',
  ];
  const filtered = {};
  for (const key of allowed) {
    if (updates[key] !== undefined) filtered[key] = updates[key];
  }

  if (filtered.attachments !== undefined) {
    filtered.attachments = normalizeAttachments(filtered.attachments);
  }

  const lesson = await Lesson.findByIdAndUpdate(id, filtered, { new: true });

  const previousKeys = collectLessonMediaKeys(existingLesson);
  const nextKeys = collectLessonMediaKeys(lesson);
  const removedKeys = previousKeys.filter(key => !nextKeys.includes(key));

  if (removedKeys.length > 0) {
    const mod = await Module.findById(lesson.moduleId).select('courseId').lean();
    await mediaService.deleteMediaByKeys(null, removedKeys, {
      courseId: mod?.courseId || null,
      moduleId: lesson.moduleId,
      reason: 'lesson.media.replaced',
    });
  }

  cacheDel(`module:${lesson.moduleId}:lessons`).catch(() => {});
  return lesson;
}

async function deleteLesson(id) {
  const lesson = await Lesson.findById(id).lean();
  if (!lesson) throw new ApiError(404, 'Lesson not found');

  const mediaKeys = collectLessonMediaKeys(lesson);
  if (mediaKeys.length > 0) {
    const mod = await Module.findById(lesson.moduleId).select('courseId').lean();
    await mediaService.deleteMediaByKeys(null, mediaKeys, {
      courseId: mod?.courseId || null,
      moduleId: lesson.moduleId,
      reason: 'lesson.deleted',
    });
  }

  await Lesson.findByIdAndDelete(id);
  cacheDel(`module:${lesson.moduleId}:lessons`).catch(() => {});
  return { deleted: true };
}

// ─── QUIZ CRUD ──────────────────────────────────────────────────
async function getModuleQuiz(moduleId) {
  return ModuleQuiz.findOne({ moduleId }).lean();
}

async function upsertModuleQuiz(data) {
  const mod = await Module.findById(data.moduleId);
  if (!mod) throw new ApiError(404, 'Module not found');

  return ModuleQuiz.findOneAndUpdate(
    { moduleId: data.moduleId },
    {
      $set: {
        courseId: mod.courseId,
        title: data.title || 'Module Quiz',
        questions: data.questions || [],
        passingScore: data.passingScore || 70,
        isActive: data.isActive !== false,
      },
    },
    { upsert: true, new: true }
  );
}

async function deleteModuleQuiz(moduleId) {
  const quiz = await ModuleQuiz.findOneAndDelete({ moduleId });
  if (!quiz) throw new ApiError(404, 'Quiz not found');
  return { deleted: true };
}

// ─── S3 UPLOAD URL ──────────────────────────────────────────────
async function getUploadUrl(data, userId = null) {
  // Admin endpoint can create upload URL for any instructor/admin
  return mediaService.requestUploadUrl(userId, data);
}

// ─── ECOSYSTEM ──────────────────────────────────────────────────
async function listEcosystem({ category, page = 1, limit = 50, search, featured } = {}) {
  const query = {};
  if (category) query.category = category;
  if (featured !== undefined) query.isFeatured = featured === 'true' || featured === true;
  if (search) query.name = { $regex: escapeRegex(search), $options: 'i' };

  const [items, total] = await Promise.all([
    EcosystemEntry.find(query).sort({ order: 1, createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    EcosystemEntry.countDocuments(query),
  ]);
  return { items, total, page, limit };
}

async function createEcosystemEntry(body) {
  const { name, description, logo, website, category, tags, isFeatured, isActive, order } = body;
  const entry = await EcosystemEntry.create({ name, description, logo, website, category, tags: tags || [], isFeatured: !!isFeatured, isActive: isActive !== false, order: order || 0 });
  return entry;
}

async function updateEcosystemEntry(id, body) {
  const entry = await EcosystemEntry.findByIdAndUpdate(id, { $set: body }, { new: true, runValidators: true }).lean();
  if (!entry) throw new ApiError(404, 'Ecosystem entry not found');
  return entry;
}

async function deleteEcosystemEntry(id) {
  const entry = await EcosystemEntry.findByIdAndDelete(id).lean();
  if (!entry) throw new ApiError(404, 'Ecosystem entry not found');
  return { deleted: true };
}

// ─── MENTORS (ADMIN) ────────────────────────────────────────────
async function listMentorApplications({ status, page = 1, limit = 50 } = {}) {
  const { MentorApplication } = require('../../models/MentorApplication');
  const query = status ? { status } : {};
  const [items, total] = await Promise.all([
    MentorApplication.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    MentorApplication.countDocuments(query),
  ]);
  return { items, total, page, limit };
}

async function updateMentorApplication(id, body) {
  const { MentorApplication } = require('../../models/MentorApplication');
  const item = await MentorApplication.findByIdAndUpdate(id, { $set: body }, { new: true }).lean();
  if (!item) throw new ApiError(404, 'Mentor application not found');
  return item;
}

async function listMentorRequests({ status, page = 1, limit = 50 } = {}) {
  const { MentorRequest } = require('../../models/MentorRequest');
  const query = status ? { status } : {};
  const [items, total] = await Promise.all([
    MentorRequest.find(query).populate('user', 'name email').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    MentorRequest.countDocuments(query),
  ]);
  return { items, total, page, limit };
}

async function updateMentorRequest(id, body) {
  const { MentorRequest } = require('../../models/MentorRequest');
  const item = await MentorRequest.findByIdAndUpdate(id, { $set: body }, { new: true }).lean();
  if (!item) throw new ApiError(404, 'Mentor request not found');
  return item;
}

// ─── INVESTORS (ADMIN) ──────────────────────────────────────────
async function listInvestorRequests({ status, page = 1, limit = 50 } = {}) {
  const query = {};
  if (status) query.status = status;
  const { InvestorRequest } = require('../../models/InvestorRequest');
  const [items, total] = await Promise.all([
    InvestorRequest.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    InvestorRequest.countDocuments(query),
  ]);
  return { items, total, page, limit };
}

async function updateInvestorRequest(id, body) {
  const { InvestorRequest } = require('../../models/InvestorRequest');
  const item = await InvestorRequest.findByIdAndUpdate(id, { $set: body }, { new: true }).lean();
  if (!item) throw new ApiError(404, 'Investor request not found');
  return item;
}

async function listExploreRequests({ status, page = 1, limit = 50 } = {}) {
  const query = {};
  if (status) query.status = status;
  const { ExploreInvestorRequest } = require('../../models/ExploreInvestorRequest');
  const [items, total] = await Promise.all([
    ExploreInvestorRequest.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    ExploreInvestorRequest.countDocuments(query),
  ]);
  return { items, total, page, limit };
}

async function updateExploreRequest(id, body) {
  const { ExploreInvestorRequest } = require('../../models/ExploreInvestorRequest');
  const item = await ExploreInvestorRequest.findByIdAndUpdate(id, { $set: body }, { new: true }).lean();
  if (!item) throw new ApiError(404, 'Explore request not found');
  return item;
}

async function getPublicEcosystem() {
  const items = await EcosystemEntry.find({ isActive: true }).sort({ order: 1, createdAt: -1 }).lean();
  const grouped = { startup: [], corporate: [], partner: [], academia: [], coworking: [] };
  for (const item of items) {
    if (grouped[item.category]) grouped[item.category].push(item);
  }
  return grouped;
}

// ─── EVENT PARTNERS LIBRARY ─────────────────────────────────────
async function listEventPartners({ type } = {}) {
  const query = { isActive: true };
  if (type) query.type = type;
  return EventPartner.find(query).sort({ name: 1 }).lean();
}

async function createEventPartner(data) {
  return EventPartner.create({
    name: data.name,
    logo: data.logo || '',
    website: data.website || '',
    description: data.description || '',
    type: data.type || 'supporting',
    isActive: data.isActive !== false,
  });
}

async function updateEventPartner(id, data) {
  const partner = await EventPartner.findByIdAndUpdate(id, { $set: data }, { new: true });
  if (!partner) throw new ApiError(404, 'Partner not found');
  return partner;
}

async function deleteEventPartner(id) {
  const partner = await EventPartner.findByIdAndDelete(id);
  if (!partner) throw new ApiError(404, 'Partner not found');
  return { deleted: true };
}

module.exports = {
  getDashboardAnalytics,
  getMonitoringData,
  listUsers,
  getUser,
  updateUser,
  deleteUser,
  listCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  // Module CRUD
  listModules,
  createModule,
  updateModule,
  deleteModule,
  reorderModules,
  // Lesson CRUD
  listLessons,
  createLesson,
  updateLesson,
  deleteLesson,
  // Quiz CRUD
  getModuleQuiz,
  upsertModuleQuiz,
  deleteModuleQuiz,
  // S3 Upload
  getUploadUrl,
  listPayments,
  refundPayment,
  listEnrollments,
  createEnrollment,
  listCertificates,
  revokeCertificate,
  listArticles,
  getArticle,
  createArticle,
  updateArticle,
  deleteArticle,
  duplicateArticle,
  getArticleAnalytics,
  listEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  duplicateEvent,
  getEventRegistrations,
  getEventAnalytics,
  reconcileEventRegistrations,
  recountEventRegistrations,
  listLeads,
  createLead,
  updateLead,
  deleteLead,
  listTestimonials,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
  listNotifications,
  createNotification,
  deleteNotification,
  getSettings,
  upsertSetting,
  deleteSetting,
  notifyEventRegistrants,
  listEcosystem,
  createEcosystemEntry,
  updateEcosystemEntry,
  deleteEcosystemEntry,
  getPublicEcosystem,
  listInvestorRequests,
  updateInvestorRequest,
  listExploreRequests,
  updateExploreRequest,
  listMentorApplications,
  updateMentorApplication,
  listMentorRequests,
  updateMentorRequest,
  listEventPartners,
  createEventPartner,
  updateEventPartner,
  deleteEventPartner,
};
