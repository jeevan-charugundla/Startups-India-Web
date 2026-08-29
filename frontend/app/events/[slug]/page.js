'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { useRouter, useParams } from 'next/navigation';
import { apiGet, apiPost, apiDelete, isLoggedIn } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';
import '../../../styles/event-details.css';

const DEFAULT_EVENT_IMAGE = 'https://images.unsplash.com/photo-1557683316-973673baf926?w=800&q=80';

// Turns plain text with URLs into React nodes where each URL is a clickable link.
// Preserves line breaks (used inside white-space: pre-wrap containers).
function linkifyText(text) {
  if (!text) return null;
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return String(text).split(urlRegex).map((part, i) => {
    // A split part is a URL if it starts with http(s):// (avoids stateful regex.test)
    if (/^https?:\/\//.test(part)) {
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#15803d', fontWeight: 700, textDecoration: 'underline', wordBreak: 'break-all' }}
        >
          {part}
        </a>
      );
    }
    return part;
  });
}

function guestRegStorageKey(slug) {
  return `guest_event_reg:${slug}`;
}

function getStoredGuestDetails(slug) {
  if (typeof window === 'undefined' || !slug) return null;
  try {
    const raw = sessionStorage.getItem(guestRegStorageKey(slug));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setStoredGuestDetails(slug, details) {
  if (typeof window === 'undefined' || !slug || !details?.email) return;
  sessionStorage.setItem(guestRegStorageKey(slug), JSON.stringify({
    fullName: details.fullName || '',
    email: details.email || '',
    phoneNumber: details.phoneNumber || '',
    collegeCompany: details.collegeCompany || '',
  }));
}

async function checkGuestRegistrationByEmail(slug, email) {
  if (!slug || !email?.trim()) return false;
  const res = await apiPost(`/api/v1/events/${slug}/guest-status`, { email: email.trim() });
  return Boolean(res.data?.isRegistered);
}

// Formats a paise integer as ₹X,XX,XXX. Returns 'FREE' for 0.
function formatMoney(paise) {
  if (typeof paise !== 'number' || !Number.isFinite(paise)) return null;
  if (paise <= 0) return 'FREE';
  return `₹${(paise / 100).toLocaleString('en-IN')}`;
}

function renderBoldText(text) {
  if (!text) return text;
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) => {
    const match = part.match(/^\*\*(.+)\*\*$/);
    return match ? <strong key={index}>{match[1]}</strong> : part;
  });
}

function renderBulletLines(text) {
  return text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .map((line, index) => (
      <li key={index}>{renderBoldText(line.replace(/^[-*•]\s*/, ''))}</li>
    ));
}

function parseItemText(item) {
  if (!item) return { title: '', desc: '' };

  if (typeof item === 'object' && item !== null) {
    const rawTitle = item.title || item.name || item.heading || item.text || item.label || item.value || '';
    const rawDesc = item.desc || item.description || item.subtext || item.subtitle || item.detail || '';
    const title = String(rawTitle).replace(/\*/g, '').replace(/^[\s*-•\d\.]+\s*/, '').trim();
    const desc = String(rawDesc).replace(/\*/g, '').trim();
    return { title, desc };
  }

  const raw = String(item).trim();
  if (!raw) return { title: '', desc: '' };

  // Strip all asterisks first to remove **bold** markers
  const noStars = raw.replace(/\*/g, '').trim();

  // Strip leading bullet/dash/number markers
  const cleaned = noStars.replace(/^[\s*-•\d\.]+\s*/, '').trim();

  let title = cleaned;
  let desc = '';

  // Split on dash (-), en-dash (–), em-dash (—), or colon (:)
  const dashMatch = cleaned.match(/^([^-–—:]+)\s*[-–—:]\s*(.+)$/s);
  if (dashMatch) {
    title = dashMatch[1].trim();
    desc = dashMatch[2].trim();
  }

  title = title.replace(/^[\s*-•]+|[\s*-•]+$/g, '').trim();
  desc = desc.replace(/^[\s*-•]+|[\s*-•]+$/g, '').trim();

  if (!title) {
    title = cleaned || raw.replace(/\*/g, '').trim();
  }

  return { title, desc };
}

function parseChiefGuest(guest, index) {
  if (!guest) return null;
  if (typeof guest === 'string') {
    const trimmed = guest.replace(/\*/g, '').replace(/^[\s*-•]+/, '').trim();
    if (!trimmed) return null;
    let name = trimmed;
    let description = '';
    if (trimmed.includes(' - ')) {
      const parts = trimmed.split(' - ');
      name = parts[0];
      description = parts.slice(1).join(' - ');
    } else if (trimmed.includes(' – ')) {
      const parts = trimmed.split(' – ');
      name = parts[0];
      description = parts.slice(1).join(' – ');
    }
    return { _id: `guest_${index}`, name: name.trim(), description: description.trim() };
  }

  const rawName = String(guest.name || guest.title || guest.fullName || guest.speakerName || '').replace(/\*/g, '').trim();
  if (!rawName) return null;

  const description = String(guest.description || guest.desc || guest.role || guest.designation || guest.company || '').replace(/\*/g, '').trim();
  const logo = guest.logo || guest.photo || guest.image || guest.avatar || null;
  const website = guest.website || guest.link || null;
  const linkedin = guest.linkedinProfile || guest.linkedin || null;

  return { _id: guest._id || guest.id || index, name: rawName, description, logo, website, linkedin };
}

const DEFAULT_HIGHLIGHTS = [
  {
    title: 'CONNECT',
    desc: 'Meet founders, investors, government leaders and ecosystem experts.',
  },
  {
    title: 'LEARN',
    desc: 'Gain insights on startups, funding and entrepreneurship.',
  },
  {
    title: 'ACCESS',
    desc: 'Explore government schemes, startup support and opportunities.',
  },
  {
    title: 'PITCH',
    desc: 'Present your startup through the Founder Pitch Arena.',
  },
  {
    title: 'NETWORK',
    desc: "Build valuable connections across Telangana's startup ecosystem.",
  },
];

