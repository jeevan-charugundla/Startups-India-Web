const crypto = require('crypto');
const { Campaign } = require('../../models/Campaign');
const { TrackingLink } = require('../../models/TrackingLink');
const { CampaignScan } = require('../../models/CampaignScan');

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Build the final redirect URL by appending UTM + custom params to the
 * destination URL.
 */
function buildRedirectUrl(link) {
  const url = new URL(link.destinationUrl);

  const utmMap = {
    utm_source: link.utmSource,
    utm_medium: link.utmMedium,
    utm_campaign: link.utmCampaign,
    utm_term: link.utmTerm,
    utm_content: link.utmContent,
  };

  for (const [key, val] of Object.entries(utmMap)) {
    if (val) url.searchParams.set(key, val);
  }

  if (link.customParams) {
    for (const [key, val] of link.customParams.entries()) {
      if (val) url.searchParams.set(key, val);
    }
  }

  return url.toString();
}

/**
 * Parse a User-Agent string into structured device/browser/os fields.
 * Intentionally lightweight - no external dependency needed.
 */
function parseUserAgent(ua = '') {
  const s = ua.toLowerCase();

  let deviceType = 'desktop';
  if (/bot|crawler|spider|slurp|bingbot|googlebot/.test(s)) {
    deviceType = 'bot';
  } else if (/mobile|android.*mobile|iphone|windows phone/.test(s)) {
    deviceType = 'mobile';
  } else if (/ipad|tablet|android(?!.*mobile)/.test(s)) {
    deviceType = 'tablet';
  }

  let browser = 'Other';
  if (s.includes('edg/') || s.includes('edge/')) browser = 'Edge';
  else if (s.includes('opr/') || s.includes('opera')) browser = 'Opera';
  else if (s.includes('chrome') && !s.includes('chromium')) browser = 'Chrome';
  else if (s.includes('safari') && !s.includes('chrome')) browser = 'Safari';
  else if (s.includes('firefox')) browser = 'Firefox';
  else if (s.includes('msie') || s.includes('trident')) browser = 'IE';

  let os = 'Other';
  if (s.includes('windows')) os = 'Windows';
  else if (s.includes('mac os') || s.includes('macos')) os = 'macOS';
  else if (s.includes('android')) os = 'Android';
  else if (s.includes('ios') || s.includes('iphone') || s.includes('ipad')) os = 'iOS';
  else if (s.includes('linux')) os = 'Linux';

  return { deviceType, browser, os };
}

function hashVisitor(ip, ua) {
  return crypto
    .createHash('sha256')
    .update(`${ip}|${ua}`)
    .digest('hex')
    .slice(0, 16); // 64-bit prefix is plenty for uniqueness counting
}

// ─── Campaigns CRUD ──────────────────────────────────────────────────────────

async function listCampaigns({ page = 1, limit = 20, search, status }) {
  const query = {};
  if (status) query.status = status;
  if (search) query.name = { $regex: search, $options: 'i' };

  const [campaigns, total] = await Promise.all([
    Campaign.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Campaign.countDocuments(query),
  ]);

  // Attach link count to each campaign
  const ids = campaigns.map(c => c._id);
  const linkCounts = await TrackingLink.aggregate([
    { $match: { campaign: { $in: ids } } },
    { $group: { _id: '$campaign', count: { $sum: 1 }, totalScans: { $sum: '$scanCount' } } },
  ]);
  const linkMap = Object.fromEntries(linkCounts.map(l => [l._id.toString(), l]));

  return {
    campaigns: campaigns.map(c => ({
      ...c,
      route: c.route || '/',
      linkCount: linkMap[c._id.toString()]?.count || 0,
      totalScans: linkMap[c._id.toString()]?.totalScans || 0,
    })),
    total,
    pages: Math.ceil(total / limit),
    page,
  };
}

async function getCampaign(id) {
  const campaign = await Campaign.findById(id).lean();
  if (!campaign) throw Object.assign(new Error('Campaign not found'), { status: 404 });
  return campaign;
}

async function createCampaign(data) {
  const campaign = await Campaign.create({
    name: data.name,
    description: data.description,
    route: data.route || '/',
    status: data.status || 'active',
    createdBy: data.createdBy,
  });
  return campaign;
}

async function updateCampaign(id, data) {
  const campaign = await Campaign.findByIdAndUpdate(
    id,
    { $set: { name: data.name, description: data.description, route: data.route, status: data.status } },
    { new: true, runValidators: true }
  );
  if (!campaign) throw Object.assign(new Error('Campaign not found'), { status: 404 });
  return campaign;
}

async function deleteCampaign(id) {
  const campaign = await Campaign.findByIdAndDelete(id);
  if (!campaign) throw Object.assign(new Error('Campaign not found'), { status: 404 });
  // Cascade delete links and scans
  const links = await TrackingLink.find({ campaign: id }).select('_id').lean();
  const linkIds = links.map(l => l._id);
  await Promise.all([
    TrackingLink.deleteMany({ campaign: id }),
    CampaignScan.deleteMany({ campaign: id }),
  ]);
  return { deleted: true, linksRemoved: linkIds.length };
}

// ─── Tracking Links CRUD ─────────────────────────────────────────────────────

async function listLinks(campaignId) {
  const links = await TrackingLink.find({ campaign: campaignId })
    .sort({ createdAt: -1 })
    .lean();
  return links;
}

async function getLink(id) {
  const link = await TrackingLink.findById(id).lean();
  if (!link) throw Object.assign(new Error('Link not found'), { status: 404 });
  return link;
}

