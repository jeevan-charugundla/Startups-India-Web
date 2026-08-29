const { Router } = require('express');
const { authRequired, requireRole } = require('../../middlewares/authMiddleware');
const { asyncHandler } = require('../../utils/asyncHandler');
const { cacheMiddleware } = require('../../middlewares/cache.middleware');
const { auditLogMiddleware } = require('../../middlewares/auditLog.middleware');
const ctrl = require('./admin.controller');
const obs = require('./observability.controller');

const adminRouter = Router();

// All admin routes require authentication + admin role, and log every write action
adminRouter.use(authRequired, requireRole('admin'), auditLogMiddleware);

// Dashboard analytics (cached 60s)
adminRouter.get('/dashboard', cacheMiddleware('dashboard:stats', 60), asyncHandler(ctrl.dashboard));

// Monitoring
adminRouter.get('/monitoring', asyncHandler(ctrl.monitoring));

// Users
adminRouter.get('/users', asyncHandler(ctrl.getUsers));
adminRouter.get('/users/:id', asyncHandler(ctrl.getUser));
adminRouter.patch('/users/:id', asyncHandler(ctrl.updateUser));
adminRouter.delete('/users/:id', asyncHandler(ctrl.deleteUser));

// Courses
adminRouter.get('/courses', asyncHandler(ctrl.getCourses));
adminRouter.get('/courses/:id', asyncHandler(ctrl.getCourse));
adminRouter.post('/courses', asyncHandler(ctrl.createCourse));
adminRouter.patch('/courses/:id', asyncHandler(ctrl.updateCourse));
adminRouter.delete('/courses/:id', asyncHandler(ctrl.deleteCourse));

// Course Builder - Modules
adminRouter.get('/courses/:courseId/modules', asyncHandler(ctrl.getModules));
adminRouter.post('/modules', asyncHandler(ctrl.createModule));
adminRouter.patch('/modules/:id', asyncHandler(ctrl.updateModule));
adminRouter.delete('/modules/:id', asyncHandler(ctrl.deleteModule));
adminRouter.post('/courses/:courseId/modules/reorder', asyncHandler(ctrl.reorderModules));

// Course Builder - Lessons
adminRouter.get('/modules/:moduleId/lessons', asyncHandler(ctrl.getLessons));
adminRouter.post('/lessons', asyncHandler(ctrl.createLesson));
adminRouter.patch('/lessons/:id', asyncHandler(ctrl.updateLesson));
adminRouter.delete('/lessons/:id', asyncHandler(ctrl.deleteLesson));

// Course Builder - Quizzes
adminRouter.get('/modules/:moduleId/quiz', asyncHandler(ctrl.getModuleQuiz));
adminRouter.post('/quizzes', asyncHandler(ctrl.upsertModuleQuiz));
adminRouter.delete('/modules/:moduleId/quiz', asyncHandler(ctrl.deleteModuleQuiz));

// Course Materials (admin-uploaded notes/PDFs)
adminRouter.post('/courses/:id/materials', asyncHandler(ctrl.addCourseMaterial));
adminRouter.delete('/courses/:id/materials/:materialId', asyncHandler(ctrl.deleteCourseMaterial));

// S3 Upload URL
adminRouter.post('/upload-url', asyncHandler(ctrl.getUploadUrl));

// Payments
adminRouter.get('/payments', asyncHandler(ctrl.getPayments));
adminRouter.post('/payments/:id/refund', asyncHandler(ctrl.refundPayment));

// Enrollments
adminRouter.get('/enrollments', asyncHandler(ctrl.getEnrollments));
adminRouter.post('/enrollments', asyncHandler(ctrl.createEnrollment));

// Certificates
adminRouter.get('/certificates', asyncHandler(ctrl.getCertificates));
adminRouter.post('/certificates/:id/revoke', asyncHandler(ctrl.revokeCertificate));

// Articles
adminRouter.get('/articles', asyncHandler(ctrl.getArticles));
adminRouter.get('/articles/:id', asyncHandler(ctrl.getArticle));
adminRouter.post('/articles', asyncHandler(ctrl.createArticle));
adminRouter.patch('/articles/:id', asyncHandler(ctrl.updateArticle));
adminRouter.delete('/articles/:id', asyncHandler(ctrl.deleteArticle));
adminRouter.post('/articles/:id/duplicate', asyncHandler(ctrl.duplicateArticle));
adminRouter.get('/articles/:id/analytics', asyncHandler(ctrl.getArticleAnalytics));

// Events
adminRouter.get('/events', asyncHandler(ctrl.getEvents));
adminRouter.post('/events', asyncHandler(ctrl.createEvent));
adminRouter.patch('/events/:id', asyncHandler(ctrl.updateEvent));
adminRouter.delete('/events/:id', asyncHandler(ctrl.deleteEvent));
adminRouter.post('/events/:id/duplicate', asyncHandler(ctrl.duplicateEvent));
adminRouter.get('/events/:id/registrations', asyncHandler(ctrl.getEventRegistrations));
adminRouter.post('/events/:id/notify-registrants', asyncHandler(ctrl.notifyEventRegistrants));
adminRouter.get('/events/:id/analytics', asyncHandler(ctrl.getEventAnalytics));
adminRouter.post('/events/:id/recount', asyncHandler(ctrl.recountEventRegistrations));