const DEFAULT_GAINS = [
  {
    title: 'Government Linkages',
    desc: 'Connect with key government initiatives and leaders.',
  },
  {
    title: 'Funding Readiness',
    desc: "Enhance your startup's preparedness for fundraising.",
  },
  {
    title: 'Investor Connect',
    desc: 'Access curated investor interactions and opportunities.',
  },
  {
    title: 'Founder Pitch Arena',
    desc: 'Showcase your startup to investors and ecosystem leaders.',
  },
  {
    title: 'Funding Readiness',
    desc: "Improve your startup's preparedness for fundraising.",
  },
  {
    title: 'StartupsIndia Ecosystem Journey',
    desc: 'Gain visibility, community access and growth opportunities.',
  },
];

const DEFAULT_CHIEF_GUESTS = [
  {
    _id: 'cg_1',
    name: 'G. Satheesh Reddy',
    description: 'Indian scientist and former Chairperson of DRDO',
    logo: null,
  },
  {
    _id: 'cg_2',
    name: 'Sri U. Raghuram Sharma',
    description: "OSD to Hon'ble Minister- ITE&C and Industries (FAC)",
    logo: null,
  },
];

const DEFAULT_SPECIAL_GUESTS = [
  { _id: 'sg_1', name: 'Santosh Kumar Pabba ji' },
  { _id: 'sg_2', name: 'Suresh Boggavarapu' },
  { _id: 'sg_3', name: 'Raghunath Maringanti' },
];

