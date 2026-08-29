const { ApiError } = require('../../utils/apiError');
const paymentsService = require('./payments.service');

async function listPayments(req, res) {
  const payments = await paymentsService.listPaymentsForUser(req.user.userId);
  res.json({ success: true, data: payments });
}

async function createPayment(req, res) {
  const payment = await paymentsService.createPaymentForUser(req.user.userId, req.body);
  res.status(201).json({ success: true, data: payment });
}

async function verifyIntent(req, res) {
  const { paymentIntentId } = req.body;
  if (!paymentIntentId) {
    throw new ApiError(400, 'paymentIntentId is required');
  }
  const paymentIntent = await paymentsService.verifyPaymentIntent(paymentIntentId);
  res.json({ success: true, data: paymentIntent });
}

async function handleWebhook(req, res) {
  const signature = req.headers['stripe-signature'];
  const result = await paymentsService.processWebhook(req.body, signature);
  res.json(result);
}

async function createRazorpayOrder(req, res) {
  const result = await paymentsService.createRazorpayOrder(req.user.userId, req.body);
  res.status(201).json({ success: true, data: result });
}

async function createGuestRazorpayOrder(req, res) {
  const result = await paymentsService.createGuestRazorpayOrder(req.body);
  res.status(201).json({ success: true, data: result });
}

async function verifyRazorpayPayment(req, res) {
  const payment = await paymentsService.verifyRazorpayPayment(req.user.userId, req.body);
  res.json({ success: true, data: payment });
}

async function verifyGuestRazorpayPayment(req, res) {
  const payment = await paymentsService.verifyGuestRazorpayPayment(req.body);
  res.json({ success: true, data: payment });
}

async function handleRazorpayWebhook(req, res) {
  const signature = req.headers['x-razorpay-signature'];
  const result = await paymentsService.processRazorpayWebhook(req.body, signature);
  res.json(result);
}

async function getPurchases(req, res) {
  const data = await paymentsService.listPurchasesForUser(req.user.userId);
  res.json({ success: true, data });
}

async function getBillingHistory(req, res) {
  const data = await paymentsService.listBillingHistory(req.user.userId);
  res.json({ success: true, data });
}

async function getSubscriptions(req, res) {
  const data = await paymentsService.getSubscriptions(req.user.userId);
  res.json({ success: true, data });
}

async function cancelSubscription(req, res) {
  const data = await paymentsService.cancelSubscription(req.params.id, req.user.userId);
  res.json({ success: true, data });
}

module.exports = {
  listPayments,
  createPayment,
  verifyIntent,
  handleWebhook,
  createRazorpayOrder,
  createGuestRazorpayOrder,
  verifyRazorpayPayment,
  verifyGuestRazorpayPayment,
  handleRazorpayWebhook,
  getPurchases,
  getBillingHistory,
  getSubscriptions,
  cancelSubscription,
};
