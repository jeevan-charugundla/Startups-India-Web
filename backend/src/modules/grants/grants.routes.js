const express = require('express');
const { z } = require('zod');
const { asyncHandler } = require('../../utils/asyncHandler');
const { validateBody } = require('../../middlewares/validateBody');
const { authRequired } = require('../../middlewares/authMiddleware');
const { ApiError } = require('../../utils/apiError');
const grantService = require('./grant.service');
const documentsService = require('./grant.documents.service');
const paymentService = require('./grant.payment.service');
const { getGrantSettings, computeEvaluationFee } = require('./grant.settings');
const { STATUS_LABELS } = require('./grant.status');
const { PHASES } = require('./grant.phases');

const router = express.Router();

// Which settings key holds the price for each paid phase. Keeps the config route
// from hardcoding fee amounts - the numbers live in grant.settings.js only.
const PHASE_FEE_KEYS = {
  // Phase key is 'idea_validation' in the 6-stage journey (grant.phases.js).
  idea_validation: 'grant.evaluation.fee',
  pre_incubation: 'grant.preIncubation.fee',
  incubation: 'grant.incubation.fee',
};

// Every route here is student-facing and scoped to the caller. There is no route
// on this router that can read another user's application - admin access lives on
// the separate admin router, behind the secret slug and a role check.
router.use(authRequired);

const founderSchema = z.object({
  fullName: z.string().min(1).max(120),
  email: z.string().email(),
  phone: z.string().max(20).optional().default(''),
  collegeName: z.string().max(200).optional().default(''),
  university: z.string().max(200).optional().default(''),
  city: z.string().max(100).optional().default(''),
  state: z.string().max(100).optional().default(''),
});

const startupSchema = z.object({
  name: z.string().min(1).max(160),
  // Not an enum: the valid values come from admin settings and are checked in
  // the service, so adding a category never requires touching this file.
  stage: z.string().min(1).max(60),
  category: z.string().min(1).max(60),
  teamSize: z.coerce.number().int().min(1).max(10000).optional(),
  problemStatement: z.string().min(1).max(5000),
  solution: z.string().min(1).max(5000),
  targetAudience: z.string().max(2000).optional().default(''),
  businessModel: z.string().max(3000).optional().default(''),
  traction: z.string().max(3000).optional().default(''),
  fundingRaised: z.string().max(200).optional().default(''),
  website: z.string().url().max(500).optional().or(z.literal('')).default(''),
  linkedin: z.string().url().max(500).optional().or(z.literal('')).default(''),
  demoVideoUrl: z.string().url().max(500).optional().or(z.literal('')).default(''),
});

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

// ─── PUBLIC-ISH CONFIG ──────────────────────────────────────────────────
// The form is rendered from this: stages, categories, limits, labels, fee. The
// frontend hardcodes none of it.
router.get(
  '/config',
  asyncHandler(async (req, res) => {
    const s = await getGrantSettings();
    const fee = await computeEvaluationFee();

    res.json({
      success: true,
      data: {
        enabled: s['grant.applications.enabled'],
        evaluationEnabled: s['grant.evaluation.enabled'],
        title: s['grant.ui.title'],
        description: s['grant.ui.description'],
        sidebarLabel: s['grant.ui.sidebarLabel'],
        termsText: s['grant.ui.termsText'],
        stages: s['grant.stages'],
        categories: s['grant.categories'],
        deadline: s['grant.applications.deadline'] || null,
        upload: {
          maxSizeMb: s['grant.upload.maxSizeMb'],
          pitchDeckTypes: s['grant.upload.pitchDeckTypes'],
          documentTypes: s['grant.upload.documentTypes'],
          imageTypes: s['grant.upload.imageTypes'],
          videoTypes: s['grant.upload.videoTypes'],
        },
        evaluationFee: fee,
        statusLabels: STATUS_LABELS,
        // The 5-phase journey (static definitions, no per-applicant state) so the
        // apply page can showcase the full path before anyone applies. `fee` is the
        // base price in paise for phases that have one (0/null = not published).
        phases: PHASES.map(p => {
          const feeKey = PHASE_FEE_KEYS[p.key];
          const phaseFee = feeKey ? s[feeKey] : 0;
          return {
            key: p.key,
            title: p.title,
            subtitle: p.subtitle,
            comingSoon: Boolean(p.comingSoon),
            fee: phaseFee > 0 ? phaseFee : null,
          };
        }),
      },
    });
  })
);

// ─── APPLICATIONS ───────────────────────────────────────────────────────
router.get(
  '/applications',
  asyncHandler(async (req, res) => {
    const items = await grantService.listMyApplications(req.user.userId);
    res.json({
      success: true,
      data: items.map(a => ({ ...a, statusLabel: STATUS_LABELS[a.status] })),
    });
  })
);

router.post(
  '/applications',
  validateBody(z.object({ founder: founderSchema, startup: startupSchema })),
  asyncHandler(async (req, res) => {
    const application = await grantService.saveDraft(req.user.userId, req.body);
    res.status(201).json({ success: true, data: application });
  })
);

