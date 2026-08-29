const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', default: null },
    paymentStatus: {
      type: String,
      enum: ['free', 'paid', 'scholarship', 'pending', 'completed', 'failed'],
      default: 'pending',
    },
    status: {
      type: String,
      enum: ['enrolled', 'active', 'completed', 'expired', 'cancelled'],
      default: 'enrolled',
    },
    paymentMethod: { type: String, default: null },
    amountPaid: { type: Number, default: 0 }, // stored in paise (minor units), copied from Payment.amount
    stripePaymentId: { type: String, default: null },
    progress: { type: Number, default: 0 },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },
    lastAccessedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

enrollmentSchema.index({ userId: 1, courseId: 1 }, { unique: true });

const lessonProgressSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    moduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Module', required: true },
    lessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true, index: true },
    lessonTitle: { type: String, default: null },
    isCompleted: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

lessonProgressSchema.index({ userId: 1, courseId: 1, lessonId: 1 }, { unique: true });

const moduleQuizAttemptSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    moduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Module', required: true, index: true },
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ModuleQuiz',
      required: true,
      index: false,
    },
    answers: [{ questionIndex: Number, selectedOption: Number }],
    score: { type: Number, required: true },
    totalQuestions: { type: Number, required: true },
    percentage: { type: Number, required: true },
    passed: { type: Boolean, required: true },
  },
  { timestamps: true }
);

moduleQuizAttemptSchema.index({ userId: 1, moduleId: 1 });

const Enrollment = mongoose.model('Enrollment', enrollmentSchema);
const LessonProgress = mongoose.model('LessonProgress', lessonProgressSchema);
const ModuleQuizAttempt = mongoose.model('ModuleQuizAttempt', moduleQuizAttemptSchema);

module.exports = { Enrollment, LessonProgress, ModuleQuizAttempt };