// Event Partners Library (reusable organiser / partner / sponsor directory)
adminRouter.get('/event-partners', asyncHandler(ctrl.getEventPartners));
adminRouter.post('/event-partners', asyncHandler(ctrl.createEventPartner));
adminRouter.patch('/event-partners/:id', asyncHandler(ctrl.updateEventPartner));
adminRouter.delete('/event-partners/:id', asyncHandler(ctrl.deleteEventPartner));

// Leads/CRM
adminRouter.get('/leads', asyncHandler(ctrl.getLeads));
adminRouter.post('/leads', asyncHandler(ctrl.createLead));
adminRouter.patch('/leads/:id', asyncHandler(ctrl.updateLead));
adminRouter.delete('/leads/:id', asyncHandler(ctrl.deleteLead));

// Testimonials
adminRouter.get('/testimonials', asyncHandler(ctrl.getTestimonials));
adminRouter.post('/testimonials', asyncHandler(ctrl.createTestimonial));
adminRouter.patch('/testimonials/:id', asyncHandler(ctrl.updateTestimonial));
adminRouter.delete('/testimonials/:id', asyncHandler(ctrl.deleteTestimonial));

// Notifications
adminRouter.get('/notifications', asyncHandler(ctrl.getNotifications));
adminRouter.post('/notifications', asyncHandler(ctrl.createNotification));
adminRouter.delete('/notifications/:id', asyncHandler(ctrl.deleteNotification));

// Settings
adminRouter.get('/settings', asyncHandler(ctrl.getSettings));
adminRouter.post('/settings', asyncHandler(ctrl.upsertSetting));
adminRouter.delete('/settings/:key', asyncHandler(ctrl.deleteSetting));

// Mentors
adminRouter.get('/mentors/applications', asyncHandler(ctrl.getMentorApplications));
adminRouter.patch('/mentors/applications/:id', asyncHandler(ctrl.patchMentorApplication));
adminRouter.get('/mentors/requests', asyncHandler(ctrl.getMentorRequests));
adminRouter.patch('/mentors/requests/:id', asyncHandler(ctrl.patchMentorRequest));

// Investors
adminRouter.get('/investors/requests', asyncHandler(ctrl.getInvestorRequests));
adminRouter.patch('/investors/requests/:id', asyncHandler(ctrl.patchInvestorRequest));
adminRouter.get('/investors/explore', asyncHandler(ctrl.getExploreRequests));
adminRouter.patch('/investors/explore/:id', asyncHandler(ctrl.patchExploreRequest));

// Push Notifications
adminRouter.post('/push/send-all',  asyncHandler(ctrl.sendPushToAll));
adminRouter.post('/push/send-role', asyncHandler(ctrl.sendPushToRole));
adminRouter.get('/push/stats',      asyncHandler(ctrl.getPushStats));

// Email Broadcasts
adminRouter.post('/email/send-all',  asyncHandler(ctrl.sendEmailToAll));
adminRouter.post('/email/send-role', asyncHandler(ctrl.sendEmailToRole));
adminRouter.get('/email/stats',      asyncHandler(ctrl.getEmailStats));

// Ecosystem
adminRouter.get('/ecosystem', asyncHandler(ctrl.getEcosystem));
adminRouter.post('/ecosystem', asyncHandler(ctrl.createEcosystemEntry));
adminRouter.patch('/ecosystem/:id', asyncHandler(ctrl.updateEcosystemEntry));
adminRouter.delete('/ecosystem/:id', asyncHandler(ctrl.deleteEcosystemEntry));

// ─── OBSERVABILITY & COMMAND CENTER ───────────────────────────────────
// Security events
adminRouter.get('/observability/security/events', asyncHandler(obs.getSecurityEvents));
adminRouter.get('/observability/security/summary', asyncHandler(obs.getSecuritySummaryRoute));
adminRouter.get('/observability/security/feed', asyncHandler(obs.getLiveSecurityFeed));
adminRouter.patch('/observability/security/events/:id/resolve', asyncHandler(obs.resolveSecurityEvent));

// Audit logs
adminRouter.get('/observability/audit-logs', asyncHandler(obs.getAuditLogs));
adminRouter.get('/observability/audit-logs/summary', asyncHandler(obs.getAuditSummary));

// Incidents
adminRouter.get('/observability/incidents', asyncHandler(obs.getIncidents));
adminRouter.post('/observability/incidents', asyncHandler(obs.createIncident));
adminRouter.patch('/observability/incidents/:id', asyncHandler(obs.updateIncident));
adminRouter.delete('/observability/incidents/:id', asyncHandler(obs.deleteIncident));

// System health + SSE stream
adminRouter.get('/observability/health', asyncHandler(obs.getSystemHealth));
adminRouter.get('/observability/stream', obs.streamMetrics);

module.exports = { adminRouter };