export default function EventDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [guestDetails, setGuestDetails] = useState({ fullName: '', email: '', phoneNumber: '', collegeCompany: '' });
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [guestStatusMessage, setGuestStatusMessage] = useState('');
  // Post-registration feedback modal (replaces the old alert() boxes)
  const [resultModal, setResultModal] = useState(null); // { type: 'success' | 'error', message: string }
  // Ticket selection
  const [selectedTicketName, setSelectedTicketName] = useState(null);
  const [couponInput, setCouponInput] = useState('');
  const [couponState, setCouponState] = useState({
    status: 'idle', // 'idle' | 'validating' | 'valid' | 'invalid'
    message: '',
    discountedPrice: null,
    discountAmount: 0,
  });

  // Derive active ticket types with effective pricing applied
  const activeTickets = useMemo(() => {
    if (!event?.ticketTypes?.length) return [];
    const now = new Date();
    return event.ticketTypes
      .filter(t => t.isActive !== false)
      .map(t => {
        const isEarlyBird = t.earlyBirdPrice > 0 && t.earlyBirdDeadline && now <= new Date(t.earlyBirdDeadline);
        const effectivePrice = isEarlyBird ? t.earlyBirdPrice : t.price;
        const soldOut = t.quota > 0 && (t.sold || 0) >= t.quota;
        return { ...t, effectivePrice, isEarlyBird, soldOut };
      })
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }, [event]);

  // Auto-select first available ticket
  useEffect(() => {
    if (activeTickets.length > 0 && !selectedTicketName) {
      const first = activeTickets.find(t => !t.soldOut);
      if (first) setSelectedTicketName(first.name);
    }
  }, [activeTickets, selectedTicketName]);

  // Reset coupon when ticket changes
  useEffect(() => {
    setCouponInput('');
    setCouponState({ status: 'idle', message: '', discountedPrice: null, discountAmount: 0 });
  }, [selectedTicketName]);

  const selectedTicket = useMemo(
    () => activeTickets.find(t => t.name === selectedTicketName) || null,
    [activeTickets, selectedTicketName]
  );

  // Effective display price (paise) - uses coupon-discounted price when applied
  const displayPrice = useMemo(() => {
    if (couponState.status === 'valid' && couponState.discountedPrice !== null) {
      return couponState.discountedPrice;
    }
    if (selectedTicket) return selectedTicket.effectivePrice;
    return event?.price || 0;
  }, [couponState, selectedTicket, event]);

  // Keep the coupon field visible across ticket types so users can discover and
  // test event-level coupons; the server validates ticket eligibility.
  const hasCoupons = useMemo(() => {
    return Boolean(event?.hasCoupons);
  }, [event]);

  const formatDate = value => {
    try {
      const d = value ? new Date(value) : null;
      if (!d || Number.isNaN(d.valueOf())) return null;
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return null;
    }
  };

  const CountdownTimer = ({ targetDate }) => {
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

    useEffect(() => {
      const timer = setInterval(() => {
        const now = new Date().getTime();
        const distance = new Date(targetDate).getTime() - now;

        if (distance < 0) {
          clearInterval(timer);
          return;
        }

        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000),
        });
      }, 1000);

      return () => clearInterval(timer);
    }, [targetDate]);

    return (
      <div className="edp-countdown-wrap">
        <div className="edp-countdown-label">Event Starts In</div>
        <div className="edp-countdown-inner">
          <div className="edp-countdown-block">
            <div className="edp-countdown-num">{String(timeLeft.days).padStart(2, '0')}</div>
            <div className="edp-countdown-unit">Days</div>
          </div>
          <div className="edp-countdown-sep">:</div>
          <div className="edp-countdown-block">
            <div className="edp-countdown-num">{String(timeLeft.hours).padStart(2, '0')}</div>
            <div className="edp-countdown-unit">Hrs</div>
          </div>
          <div className="edp-countdown-sep">:</div>
          <div className="edp-countdown-block">
            <div className="edp-countdown-num">{String(timeLeft.minutes).padStart(2, '0')}</div>
            <div className="edp-countdown-unit">Mins</div>
          </div>
          <div className="edp-countdown-sep">:</div>
          <div className="edp-countdown-block">
            <div className="edp-countdown-num">{String(timeLeft.seconds).padStart(2, '0')}</div>
            <div className="edp-countdown-unit">Secs</div>
          </div>
        </div>
      </div>
    );
  };

  // Fetch event data based on ID
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        const [response, userRes] = await Promise.all([
          apiGet(`/api/v1/events/${params.slug}`),
          isLoggedIn() ? getCurrentUser() : Promise.resolve({ data: null }),
        ]);
        if (response.data && !response.error) {
          const eventData = response.data;
          setEvent(eventData);
          let registered = !!eventData.isRegistered;

          if (eventData.registrationType === 'guest' && !isLoggedIn()) {
            const storedGuest = getStoredGuestDetails(params.slug);
            if (storedGuest) {
              setGuestDetails(prev => ({
                fullName: storedGuest.fullName || prev.fullName,
                email: storedGuest.email || prev.email,
                phoneNumber: storedGuest.phoneNumber || prev.phoneNumber,
              }));
              if (storedGuest.email) {
                registered = await checkGuestRegistrationByEmail(params.slug, storedGuest.email);
              }
            }
          }

          setIsRegistered(registered);
        } else {
          setError('Event not found');
        }
        if (userRes?.data?.user || userRes?.data) {
          setCurrentUser(userRes.data?.user || userRes.data);
        }
      } catch (err) {
        setError('Failed to load event');
        console.error('Error fetching event:', err);
      } finally {
        setLoading(false);
      }
    };

    if (params.slug) {
      fetchEvent();
    }
  }, [params.slug]);

  useEffect(() => {
    if (typeof window !== 'undefined' && !document.getElementById('razorpay-script')) {
      const script = document.createElement('script');
      script.id = 'razorpay-script';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  // If loading, show loading state
  if (loading) {
    return (
      <div className="edp-root">
        <div className="edp-loading">
          <div className="edp-spinner"></div>
          <p>Loading event details...</p>
        </div>
      </div>
    );
  }

  // If event not found, show error
  if (!event || error) {
    return (
      <div className="edp-root">
        <div className="edp-not-found">
          <h1>{error || 'Event Not Found'}</h1>
          <p>The event you&apos;re looking for doesn&apos;t exist.</p>
          <button onClick={() => router.push('/events')} className="edp-not-found-btn">
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  const nextImage = () => {
    const images = event.images || [event.coverImage];
    setCurrentImageIndex(prev => (prev + 1) % images.length);
  };

  const prevImage = () => {
    const images = event.images || [event.coverImage];
    setCurrentImageIndex(prev => (prev - 1 + images.length) % images.length);
  };

  const isFreeEvent = activeTickets.length > 0
    ? selectedTicket?.effectivePrice === 0
    : !event.isPaid && (!event.price || event.price === 0);

  const validateCoupon = async () => {
    if (!couponInput.trim() || !selectedTicketName) return;
    setCouponState({ status: 'validating', message: '', discountedPrice: null, discountAmount: 0 });
    try {
      const res = await apiPost(`/api/v1/events/${params.slug}/validate-coupon`, {
        code: couponInput.trim().toUpperCase(),
        ticketTypeName: selectedTicketName,
      });
      if (res.error) {
        setCouponState({ status: 'invalid', message: res.error.message || 'Could not validate coupon.', discountedPrice: null, discountAmount: 0 });
        return;
      }
      if (res.data?.valid) {
        setCouponState({
          status: 'valid',
          message: res.data.message || 'Coupon applied!',
          discountedPrice: res.data.discountedPrice,
          discountAmount: res.data.discountAmount,
        });
      } else {
        setCouponState({ status: 'invalid', message: res.data?.message || 'Invalid coupon code.', discountedPrice: null, discountAmount: 0 });
      }
    } catch {
      setCouponState({ status: 'invalid', message: 'Could not validate coupon. Try again.', discountedPrice: null, discountAmount: 0 });
    }
  };

  const handleRegister = async ({ fromModal = false } = {}) => {
    try {
      const isGuestRegistration = event.registrationType === 'guest';
      if (isGuestRegistration && !isRegistered && !fromModal) {
        setShowRegistrationModal(true);
        return;
      }
      if (!isGuestRegistration && !isLoggedIn()) {
        router.push(`/login?returnUrl=/events/${params.slug}`);
        return;
      }

      setRegistering(true);

      const hasTicketTypes = activeTickets.length > 0;
      // A 100%-off coupon brings the payable amount to 0 - that must be treated
      // as a free registration (skip Razorpay), not a ₹0 paid order.
      const couponMakesFree = couponState.status === 'valid' && couponState.discountedPrice === 0;
      // H4 fix: use optional chaining so null selectedTicket → undefined === 0 → false
      const isFree = couponMakesFree || (hasTicketTypes
        ? selectedTicket?.effectivePrice === 0
        : !event.isPaid && (!event.price || event.price === 0));

      // Validate ticket selection for paid multi-ticket events
      if (hasTicketTypes && !selectedTicket) {
        alert('Please select a ticket type before registering.');
        setRegistering(false);
        return;
      }
      if (hasTicketTypes && selectedTicket?.soldOut) {
        alert('This ticket type is sold out. Please choose another.');
        setRegistering(false);
        return;
      }

      if (isGuestRegistration && (!guestDetails.fullName.trim() || !guestDetails.email.trim() || !guestDetails.phoneNumber.trim())) {
        alert('Please enter your name, email, and mobile number.');
        setRegistering(false);
        return;
      }

      if (isRegistered) {
        const res = await apiDelete(`/api/v1/events/${params.slug}/register`);
        if (res.error?.status === 401) {
          router.push(`/login?returnUrl=/events/${params.slug}`);
          return;
        }
        setIsRegistered(false);
        setRegistering(false);
      } else {
        if (!isFree) {
          setShowRegistrationModal(false);
          // Build the order request - server validates amount from ticketTypes
          const orderPayload = {
            eventId: event._id,
            // amount is in paise. Server overrides it when ticketTypeName is given.
            amount: displayPrice || event.price || 0,
            ...(selectedTicketName ? { ticketTypeName: selectedTicketName } : {}),
            ...(couponInput.trim() ? { couponCode: couponInput.trim().toUpperCase() } : {}),
            ...(isGuestRegistration ? { guest: guestDetails } : {}),
          };

          const orderEndpoint = isGuestRegistration
            ? '/api/v1/payments/razorpay/guest/order'
            : '/api/v1/payments/razorpay/order';
          const verifyEndpoint = isGuestRegistration
            ? '/api/v1/payments/razorpay/guest/verify'
            : '/api/v1/payments/razorpay/verify';

          const orderRes = await apiPost(orderEndpoint, orderPayload);

          if (orderRes.error) {
            if (!isGuestRegistration && (orderRes.error.status === 401 || orderRes.error.message?.includes('token'))) {
              router.push(`/login?returnUrl=/events/${params.slug}`);
              return;
            }
            setResultModal({ type: 'error', message: orderRes.error.message || 'Could not initiate payment' });
            setRegistering(false);
            return;
          }

          const orderData = orderRes.data?.order || orderRes.data;
          const keyId = orderRes.data?.keyId
            || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
            || orderData.key_id;

          const options = {
            key: keyId,
            amount: orderData.amount,
            currency: orderData.currency || 'INR',
            name: 'Startups India',
            description: selectedTicketName
              ? `${event.title} - ${selectedTicketName}`
              : `Registration: ${event.title}`,
            image: '/Startupsindia-favicon.png',
            order_id: orderData.id || orderData.orderId,
            prefill: {
              name: isGuestRegistration
                ? guestDetails.fullName
                : (currentUser?.fullName || currentUser?.name || ''),
              email: isGuestRegistration ? guestDetails.email : (currentUser?.email || ''),
              contact: isGuestRegistration
                ? guestDetails.phoneNumber
                : (currentUser?.phoneNumber || currentUser?.phone || ''),
            },
            notes: {
              eventId: event._id,
              ...(selectedTicketName ? { ticketTypeName: selectedTicketName } : {}),
            },
            theme: { color: '#e63946' },
            handler: async function (response) {
              try {
                const verifyRes = await apiPost(verifyEndpoint, {
                  orderId: response.razorpay_order_id,
                  paymentId: response.razorpay_payment_id,
                  signature: response.razorpay_signature,
                });
                const regResult = verifyRes.data?.registration;
                if (verifyRes.error) {
                  setResultModal({
                    type: 'error',
                    message: 'Your payment was received, but we could not confirm your registration automatically. Our team has been notified - please contact support if it is not resolved shortly.',
                  });
                } else if (regResult && regResult.ok === false) {
                  // Payment succeeded; registration is being finalised in the
                  // background (webhook/reconcile will complete it). Reassure the
                  // user rather than alarming them - their spot is secured.
                  setIsRegistered(true);
                  setShowRegistrationModal(false);
                  setResultModal({
                    type: 'success',
                    message: 'Your payment was successful and your spot is secured. Your confirmation email will arrive shortly. If you do not see it, please contact support.',
                  });
                } else {
                  setIsRegistered(true);
                  setShowRegistrationModal(false);
                  setResultModal({
                    type: 'success',
                    message: 'You are now registered for this event. A confirmation email with your ticket is on its way to your inbox.',
                  });
                }
              } catch (err) {
                setResultModal({
                  type: 'error',
                  message: 'We could not verify your payment. Please refresh the page to check your registration status, or contact support.',
                });
              } finally {
                setRegistering(false);
              }
            },
            modal: {
              ondismiss: () => {
                setRegistering(false);
              },
            },
          };

          if (window.Razorpay) {
            new window.Razorpay(options).open();
          } else {
            setResultModal({ type: 'error', message: 'Payment gateway is still loading. Please refresh the page and try again.' });
            setRegistering(false);
          }
        } else {
          const res = await apiPost(`/api/v1/events/${params.slug}/register`, {
            ...(selectedTicketName ? { ticketTypeName: selectedTicketName } : {}),
            ...(couponInput.trim() ? { couponCode: couponInput.trim().toUpperCase() } : {}),
            ...(isGuestRegistration ? { guest: guestDetails } : {}),
          });
          if (res.error) {
            if (res.error.status === 401 || res.error.message?.includes('token')) {
              router.push(`/login?returnUrl=/events/${params.slug}`);
              return;
            }
            setResultModal({ type: 'error', message: res.error.message || 'Could not register for event' });
            setRegistering(false);
            return;
          }
          setIsRegistered(true);
          setShowRegistrationModal(false);
          setRegistering(false);
          setResultModal({
            type: 'success',
            message: 'You are now registered for this event. A confirmation email with your ticket is on its way to your inbox.',
          });
        }
      }
    } catch (err) {
      console.error('Error managing registration:', err);
      setRegistering(false);
    }
  };

  const handleShare = async () => {
    try {
      const url = typeof window !== 'undefined' ? window.location.href : '';
      if (navigator.share) {
        await navigator.share({ title: event?.title || 'Event', url });
        return;
      }
      if (navigator.clipboard?.writeText && url) {
        await navigator.clipboard.writeText(url);
      }
    } catch {
      // ignore share errors
    }
  };

  return (
    <div className="edp-root">

      {/* ── Top bar ─────────────────────────────────────── */}
      <div className="edp-topbar">
        <div className="edp-topbar-inner">
          <button onClick={() => router.back()} className="edp-back-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
            Back to Events
          </button>
          <button onClick={handleShare} className="edp-share-btn">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>
            Share Event
          </button>
        </div>
      </div>

      <div className="edp-container">

        {/* ── Hero Banner ───────────────────────────────── */}
        <div className="edp-hero">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={event.coverImage || DEFAULT_EVENT_IMAGE}
            alt=""
            className="edp-hero-img"
            onError={e => { e.target.onerror = null; e.target.src = DEFAULT_EVENT_IMAGE; }}
          />

          <div className="edp-hero-body">
            {/* Top row: badges + organiser logos */}
            <div className="edp-hero-top-row">
              <div className="edp-hero-badges">
                {event.category && <span className="edp-badge edp-badge--cat">{event.category}</span>}
                {event.mode && (
                  <span className={`edp-badge ${event.mode === 'Online' ? 'edp-badge--online' : 'edp-badge--mode'}`}>
                    {event.mode}
                  </span>
                )}
                {event.isFeatured && (
                  <span className="edp-badge edp-badge--feat">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                    Featured Event
                  </span>
                )}
              </div>

              {/* Organiser logos */}
              {event.organizedBy?.length > 0 && (
                <div className="edp-organiser-row">
                  {event.organizedBy.map((org, idx) => (
                    <div key={org._id || idx} className="edp-organiser-label">
                      <span>{idx === 0 ? 'Organised by' : 'In partnership with'}</span>
                      {org.logo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={org.logo} alt={org.name} className="edp-organiser-logo" />
                      ) : (
                        <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: 700 }}>{org.name}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Title */}
            <h1 className="edp-hero-title">{event.title}</h1>
            {event.subtitle && <p className="edp-hero-subtitle">{renderBoldText(event.subtitle)}</p>}
          </div>

          {/* Meta strip */}
          <div className="edp-hero-meta">
            {(event.eventStartDate || event.date) && (
              <div className="edp-meta-item">
                <div className="edp-meta-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                </div>
                <div>
                  <div className="edp-meta-label">Date & Time</div>
                  <div className="edp-meta-value">
                    {formatDate(event.eventStartDate || event.date)}
                    {event.time && <><br />{event.time}</>}
                  </div>
                </div>
              </div>
            )}

            {(event.venueName || event.city || event.mode) && (
              <div className="edp-meta-item">
                <div className="edp-meta-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                </div>
                <div>
                  <div className="edp-meta-label">Venue</div>
                  <div className="edp-meta-value">
                    {event.mode === 'Offline' ? (event.venueName || event.city || 'Offline') : 'Online'}
                    {event.city && event.mode === 'Offline' && event.venueName && event.city !== event.venueName && (
                      <>, {event.city}</>
                    )}
                  </div>
                  {event.googleMapsLink && (
                    <a href={event.googleMapsLink} target="_blank" rel="noopener noreferrer" className="edp-meta-link">
                      View on map →
                    </a>
                  )}
                </div>
              </div>
            )}

            {event.duration && (
              <div className="edp-meta-item">
                <div className="edp-meta-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                </div>
                <div>
                  <div className="edp-meta-label">Duration</div>
                  <div className="edp-meta-value">{event.duration}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Two-column layout ─────────────────────────── */}
        <div className="edp-grid">

          {/* ═══ LEFT COLUMN ═══ */}
          <div className="edp-main">

            {/* Tags */}
            {event.tags?.length > 0 && (
              <div className="edp-tags">
                {event.tags.map((tag, i) => (
                  <span key={i} className="edp-tag">{tag}</span>
                ))}
              </div>
            )}

            {/* About the Event */}
            {event.description && (
              <div className="edp-card">
                <h2 className="edp-card-title">
                  <span className="edp-card-title-icon edp-card-title-icon--pink">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                  </span>
                  About the Event
                </h2>
                <div className="edp-about-body">
                  {event.description.split('\n\n').filter(Boolean).map((p, i) => {
                    // Detect tagline/theme lines (quoted or short bold lines)
                    const isQuote = /^[""\u201c]/.test(p.trim()) || (/^\*\*/.test(p.trim()) && p.length < 120);
                    if (isQuote) {
                      return (
                        <div key={i} className="edp-quote-strip">
                          <span className="edp-quote-mark">&ldquo;</span>
                          <span className="edp-quote-text">{renderBoldText(p.replace(/^[""\u201c]+|[""\u201d]+$/g, ''))}</span>
                        </div>
                      );
                    }
                    return <p key={i}>{renderBoldText(p)}</p>;
                  })}
                </div>
              </div>
            )}

            {/* Highlights */}
            {(() => {
              const parsed = (event.highlights || []).map(parseItemText).filter(item => item.title || item.desc);
              const list = parsed.length > 0 ? parsed : DEFAULT_HIGHLIGHTS;
              return (
                <div className="edp-card">
                  <h2 className="edp-card-title">
                    <span className="edp-card-title-icon edp-card-title-icon--amber">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                    </span>
                    Highlights
                  </h2>
                  <div className="edp-highlights-grid">
                    {list.map((item, i) => {
                      const iconColors = ['#e63946', '#d97706', '#10b981', '#8b5cf6', '#2563eb'];
                      const bgColors = ['#fff1f2', '#fffbeb', '#ecfdf5', '#f5f3ff', '#eff6ff'];
                      return (
                        <div key={i} className="edp-highlight-item">
                          <div className="edp-highlight-icon-wrap" style={{ background: bgColors[i % 5] }}>
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={iconColors[i % 5]} strokeWidth="2">
                              {i % 5 === 0 && <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>}
                              {i % 5 === 1 && <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></>}
                              {i % 5 === 2 && <><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.71 1.26-1.55 1.66-2.48M12.5 8.5L8 13l3 3 4.5-4.5" /><path d="M12 5l7 7" /><path d="M9 18h.01" /></>}
                              {i % 5 === 3 && <><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></>}
                              {i % 5 === 4 && <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>}
                            </svg>
                          </div>
                          <div className="edp-highlight-name">{item.title}</div>
                          {item.desc && <div className="edp-highlight-desc">{item.desc}</div>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* What You Will Gain (Main column) */}
            {(() => {
              const parsed = (event.outcomes || []).map(parseItemText).filter(item => item.title || item.desc);
              const list = parsed.length > 0 ? parsed : DEFAULT_GAINS;
              return (
                <div className="edp-card edp-card--gains-main">
                  <h2 className="edp-card-title">
                    <span className="edp-card-title-icon edp-card-title-icon--green">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                    </span>
                    What You Will Gain
                  </h2>
                  <div className="edp-gains-two-col">
                    {list.map((item, i) => {
                      const iconBgs = ['#ecfdf5', '#eff6ff', '#f5f3ff', '#fffbeb', '#fff1f2', '#ecfeff'];
                      const iconColors = ['#10b981', '#2563eb', '#8b5cf6', '#d97706', '#e63946', '#0ea5e9'];
                      return (
                        <div key={i} className="edp-gain-card">
                          <div className="edp-gain-card-icon" style={{ background: iconBgs[i % 6] }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={iconColors[i % 6]} strokeWidth="2">
                              {i % 6 === 0 && <><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></>}
                              {i % 6 === 1 && <><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></>}
                              {i % 6 === 2 && <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>}
                              {i % 6 === 3 && <><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></>}
                              {i % 6 === 4 && <><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></>}
                              {i % 6 === 5 && <><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></>}
                            </svg>
                          </div>
                          <div className="edp-gain-card-content">
                            <div className="edp-gain-card-title">{item.title}</div>
                            {item.desc && <div className="edp-gain-card-desc">{item.desc}</div>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Timeline */}
            {event.timeline?.length > 0 && (
              <div className="edp-card">
                <h2 className="edp-card-title">
                  <span className="edp-card-title-icon edp-card-title-icon--purple">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                  </span>
                  Agenda
                </h2>
                <div className="edp-timeline">
                  {event.timeline.map((item, i) => (
                    <div key={i} className="edp-tl-item">
                      <div className="edp-tl-num">{i + 1}</div>
                      <div style={{ flex: 1, paddingTop: 4 }}>
                        {item.time && <div className="edp-tl-time">{item.time}</div>}
                        <div className="edp-tl-title">{renderBoldText(item.title)}</div>
                        {item.description && <div className="edp-tl-desc">{renderBoldText(item.description)}</div>}
                        {item.speaker && <div className="edp-tl-speaker">– {renderBoldText(item.speaker)}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Speakers / Artists */}
            {(() => {
              const people = event.speakers?.length ? event.speakers : (event.artists || []);
              if (!people.length) return null;
              return (
                <div className="edp-card">
                  <h2 className="edp-card-title">
                    <span className="edp-card-title-icon edp-card-title-icon--blue">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></svg>
                    </span>
                    {event.speakers?.length ? 'Speakers' : 'Artists'}
                  </h2>
                  <div className="edp-speakers-grid">
                    {people.map((p, i) => (
                      <div key={i} className="edp-speaker-card">
                        {p.photo || p.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.photo || p.image} alt={p.name} className="edp-speaker-avatar" />
                        ) : (
                          <div className="edp-speaker-avatar-fallback">
                            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.8"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                          </div>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 800, fontSize: 14, color: '#111827' }}>{p.name}</div>
                          {(p.role || p.company) && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2, fontWeight: 600 }}>{p.role}{p.company ? ` · ${p.company}` : ''}</div>}
                          {p.bio && <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 5, lineHeight: 1.5 }}>{renderBoldText(p.bio)}</div>}
                          {p.linkedinProfile && <a href={p.linkedinProfile} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: 5, fontSize: 11, fontWeight: 700, color: '#0a66c2' }}>LinkedIn ↗</a>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Chief Guests */}
            {(() => {
              const parsed = (event.chiefGuests || []).map(parseChiefGuest).filter(Boolean);
              const guests = parsed.length > 0 ? parsed : DEFAULT_CHIEF_GUESTS;
              return (
                <div className="edp-card">
                  <h2 className="edp-card-title">
                    <span className="edp-card-title-icon edp-card-title-icon--pink">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="7" /><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" /></svg>
                    </span>
                    Chief Guests
                  </h2>
                  <div className="edp-chief-grid">
                    {guests.map((guest, i) => (
                      <div key={guest._id || i} className="edp-chief-card">
                        {guest.logo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={guest.logo} alt={guest.name} className="edp-chief-avatar" />
                        ) : (
                          <div className="edp-chief-avatar-fallback">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="1.8"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                          </div>
                        )}
                        <div className="edp-chief-info">
                          <div className="edp-chief-name">
                            {guest.website ? (
                              <a href={guest.website} target="_blank" rel="noopener noreferrer">{guest.name}</a>
                            ) : guest.name}
                          </div>
                          {guest.description && <div className="edp-chief-desc">{guest.description}</div>}
                          {guest.linkedin && (
                            <a href={guest.linkedin} target="_blank" rel="noopener noreferrer" className="edp-chief-linkedin" title="LinkedIn">
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="#0a66c2"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Special Guests */}
            {(() => {
              const parsed = (event.specialGuests || []).map(parseChiefGuest).filter(Boolean);
              const guests = parsed.length > 0 ? parsed : DEFAULT_SPECIAL_GUESTS;
              return (
                <div className="edp-card">
                  <h2 className="edp-card-title">
                    <span className="edp-card-title-icon edp-card-title-icon--amber">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                    </span>
                    Special Guests
                  </h2>
                  <div className="edp-special-grid">
                    {guests.map((guest, i) => (
                      <div key={guest._id || i} className="edp-special-card">
                        {guest.logo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={guest.logo} alt={guest.name} className="edp-special-avatar" />
                        ) : (
                          <div className="edp-special-avatar-fallback">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="1.8"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                          </div>
                        )}
                        <div className="edp-special-info">
                          <div className="edp-special-name">
                            {guest.website ? (
                              <a href={guest.website} target="_blank" rel="noopener noreferrer">{guest.name}</a>
                            ) : guest.name}
                          </div>
                          {guest.description && <div className="edp-special-desc">{guest.description}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Organized By */}
            {(event.organizedBy?.length > 0 || (event.organizer && event.organizer !== 'StartupsIndia')) && (
              <div className="edp-card">
                <h2 className="edp-card-title">
                  <span className="edp-card-title-icon edp-card-title-icon--blue">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>
                  </span>
                  Organized By
                </h2>
                {event.organizedBy?.length > 0 ? (
                  <div className="edp-org-grid">
                    {event.organizedBy.map(org => (
                      <a key={org._id} href={org.website || undefined} target={org.website ? '_blank' : undefined} rel="noopener noreferrer" className="edp-org-chip">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {org.logo && <img src={org.logo} alt={org.name} style={{ height: 32, maxWidth: 72, objectFit: 'contain' }} />}
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13, color: '#111827' }}>{org.name}</div>
                          {org.description && <div style={{ fontSize: 11, color: '#6b7280' }}>{org.description}</div>}
                        </div>
                      </a>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: 14, color: '#374151', fontWeight: 600 }}>{event.organizer}</div>
                )}
              </div>
            )}

            {/* Partner strips */}
            {[
              { key: 'supportingPartners', label: 'Supporting Partners', icon: '🤝', accent: '#15803d', bg: '#f0fdf4', border: '#bbf7d0' },
              { key: 'academicPartners', label: 'Academic Partners', icon: '🎓', accent: '#7e22ce', bg: '#fdf4ff', border: '#e9d5ff' },
              { key: 'sponsors', label: 'Sponsors', icon: '💎', accent: '#b45309', bg: '#fffbeb', border: '#fde68a' },
            ].map(({ key, label, icon, bg, border }) => {
              const list = event[key];
              if (!list?.length) return null;
              return (
                <div key={key} className="edp-card">
                  <h2 className="edp-card-title">
                    <span className="edp-card-title-icon">{icon}</span>
                    {label}
                  </h2>
                  <div className="edp-partner-strip">
                    {list.map(org => (
                      <a key={org._id} href={org.website || undefined} target={org.website ? '_blank' : undefined} rel="noopener noreferrer" title={org.name} className="edp-partner-chip" style={{ border: `1px solid ${border}`, background: bg }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {org.logo && <img src={org.logo} alt={org.name} className="edp-partner-logo" />}
                        <span>{org.name}</span>
                      </a>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ═══ RIGHT COLUMN (Sidebar) ═══ */}
          <div className="edp-sidebar">

            {/* Registered success banner */}
            {isRegistered && (
              <div className="edp-reg-success">
                <div className="edp-reg-success-head">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                  You are registered!
                </div>
                {event.postRegistrationMessage && (
                  <div className="edp-reg-success-msg">
                    {linkifyText(event.postRegistrationMessage)}
                  </div>
                )}
                {event.meetingLink && (
                  <a href={event.meetingLink} target="_blank" rel="noopener noreferrer" className="edp-join-btn">
                    JOIN MEETING →
                  </a>
                )}
              </div>
            )}

            {/* Registration card */}
            <div className="edp-reg-card">

              {/* Price */}
              <div className="edp-price-label">Ticket Price</div>
              <div className="edp-price-value">
                {displayPrice > 0 ? formatMoney(displayPrice) : (event.priceLabel || 'FREE')}
                {couponState.status === 'valid' && couponState.discountAmount > 0 && selectedTicket && (
                  <span className="edp-price-original">{formatMoney(selectedTicket.effectivePrice)}</span>
                )}
                {displayPrice === 0 && <span className="edp-price-free-tag">Free</span>}
              </div>

              {/* Key details */}
              <div className="edp-reg-info">
                {(event.eventStartDate || event.date) && (
                  <div className="edp-reg-info-row">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                    {formatDate(event.eventStartDate || event.date)}
                    {event.time && <span style={{ color: '#475569', fontWeight: 500 }}> · {event.time}</span>}
                  </div>
                )}
                {(event.mode || event.venueName || event.city) && (
                  <div className="edp-reg-info-row">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                    {event.mode === 'Offline' ? (event.venueName || event.city || 'Offline') : 'Online Event'}
                  </div>
                )}
              </div>

              {/* Countdown */}
              {event.date && !isRegistered && <CountdownTimer targetDate={event.date} />}

              {/* Ticket selector */}
              {!isRegistered && activeTickets.length > 0 && (
                <div>
                  <div className="edp-ticket-label">Select Your Ticket</div>
                  <div className="edp-ticket-options">
                    {activeTickets.map(ticket => (
                      <label
                        key={ticket.name}
                        className={`edp-ticket-option${selectedTicketName === ticket.name ? ' edp-ticket-option--selected' : ''}${ticket.soldOut ? ' edp-ticket-option--sold' : ''}`}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9, minWidth: 0, flex: 1 }}>
                          <input
                            type="radio"
                            name="ticketType"
                            value={ticket.name}
                            checked={selectedTicketName === ticket.name}
                            disabled={ticket.soldOut}
                            onChange={() => !ticket.soldOut && setSelectedTicketName(ticket.name)}
                            className="edp-ticket-radio"
                          />
                          <div style={{ minWidth: 0, overflowWrap: 'anywhere' }}>
                            <div className="edp-ticket-name">
                              {ticket.name}
                              {ticket.isEarlyBird && <span className="edp-ticket-tag edp-ticket-tag--eb">EARLY BIRD</span>}
                              {ticket.soldOut && <span className="edp-ticket-tag edp-ticket-tag--so">SOLD OUT</span>}
                            </div>
                            {ticket.description && (
                              <ul className="edp-ticket-bullets">
                                {renderBulletLines(ticket.description)}
                              </ul>
                            )}
                            {ticket.quota > 0 && !ticket.soldOut && (
                              <div className="edp-ticket-left-over">{Math.max(0, ticket.quota - (ticket.sold || 0))} left</div>
                            )}
                          </div>
                        </div>
                        <div className="edp-ticket-price-col">
                          <div className={`edp-ticket-price${ticket.soldOut ? ' edp-ticket-price--sold' : ''}`}>
                            {ticket.effectivePrice > 0 ? formatMoney(ticket.effectivePrice) : 'FREE'}
                          </div>
                          {(ticket.isEarlyBird ? ticket.originalPrice > 0 : ticket.originalPrice > ticket.price && ticket.originalPrice > 0) && (
                            <div className="edp-ticket-price-orig">{formatMoney(ticket.isEarlyBird ? ticket.price : ticket.originalPrice)}</div>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Coupon */}
              {!isRegistered && hasCoupons && (
                <div className="edp-coupon-wrap">
                  <div className="edp-coupon-label">Have a coupon?</div>
                  <div className="edp-coupon-row">
                    <input
                      value={couponInput}
                      onChange={e => {
                        setCouponInput(e.target.value.toUpperCase().replace(/\s/g, ''));
                        if (couponState.status !== 'idle') setCouponState({ status: 'idle', message: '', discountedPrice: null, discountAmount: 0 });
                      }}
                      onKeyDown={e => e.key === 'Enter' && validateCoupon()}
                      placeholder="Enter code"
                      className={`edp-coupon-input${couponState.status === 'valid' ? ' edp-coupon-input--valid' : couponState.status === 'invalid' ? ' edp-coupon-input--invalid' : ''}`}
                    />
                    <button
                      type="button"
                      onClick={validateCoupon}
                      disabled={!couponInput.trim() || couponState.status === 'validating'}
                      className={`edp-coupon-btn${couponState.status === 'valid' ? ' edp-coupon-btn--valid' : ''}`}
                    >
                      {couponState.status === 'validating' ? '…' : couponState.status === 'valid' ? '✓' : 'Apply'}
                    </button>
                  </div>
                  {couponState.status === 'valid' && (
                    <div className="edp-coupon-msg edp-coupon-msg--ok">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                      {couponState.message}{couponState.discountAmount > 0 && ` – saving ${formatMoney(couponState.discountAmount)}`}
                      <button type="button" onClick={() => { setCouponInput(''); setCouponState({ status: 'idle', message: '', discountedPrice: null, discountAmount: 0 }); }} className="edp-coupon-remove">Remove</button>
                    </div>
                  )}
                  {couponState.status === 'invalid' && (
                    <div className="edp-coupon-msg edp-coupon-msg--err">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                      {couponState.message}
                    </div>
                  )}
                </div>
              )}

              {/* CTA */}
              <button
                onClick={isRegistered ? null : () => handleRegister()}
                disabled={registering || isRegistered || (activeTickets.length > 0 && !selectedTicket)}
                className={`edp-cta-btn${isRegistered ? ' edp-cta-btn--registered' : ''}`}
              >
                {registering
                  ? 'Processing…'
                  : isRegistered
                    ? 'Successfully Registered ✓'
                    : displayPrice > 0
                      ? `Register Now →`
                      : 'Register Now · Free'}
              </button>

              {/* Trust line */}
              {!isRegistered && displayPrice > 0 && (
                <div className="edp-pay-trust">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                  Secure payments powered by Razorpay
                </div>
              )}
            </div>

            {/* What You Will Gain (Sidebar) */}
            {event.outcomes?.map(parseItemText).filter(item => item.title || item.desc).length > 0 && (
              <div className="edp-sidebar-gains">
                <div className="edp-sidebar-gains-title">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e63946" strokeWidth="2.2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                  What You Will Gain
                </div>
                {event.outcomes.map(parseItemText).filter(item => item.title || item.desc).slice(0, 6).map((item, i) => {
                  const iconBgs = ['#ecfdf5', '#eff6ff', '#f5f3ff', '#fffbeb', '#fff1f2', '#ecfeff'];
                  const iconColors = ['#10b981', '#2563eb', '#8b5cf6', '#d97706', '#e63946', '#0ea5e9'];
                  return (
                    <div key={i} className="edp-sidebar-gain-item">
                      <div className="edp-sidebar-gain-icon" style={{ background: iconBgs[i % 6] }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={iconColors[i % 6]} strokeWidth="2">
                          {i % 6 === 0 && <><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></>}
                          {i % 6 === 1 && <><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></>}
                          {i % 6 === 2 && <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>}
                          {i % 6 === 3 && <><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></>}
                          {i % 6 === 4 && <><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></>}
                          {i % 6 === 5 && <><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></>}
                        </svg>
                      </div>
                      <div>
                        <div className="edp-sidebar-gain-name">{item.title}</div>
                        {item.desc && <div className="edp-sidebar-gain-desc">{item.desc}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Organiser mini-card */}
            {event.organizedBy?.length > 0 && (
              <div className="edp-org-mini">
                <div className="edp-org-mini-label">Organized By</div>
                {event.organizedBy.map(org => (
                  <div key={org._id} className="edp-org-row">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {org.logo && <img src={org.logo} alt={org.name} className="edp-org-logo" />}
                    <div>
                      {org.website ? <a href={org.website} target="_blank" rel="noopener noreferrer" className="edp-org-name">{org.name}</a> : <span className="edp-org-name">{org.name}</span>}
                      {org.description && <div className="edp-org-desc">{org.description}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Guest Registration Modal ──────────────────── */}
      {showRegistrationModal && event.registrationType === 'guest' && !isRegistered && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="registration-modal-title"
          onMouseDown={e => e.target === e.currentTarget && setShowRegistrationModal(false)}
          className="edp-modal-backdrop"
        >
          <form onSubmit={e => { e.preventDefault(); handleRegister({ fromModal: true }); }} className="edp-modal">
            <div className="edp-modal-head">
              <div>
                <div className="edp-modal-kicker">Almost there</div>
                <h2 id="registration-modal-title" className="edp-modal-title">Registration details</h2>
              </div>
              <button type="button" aria-label="Close registration form" onClick={() => setShowRegistrationModal(false)} className="edp-modal-close">×</button>
            </div>
            <p className="edp-modal-sub">Enter your details to reserve your place at {event.title}.</p>
            <input required type="text" value={guestDetails.fullName} onChange={e => setGuestDetails({ ...guestDetails, fullName: e.target.value })} placeholder="Full name" autoComplete="name" className="edp-modal-field" />
            <input required type="email" value={guestDetails.email} onChange={e => setGuestDetails({ ...guestDetails, email: e.target.value })} placeholder="Email address" autoComplete="email" className="edp-modal-field" />
            <input required type="tel" value={guestDetails.phoneNumber} onChange={e => setGuestDetails({ ...guestDetails, phoneNumber: e.target.value })} placeholder="Mobile number" autoComplete="tel" className="edp-modal-field" />
            <input required type="text" value={guestDetails.collegeCompany} onChange={e => setGuestDetails({ ...guestDetails, collegeCompany: e.target.value })} placeholder="College / Organization" autoComplete="organization" className="edp-modal-field" />
            <button type="submit" disabled={registering} className="edp-modal-submit">
              {registering ? 'Processing...' : isFreeEvent ? 'Complete Registration' : `Continue to Payment – ${formatMoney(displayPrice)}`}
            </button>
          </form>
        </div>
      )}

      {/* ── Result Modal ──────────────────────────────── */}
      {resultModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="result-modal-title"
          onMouseDown={e => {
            if (e.target === e.currentTarget) {
              const wasSuccess = resultModal.type === 'success';
              setResultModal(null);
              if (wasSuccess && currentUser) window.location.reload();
            }
          }}
          className="edp-modal-backdrop"
          style={{ zIndex: 1100 }}
        >
          <div className="edp-modal edp-result-modal">
            <div className={`edp-result-icon ${resultModal.type === 'success' ? 'edp-result-icon--ok' : 'edp-result-icon--err'}`}>
              {resultModal.type === 'success' ? '✓' : '!'}
            </div>
            <h2 id="result-modal-title" className="edp-result-title">
              {resultModal.type === 'success' ? 'Registration successful' : 'Something went wrong'}
            </h2>
            <p className="edp-result-msg">{resultModal.message}</p>
            <button
              type="button"
              onClick={() => {
                const wasSuccess = resultModal.type === 'success';
                setResultModal(null);
                if (wasSuccess && currentUser) window.location.reload();
              }}
              className="edp-result-btn"
              style={{ background: resultModal.type === 'success' ? '#16a34a' : '#e63946' }}
            >
              {resultModal.type === 'success' ? 'Done' : 'Close'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
