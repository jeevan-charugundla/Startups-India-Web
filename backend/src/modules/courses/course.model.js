const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with hyphens only'],
    },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    subtitle: { type: String, trim: true, maxlength: 300 },
    description: { type: String, trim: true, maxlength: 5000 },
    introCopy: { type: String, trim: true },
    structureDescription: { type: String, trim: true },
    durationWeeks: { type: Number, default: 0 },
    totalModules: { type: Number, default: 0 },
    category: { type: String, trim: true },
    level: { type: String, trim: true },
    thumbnailUrl: { type: String, trim: true },
    thumbnailKey: { type: String, trim: true },
    videoIntroUrl: { type: String, trim: true },
    difficultyLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
    },
    language: { type: String, default: 'English' },
    isPublished: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },
    enrollmentStatus: { type: String, enum: ['open', 'closed', 'coming_soon'], default: 'open' },
    priceInr: { type: Number, default: 0 },         // stored in paise (minor units). e.g. ₹499 → 49900
    originalPriceInr: { type: Number, default: null }, // stored in paise. pre-discount "was" price
    enrolledCount: { type: Number, default: 0 },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    preStartMessage: {
      type: String,
      default: 'Welcome! The course will begin shortly. Stay tuned.',
    },
    materials: [{
      title: { type: String },
      fileUrl: { type: String },
      fileKey: { type: String },
      fileType: { type: String },
      size: { type: Number },
      uploadedAt: { type: Date, default: Date.now }
    }]
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Virtual alias so user-facing pages can use course.price. Returns paise, same as priceInr.
courseSchema.virtual('price').get(function () {
  return this.priceInr || 0;
});

courseSchema.index({ isPublished: 1, createdAt: -1 });

const moduleSchema = new mongoose.Schema(
  {
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    moduleNumber: { type: Number, required: true },
    weekNumber: { type: Number, required: true },
    title: { type: String, required: true },
    description: { type: String },
    whatYouLearn: { type: [String], default: [] },
    keyActivities: { type: [String], default: [] },
    deliverable: { type: String },
    deliverableDescription: { type: String },
    durationHours: { type: Number, default: 0 },
    isLocked: { type: Boolean, default: false },
    unlockAfterDays: { type: Number, default: 0 },
    sortOrder: { type: Number, required: true },
  },
  { timestamps: true }
);

moduleSchema.index({ courseId: 1, sortOrder: 1 }, { unique: true });

const lessonSchema = new mongoose.Schema(
  {
    moduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Module', required: true },
    lessonNumber: { type: Number, required: true },
    title: { type: String, required: true },
    description: { type: String },
    contentType: {
      type: String,
      enum: ['video', 'reading', 'assignment', 'quiz', 'live_session', 'resource'],
      required: true,
    },
    videoUrl: { type: String },
    videoKey: { type: String },
    videoDurationSeconds: { type: Number, default: 0 },
    readingContent: { type: String },
    readingTimeMinutes: { type: Number, default: 0 },
    attachments: { type: [mongoose.Schema.Types.Mixed], default: [] },
    externalLinks: { type: [mongoose.Schema.Types.Mixed], default: [] },
    assignmentInstructions: { type: String },
    assignmentDeadlineDays: { type: Number },
    assignmentSubmissionRequired: { type: Boolean, default: false },
    quizQuestions: { type: [mongoose.Schema.Types.Mixed], default: [] },
    quizPassingScore: { type: Number, default: 75 },
    isPreview: { type: Boolean, default: false },
    isMandatory: { type: Boolean, default: true },
    durationMinutes: { type: Number, default: 0 },
    sortOrder: { type: Number, required: true },
  },
  { timestamps: true }
);

lessonSchema.index({ moduleId: 1, sortOrder: 1 }, { unique: true });

const Course = mongoose.model('Course', courseSchema);
const Module = mongoose.model('Module', moduleSchema);
const Lesson = mongoose.model('Lesson', lessonSchema);

module.exports = { Course, Module, Lesson };
