const adminService = require('./admin.service');
const pushService = require('../push/push.service');

// ─── ANALYTICS ──────────────────────────────────────────────────
async function dashboard(req, res) {
  const data = await adminService.getDashboardAnalytics();
  res.json({ success: true, data });
}

async function monitoring(req, res) {
  const data = await adminService.getMonitoringData();
  res.json({ success: true, data });
}

// ─── USERS ──────────────────────────────────────────────────────
async function getUsers(req, res) {
  const { page, limit, search, role, sort } = req.query;
  const data = await adminService.listUsers({
    page: Number(page) || 1,
    limit: Number(limit) || 20,
    search,
    role,
    sort,
  });
  res.json({ success: true, data });
}

async function getUser(req, res) {
  const data = await adminService.getUser(req.params.id);
  res.json({ success: true, data });
}

async function updateUser(req, res) {
  const data = await adminService.updateUser(req.params.id, req.body);
  res.json({ success: true, data });
}

async function deleteUser(req, res) {
  const data = await adminService.deleteUser(req.params.id);
  res.json({ success: true, data });
}

// ─── COURSES ────────────────────────────────────────────────────
async function getCourses(req, res) {
  const { page, limit, search, status, sort } = req.query;
  const data = await adminService.listCourses({
    page: Number(page) || 1,
    limit: Number(limit) || 20,
    search,
    status,
    sort,
  });
  res.json({ success: true, data });
}

async function getCourse(req, res) {
  const data = await adminService.getCourse(req.params.id);
  res.json({ success: true, data });
}

async function updateCourse(req, res) {
  const data = await adminService.updateCourse(req.params.id, req.body);
  res.json({ success: true, data });
}

async function deleteCourse(req, res) {
  const data = await adminService.deleteCourse(req.params.id);
  res.json({ success: true, data });
}

// ─── COURSE CREATION ────────────────────────────────────────────
async function createCourse(req, res) {
  const data = await adminService.createCourse(req.body);
  res.status(201).json({ success: true, data });
}

// ─── MODULES ────────────────────────────────────────────────────
async function getModules(req, res) {
  const data = await adminService.listModules(req.params.courseId);
  res.json({ success: true, data });
}

async function createModule(req, res) {
  const data = await adminService.createModule(req.body);
  res.status(201).json({ success: true, data });
}

async function updateModule(req, res) {
  const data = await adminService.updateModule(req.params.id, req.body);
  res.json({ success: true, data });
}

async function deleteModule(req, res) {
  const data = await adminService.deleteModule(req.params.id);
  res.json({ success: true, data });
}

async function reorderModules(req, res) {
  const data = await adminService.reorderModules(req.params.courseId, req.body.orderedIds);
  res.json({ success: true, data });
}

// ─── LESSONS ────────────────────────────────────────────────────
async function getLessons(req, res) {
  const data = await adminService.listLessons(req.params.moduleId);
  res.json({ success: true, data });
}

async function createLesson(req, res) {
  const data = await adminService.createLesson(req.body);
  res.status(201).json({ success: true, data });
}

async function updateLesson(req, res) {
  const data = await adminService.updateLesson(req.params.id, req.body);
  res.json({ success: true, data });
}

async function deleteLesson(req, res) {
  const data = await adminService.deleteLesson(req.params.id);
  res.json({ success: true, data });
}

// ─── QUIZZES ────────────────────────────────────────────────────
async function getModuleQuiz(req, res) {
  const data = await adminService.getModuleQuiz(req.params.moduleId);
  res.json({ success: true, data });
}

async function upsertModuleQuiz(req, res) {
  const data = await adminService.upsertModuleQuiz(req.body);
  res.json({ success: true, data });
}

async function deleteModuleQuiz(req, res) {
  const data = await adminService.deleteModuleQuiz(req.params.moduleId);
  res.json({ success: true, data });
}

