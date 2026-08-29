const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', index: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', index: true },
    provider: { type: String, enum: ['stripe', 'razorpay', 'manual'], default: 'stripe' },
    paymentIntentId: { type: String, index: true, unique: true, sparse: true },
    orderId: { type: String, index: true, unique: true, sparse: true },
    paymentId: { type: String, index: true, unique: true, sparse: true },
    amount: { type: Number, required: true }, // stored in paise (minor units). Never floats.
    currency: { type: String, default: 'INR' },
    status: {
      type: String,
      enum: ['created', 'succeeded', 'failed', 'refunded'],
      default: 'created',
    },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ userId: 1, courseId: 1, orderId: 1 }, { sparse: true });

const Payment = mongoose.model('Payment', paymentSchema);
module.exports = { Payment };
