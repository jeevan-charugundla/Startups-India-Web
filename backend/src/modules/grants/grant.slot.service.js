const { SlotDay } = require('./grant.slot.model');
const { GrantApplication, IdeaEvaluation, EvaluationPayment } = require('./grant.models');
const { ApiError } = require('../../utils/apiError');
const { STATUS } = require('./grant.status');

// Office hours: 11:00 to 18:00 in 1-hour intervals. No Sundays.
const OFFICE_TIMES = [];
for (let h = 11; h <= 17; h++) {
  OFFICE_TIMES.push(`${String(h).padStart(2, '0')}:00`);
}
// → 7 slots per day: 11:00, 12:00, 13:00, 14:00, 15:00, 16:00, 17:00

function isSunday(dateStr) {
  return new Date(dateStr + 'T12:00:00').getDay() === 0;
}

async function getOrCreateDay(date) {
  if (isSunday(date)) throw new ApiError(400, 'Slots are not available on Sundays.');

  let day = await SlotDay.findOne({ date });
  if (!day) {
    day = await SlotDay.create({
      date,
      slots: OFFICE_TIMES.map(time => ({ time, blocked: false, bookedBy: null })),
    });
  } else {
    const existing = new Set(day.slots.map(s => s.time));
    const missing = OFFICE_TIMES.filter(t => !existing.has(t));
    if (missing.length) {
      missing.forEach(time => day.slots.push({ time, blocked: false, bookedBy: null }));
      day.slots.sort((a, b) => a.time.localeCompare(b.time));
      await day.save();
    }
  }
  return day;
}

async function getAdminSlots(date) {
  if (isSunday(date)) return { date, slots: [], isSunday: true };
  const day = await getOrCreateDay(date);

  const bookedUserIds = [...new Set(day.slots.map(slot => String(slot.bookedBy || '')).filter(Boolean))];
  const bookedAppIds = [...new Set(day.slots.map(slot => String(slot.applicationId || '')).filter(Boolean))];

  if (bookedUserIds.length || bookedAppIds.length) {
    const { User } = require('../users/user.model');
    const { GrantApplication } = require('./grant.models');

    const [users, apps] = await Promise.all([
      bookedUserIds.length
        ? User.find({ _id: { $in: bookedUserIds } }).select('fullName email').lean()
        : [],
      bookedAppIds.length
        ? GrantApplication.find({ _id: { $in: bookedAppIds } }).select('applicationId startup').lean()
        : [],
    ]);

    const userMap = Object.fromEntries(users.map(user => [String(user._id), user]));
    const appMap = Object.fromEntries(apps.map(app => [String(app._id), app]));

    return {
      date: day.date,
      slots: day.slots.map(slot => {
        const s = slot.toObject ? slot.toObject() : { ...slot };
        return {
          ...s,
          bookedBy: s.bookedBy ? (userMap[String(s.bookedBy)] || { _id: s.bookedBy }) : null,
          applicationId: s.applicationId ? (appMap[String(s.applicationId)] || { _id: s.applicationId }) : null,
        };
      }),
    };
  }

  return { date: day.date, slots: day.slots };
}

async function setAdminBlocked({ date, times, blocked }) {
  const day = await getOrCreateDay(date);
  const timeSet = new Set(times);
  day.slots.forEach(slot => {
    if (timeSet.has(slot.time)) slot.blocked = blocked;
  });
  await day.save();
  return { date: day.date, slots: day.slots };
}

async function getAvailableSlots(date) {
  if (isSunday(date)) return { date, slots: [], isSunday: true };

  const day = await SlotDay.findOne({ date }).lean();
  if (!day) {
    return {
      date,
      slots: OFFICE_TIMES.map(time => ({ time, available: true })),
    };
  }
  return {
    date: day.date,
    slots: day.slots.map(s => ({
      time: s.time,
      available: !s.blocked && !s.bookedBy,
    })),
  };
}

/**
 * Student: book a slot.
 * mode: 'online' | 'offline'
 */
async function bookSlot({ userId, applicationId, date, time, mode }) {
  if (!['online', 'offline'].includes(mode)) {
    throw new ApiError(400, 'mode must be "online" or "offline".');
  }
  if (isSunday(date)) throw new ApiError(400, 'Slots are not available on Sundays.');

  const application = await GrantApplication.findOne({ _id: applicationId, userId }).lean();
  if (!application) throw new ApiError(404, 'Application not found.');

  // Any status at or beyond payment is bookable. This covers:
  // EVALUATION_PAID (normal path), EVALUATION_SCHEDULED (rebooking after cancellation),
  // and statuses beyond evaluation in case of edge cases.
  const NON_BOOKABLE_STATUSES = [
    STATUS.DRAFT, STATUS.SUBMITTED, STATUS.UNDER_REVIEW,
    STATUS.CHANGES_REQUESTED, STATUS.SHORTLISTED, STATUS.SELECTED,
    STATUS.EVALUATION_PENDING, STATUS.REJECTED,
  ];
  if (NON_BOOKABLE_STATUSES.includes(application.status)) {
    // Also allow if there's a confirmed paid EvaluationPayment record
    // (handles edge cases where status update may have lagged behind payment)
    const paidRecord = await EvaluationPayment.findOne({
      applicationId: application._id,
      status: 'paid',
    }).lean();
    if (!paidRecord) {
      throw new ApiError(409, 'You can only book a slot after completing payment.');
    }
  }

  // Check not already booked
  const alreadyBooked = await SlotDay.findOne({
    'slots.applicationId': applicationId,
    'slots.bookedBy': { $ne: null },
  }).lean();
  if (alreadyBooked) {
    throw new ApiError(409, 'You have already booked a slot for this application.');
  }

  const day = await getOrCreateDay(date);
  const slot = day.slots.find(s => s.time === time);

  if (!slot) throw new ApiError(404, `No slot found for ${time} on ${date}.`);
  if (slot.blocked) throw new ApiError(409, 'This slot is not available.');
  if (slot.bookedBy) throw new ApiError(409, 'This slot has already been booked.');

  slot.bookedBy = userId;
  slot.applicationId = applicationId;
  slot.bookedAt = new Date();
  slot.mode = mode;
  await day.save();

  // Build scheduled datetime in IST
  const scheduledAt = new Date(`${date}T${time}:00+05:30`);

  await IdeaEvaluation.findOneAndUpdate(
    { applicationId },
    {
      $set: {
        'meeting.mode': mode === 'online' ? 'google_meet' : 'physical',
        'meeting.scheduledAt': scheduledAt,
        'meeting.location': mode === 'offline' ? 'StartupsIndia Office' : null,
        'meeting.link': mode === 'online' ? 'To be shared before the session' : null,
        'meeting.scheduledBy': null,
      },
    },
    { upsert: true, new: true }
  );

  const { changeStatus } = require('./grant.service');
  if (application.status === STATUS.EVALUATION_PAID) {
    await changeStatus({
      applicationDbId: applicationId,
      toStatus: STATUS.EVALUATION_SCHEDULED,
      adminUserId: userId,
      notify: true,
    }).catch(() => {});
  }

  return { date, time, mode, scheduledAt };
}