// ─── COURSE MATERIALS ───────────────────────────────────────────
async function addCourseMaterial(req, res) {
  const { Course } = require('../courses/course.model');
  const { title, fileUrl, fileKey, fileType, size } = req.body;
  const course = await Course.findByIdAndUpdate(
    req.params.id,
    { $push: { materials: { title, fileUrl, fileKey, fileType, size, uploadedAt: new Date() } } },
    { new: true }
  );
  if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
  res.json({ success: true, data: course.materials });
}

async function deleteCourseMaterial(req, res) {
  const { Course } = require('../courses/course.model');
  const course = await Course.findByIdAndUpdate(
    req.params.id,
    { $pull: { materials: { _id: req.params.materialId } } },
    { new: true }
  );
  if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
  res.json({ success: true, data: course.materials });
}

// ─── S3 UPLOAD ──────────────────────────────────────────────────
async function getUploadUrl(req, res) {
  const data = await adminService.getUploadUrl(req.body, req.user.userId);
  res.json({ success: true, data });
}

// ─── PAYMENTS ───────────────────────────────────────────────────
async function getPayments(req, res) {
  const { page, limit, status, sort } = req.query;
  const data = await adminService.listPayments({
    page: Number(page) || 1,
    limit: Number(limit) || 20,
    status,
    sort,
  });
  res.json({ success: true, data });
}

async function refundPayment(req, res) {
  const data = await adminService.refundPayment(req.params.id);
  res.json({ success: true, data });
}

// ─── ENROLLMENTS ────────────────────────────────────────────────
async function getEnrollments(req, res) {
  const { page, limit, search, sort } = req.query;
  const data = await adminService.listEnrollments({
    page: Number(page) || 1,
    limit: Number(limit) || 20,
    search,
    sort,
  });
  res.json({ success: true, data });
}

async function createEnrollment(req, res) {
  const data = await adminService.createEnrollment(req.body);
  res.status(201).json({ success: true, data });
}

// ─── CERTIFICATES ───────────────────────────────────────────────
async function getCertificates(req, res) {
  const { page, limit, sort } = req.query;
  const data = await adminService.listCertificates({
    page: Number(page) || 1,
    limit: Number(limit) || 20,
    sort,
  });
  res.json({ success: true, data });
}

async function revokeCertificate(req, res) {
  const data = await adminService.revokeCertificate(req.params.id);
  res.json({ success: true, data });
}

// ─── ARTICLES ───────────────────────────────────────────────────────
async function getArticles(req, res) {
  const { page, limit, status, category, search, sort } = req.query;
  const data = await adminService.listArticles({
    page: Number(page) || 1,
    limit: Number(limit) || 20,
    status,
    category,
    search,
    sort,
  });
  res.json({ success: true, data });
}

async function getArticle(req, res) {
  const data = await adminService.getArticle(req.params.id);
  res.json({ success: true, data });
}

async function createArticle(req, res) {
  const data = await adminService.createArticle(req.body);
  res.status(201).json({ success: true, data });
}

async function updateArticle(req, res) {
  const data = await adminService.updateArticle(req.params.id, req.body);
  res.json({ success: true, data });
}

async function deleteArticle(req, res) {
  const data = await adminService.deleteArticle(req.params.id);
  res.json({ success: true, data });
}

async function duplicateArticle(req, res) {
  const data = await adminService.duplicateArticle(req.params.id);
  res.json({ success: true, data });
}

async function getArticleAnalytics(req, res) {
  const data = await adminService.getArticleAnalytics(req.params.id);
  res.json({ success: true, data });
}

// ─── EVENTS ─────────────────────────────────────────────────────
async function getEvents(req, res) {
  const { page, limit, status, sort } = req.query;
  const data = await adminService.listEvents({
    page: Number(page) || 1,
    limit: Number(limit) || 20,
    status,
    sort,
  });
  res.json({ success: true, data });
}

async function createEvent(req, res) {
  const data = await adminService.createEvent({ ...req.body, createdBy: req.user.userId });
  res.status(201).json({ success: true, data });
}