async function createLink(data) {
  const campaign = await Campaign.findById(data.campaignId);
  if (!campaign) throw Object.assign(new Error('Campaign not found'), { status: 404 });

  const link = await TrackingLink.create({
    campaign: data.campaignId,
    destinationUrl: data.destinationUrl,
    utmSource: data.utmSource,
    utmMedium: data.utmMedium,
    utmCampaign: data.utmCampaign,
    utmTerm: data.utmTerm,
    utmContent: data.utmContent,
    customParams: data.customParams || {},
    label: data.label,
    qr: {
      foreground: data.qrForeground || '#000000',
      background: data.qrBackground || '#FFFFFF',
      size: data.qrSize || 300,
      logoUrl: data.qrLogoUrl,
    },
  });
  return link;
}

async function updateLink(id, data) {
  const link = await TrackingLink.findByIdAndUpdate(
    id,
    {
      $set: {
        destinationUrl: data.destinationUrl,
        utmSource: data.utmSource,
        utmMedium: data.utmMedium,
        utmCampaign: data.utmCampaign,
        utmTerm: data.utmTerm,
        utmContent: data.utmContent,
        customParams: data.customParams || {},
        label: data.label,
        isActive: data.isActive,
        'qr.foreground': data.qrForeground,
        'qr.background': data.qrBackground,
        'qr.size': data.qrSize,
        'qr.logoUrl': data.qrLogoUrl,
      },
    },
    { new: true, runValidators: true }
  );
  if (!link) throw Object.assign(new Error('Link not found'), { status: 404 });
  return link;
}

async function deleteLink(id) {
  const link = await TrackingLink.findByIdAndDelete(id);
  if (!link) throw Object.assign(new Error('Link not found'), { status: 404 });
  await CampaignScan.deleteMany({ trackingLink: id });
  return { deleted: true };
}

// ─── Redirect + Scan recording ───────────────────────────────────────────────

/**
 * Called by the public /r/:code endpoint.
 * Records the scan and returns the full redirect URL.
 */
async function recordScanAndGetRedirect(shortCode, req) {
  const link = await TrackingLink.findOneAndUpdate(
    { shortCode, isActive: true },
    { $inc: { scanCount: 1 } },
    { new: true }
  );

  if (!link) return null;

  const ip =
    (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    '';
  const ua = req.headers['user-agent'] || '';
  const { deviceType, browser, os } = parseUserAgent(ua);

  // Fire-and-forget scan recording - don't delay the redirect
  setImmediate(async () => {
    try {
      await CampaignScan.create({
        trackingLink: link._id,
        campaign: link.campaign,
        visitorHash: hashVisitor(ip, ua),
        deviceType,
        browser,
        os,
        referrer: (req.headers['referer'] || req.headers['referrer'] || '').slice(0, 500),
      });
    } catch {
      // Non-critical - never crash the redirect
    }
  });

  return buildRedirectUrl(link);
}

// ─── Analytics ───────────────────────────────────────────────────────────────

async function getCampaignAnalytics(campaignId) {
  const [totalScans, uniqueVisitors, deviceBreakdown, browserBreakdown, osBreakdown, timeSeriesRaw, linkBreakdown] =
    await Promise.all([
      CampaignScan.countDocuments({ campaign: campaignId }),
      CampaignScan.distinct('visitorHash', { campaign: campaignId }).then(a => a.length),
      CampaignScan.aggregate([
        { $match: { campaign: new (require('mongoose').Types.ObjectId)(campaignId) } },
        { $group: { _id: '$deviceType', count: { $sum: 1 } } },
      ]),
      CampaignScan.aggregate([
        { $match: { campaign: new (require('mongoose').Types.ObjectId)(campaignId) } },
        { $group: { _id: '$browser', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),
      CampaignScan.aggregate([
        { $match: { campaign: new (require('mongoose').Types.ObjectId)(campaignId) } },
        { $group: { _id: '$os', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),
      CampaignScan.aggregate([
        { $match: { campaign: new (require('mongoose').Types.ObjectId)(campaignId) } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $limit: 30 },
      ]),
      TrackingLink.find({ campaign: campaignId })
        .select('label shortCode scanCount isActive')
        .lean(),
    ]);

  const devices = Object.fromEntries(deviceBreakdown.map(d => [d._id, d.count]));

  return {
    totalScans,
    uniqueVisitors,
    devices,
    browsers: browserBreakdown.map(b => ({ name: b._id || 'Unknown', count: b.count })),
    os: osBreakdown.map(o => ({ name: o._id || 'Unknown', count: o.count })),
    timeSeries: timeSeriesRaw.map(t => ({ date: t._id, count: t.count })),
    links: linkBreakdown,
  };
}

async function getLinkAnalytics(linkId) {
  const mongoose = require('mongoose');
  const oid = new mongoose.Types.ObjectId(linkId);

  const [totalScans, uniqueVisitors, deviceBreakdown, timeSeriesRaw] = await Promise.all([
    CampaignScan.countDocuments({ trackingLink: oid }),
    CampaignScan.distinct('visitorHash', { trackingLink: oid }).then(a => a.length),
    CampaignScan.aggregate([
      { $match: { trackingLink: oid } },
      { $group: { _id: '$deviceType', count: { $sum: 1 } } },
    ]),
    CampaignScan.aggregate([
      { $match: { trackingLink: oid } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 30 },
    ]),
  ]);

  return {
    totalScans,
    uniqueVisitors,
    devices: Object.fromEntries(deviceBreakdown.map(d => [d._id, d.count])),
    timeSeries: timeSeriesRaw.map(t => ({ date: t._id, count: t.count })),
  };
}

module.exports = {
  listCampaigns,
  getCampaign,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  listLinks,
  getLink,
  createLink,
  updateLink,
  deleteLink,
  recordScanAndGetRedirect,
  getCampaignAnalytics,
  getLinkAnalytics,
  buildRedirectUrl,
};
