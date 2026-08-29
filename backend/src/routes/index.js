const { authRouter } = require('../modules/auth/auth.routes');
const { assessmentsRouter } = require('../modules/assessments/assessments.routes');
const { usersRouter } = require('../modules/users/users.routes');
const { coursesRouter } = require('../modules/courses/courses.routes');
const { enrollmentsRouter } = require('../modules/enrollments/enrollments.routes');
const { paymentsRouter } = require('../modules/payments/payments.routes');
const { certificatesRouter } = require('../modules/certificates/certificates.routes');
const { profilesRouter } = require('../modules/profiles/profiles.routes');
const { learningRouter } = require('../modules/learning/learning.routes');
const { learnRouter } = require('../modules/learning/learningEngine.routes');
const { adminRouter } = require('../modules/admin/admin.routes');
const { analyticsRouter } = require('../modules/analytics/analytics.routes');
const { achievementsRouter } = require('../modules/achievements/achievements.routes');
const { communityRouter } = require('../modules/community/community.routes');
const { settingsRouter } = require('../modules/settings/settings.routes');
const { mediaRouter } = require('../modules/media/media.routes');
const { eventsRouter } = require('../modules/events/events.routes');
const articleRouter = require('../modules/public/article.routes');
const { publicRouter } = require('../modules/public/public.routes');
const { locationRouter } = require('../modules/location/location.routes');
const { grantsRouter } = require('../modules/grants/grants.routes');
const { grantsAdminRouter } = require('../modules/grants/grants.admin.routes');
const { campaignsAdminRouter, redirectRouter, scanRouter } = require('../modules/campaigns/campaigns.routes');
const { asyncHandler } = require('../utils/asyncHandler');
const { authRequired } = require('../middlewares/authMiddleware');
const { getActivities } = require('../utils/activityLogger');
const env = require('../config/env');

function registerRoutes(app) {
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/users', usersRouter);
  app.use('/api/v1/courses', coursesRouter);
  app.use('/api/v1/enrollments', enrollmentsRouter);
  app.use('/api/v1/payments', paymentsRouter);
  app.use('/api/v1/certificates', certificatesRouter);
  app.use('/api/v1/profiles', profilesRouter);
  app.use('/api/v1/learning', learningRouter);
  app.use('/api/v1/learn', learnRouter);
  app.use('/api/v1/assessments', assessmentsRouter);

  // CRM bulk email: public tracking/unsubscribe + admin-gated management.
  const { crmRouter } = require('../modules/crm/crm.routes');
  app.use('/api/v1/crm', crmRouter);

  // Startup Grant - student-facing. Every route is scoped to the caller.
  app.use('/api/v1/grants', grantsRouter);

  // Startup Grant - admin. Mounted BEFORE adminRouter so the more specific
  // /grants prefix wins, and gated by an admin role check of its own: knowing
  // the secret slug is not authorisation.
  app.use(`/api/v1/${env.ADMIN_SLUG}/grants`, grantsAdminRouter);

  // Campaign / QR tracking - admin management routes
  app.use(`/api/v1/${env.ADMIN_SLUG}/campaigns`, campaignsAdminRouter);

  // Admin routes mounted under the secret slug - /api/v1/admin returns 404
  app.use(`/api/v1/${env.ADMIN_SLUG}`, adminRouter);

  // Public QR redirect endpoint - /r/:code - no auth required
  app.use('/r', redirectRouter);

  // Public QR scan ping — called by Next.js middleware on utm_medium=qr landing
  app.use('/api/v1/campaigns/scan', scanRouter);

  // Harden: explicitly 404 any attempt to reach the old /admin path
  app.use('/api/v1/admin', (req, res) => res.status(404).json({ success: false, message: 'Not found' }));
  app.use('/api/v1/analytics', analyticsRouter);
  app.use('/api/v1/achievements', achievementsRouter);
  app.use('/api/v1/community', communityRouter);
  app.use('/api/v1/settings', settingsRouter);
  app.use('/api/v1/media', mediaRouter);
  app.use('/api/v1/events', eventsRouter);
  app.use('/api/v1/articles', articleRouter);
  app.use('/api/v1/public', publicRouter);
  app.use('/api/v1/location', locationRouter);

  // Mentors routes
  const mentorsRouter = require('../modules/mentors/mentors.routes');
  app.use('/api/v1/mentors', mentorsRouter);

  // Investors routes
  const investorsRouter = require('../modules/investors/investors.routes');
  app.use('/api/v1/investors', investorsRouter);

  // Public push subscribe (no auth - any visitor can subscribe)
  const { pushRouter } = require('../modules/push/push.routes');
  app.use('/api/v1/push', pushRouter);

  // Public ecosystem route
  const { asyncHandler: ah } = require('../utils/asyncHandler');
  const adminService = require('../modules/admin/admin.service');
  app.get('/api/v1/ecosystem', ah(async (req, res) => {
    const data = await adminService.getPublicEcosystem();
    res.json({ success: true, data });
  }));

  // Public upload URL endpoint (alias to media/upload-url)
  const mediaController = require('../modules/media/media.controller');
  const { requireRole } = require('../middlewares/authMiddleware');
  app.post(
    '/api/v1/upload-url',
    authRequired,
    requireRole('admin', 'instructor'),
    asyncHandler(mediaController.getUploadUrl)
  );
  app.post(
    '/api/v1/upload-complete',
    authRequired,
    requireRole('admin', 'instructor'),
    asyncHandler(mediaController.completeUpload)
  );

  // Activity feed
  app.get(
    '/api/v1/activity',
    authRequired,
    asyncHandler(async (req, res) => {
      const activities = await getActivities(req.user.userId, Number(req.query.limit) || 20);
      res.json({ success: true, data: activities });
    })
  );
}

module.exports = { registerRoutes };