async function updateEvent(req, res) {
  const data = await adminService.updateEvent(req.params.id, req.body);
  res.json({ success: true, data });
}

async function deleteEvent(req, res) {
  const data = await adminService.deleteEvent(req.params.id);
  res.json({ success: true, data });
}

async function duplicateEvent(req, res) {
  const data = await adminService.duplicateEvent(req.params.id, req.user.userId);
  res.status(201).json({ success: true, data });
}

async function getEventRegistrations(req, res) {
  const data = await adminService.getEventRegistrations(req.params.id, req.query);
  res.json({ success: true, data });
}

async function getEventAnalytics(req, res) {
  const data = await adminService.getEventAnalytics(req.params.id);
  res.json({ success: true, data });
}

async function recountEventRegistrations(req, res) {
  const data = await adminService.recountEventRegistrations(req.params.id);
  res.json({ success: true, data });
}

// ─── LEADS/CRM ──────────────────────────────────────────────────
async function getLeads(req, res) {
  const { page, limit, status, sort } = req.query;
  const data = await adminService.listLeads({
    page: Number(page) || 1,
    limit: Number(limit) || 20,
    status,
    sort,
  });
  res.json({ success: true, data });
}

async function createLead(req, res) {
  const data = await adminService.createLead(req.body);
  res.status(201).json({ success: true, data });
}

async function updateLead(req, res) {
  const data = await adminService.updateLead(req.params.id, req.body);
  res.json({ success: true, data });
}

async function deleteLead(req, res) {
  const data = await adminService.deleteLead(req.params.id);
  res.json({ success: true, data });
}

// ─── TESTIMONIALS ───────────────────────────────────────────────
async function getTestimonials(req, res) {
  const { page, limit, status, sort } = req.query;
  const data = await adminService.listTestimonials({
    page: Number(page) || 1,
    limit: Number(limit) || 20,
    status,
    sort,
  });
  res.json({ success: true, data });
}

async function createTestimonial(req, res) {
  const data = await adminService.createTestimonial(req.body);
  res.status(201).json({ success: true, data });
}

async function updateTestimonial(req, res) {
  const data = await adminService.updateTestimonial(req.params.id, req.body);
  res.json({ success: true, data });
}

async function deleteTestimonial(req, res) {
  const data = await adminService.deleteTestimonial(req.params.id);
  res.json({ success: true, data });
}

// ─── NOTIFICATIONS ──────────────────────────────────────────────
async function getNotifications(req, res) {
  const { page, limit, sort } = req.query;
  const data = await adminService.listNotifications({
    page: Number(page) || 1,
    limit: Number(limit) || 20,
    sort,
  });
  res.json({ success: true, data });
}

async function createNotification(req, res) {
  const data = await adminService.createNotification({ ...req.body, sentBy: req.user.userId });
  res.status(201).json({ success: true, data });
}

async function deleteNotification(req, res) {
  const data = await adminService.deleteNotification(req.params.id);
  res.json({ success: true, data });
}

async function notifyEventRegistrants(req, res) {
  const { title, message, type, deliveryMethods } = req.body;
  if (!title || !message) {
    return res.status(400).json({ success: false, message: 'Title and message are required' });
  }
  const data = await adminService.notifyEventRegistrants(
    req.params.id,
    { title, message, type, deliveryMethods },
    req.user.userId
  );
  res.json({ success: true, data });
}

// ─── SETTINGS ───────────────────────────────────────────────────
async function getSettings(req, res) {
  const data = await adminService.getSettings(req.query.category);
  res.json({ success: true, data });
}

async function upsertSetting(req, res) {
  const data = await adminService.upsertSetting({ ...req.body, updatedBy: req.user.userId });
  res.json({ success: true, data });
}

async function deleteSetting(req, res) {
  const data = await adminService.deleteSetting(req.params.key);
  res.json({ success: true, data });
}

