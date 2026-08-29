const { Router } = require('express');
const { authRequired, requireRole } = require('../../middlewares/authMiddleware');
const { asyncHandler } = require('../../utils/asyncHandler');
const { auditLogMiddleware } = require('../../middlewares/auditLog.middleware');
const ctrl = require('./campaigns.controller');

// ─── Admin-only campaign management routes ───────────────────────────────────
// Mounted under /api/v1/{ADMIN_SLUG}/campaigns in routes/index.js
const campaignsAdminRouter = Router();

campaignsAdminRouter.use(authRequired, requireRole('admin'), auditLogMiddleware);

// Campaigns CRUD
campaignsAdminRouter.get('/', asyncHandler(ctrl.listCampaigns));
campaignsAdminRouter.get('/:id', asyncHandler(ctrl.getCampaign));
campaignsAdminRouter.post('/', asyncHandler(ctrl.createCampaign));
campaignsAdminRouter.patch('/:id', asyncHandler(ctrl.updateCampaign));
campaignsAdminRouter.delete('/:id', asyncHandler(ctrl.deleteCampaign));
campaignsAdminRouter.get('/:id/analytics', asyncHandler(ctrl.getCampaignAnalytics));

// Tracking links nested under a campaign
campaignsAdminRouter.get('/:campaignId/links', asyncHandler(ctrl.listLinks));
campaignsAdminRouter.post('/:campaignId/links', asyncHandler(ctrl.createLink));
campaignsAdminRouter.patch('/:campaignId/links/:linkId', asyncHandler(ctrl.updateLink));
campaignsAdminRouter.delete('/:campaignId/links/:linkId', asyncHandler(ctrl.deleteLink));
campaignsAdminRouter.get('/:campaignId/links/:linkId/analytics', asyncHandler(ctrl.getLinkAnalytics));

// ─── Public redirect endpoint ─────────────────────────────────────────────────
// Mounted at /r/:code - no auth, no admin slug
const redirectRouter = Router();
redirectRouter.get('/:code', asyncHandler(ctrl.redirect));

// ─── Public scan-ping endpoint ───────────────────────────────────────────────
// Called by Next.js middleware when a visitor lands with utm_medium=qr.
// No auth — intentionally public. Rate-limited at the app level.
const scanRouter = Router();
scanRouter.post('/', asyncHandler(async (req, res) => {
  const { utmCampaign, utmMedium, utmContent, utmSource, pathname, userAgent, ip, referrer } = req.body;

  if (!utmCampaign) return res.status(400).json({ success: false });

  const { TrackingLink } = require('../../models/TrackingLink');
  const { CampaignScan } = require('../../models/CampaignScan');
  const { Campaign } = require('../../models/Campaign');
  const crypto = require('crypto');

  // Match campaign by utm_campaign slug
  const slug = (utmCampaign || '').toLowerCase().replace(/\s+/g, '_');
  const campaign = await Campaign.findOne({
    $expr: {
      $eq: [{ $toLower: { $replaceAll: { input: '$name', find: ' ', replacement: '_' } } }, slug],
    },
  });

  if (!campaign) return res.json({ success: true, tracked: false });

  // Find or get the first tracking link for this campaign
  const link = await TrackingLink.findOneAndUpdate(
    { campaign: campaign._id },
    { $inc: { scanCount: 1 } },
    { new: true }
  );

  if (!link) return res.json({ success: true, tracked: false });

  // Parse device type from user agent
  const ua = (userAgent || '').toLowerCase();
  let deviceType = 'desktop';
  if (/bot|crawler|spider/.test(ua)) deviceType = 'bot';
  else if (/mobile|iphone|android.*mobile/.test(ua)) deviceType = 'mobile';
  else if (/ipad|tablet/.test(ua)) deviceType = 'tablet';

  let browser = 'Other';
  if (ua.includes('edg/')) browser = 'Edge';
  else if (ua.includes('chrome') && !ua.includes('chromium')) browser = 'Chrome';
  else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari';
  else if (ua.includes('firefox')) browser = 'Firefox';

  let os = 'Other';
  if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';
  else if (ua.includes('mac os')) os = 'macOS';
  else if (ua.includes('linux')) os = 'Linux';

  const visitorHash = crypto
    .createHash('sha256')
    .update(`${ip}|${userAgent}`)
    .digest('hex')
    .slice(0, 16);

  await CampaignScan.create({
    trackingLink: link._id,
    campaign: campaign._id,
    visitorHash,
    deviceType,
    browser,
    os,
    referrer: (referrer || '').slice(0, 500),
  });

  res.json({ success: true, tracked: true });
}));

module.exports = { campaignsAdminRouter, redirectRouter, scanRouter };