async function getAllBookings({ page = 1, limit = 30 } = {}) {
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(100, Math.max(1, Number(limit) || 30));

  // Find all SlotDay documents that have at least one booked slot.
  // We don't skip/limit on SlotDay level because that would skip entire days,
  // not individual bookings. Fetch all matching days and flatten first.
  // IMPORTANT: {bookedBy: {$ne: null}} does NOT reliably match ObjectId values
  // in subdoc arrays with MongoDB Atlas - use bookedAt (a Date set on every booking)
  // as the presence indicator instead.
  const days = await SlotDay.find({
    slots: { $elemMatch: { bookedAt: { $exists: true, $type: 'date' } } },
  })
    .sort({ date: 1 })
    .lean();

  // Flatten all booked slots across all days into a single array
  const allBookings = [];
  for (const day of days) {
    for (const slot of day.slots) {
      if (slot.bookedAt) {
        allBookings.push({
          date: day.date,
          time: slot.time,
          mode: slot.mode,
          bookedBy: slot.bookedBy,         // ObjectId - populated below
          applicationId: slot.applicationId, // ObjectId - populated below
          bookedAt: slot.bookedAt,
        });
      }
    }
  }

  // Apply pagination on the flattened list
  const paginated = allBookings.slice((safePage - 1) * safeLimit, safePage * safeLimit);
  if (paginated.length === 0) return paginated;

  // Manually populate user and application details
  const { User } = require('../users/user.model');
  const { GrantApplication } = require('./grant.models');

  const userIds = [...new Set(paginated.map(b => String(b.bookedBy)).filter(Boolean))];
  const appIds  = [...new Set(paginated.map(b => b.applicationId && String(b.applicationId)).filter(Boolean))];

  const [users, apps] = await Promise.all([
    User.find({ _id: { $in: userIds } }).select('fullName email').lean(),
    GrantApplication.find({ _id: { $in: appIds } }).select('applicationId startup').lean(),
  ]);

  const userMap = Object.fromEntries(users.map(u => [String(u._id), u]));
  const appMap  = Object.fromEntries(apps.map(a => [String(a._id), a]));

  return paginated.map(b => ({
    ...b,
    bookedBy: userMap[String(b.bookedBy)] || { _id: b.bookedBy },
    applicationId: appMap[String(b.applicationId)] || { _id: b.applicationId },
  }));
}

module.exports = {
  OFFICE_TIMES,
  getAdminSlots,
  setAdminBlocked,
  getAvailableSlots,
  bookSlot,
  cancelSlot,
  getAllBookings,
};

/**
 * Cancel an existing slot booking for an application.
 * Clears the slot so it becomes available for others, and rolls the
 * application status back to EVALUATION_PAID so the student can rebook.
 */
async function cancelSlot({ userId, applicationId }) {
  const application = await GrantApplication.findOne({ _id: applicationId, userId }).lean();
  if (!application) throw new ApiError(404, 'Application not found.');

  // Find the day that has this application's booking
  const day = await SlotDay.findOne({ 'slots.applicationId': applicationId });
  if (!day) throw new ApiError(404, 'No booking found for this application.');

  const slot = day.slots.find(
    s => s.applicationId && String(s.applicationId) === String(applicationId)
  );
  if (!slot) throw new ApiError(404, 'No booking found for this application.');

  // Free up the slot
  slot.bookedBy = null;
  slot.applicationId = null;
  slot.bookedAt = null;
  slot.mode = null;
  await day.save();

  // Clear the meeting from IdeaEvaluation
  await IdeaEvaluation.findOneAndUpdate(
    { applicationId },
    { $unset: { meeting: '' } }
  );

  // Roll status back to EVALUATION_PAID so the student can pick a new slot
  const { changeStatus } = require('./grant.service');
  if (application.status === STATUS.EVALUATION_SCHEDULED) {
    await changeStatus({
      applicationDbId: applicationId,
      toStatus: STATUS.EVALUATION_PAID,
      adminUserId: userId,
      notify: false,
    }).catch(() => {});
  }

  return { cancelled: true };
}