// ─── MENTORS (ADMIN) ────────────────────────────────────────────
async function getMentorApplications(req, res) {
  const { status, page, limit } = req.query;
  const data = await adminService.listMentorApplications({ status, page: Number(page) || 1, limit: Number(limit) || 50 });
  res.json({ success: true, data });
}

async function patchMentorApplication(req, res) {
  const data = await adminService.updateMentorApplication(req.params.id, req.body);
  res.json({ success: true, data });
}

async function getMentorRequests(req, res) {
  const { status, page, limit } = req.query;
  const data = await adminService.listMentorRequests({ status, page: Number(page) || 1, limit: Number(limit) || 50 });
  res.json({ success: true, data });
}

async function patchMentorRequest(req, res) {
  const data = await adminService.updateMentorRequest(req.params.id, req.body);
  res.json({ success: true, data });
}

// ─── INVESTORS (ADMIN) ──────────────────────────────────────────
async function getInvestorRequests(req, res) {
  const { status, page, limit } = req.query;
  const data = await adminService.listInvestorRequests({ status, page: Number(page) || 1, limit: Number(limit) || 50 });
  res.json({ success: true, data });
}

async function patchInvestorRequest(req, res) {
  const data = await adminService.updateInvestorRequest(req.params.id, req.body);
  res.json({ success: true, data });
}

async function getExploreRequests(req, res) {
  const { status, page, limit } = req.query;
  const data = await adminService.listExploreRequests({ status, page: Number(page) || 1, limit: Number(limit) || 50 });
  res.json({ success: true, data });
}

async function patchExploreRequest(req, res) {
  const data = await adminService.updateExploreRequest(req.params.id, req.body);
  res.json({ success: true, data });
}

// ─── ECOSYSTEM ──────────────────────────────────────────────────
async function getEcosystem(req, res) {
  const { category, page, limit, search, featured } = req.query;
  const data = await adminService.listEcosystem({ category, page: Number(page) || 1, limit: Number(limit) || 50, search, featured });
  res.json({ success: true, data });
}

async function createEcosystemEntry(req, res) {
  const data = await adminService.createEcosystemEntry(req.body);
  res.status(201).json({ success: true, data });
}

async function updateEcosystemEntry(req, res) {
  const data = await adminService.updateEcosystemEntry(req.params.id, req.body);
  res.json({ success: true, data });
}

async function deleteEcosystemEntry(req, res) {
  const data = await adminService.deleteEcosystemEntry(req.params.id);
  res.json({ success: true, data });
}

module.exports = {
  dashboard,
  monitoring,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  // Course Builder
  getModules,
  createModule,
  updateModule,
  deleteModule,
  reorderModules,
  getLessons,
  createLesson,
  updateLesson,
  deleteLesson,
  getModuleQuiz,
  upsertModuleQuiz,
  deleteModuleQuiz,
  addCourseMaterial,
  deleteCourseMaterial,
  getUploadUrl,
  getPayments,
  refundPayment,
  getEnrollments,
  createEnrollment,
  getCertificates,
  revokeCertificate,
  getArticles,
  getArticle,
  createArticle,
  updateArticle,
  deleteArticle,
  duplicateArticle,
  getArticleAnalytics,
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  duplicateEvent,
  getEventRegistrations,
  getEventAnalytics,
  recountEventRegistrations,
  getLeads,
  createLead,
  updateLead,
  deleteLead,
  getTestimonials,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
  getNotifications,
  createNotification,
  deleteNotification,
  notifyEventRegistrants,
  getSettings,
  upsertSetting,
  deleteSetting,
  getEcosystem,
  createEcosystemEntry,
  updateEcosystemEntry,
  deleteEcosystemEntry,
  getInvestorRequests,
  patchInvestorRequest,
  getExploreRequests,
  patchExploreRequest,
  getMentorApplications,
  patchMentorApplication,
  getMentorRequests,
  patchMentorRequest,
  sendPushToAll,
  sendPushToRole,
  getPushStats,
  sendEmailToAll,
  sendEmailToRole,
  getEmailStats,
  getEventPartners,
  createEventPartner,
  updateEventPartner,
  deleteEventPartner,
};

