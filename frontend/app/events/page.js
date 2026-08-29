'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiGet, apiPost } from '@/lib/api';
import '../../styles/events.css';
import '../../styles/event-details.css';

const DEFAULT_EVENT_IMAGE =
  'https://images.unsplash.com/photo-1557683316-973673baf926?w=800&q=80';

/* ── Hover-reveal cell — bg-image via style prop, no <img> so no broken-image UI ── */
function HoverImageCell({ src }) {
  return (
    <div className="ehg-cell ehg-cell--hover">
      {/* background image — CSS transition handles fade + scale */}
      <div
        className="ehg-hover-bg"
        style={{ backgroundImage: `url(${src})` }}
        aria-hidden="true"
      />
      {/* subtle dark overlay */}
      <div className="ehg-hover-overlay" aria-hidden="true" />
      {/* tiny resting dot indicator */}
      <div className="ehg-hover-dot" aria-hidden="true" />
    </div>
  );
}

export default function EventsPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('latest');
  const [carouselPage, setCarouselPage] = useState(0);
  const scrollRef = useRef(null);
  const carouselRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const CARDS_PER_PAGE = 4;

  const updateScrollState = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  const scrollBy = (dir) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 240, behavior: 'smooth' });
  };

  const formatPrice = event => {
    // If the event has ticket types, derive price from the lowest active ticket
    if (event?.ticketTypes?.length) {
      const now = new Date();
      const activePrices = event.ticketTypes
        .filter(
          t =>
            t.isActive !== false &&
            !(t.quota > 0 && (t.sold || 0) >= t.quota)
        )
        .map(t => {
          const isEarlyBird =
            t.earlyBirdPrice > 0 &&
            t.earlyBirdDeadline &&
            now <= new Date(t.earlyBirdDeadline);
          return isEarlyBird ? t.earlyBirdPrice : t.price;
        });

      if (activePrices.length > 0) {
        const minPrice = Math.min(...activePrices);
        const hasFree = activePrices.some(p => p === 0);

        if (hasFree && activePrices.every(p => p === 0))
          return { label: 'FREE', isFree: true, original: null };

        const label =
          event.ticketTypes.filter(t => t.isActive !== false).length > 1
            ? `from ₹${(minPrice / 100).toLocaleString('en-IN')}`
            : `₹${(minPrice / 100).toLocaleString('en-IN')}`;

        return { label, isFree: false, original: null };
      }
    }

    const rawPrice = event?.price;
    // price is stored in paise — divide by 100 for display
    const priceInPaise =
      rawPrice !== undefined && rawPrice !== null ? Number(rawPrice) : null;
    const price = priceInPaise !== null ? priceInPaise / 100 : null;

    const originalPriceInPaise = event?.originalPrice
      ? Number(event.originalPrice)
      : null;
    const originalPrice =
      originalPriceInPaise !== null ? originalPriceInPaise / 100 : null;

    // If isPaid is true or price > 0, it's not free
    const isActuallyFree =
      !event?.isPaid && (priceInPaise === null || priceInPaise <= 0);

    if (isActuallyFree) return { label: 'FREE', isFree: true, original: null };

    return {
      label: `₹${price ? price.toLocaleString('en-IN') : 0}`,
      isFree: false,
      original:
        originalPrice && originalPrice > (price || 0)
          ? `₹${originalPrice.toLocaleString('en-IN')}`
          : null,
    };
  };

  const formatDateTime = event => {
    try {
      const date = event?.date ? new Date(event.date) : null;
      const dateLabel =
        date && !Number.isNaN(date.valueOf())
          ? date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })
          : 'Date TBD';
      const timeLabel = event?.time ? String(event.time) : null;
      return timeLabel ? `${dateLabel} • ${timeLabel}` : dateLabel;
    } catch {
      return 'Date TBD';
    }
  };

  // Fetch events from API
  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.set('category', selectedCategory);
      params.set('status', 'upcoming,live');
      params.set('limit', '50');

      const response = await apiGet(`/api/v1/events?${params}`);
      if (!response.error && response.data) {
        setEvents(response.data.events || []);
      } else {
        setError('Failed to load events');
      }
    } catch (err) {
      setError('Failed to load events');
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const categories = [
    {
      id: 'all',
      label: 'All Events',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      ),
      count: events.length,
    },
    {
      id: 'entertainment',
      label: 'Entertainment',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
      ),
      count: events.filter(e => e.category === 'entertainment').length,
    },
    {
      id: 'workshops',
      label: 'Workshops',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
        </svg>
      ),
      count: events.filter(e => e.category === 'workshops').length,
    },
    {
      id: 'networking',
      label: 'Networking',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
      count: events.filter(e => e.category === 'networking').length,
    },
    {
      id: 'conferences',
      label: 'Conferences',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
        </svg>
      ),
      count: events.filter(e => e.category === 'conferences').length,
    },
    {
      id: 'webinars',
      label: 'Webinars',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
      ),
      count: events.filter(e => e.category === 'webinars').length,
    },
    {
      id: 'meetups',
      label: 'Meetups',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <line x1="23" y1="11" x2="17" y2="11" />
          <line x1="20" y1="8" x2="20" y2="14" />
        </svg>
      ),
      count: events.filter(
        e => e.category === 'meetups' || e.category === 'meetup'
      ).length,
    },
  ];

  const filteredEvents = events.filter(event => {
    const categoryMatch =
      selectedCategory === 'all' ||
      event.category === selectedCategory ||
      (selectedCategory === 'meetups' && event.category === 'meetup') ||
      (selectedCategory === 'workshops' && event.category === 'workshop') ||
      (selectedCategory === 'conferences' && event.category === 'conference') ||
      (selectedCategory === 'webinars' && event.category === 'webinar');

    const priceMatch =
      priceFilter === 'all' ||
      (priceFilter === 'free' && (event.price === 0 || !event.price)) ||
      (priceFilter === 'paid' && event.price > 0);

    const searchMatch =
      !searchQuery ||
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (event.tags &&
        event.tags.some(tag =>
          tag.toLowerCase().includes(searchQuery.toLowerCase())
        ));

    return categoryMatch && priceMatch && searchMatch;
  });

  const hasAnyEvents = events.length > 0;
  const hasActiveFilters =
    selectedCategory !== 'all' || priceFilter !== 'all' || !!searchQuery;

  // Sort filteredEvents based on sortBy
  const sortedEvents = [...filteredEvents].sort((a, b) => {
    if (sortBy === 'latest') {
      return (
        new Date(b.date || b.createdAt || 0) -
        new Date(a.date || a.createdAt || 0)
      );
    }
    if (sortBy === 'oldest') {
      return (
        new Date(a.date || a.createdAt || 0) -
        new Date(b.date || b.createdAt || 0)
      );
    }
    if (sortBy === 'price-low') return (a.price || 0) - (b.price || 0);
    if (sortBy === 'price-high') return (b.price || 0) - (a.price || 0);
    return 0;
  });

  // Featured = flagged event or first in sorted list
  const featuredEvent =
    sortedEvents.find(e => e.featured) || sortedEvents[0] || null;
  // Upcoming = all except the featured one
  const upcomingEvents = sortedEvents.filter(
    e => (e._id || e.id) !== (featuredEvent?._id || featuredEvent?.id)
  );

  const totalCarouselPages = Math.ceil(upcomingEvents.length / CARDS_PER_PAGE);

  const scrollCarousel = dir => {
    const next = Math.max(
      0,
      Math.min(totalCarouselPages - 1, carouselPage + dir)
    );
    setCarouselPage(next);
    if (carouselRef.current) {
      const el = carouselRef.current;
      const cardW = el.scrollWidth / Math.max(upcomingEvents.length, 1);
      el.scrollTo({ left: next * CARDS_PER_PAGE * cardW, behavior: 'smooth' });
    }
  };

  const formatFeaturedDate = event => {
    try {
      const d = event?.date ? new Date(event.date) : null;
      if (!d || isNaN(d)) return 'Date TBD';
      const datePart = d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      return event?.time ? `${datePart} • ${event.time}` : datePart;
    } catch {
      return 'Date TBD';
    }
  };

  const dateBadge = event => {
    try {
      const d = event?.date ? new Date(event.date) : null;
      if (!d || isNaN(d)) return null;
      return {
        month: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
        day: String(d.getDate()).padStart(2, '0'),
      };
    } catch {
      return null;
    }
  };

  return (
    <div className="events-page">
      {/* ── Editorial Grid Hero ── */}
      <section className="events-hero-grid">
        {/* ── ROW 1 ── */}
        <div className="ehg-row ehg-row--top">
          {/* Col A — permanently visible image 1 */}
          <div className="ehg-cell ehg-cell--img ehg-cell--static">
            <img
              src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=75"
              alt="Startup networking event"
              className="ehg-static-img"
            />
            <div className="ehg-img-overlay"></div>
          </div>

          {/* Col B — hover box 1 */}
          <HoverImageCell
            src="https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=600&q=75"
            label="Summit 2026"
          />

          {/* Col C — hover box 2 */}
          <HoverImageCell
            src="https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=600&q=75"
            label="Founders Meetup"
          />

          {/* Col D — permanently visible image 2 */}
          <div className="ehg-cell ehg-cell--img ehg-cell--static">
            <img
              src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=600&q=75"
              alt="Conference panel"
              className="ehg-static-img"
            />
            <div className="ehg-img-overlay"></div>
          </div>

          {/* Col E — dot cluster decoration */}
          <div className="ehg-cell ehg-cell--dots" aria-hidden="true">
            <span className="ehg-dots"></span>
          </div>
        </div>

        {/* ── ROW 2 — headline row ── */}
        <div className="ehg-row ehg-row--headline">
          {/* left empty cell with cross marker */}
          <div className="ehg-cell ehg-cell--empty">
            <span className="ehg-cross" aria-hidden="true"></span>
          </div>

          {/* headline spans 3 cols */}
          <div className="ehg-cell ehg-cell--title">
            <h1 className="ehg-heading">
              <span className="ehg-heading-red">Events</span>{' '}
              <em className="ehg-heading-and">and</em>{' '}
              <span className="ehg-heading-red">Community</span>
            </h1>
          </div>

          {/* right empty with cross */}
          <div className="ehg-cell ehg-cell--empty">
            <span className="ehg-cross" aria-hidden="true"></span>
          </div>

          {/* dot cluster right */}
          <div className="ehg-cell ehg-cell--dots" aria-hidden="true">
            <span className="ehg-dots"></span>
          </div>
        </div>

        {/* ── ROW 3 — bottom row ── */}
        <div className="ehg-row ehg-row--bottom">
          {/* left cell — cross */}
          <div className="ehg-cell ehg-cell--empty">
            <span className="ehg-cross" aria-hidden="true"></span>
          </div>

          {/* permanently visible image 3 — spans 2 cols */}
          <div className="ehg-cell ehg-cell--img ehg-cell--static ehg-cell--wide">
            <img
              src="https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800&q=75"
              alt="Workshop session"
              className="ehg-static-img"
            />
            <div className="ehg-img-overlay"></div>
          </div>

          {/* hover box 3 */}
          <HoverImageCell
            src="https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=600&q=75"
            label="Workshop Series"
          />

          {/* CTA content cell — spans 2 cols */}
          <div className="ehg-cell ehg-cell--cta">
            <p className="ehg-cta-text">
              Connect. Learn.
              <br />
              <span className="ehg-cta-red">Grow Together.</span>
            </p>
            <div className="ehg-cta-btns">
              <a
                href="#all-events"
                className="ehg-btn ehg-btn--primary"
                onClick={e => {
                  e.preventDefault();
                  document
                    .getElementById('all-events')
                    ?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Explore events
              </a>
              <button className="ehg-btn ehg-btn--outline">Host event</button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Event Discovery — two-panel category selector ── */}
      <section className="edc-section">
        <div className="edc-inner">
          {/* ── Section header ── */}
          <div className="edc-header">
            <div className="edc-header-left">
              <h2 className="edc-heading">
                Explore by <span className="edc-heading-red">Category</span>
              </h2>
              <p className="edc-subtitle">
                Find the perfect event that matches your interests
              </p>
            </div>
            <div className="edc-header-right">
              <div className="edc-price-wrap">
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#e63946"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                  <line x1="7" y1="7" x2="7.01" y2="7" />
                </svg>
                <select
                  className="edc-price-select"
                  value={priceFilter}
                  onChange={e => setPriceFilter(e.target.value)}
                  aria-label="Filter by price"
                >
                  <option value="all">All Prices</option>
                  <option value="free">Free Events</option>
                  <option value="paid">Paid Events</option>
                </select>
                <svg
                  className="edc-chevron"
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            </div>
          </div>

          {/* ── Two-panel body ── */}
          <div className="edc-body">
            {/* ── LEFT: vertical category list ── */}
            <div
              className="edc-cat-panel"
              role="tablist"
              aria-label="Event categories"
            >
              {categories.slice(0, 7).map((cat, idx) => {
                const isActive = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    className={`edc-cat-row${isActive ? ' edc-cat-row--active' : ''}`}
                    onClick={() => setSelectedCategory(cat.id)}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                  >
                    <span className="edc-cat-index" aria-hidden="true">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <span className="edc-cat-bar" aria-hidden="true" />
                    <span className="edc-cat-name">{cat.label}</span>
                    <span
                      className="edc-cat-count"
                      aria-label={`${cat.count} events`}
                    >
                      {cat.count}
                    </span>
                  </button>
                );
              })}

              {/* View all link */}
              <a
                href="#all-events"
                className="edc-view-all"
                onClick={e => {
                  e.preventDefault();
                  document
                    .getElementById('all-events')
                    ?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                View all categories
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#e63946"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </a>
            </div>

            {/* ── RIGHT: event preview panel — key causes remount+animation on switch ── */}
            {(() => {
              const activeCat =
                categories.find(c => c.id === selectedCategory) ||
                categories[0];

              const previewEvents = events.filter(event => {
                if (selectedCategory === 'all') return true;
                return (
                  event.category === selectedCategory ||
                  (selectedCategory === 'meetups' &&
                    event.category === 'meetup') ||
                  (selectedCategory === 'workshops' &&
                    event.category === 'workshop') ||
                  (selectedCategory === 'conferences' &&
                    event.category === 'conference') ||
                  (selectedCategory === 'webinars' &&
                    event.category === 'webinar')
                );
              });

              const firstEvent = previewEvents[0];
              const previewImg =
                firstEvent?.coverImage ||
                firstEvent?.image ||
                'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=900&q=80';
              const hasEvents = previewEvents.length > 0;

              return (
                <div
                  className="edc-preview-panel"
                  key={selectedCategory}
                  role="tabpanel"
                  aria-label={`${activeCat.label} preview`}
                >
                  <div
                    className="edc-preview-bg"
                    style={{
                      backgroundImage: `url(${hasEvents ? previewImg : ''})`,
                    }}
                    aria-hidden="true"
                  />
                  <div className="edc-preview-overlay" aria-hidden="true" />

                  <div className="edc-preview-content">
                    <span className="edc-preview-label">
                      {activeCat.label.toUpperCase()}
                    </span>

                    {hasEvents ? (
                      <>
                        <p className="edc-preview-count">
                          {previewEvents.length}
                          <span className="edc-preview-count-sub">
                            {previewEvents.length === 1 ? ' event' : ' events'}
                            <br />
                            available
                          </span>
                        </p>
                        <p className="edc-preview-desc">
                          {firstEvent?.description
                            ? firstEvent.description.slice(0, 120) +
                            (firstEvent.description.length > 120 ? '…' : '')
                            : `Discover upcoming ${activeCat.label.toLowerCase()} events — workshops, sessions, conferences and more.`}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="edc-preview-empty-title">
                          No events available yet
                        </p>
                        <p className="edc-preview-desc">
                          Check back soon — new{' '}
                          {activeCat.label.toLowerCase()} events are added
                          regularly.
                        </p>
                      </>
                    )}

                    <a
                      href="#all-events"
                      className="edc-preview-cta"
                      onClick={e => {
                        e.preventDefault();
                        document
                          .getElementById('all-events')
                          ?.scrollIntoView({ behavior: 'smooth' });
                      }}
                    >
                      Explore Events
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </a>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          ALL EVENTS — Featured + Upcoming Discovery
          ══════════════════════════════════════════ */}
      <section className="aes-section" id="all-events">
        <div className="aes-inner">
          {/* ── Section header ── */}
          <div className="aes-header">
            <div className="aes-header-left">
              <h2 className="aes-heading">
                {selectedCategory === 'all'
                  ? 'All Events'
                  : categories.find(c => c.id === selectedCategory)?.label ||
                  'All Events'}
              </h2>
              <div className="aes-heading-line" aria-hidden="true" />
              <p className="aes-event-count">
                {filteredEvents.length}{' '}
                {filteredEvents.length === 1 ? 'event' : 'events'} available
              </p>
            </div>
            <div className="aes-header-right">
              <div className="aes-sort-wrap">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#e63946"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <select
                  className="aes-sort-select"
                  value={sortBy}
                  onChange={e => {
                    setSortBy(e.target.value);
                    setCarouselPage(0);
                  }}
                  aria-label="Sort events"
                >
                  <option value="latest">Sort by: Latest</option>
                  <option value="oldest">Sort by: Oldest</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </select>
                <svg
                  className="aes-sort-chevron"
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            </div>
          </div>

          {/* ── Loading ── */}
          {loading && (
            <div className="aes-loading">
              <div className="aes-spinner" />
              <p>Loading events…</p>
            </div>
          )}

          {/* ── Error ── */}
          {!loading && error && (
            <div className="aes-empty">
              <p className="aes-empty-title">Could not load events</p>
              <button className="aes-retry-btn" onClick={fetchEvents}>
                Try Again
              </button>
            </div>
          )}

          {/* ── No results ── */}
          {!loading && !error && filteredEvents.length === 0 && (
            <div className="aes-empty">
              <svg
                width="56"
                height="56"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#d1d5db"
                strokeWidth="1.5"
                aria-hidden="true"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
                <line x1="10" y1="15" x2="14" y2="15" />
              </svg>
              <p className="aes-empty-title">
                {hasActiveFilters
                  ? 'No events match your filters'
                  : 'No events available yet'}
              </p>
              <p className="aes-empty-sub">
                {hasActiveFilters
                  ? 'Try clearing your filters to see all events.'
                  : 'Check back soon for upcoming events.'}
              </p>
              {hasActiveFilters && (
                <button
                  className="aes-clear-btn"
                  onClick={() => {
                    setSelectedCategory('all');
                    setPriceFilter('all');
                    setSearchQuery('');
                  }}
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}

          {/* ── Featured Event ── */}
          {!loading && !error && featuredEvent && (
            <div
              className="aes-featured"
              role="article"
              aria-label={`Featured event: ${featuredEvent.title}`}
            >
              <span className="aes-featured-label">Featured Event</span>

              <div className="aes-featured-body">
                {/* Left: image */}
                <div
                  className="aes-feat-img-wrap"
                  onClick={() =>
                    router.push(
                      `/events/${featuredEvent._id || featuredEvent.id}`
                    )
                  }
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      router.push(
                        `/events/${featuredEvent._id || featuredEvent.id}`
                      );
                    }
                  }}
                  aria-label={`View ${featuredEvent.title}`}
                >
                  <img
                    src={
                      featuredEvent.coverImage ||
                      featuredEvent.image ||
                      DEFAULT_EVENT_IMAGE
                    }
                    alt={featuredEvent.title}
                    className="aes-feat-img"
                    loading="eager"
                    onError={e => {
                      e.target.onerror = null;
                      e.target.src = DEFAULT_EVENT_IMAGE;
                    }}
                  />
                </div>

                {/* Right: info */}
                <div className="aes-feat-info">
                  <h3 className="aes-feat-title">{featuredEvent.title}</h3>

                  {featuredEvent.description && (
                    <p className="aes-feat-desc">
                      {featuredEvent.description.slice(0, 160)}
                      {featuredEvent.description.length > 160 ? '…' : ''}
                    </p>
                  )}

                  <div className="aes-feat-meta">
                    <div className="aes-feat-meta-col">
                      <div className="aes-meta-label">
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#e63946"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        Date &amp; Time
                      </div>
                      <div className="aes-meta-value">
                        {formatFeaturedDate(featuredEvent)}
                      </div>
                    </div>
                    <div className="aes-feat-meta-col">
                      <div className="aes-meta-label">
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#e63946"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                        Mode
                      </div>
                      <div className="aes-meta-value">
                        {featuredEvent.mode ||
                          (featuredEvent.venue ? 'Offline' : 'Online')}
                      </div>
                    </div>
                  </div>

                  <div className="aes-feat-footer">
                    {(() => {
                      const p = formatPrice(featuredEvent);
                      return (
                        <span
                          className={`aes-feat-price${p.isFree ? ' free' : ''}`}
                        >
                          {p.label}
                          {p.original && (
                            <s className="aes-feat-original">{p.original}</s>
                          )}
                        </span>
                      );
                    })()}

                    <button
                      className="aes-feat-cta"
                      onClick={() =>
                        router.push(
                          `/events/${featuredEvent._id || featuredEvent.id}`
                        )
                      }
                    >
                      {featuredEvent.isRegistered ? 'Registered ✓' : 'Book Now'}
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Upcoming Events carousel ── */}
          {!loading && !error && upcomingEvents.length > 0 && (
            <div className="aes-upcoming">
              {/* Upcoming header */}
              <div className="aes-upcoming-header">
                <div className="aes-upcoming-title-wrap">
                  <h3 className="aes-upcoming-heading">Upcoming Events</h3>
                  <div className="aes-heading-line" aria-hidden="true" />
                </div>
                {totalCarouselPages > 1 && (
                  <div className="aes-carousel-nav">
                    <button
                      className="aes-nav-btn"
                      onClick={() => scrollCarousel(-1)}
                      disabled={carouselPage === 0}
                      aria-label="Previous events"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="15 18 9 12 15 6" />
                      </svg>
                    </button>
                    <button
                      className="aes-nav-btn"
                      onClick={() => scrollCarousel(1)}
                      disabled={carouselPage >= totalCarouselPages - 1}
                      aria-label="Next events"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>

              {/* Card rail */}
              <div className="aes-rail" ref={carouselRef}>
                {upcomingEvents.map(event => {
                  const badge = dateBadge(event);
                  return (
                    <div
                      key={event._id || event.id}
                      className="aes-card"
                      onClick={() =>
                        router.push(`/events/${event._id || event.id}`)
                      }
                      role="button"
                      tabIndex={0}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          router.push(`/events/${event._id || event.id}`);
                        }
                      }}
                      aria-label={`View ${event.title}`}
                    >
                      {/* Image area */}
                      <div className="aes-card-img-wrap">
                        <img
                          src={
                            event.coverImage ||
                            event.image ||
                            DEFAULT_EVENT_IMAGE
                          }
                          alt={event.title}
                          className="aes-card-img"
                          loading="lazy"
                          onError={e => {
                            e.target.onerror = null;
                            e.target.src = DEFAULT_EVENT_IMAGE;
                          }}
                        />
                        {badge && (
                          <div className="aes-date-badge" aria-hidden="true">
                            <span className="aes-badge-month">
                              {badge.month}
                            </span>
                            <span className="aes-badge-day">{badge.day}</span>
                          </div>
                        )}
                      </div>

                      {/* Card content */}
                      <div className="aes-card-body">
                        <h4 className="aes-card-title">{event.title}</h4>

                        <div className="aes-card-meta">
                          <div className="aes-card-row">
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="#e63946"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              aria-hidden="true"
                            >
                              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                              <line x1="16" y1="2" x2="16" y2="6" />
                              <line x1="8" y1="2" x2="8" y2="6" />
                              <line x1="3" y1="10" x2="21" y2="10" />
                            </svg>
                            <span>{formatDateTime(event)}</span>
                          </div>
                          <div className="aes-card-row">
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="#e63946"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              aria-hidden="true"
                            >
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                              <circle cx="12" cy="10" r="3" />
                            </svg>
                            <span>
                              {event.venue ||
                                event.city ||
                                event.location ||
                                (event.mode === 'Online' ? 'Online' : 'Online')}
                            </span>
                          </div>
                        </div>

                        <div className="aes-card-footer">
                          {(() => {
                            const p = formatPrice(event);
                            return (
                              <span
                                className={`aes-card-price${p.isFree ? ' free' : ''}`}
                              >
                                {p.label}
                              </span>
                            );
                          })()}
                          <span className="aes-card-cta">
                            View Event
                            <svg
                              width="13"
                              height="13"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              aria-hidden="true"
                            >
                              <line x1="5" y1="12" x2="19" y2="12" />
                              <polyline points="12 5 19 12 12 19" />
                            </svg>
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination dots */}
              {totalCarouselPages > 1 && (
                <div className="aes-dots" role="tablist" aria-label="Carousel pages">
                  {Array.from({ length: totalCarouselPages }).map((_, i) => (
                    <button
                      key={i}
                      className={`aes-dot${i === carouselPage ? ' aes-dot--active' : ''}`}
                      onClick={() => {
                        setCarouselPage(i);
                        if (carouselRef.current) {
                          const el = carouselRef.current;
                          const cardW =
                            el.scrollWidth /
                            Math.max(upcomingEvents.length, 1);
                          el.scrollTo({
                            left: i * CARDS_PER_PAGE * cardW,
                            behavior: 'smooth',
                          });
                        }
                      }}
                      role="tab"
                      aria-selected={i === carouselPage}
                      aria-label={`Page ${i + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
