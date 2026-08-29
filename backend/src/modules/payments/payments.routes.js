const express = require('express');
const { z } = require('zod');
const { authRequired } = require('../../middlewares/authMiddleware');
const { validateBody } = require('../../middlewares/validateBody');
const { asyncHandler } = require('../../utils/asyncHandler');
const controller = require('./payments.controller');

const router = express.Router();

router.post('/webhook', asyncHandler(controller.handleWebhook));
router.post('/razorpay/webhook', asyncHandler(controller.handleRazorpayWebhook));

router.get('/', authRequired, asyncHandler(controller.listPayments));

router.post(
  '/',
  authRequired,
  validateBody(
    z.object({
      courseId: z.string().min(1).optional(),
      eventId: z.string().min(1).optional(),
      provider: z.enum(['stripe', 'razorpay', 'manual']).optional(),
      paymentIntentId: z.string().optional(),
      amount: z.number().nonnegative(),
      currency: z.string().optional(),
      status: z.enum(['created', 'succeeded', 'failed', 'refunded']).optional(),
      metadata: z.record(z.any()).optional(),
    })
  ),
  asyncHandler(controller.createPayment)
);

router.post(
  '/verify-intent',
  authRequired,
  validateBody(
    z.object({
      paymentIntentId: z.string().min(1),
    })
  ),
  asyncHandler(controller.verifyIntent)
);

router.post(
  '/razorpay/guest/order',
  validateBody(
    z.object({
      eventId: z.string().min(1),
      amount: z.number().nonnegative(),
      currency: z.string().optional(),
      receipt: z.string().optional(),
      ticketTypeName: z.string().optional(),
      couponCode: z.string().optional(),
      notes: z.record(z.string()).optional(),
      metadata: z.record(z.any()).optional(),
      guest: z.object({
        fullName: z.string().min(1),
        email: z.string().email(),
        phoneNumber: z.string().min(1),
        collegeCompany: z.string().optional(),
      }),
    })
  ),
  asyncHandler(controller.createGuestRazorpayOrder)
);

router.post(
  '/razorpay/guest/verify',
  validateBody(
    z.object({
      orderId: z.string().min(1),
      paymentId: z.string().min(1),
      signature: z.string().min(1),
    })
  ),
  asyncHandler(controller.verifyGuestRazorpayPayment)
);

router.post(
  '/razorpay/order',
  authRequired,
  validateBody(
    z.object({
      courseId: z.string().min(1).optional(),
      eventId: z.string().min(1).optional(),
      amount: z.number().nonnegative(),
      currency: z.string().optional(),
      receipt: z.string().optional(),
      ticketTypeName: z.string().optional(),
      couponCode: z.string().optional(),
      notes: z.record(z.string()).optional(),
      metadata: z.record(z.any()).optional(),
    })
  ),
  asyncHandler(controller.createRazorpayOrder)
);

router.post(
  '/razorpay/verify',
  authRequired,
  validateBody(
    z.object({
      orderId: z.string().min(1),
      paymentId: z.string().min(1),
      signature: z.string().min(1),
    })
  ),
  asyncHandler(controller.verifyRazorpayPayment)
);

router.get('/purchases', authRequired, asyncHandler(controller.getPurchases));
router.get('/billing', authRequired, asyncHandler(controller.getBillingHistory));
router.get('/subscriptions', authRequired, asyncHandler(controller.getSubscriptions));
router.patch('/subscriptions/:id/cancel', authRequired, asyncHandler(controller.cancelSubscription));

module.exports = { paymentsRouter: router };
