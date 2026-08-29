const mongoose = require('mongoose');
const crypto = require('crypto');

/** Generates a random 7-character alphanumeric short code */
function genShortCode() {
  return crypto.randomBytes(5).toString('base64url').slice(0, 7);
}

const trackingLinkSchema = new mongoose.Schema(
  {
    campaign: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', required: true },
    shortCode: {
      type: String,
      required: true,
      unique: true,
      default: genShortCode,
    },
    destinationUrl: { type: String, required: true, trim: true },

    // Standard UTM parameters
    utmSource: { type: String, trim: true },
    utmMedium: { type: String, trim: true },
    utmCampaign: { type: String, trim: true },
    utmTerm: { type: String, trim: true },
    utmContent: { type: String, trim: true },

    // Arbitrary business-specific parameters (JSONB equivalent)
    customParams: { type: Map, of: String, default: {} },

    // QR code configuration
    qr: {
      foreground: { type: String, default: '#000000' },
      background: { type: String, default: '#FFFFFF' },
      size: { type: Number, default: 300 },
      logoUrl: { type: String, trim: true },
    },

    label: { type: String, trim: true }, // e.g. "Instagram Poster", "Entry Banner"
    isActive: { type: Boolean, default: true },

    // Denormalised scan counter - incremented atomically on each scan
    scanCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

trackingLinkSchema.index({ campaign: 1, createdAt: -1 });
trackingLinkSchema.index({ shortCode: 1 }, { unique: true });

const TrackingLink = mongoose.model('TrackingLink', trackingLinkSchema);
module.exports = { TrackingLink };