router.get(
  '/applications/:id',
  asyncHandler(async (req, res) => {
    const data = await grantService.getMyApplication(req.user.userId, req.params.id);
    res.json({ success: true, data });
  })
);

router.post(
  '/applications/:id/submit',
  validateBody(z.object({ termsAccepted: z.boolean() })),
  asyncHandler(async (req, res) => {
    const application = await grantService.submitApplication(
      req.user.userId,
      req.params.id,
      req.body
    );
    res.json({ success: true, data: application });
  })
);

// ─── DOCUMENTS ──────────────────────────────────────────────────────────
router.post(
  '/applications/:id/documents/upload-url',
  validateBody(
    z.object({
      kind: z.enum(['pitch_deck', 'business_plan', 'product_image', 'demo_video']),
      fileName: z.string().min(1).max(200),
      fileType: z.string().min(1).max(120),
      fileSize: z.coerce.number().int().positive(),
    })
  ),
  asyncHandler(async (req, res) => {
    const data = await documentsService.requestUploadUrl(req.user.userId, {
      applicationDbId: req.params.id,
      ...req.body,
    });
    res.json({ success: true, data });
  })
);

router.post(
  '/applications/:id/documents/complete',
  validateBody(
    z.object({
      kind: z.enum(['pitch_deck', 'business_plan', 'product_image', 'demo_video']),
      key: z.string().min(1).max(500),
      fileName: z.string().min(1).max(200),
      fileType: z.string().min(1).max(120),
    })
  ),
  asyncHandler(async (req, res) => {
    const document = await documentsService.completeUpload(req.user.userId, {
      applicationDbId: req.params.id,
      ...req.body,
    });
    res.status(201).json({ success: true, data: document });
  })
);

router.get(
  '/documents/:documentId/url',
  asyncHandler(async (req, res) => {
    const data = await documentsService.getSignedUrl({
      documentId: req.params.documentId,
      userId: req.user.userId,
      isAdmin: false,
    });
    res.json({ success: true, data });
  })
);

// ─── IDEA EVALUATION (student) ──────────────────────────────────────────
router.get(
  '/applications/:id/evaluation',
  asyncHandler(async (req, res) => {
    const data = await paymentService.getEvaluationSummary(req.user.userId, req.params.id);
    res.json({ success: true, data });
  })
);

// Note there is NO amount in the request body. The price is computed server-side
// from admin settings - a client cannot propose what it would like to pay.
router.post(
  '/applications/:id/evaluation/order',
  asyncHandler(async (req, res) => {
    const data = await paymentService.createEvaluationOrder(req.user.userId, req.params.id);
    res.status(201).json({ success: true, data });
  })
);

router.post(
  '/applications/:id/evaluation/verify',
  validateBody(
    z.object({
      orderId: z.string().min(1),
      paymentId: z.string().min(1),
      signature: z.string().min(1),
    })
  ),
  asyncHandler(async (req, res) => {
    const result = await paymentService.verifyEvaluationPayment(req.user.userId, req.body);
    res.json({
      success: true,
      data: {
        paid: true,
        alreadyPaid: result.alreadyPaid,
        invoiceNumber: result.payment.invoiceNumber,
      },
    });
  })
);

router.get(
  '/applications/:id/invoice',
  asyncHandler(async (req, res) => {
    const data = await paymentService.getInvoice({
      applicationDbId: req.params.id,
      userId: req.user.userId,
      isAdmin: false,
    });
    res.json({ success: true, data });
  })
);

router.delete(
  '/documents/:documentId',
  asyncHandler(async (req, res) => {
    const data = await documentsService.deleteDocument(req.user.userId, req.params.documentId);
    res.json({ success: true, data });
  })
);

// ─── SLOT BOOKING (student) ─────────────────────────────────────────────
const slotService = require('./grant.slot.service');

// Available slots for a given date (not blocked, not booked)
router.get(
  '/slots',
  asyncHandler(async (req, res) => {
    const { date } = req.query;
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new ApiError(400, 'date query param is required (YYYY-MM-DD)');
    }
    const data = await slotService.getAvailableSlots(date);
    res.json({ success: true, data });
  })
);

// Book a slot for an application
router.post(
  '/slots/book',
  validateBody(z.object({
    applicationId: objectId,
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
    time: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be HH:MM'),
    mode: z.enum(['online', 'offline']),
  })),
  asyncHandler(async (req, res) => {
    const data = await slotService.bookSlot({
      userId: req.user.userId,
      ...req.body,
    });
    res.json({ success: true, data });
  })
);

// Cancel existing slot booking (used by reschedule flow - cancel then rebook)
router.delete(
  '/slots/cancel',
  validateBody(z.object({ applicationId: objectId })),
  asyncHandler(async (req, res) => {
    const data = await slotService.cancelSlot({
      userId: req.user.userId,
      applicationId: req.body.applicationId,
    });
    res.json({ success: true, data });
  })
);

module.exports = { grantsRouter: router, objectId, founderSchema, startupSchema };
