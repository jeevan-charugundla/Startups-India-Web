const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, trim: true },
    description: { type: String, trim: true },
    mode: { type: String, enum: ['Online', 'Offline'], default: 'Online' },
    type: {
      type: String,
      enum: ['webinar', 'workshop', 'meetup', 'conference', 'networking', 'entertainment', 'other', 'hackathon', 'startup pitch', 'tech talk', 'competition'],
      default: 'webinar',
    },
    category: {
      type: String,
      enum: ['workshops', 'networking', 'conferences', 'webinars', 'meetups', 'meetup', 'entertainment', 'workshop', 'hackathon', 'startup pitch', 'tech talk', 'competition', 'other'],
      default: 'workshops',
    },
    date: { type: Date, required: true }, // Legacy/compat
    endDate: { type: Date }, // Legacy/compat
    registrationStartDate: { type: Date },
    registrationEndDate: { type: Date },
    eventStartDate: { type: Date },
    eventEndDate: { type: Date },
    time: { type: String, trim: true },
    duration: { type: String, trim: true },
    
    // Offline Fields
    venue: { type: String, trim: true, default: 'Online' }, // legacy
    venueName: { type: String, trim: true },
    fullAddress: { type: String, trim: true },
    city: { type: String, trim: true },
    location: { type: String, trim: true },
    locationUrl: { type: String, trim: true },
    googleMapsLink: { type: String, trim: true },
    
    // Online Fields
    meetingPlatform: { type: String, trim: true },
    meetingLink: { type: String, trim: true },
    
    coverImage: { type: String, default: '' },
    images: [{ type: String }],
    
    // Pricing
    isPaid: { type: Boolean, default: false },
    price: { type: Number, default: 0 },
    originalPrice: { type: Number },
    discountedPrice: { type: Number },
    earlyBirdPrice: { type: Number },
    couponCode: { type: String, trim: true },
    priceLabel: { type: String },
    
    // Capacity Control
    maxAttendees: { type: Number, default: 0 },
    waitlistEnabled: { type: Boolean, default: false },
    autoCloseRegistration: { type: Boolean, default: false },
    
    registrations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    featured: { type: Boolean, default: false },
    tags: [{ type: String }],
    organizer: { type: String, default: 'StartupsIndia' },
    attendees: { type: Number, default: 0 },
    ageLimit: { type: String, default: '18yrs +' },
    language: { type: String, default: 'English' },
    genre: { type: String },
    status: {
      type: String,
      enum: ['upcoming', 'live', 'completed', 'cancelled'],
      default: 'upcoming',
    },
    highlights: [{ type: String }],
    outcomes: [{ type: String }],
    timeline: [
      {
        time: { type: String },
        title: { type: String },
        description: { type: String },
        speaker: { type: String },
      },
    ],
    artists: [
      {
        name: { type: String },
        role: { type: String },
        image: { type: String },
        bio: { type: String },
      },
    ],
    speakers: [
      {
        photo: { type: String },
        name: { type: String },
        role: { type: String },
        company: { type: String },
        linkedinProfile: { type: String },
        bio: { type: String },
      },
    ],
    chiefGuests: [
      {
        name: { type: String },
        description: { type: String },
        logo: { type: String },
        website: { type: String },
        linkedinProfile: { type: String },
      },
    ],
    specialGuests: [
      {
        name: { type: String },
        description: { type: String },
        logo: { type: String },
        website: { type: String },
        linkedinProfile: { type: String },
      },
    ],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

eventSchema.index({ status: 1, date: -1 });
eventSchema.index({ category: 1, date: -1 });
eventSchema.index({ featured: -1, date: -1 });

const Event = mongoose.model('Event', eventSchema);
module.exports = { Event };