// ─── PUSH NOTIFICATIONS ─────────────────────────────────────────
async function sendPushToAll(req, res) {
  const { title, body, imageUrl, data } = req.body;
  if (!title || !body) return res.status(400).json({ success: false, message: 'title and body required' });
  const result = await pushService.sendToAll({ title, body, imageUrl, data });
  if (result.error) return res.status(503).json({ success: false, message: result.error });
  res.json({ success: true, data: result });
}

async function sendPushToRole(req, res) {
  const { role, title, body, imageUrl, data } = req.body;
  if (!role || !title || !body) return res.status(400).json({ success: false, message: 'role, title and body required' });
  const result = await pushService.sendToRole(role, { title, body, imageUrl, data });
  if (result.error) return res.status(503).json({ success: false, message: result.error });
  res.json({ success: true, data: result });
}

async function getPushStats(req, res) {
  const { User } = require('../users/user.model');
  const { GuestToken } = require('../push/guest-token.model');
  const [userCount, guestCount, roleAgg] = await Promise.all([
    User.countDocuments({ fcmTokens: { $exists: true, $not: { $size: 0 } } }),
    GuestToken.countDocuments(),
    User.aggregate([
      { $match: { fcmTokens: { $exists: true, $not: { $size: 0 } } } },
      { $group: { _id: '$role', count: { $sum: 1 } } },
    ]),
  ]);
  const byRole = roleAgg.reduce((acc, r) => { acc[r._id] = r.count; return acc; }, {});
  res.json({ success: true, data: { totalSubscribers: userCount + guestCount, userSubscribers: userCount, guestSubscribers: guestCount, byRole } });
}

// ─── EMAIL BROADCASTS ───────────────────────────────────────────
async function sendEmailToAll(req, res) {
  const { subject, body, ctaUrl, ctaText } = req.body;
  if (!subject || !body) return res.status(400).json({ success: false, message: 'subject and body required' });
  const { getBroadcastEmailTemplate } = require('../../utils/emailTemplates');
  const { sendToAll } = require('../../utils/emailService');
  const { html, text } = getBroadcastEmailTemplate({ subject, body, ctaUrl, ctaText });
  const result = await sendToAll({ subject, html, text });
  res.json({ success: true, data: result });
}

async function sendEmailToRole(req, res) {
  const { role, subject, body, ctaUrl, ctaText } = req.body;
  if (!role || !subject || !body) return res.status(400).json({ success: false, message: 'role, subject and body required' });
  const { getBroadcastEmailTemplate } = require('../../utils/emailTemplates');
  const { sendToRole } = require('../../utils/emailService');
  const { html, text } = getBroadcastEmailTemplate({ subject, body, ctaUrl, ctaText });
  const result = await sendToRole(role, { subject, html, text });
  res.json({ success: true, data: result });
}

async function getEmailStats(req, res) {
  const { getEmailStats: stats } = require('../../utils/emailService');
  const data = await stats();
  res.json({ success: true, data });
}

// ─── EVENT PARTNERS LIBRARY ─────────────────────────────────────
async function getEventPartners(req, res) {
  const { type } = req.query;
  const data = await adminService.listEventPartners({ type });
  res.json({ success: true, data });
}

async function createEventPartner(req, res) {
  const data = await adminService.createEventPartner(req.body);
  res.status(201).json({ success: true, data });
}

async function updateEventPartner(req, res) {
  const data = await adminService.updateEventPartner(req.params.id, req.body);
  res.json({ success: true, data });
}

async function deleteEventPartner(req, res) {
  const data = await adminService.deleteEventPartner(req.params.id);
  res.json({ success: true, data });
}
