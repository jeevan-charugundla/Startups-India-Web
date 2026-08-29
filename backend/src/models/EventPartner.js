const mongoose = require('mongoose');

/**
 * EventPartner - shared library of organisations that can be attached to events.
 *
 * Stored once here; referenced by ObjectId on the Event document so the same
 * org (logo, website, name) is never uploaded more than once.
 *
 * type values:
 *   organizer        - primary event organiser
 *   supporting       - general supporting partner / co-organiser
 *   academic         - university / college / research institution
 *   sponsor          - financial/title sponsor
 *   chiefGuest       - guest of honour / keynote dignitary (name + photo/logo)
 *   specialGuest     - special invited guest (name + photo/logo)
 */
const eventPartnerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    logo: { type: String, trim: true, default: '' },          // URL to logo image
    website: { type: String, trim: true, default: '' },
    description: { type: String, trim: true, default: '' },
    type: {
      type: String,
      enum: ['organizer', 'supporting', 'academic', 'sponsor', 'chiefGuest', 'specialGuest'],
      default: 'supporting',
      index: true,
    },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

eventPartnerSchema.index({ name: 1, type: 1 });

const EventPartner = mongoose.model('EventPartner', eventPartnerSchema);
module.exports = { EventPartner };
