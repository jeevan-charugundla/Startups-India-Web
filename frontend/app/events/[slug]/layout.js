/**
 * Server component - exports generateMetadata for /events/[slug].
 *
 * Data flow:
 *   1. Try Redis first via the public API (same cache the frontend uses).
 *      The backend GET /api/v1/events/:slug calls getEventById which already
 *      caches under event:slug:<slug>:anon - so this request is a Redis HIT
 *      almost all the time after the first visitor.
 *   2. On miss the API hits MongoDB, caches the result, and returns it.
 *   3. We never read MongoDB directly here - the cache layer is owned by the backend.
 */

const SITE_URL  = process.env.NEXT_PUBLIC_SITE_URL  || 'https://startupsindia.in';
const API_BASE  = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
const SITE_NAME = 'Startups India';
const DEFAULT_OG = `${SITE_URL}/assets/images/og-default.jpg`;

async function fetchEvent(slug) {
  try {
    const res = await fetch(`${API_BASE}/api/v1/events/${slug}`, {
      // next.js server-side revalidation - revalidate every 10 min.
      // Redis TTL on the backend is also 10 min, so they stay in sync.
      next: { revalidate: 600 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data || null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const slug  = params.slug;
  const event = await fetchEvent(slug);
  const url   = `${SITE_URL}/events/${slug}`;

  if (!event) {
    return {
      title: 'Event Not Found | Startups India',
      robots: { index: false },
    };
  }

  // Lowest ticket price for structured data / description
  const lowestPrice = (() => {
    if (event.ticketTypes?.length) {
      const prices = event.ticketTypes
        .filter(t => t.isActive !== false && t.price > 0)
        .map(t => t.price);
      return prices.length ? Math.min(...prices) / 100 : 0;
    }
    return event.price ? event.price / 100 : 0;
  })();

  const priceText = lowestPrice > 0
    ? `₹${lowestPrice.toLocaleString('en-IN')}`
    : 'Free';

  const dateText = event.eventStartDate || event.date
    ? new Date(event.eventStartDate || event.date).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : '';

  const description = [
    event.subtitle || event.description?.slice(0, 120),
    dateText && `📅 ${dateText}`,
    priceText && `🎟 ${priceText}`,
    event.mode && `📍 ${event.mode}`,
  ].filter(Boolean).join(' · ');

  const ogImage = event.coverImage || DEFAULT_OG;

  // ── JSON-LD structured data ──────────────────────────────────
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    '@id': `${url}#event`,
    name: event.title,
    description: event.description || event.subtitle || '',
    url,
    image: ogImage,
    startDate: event.eventStartDate || event.date,
    endDate: event.eventEndDate || event.endDate || event.eventStartDate || event.date,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: event.mode === 'Offline'
      ? 'https://schema.org/OfflineEventAttendanceMode'
      : 'https://schema.org/OnlineEventAttendanceMode',
    location: event.mode === 'Offline'
      ? {
          '@type': 'Place',
          name: event.venueName || event.city || 'India',
          address: {
            '@type': 'PostalAddress',
            streetAddress: event.fullAddress || '',
            addressLocality: event.city || '',
            addressCountry: 'IN',
          },
        }
      : { '@type': 'VirtualLocation', url },
    organizer: event.organizedBy?.[0]
      ? {
          '@type': 'Organization',
          name: event.organizedBy[0].name,
          url: event.organizedBy[0].website || SITE_URL,
        }
      : { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
    offers: {
      '@type': 'Offer',
      price: lowestPrice,
      priceCurrency: 'INR',
      availability: 'https://schema.org/InStock',
      url,
    },
    isAccessibleForFree: lowestPrice === 0,
    inLanguage: 'en-IN',
  };

  return {
    title: `${event.title} | ${SITE_NAME}`,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      url,
      title: event.title,
      description,
      images: [{ url: ogImage, width: 1200, height: 630, alt: event.title }],
      siteName: SITE_NAME,
      locale: 'en_IN',
    },
    twitter: {
      card: 'summary_large_image',
      title: event.title,
      description,
      images: [ogImage],
      site: '@StartupIndia',
    },
    other: {
      'application/ld+json': JSON.stringify(jsonLd),
    },
  };
}

export default function EventSlugLayout({ children }) {
  return children;
}
