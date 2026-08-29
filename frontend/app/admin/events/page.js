'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api';
import Link from 'next/link';

const ADMIN_BASE = `/${process.env.NEXT_PUBLIC_ADMIN_SLUG || 'ctrl-x9k2m3-panel'}`;

export default function AdminEventsPage() {
  const [events, setEvents] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editEvent, setEditEvent] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const initialFormState = {
    title: '',
    subtitle: '',
    description: '',
    mode: 'Online',
    category: 'workshops',
    type: 'workshop',
    registrationStartDate: '',
    registrationEndDate: '',
    eventStartDate: '',
    eventEndDate: '',
    date: '', // for backward compat
    time: '',
    duration: '',
    
    // Offline Fields
    venueName: '',
    fullAddress: '',
    city: '',
    googleMapsLink: '',
    
    // Online Fields
    meetingPlatform: '',
    meetingLink: '',
    
    coverImage: '',
    images: [],
    
    // Pricing
    isPaid: false,
    price: 0,
    originalPrice: 0,
    discountedPrice: 0,
    earlyBirdPrice: 0,
    couponCode: '',
    priceLabel: 'Free',
    
    // Capacity
    maxAttendees: 0,
    waitlistEnabled: false,
    autoCloseRegistration: false,
    
    featured: false,
    tags: [],
    organizer: 'StartupsIndia',
    ageLimit: '18yrs +',
    language: 'English',
    genre: '',
    status: 'upcoming',
    highlights: [],
    outcomes: [],
    timeline: [],
    speakers: [],
    chiefGuests: [],
    specialGuests: [],
  };

  const [form, setForm] = useState(initialFormState);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: 20 });
    if (statusFilter) params.set('status', statusFilter);
    const { data } = await apiGet(`/api/v1/admin/events?${params}`);
    if (data) {
      setEvents(data.events || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    }
    setLoading(false);
  }, [page, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditEvent(null);
    setForm(initialFormState);
    setShowModal(true);
  };

  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toISOString().slice(0, 16);
  };

  const openEdit = ev => {
    setEditEvent(ev);
    setForm({
      title: ev.title || '',
      subtitle: ev.subtitle || '',
      description: ev.description || '',
      mode: ev.mode || 'Online',
      category: ev.category || 'workshops',
      type: ev.type || 'workshop',
      registrationStartDate: formatDateForInput(ev.registrationStartDate),
      registrationEndDate: formatDateForInput(ev.registrationEndDate),
      eventStartDate: formatDateForInput(ev.eventStartDate || ev.date),
      eventEndDate: formatDateForInput(ev.eventEndDate || ev.endDate),
      date: formatDateForInput(ev.date), // backup
      time: ev.time || '',
      duration: ev.duration || '',
      venueName: ev.venueName || '',
      fullAddress: ev.fullAddress || '',
      city: ev.city || '',
      googleMapsLink: ev.googleMapsLink || '',
      meetingPlatform: ev.meetingPlatform || '',
      meetingLink: ev.meetingLink || '',
      coverImage: ev.coverImage || '',
      images: ev.images || [],
      isPaid: ev.isPaid || false,
      price: ev.price || 0,
      originalPrice: ev.originalPrice || 0,
      discountedPrice: ev.discountedPrice || 0,
      earlyBirdPrice: ev.earlyBirdPrice || 0,
      couponCode: ev.couponCode || '',
      priceLabel: ev.priceLabel || 'Free',
      maxAttendees: ev.maxAttendees || 0,
      waitlistEnabled: ev.waitlistEnabled || false,
      autoCloseRegistration: ev.autoCloseRegistration || false,
      featured: ev.featured || false,
      tags: ev.tags || [],
      organizer: ev.organizer || 'StartupsIndia',
      ageLimit: ev.ageLimit || '18yrs +',
      language: ev.language || 'English',
      genre: ev.genre || '',
      status: ev.status || 'upcoming',
      highlights: ev.highlights || [],
      outcomes: ev.outcomes || [],
      timeline: ev.timeline || [],
      speakers: ev.speakers || ev.artists || [],
      chiefGuests: ev.chiefGuests || [],
      specialGuests: ev.specialGuests || [],
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title) return;
    
    const payload = { ...form };
    // Make sure date field is set for backward compatibility
    payload.date = payload.eventStartDate || payload.date || new Date().toISOString();
    
    if (editEvent) {
      await apiPatch(`/api/v1/admin/events/${editEvent._id}`, payload);
    } else {
      await apiPost('/api/v1/admin/events', payload);
    }
    setShowModal(false);
    load();
  };

  const handleDelete = async id => {
    if (!confirm('Delete this event?')) return;
    await apiDelete(`/api/v1/admin/events/${id}`);
    load();
  };

  const handleDuplicate = async id => {
    if (!confirm('Duplicate this event?')) return;
    await apiPost(`/api/v1/admin/events/${id}/duplicate`);
    load();
  };

  const toggleFeatured = async (id, currentVal) => {
    await apiPatch(`/api/v1/admin/events/${id}`, { featured: !currentVal });
    load();
  };

  const handleImageUpload = async (file, onUploadSuccess) => {
    try {
      setUploadingImage(true);
      const { data } = await apiPost('/api/v1/admin/upload-url', {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        folder: 'events',
      });

      if (!data || !data.uploadUrl) {
        throw new Error('Failed to get upload URL');
      }

      const uploadResponse = await fetch(data.uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (uploadResponse.ok) {
        onUploadSuccess(data.fileUrl || data.url);
      } else {
        throw new Error('Failed to upload file to S3');
      }
    } catch (error) {
      console.error('Upload Error:', error);
      alert('Failed to upload image. Please check your AWS credentials or try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <div className="admin-page">
      <div
        className="admin-topbar"
        style={{
          margin: '-28px -28px 24px',
          padding: '18px 28px',
          background: '#fff',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Events & Webinars</h1>
        <button className="btn btn-primary" onClick={openCreate}>
          + New Event
        </button>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <select
          value={statusFilter}
          onChange={e => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          style={{
            padding: '8px 14px',
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            fontSize: 13,
            outline: 'none',
          }}
        >
          <option value="">All Status</option>
          <option value="upcoming">Upcoming</option>
          <option value="live">Live</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {loading ? (
        <div className="admin-loading">
          <div className="admin-spinner" />
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Event</th>
                <th>Mode</th>
                <th>Category</th>
                <th>Event Date</th>
                <th>Price</th>
                <th>Reg.</th>
                <th>Status</th>
                <th>Featured</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map(ev => (
                <tr key={ev._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {ev.coverImage ? (
                        <img 
                          src={ev.coverImage} 
                          alt={ev.title} 
                          style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover' }} 
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://images.unsplash.com/photo-1557683316-973673baf926?w=100&q=80";
                          }}
                        />
                      ) : (
                        <img 
                          src="https://images.unsplash.com/photo-1557683316-973673baf926?w=100&q=80" 
                          alt={ev.title} 
                          style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover' }}
                        />
                      )}
                      <div>
                        <div style={{ fontWeight: 600 }}>{ev.title}</div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>{ev.subtitle}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${ev.mode === 'Online' ? 'badge-blue' : 'badge-orange'}`}>{ev.mode || 'Online'}</span>
                  </td>
                  <td>
                    <span className="badge badge-purple">{ev.category}</span>
                  </td>
                  <td style={{ fontSize: 12.5 }}>
                    {ev.eventStartDate || ev.date ? new Date(ev.eventStartDate || ev.date).toLocaleDateString() : 'TBD'}
                    <div style={{ fontSize: 11, color: '#64748b' }}>{ev.time || ''}</div>
                  </td>
                  <td>
                    {!ev.isPaid || ev.price === 0 ? (
                      <span style={{ color: '#10b981', fontWeight: 600 }}>Free</span>
                    ) : (
                      <span>₹{ev.price}</span>
                    )}
                  </td>
                  <td>
                    {(ev.registrations || []).length}
                    {ev.maxAttendees ? `/${ev.maxAttendees}` : ''}
                  </td>
                  <td>
                    <span
                      className={`badge ${ev.status === 'upcoming' ? 'badge-blue' : ev.status === 'live' ? 'badge-green' : ev.status === 'completed' ? 'badge-gray' : 'badge-red'}`}
                    >
                      {ev.status}
                    </span>
                  </td>
                  <td>
                    <button 
                      onClick={() => toggleFeatured(ev._id, ev.featured)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18 }}
                    >
                      <span style={{ color: ev.featured ? '#f59e0b' : '#94a3b8' }}>
                        {ev.featured ? '⭐' : '☆'}
                      </span>
                    </button>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <Link href={`${ADMIN_BASE}/events/${ev._id}/registrations`} className="btn btn-primary btn-sm">
                        Regs
                      </Link>
                      <Link href={`${ADMIN_BASE}/events/${ev._id}/analytics`} className="btn btn-secondary btn-sm" style={{background: '#e0e7ff', color: '#4338ca'}}>
                        Stats
                      </Link>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(ev)}>
                        Edit
                      </button>
                      <button className="btn btn-secondary btn-sm" onClick={() => handleDuplicate(ev._id)}>
                        Dup
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(ev._id)}
                      >
                        Del
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {events.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                    No events yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {pages > 1 && (
            <div className="admin-pagination">
              <span>
                Page {page} of {pages}
              </span>
              <div className="pagination-btns">
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                  Previous
                </button>
                <button disabled={page >= pages} onClick={() => setPage(p => p + 1)}>
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
          <div
            className="admin-modal"
            style={{ maxWidth: 800, maxHeight: '90vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="admin-modal-header">
              <h2>{editEvent ? 'Edit Event' : 'New Event'}</h2>
              <button className="admin-modal-close" onClick={() => setShowModal(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="admin-modal-body">
              <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: 8, marginBottom: 16 }}>Basic Information</h3>
              <div className="admin-form-group">
                <label>Event Title *</label>
                <input
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="Event title"
                />
              </div>
              <div className="admin-form-group">
                <label>Event Subtitle / Tagline</label>
                <input
                  value={form.subtitle}
                  onChange={e => setForm({ ...form, subtitle: e.target.value })}
                  placeholder="Brief tagline"
                />
              </div>
              <div className="admin-form-group">
                <label>Event Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Event description"
                  rows={4}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="admin-form-group">
                  <label>Category *</label>
                  <select
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                  >
                    <option value="workshop">Workshop</option>
                    <option value="hackathon">Hackathon</option>
                    <option value="meetup">Meetup</option>
                    <option value="startup pitch">Startup Pitch</option>
                    <option value="networking">Networking</option>
                    <option value="tech talk">Tech Talk</option>
                    <option value="competition">Competition</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="admin-form-group">
                  <label>Event Mode</label>
                  <select
                    value={form.mode}
                    onChange={e => setForm({ ...form, mode: e.target.value })}
                  >
                    <option value="Online">Online</option>
                    <option value="Offline">Offline</option>
                  </select>
                </div>
              </div>

              {form.mode === 'Online' && (
                <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, marginBottom: 16 }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: 14 }}>Online Meeting Details</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
                    <div className="admin-form-group" style={{ marginBottom: 0 }}>
                      <label>Meeting Platform</label>
                      <select value={form.meetingPlatform} onChange={e => setForm({...form, meetingPlatform: e.target.value})}>
                        <option value="">Select Platform</option>
                        <option value="Zoom">Zoom</option>
                        <option value="Google Meet">Google Meet</option>
                        <option value="Teams">Microsoft Teams</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="admin-form-group" style={{ marginBottom: 0 }}>
                      <label>Meeting Link</label>
                      <input value={form.meetingLink} onChange={e => setForm({...form, meetingLink: e.target.value})} placeholder="https://..." />
                    </div>
                  </div>
                </div>
              )}

              {form.mode === 'Offline' && (
                <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, marginBottom: 16 }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: 14 }}>Offline Venue Details</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div className="admin-form-group">
                      <label>Venue Name</label>
                      <input value={form.venueName} onChange={e => setForm({...form, venueName: e.target.value})} placeholder="e.g. ITC Grand Chola" />
                    </div>
                    <div className="admin-form-group">
                      <label>City</label>
                      <input value={form.city} onChange={e => setForm({...form, city: e.target.value})} placeholder="e.g. Chennai" />
                    </div>
                  </div>
                  <div className="admin-form-group">
                    <label>Full Address</label>
                    <input value={form.fullAddress} onChange={e => setForm({...form, fullAddress: e.target.value})} placeholder="Complete street address" />
                  </div>
                  <div className="admin-form-group" style={{ marginBottom: 0 }}>
                    <label>Google Maps Link</label>
                    <input value={form.googleMapsLink} onChange={e => setForm({...form, googleMapsLink: e.target.value})} placeholder="https://maps.google.com/..." />
                  </div>
                </div>
              )}

              <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: 8, marginBottom: 16, marginTop: 24 }}>Event Scheduling</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="admin-form-group">
                  <label>Registration Start Date</label>
                  <input type="datetime-local" value={form.registrationStartDate} onChange={e => setForm({ ...form, registrationStartDate: e.target.value })} />
                </div>
                <div className="admin-form-group">
                  <label>Registration End Date</label>
                  <input type="datetime-local" value={form.registrationEndDate} onChange={e => setForm({ ...form, registrationEndDate: e.target.value })} />
                </div>
                <div className="admin-form-group">
                  <label>Event Start Date *</label>
                  <input type="datetime-local" value={form.eventStartDate} onChange={e => setForm({ ...form, eventStartDate: e.target.value })} />
                </div>
                <div className="admin-form-group">
                  <label>Event End Date</label>
                  <input type="datetime-local" value={form.eventEndDate} onChange={e => setForm({ ...form, eventEndDate: e.target.value })} />
                </div>
                <div className="admin-form-group">
                  <label>Time</label>
                  <input type="text" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} placeholder="e.g. 2:00 PM - 5:00 PM" />
                </div>
                <div className="admin-form-group">
                  <label>Duration</label>
                  <input type="text" value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} placeholder="e.g. 3 hours" />
                </div>
              </div>

              <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: 8, marginBottom: 16, marginTop: 24 }}>Pricing & Capacity</h3>
              <div style={{ display: 'flex', gap: 20, marginBottom: 16 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input type="radio" checked={!form.isPaid} onChange={() => setForm({...form, isPaid: false, price: 0})} />
                  Free Event
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input type="radio" checked={form.isPaid} onChange={() => setForm({...form, isPaid: true})} />
                  Paid Event
                </label>
              </div>

              {form.isPaid && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, background: '#f0fdf4', padding: 12, borderRadius: 8, marginBottom: 16 }}>
                  <div className="admin-form-group" style={{ marginBottom: 0 }}>
                    <label>Original Price (₹)</label>
                    <input type="number" value={form.originalPrice} onChange={e => setForm({ ...form, originalPrice: Number(e.target.value) })} min="0" />
                  </div>
                  <div className="admin-form-group" style={{ marginBottom: 0 }}>
                    <label>Discounted / Selling Price (₹)</label>
                    <input type="number" value={form.price} onChange={e => setForm({ ...form, price: Number(e.target.value) })} min="0" />
                  </div>
                  <div className="admin-form-group" style={{ marginBottom: 0 }}>
                    <label>Early Bird Price (₹)</label>
                    <input type="number" value={form.earlyBirdPrice} onChange={e => setForm({ ...form, earlyBirdPrice: Number(e.target.value) })} min="0" />
                  </div>
                  <div className="admin-form-group" style={{ marginBottom: 0, gridColumn: 'span 3' }}>
                    <label>Coupon Code (Optional)</label>
                    <input type="text" value={form.couponCode} onChange={e => setForm({ ...form, couponCode: e.target.value })} placeholder="e.g. STARTUP50" />
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div className="admin-form-group">
                  <label>Max Attendees</label>
                  <input type="number" value={form.maxAttendees} onChange={e => setForm({ ...form, maxAttendees: Number(e.target.value) })} placeholder="0 for unlimited" />
                </div>
                <div className="admin-form-group" style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 10 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', margin: 0 }}>
                    <input type="checkbox" checked={form.waitlistEnabled} onChange={e => setForm({...form, waitlistEnabled: e.target.checked})} />
                    Enable Waitlist
                  </label>
                </div>
                <div className="admin-form-group" style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 10 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', margin: 0 }}>
                    <input type="checkbox" checked={form.autoCloseRegistration} onChange={e => setForm({...form, autoCloseRegistration: e.target.checked})} />
                    Auto Close Reg. when full
                  </label>
                </div>
              </div>

              <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: 8, marginBottom: 16, marginTop: 24 }}>Event Content</h3>
              
              <div className="admin-form-group">
                <label>Cover Image</label>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={uploadingImage}
                    onChange={e => {
                      if (e.target.files && e.target.files[0]) {
                        handleImageUpload(e.target.files[0], url => setForm({ ...form, coverImage: url }));
                      }
                    }}
                    style={{ flex: 1 }}
                  />
                  {uploadingImage && <span style={{ fontSize: 12, color: '#666' }}>Uploading...</span>}
                  {form.coverImage && (
                    <img src={form.coverImage} alt="Cover Preview" style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 4 }} />
                  )}
                </div>
                <input style={{ marginTop: 8 }} value={form.coverImage} onChange={e => setForm({ ...form, coverImage: e.target.value })} placeholder="Or enter image URL https://..." />
              </div>

              <div className="admin-form-group">
                <label>Highlights (One per line)</label>
                <textarea
                  value={form.highlights?.join('\n') || ''}
                  onChange={e => setForm({ ...form, highlights: e.target.value.split('\n').filter(Boolean) })}
                  placeholder="Key highlights..."
                  rows={3}
                />
              </div>

              <div className="admin-form-group">
                <label>Outcomes (One per line)</label>
                <textarea
                  value={form.outcomes?.join('\n') || ''}
                  onChange={e => setForm({ ...form, outcomes: e.target.value.split('\n').filter(Boolean) })}
                  placeholder="Learning outcomes..."
                  rows={3}
                />
              </div>

              <div className="admin-form-group">
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Agenda / Timeline</span>
                  <button type="button" className="btn btn-sm" onClick={() => setForm({...form, timeline: [...(form.timeline || []), { time: '', title: '', description: '', speaker: '' }]})}>+ Add Agenda Item</button>
                </label>
                {(form.timeline || []).map((item, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 8, marginBottom: 8, background: '#f8fafc', padding: 12, borderRadius: 8 }}>
                    <input value={item.time} onChange={e => { const t = [...form.timeline]; t[idx].time = e.target.value; setForm({...form, timeline: t}); }} placeholder="Time (e.g. 10:00 AM)" />
                    <input value={item.title} onChange={e => { const t = [...form.timeline]; t[idx].title = e.target.value; setForm({...form, timeline: t}); }} placeholder="Session Title" />
                    <input style={{ gridColumn: 'span 2' }} value={item.speaker} onChange={e => { const t = [...form.timeline]; t[idx].speaker = e.target.value; setForm({...form, timeline: t}); }} placeholder="Speaker Name (Optional)" />
                    <button type="button" onClick={() => { const t = [...form.timeline]; t.splice(idx, 1); setForm({...form, timeline: t}); }} style={{ color: 'red', background: 'transparent', border: 'none', cursor: 'pointer', gridColumn: 'span 2', textAlign: 'right', fontSize: 12 }}>Remove Item</button>
                  </div>
                ))}
              </div>

              <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: 8, marginBottom: 16, marginTop: 24 }}>Speakers</h3>
              <div className="admin-form-group">
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Event Speakers</span>
                  <button type="button" className="btn btn-sm" onClick={() => setForm({...form, speakers: [...(form.speakers || []), { name: '', role: '', company: '', photo: '', linkedinProfile: '', bio: '' }]})}>+ Add Speaker</button>
                </label>
                {(form.speakers || []).map((speaker, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12, background: '#f8fafc', padding: 12, borderRadius: 8 }}>
                    <input value={speaker.name} onChange={e => { const s = [...form.speakers]; s[idx].name = e.target.value; setForm({...form, speakers: s}); }} placeholder="Name" />
                    <input value={speaker.role} onChange={e => { const s = [...form.speakers]; s[idx].role = e.target.value; setForm({...form, speakers: s}); }} placeholder="Role / Title" />
                    <input value={speaker.company} onChange={e => { const s = [...form.speakers]; s[idx].company = e.target.value; setForm({...form, speakers: s}); }} placeholder="Company" />
                    <input value={speaker.linkedinProfile} onChange={e => { const s = [...form.speakers]; s[idx].linkedinProfile = e.target.value; setForm({...form, speakers: s}); }} placeholder="LinkedIn URL" />
                    
                    <div style={{ gridColumn: 'span 2', display: 'flex', gap: 10, alignItems: 'center' }}>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={uploadingImage}
                        onChange={e => {
                          if (e.target.files && e.target.files[0]) {
                            handleImageUpload(e.target.files[0], url => {
                              const s = [...form.speakers];
                              s[idx].photo = url;
                              setForm({ ...form, speakers: s });
                            });
                          }
                        }}
                      />
                      {speaker.photo && (
                        <img src={speaker.photo} alt="Preview" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 20 }} />
                      )}
                      <input style={{ flex: 1 }} value={speaker.photo} onChange={e => { const s = [...form.speakers]; s[idx].photo = e.target.value; setForm({...form, speakers: s}); }} placeholder="Or enter photo URL" />
                    </div>

                    <textarea style={{ gridColumn: 'span 2' }} value={speaker.bio} onChange={e => { const s = [...form.speakers]; s[idx].bio = e.target.value; setForm({...form, speakers: s}); }} placeholder="Short Bio" rows={2} />
                    <button type="button" onClick={() => { const s = [...form.speakers]; s.splice(idx, 1); setForm({...form, speakers: s}); }} style={{ color: 'red', background: 'transparent', border: 'none', cursor: 'pointer', gridColumn: 'span 2', textAlign: 'right', fontSize: 12 }}>Remove Speaker</button>
                  </div>
                ))}
              </div>

              <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: 8, marginBottom: 16, marginTop: 24 }}>Chief Guests</h3>
              <div className="admin-form-group">
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Chief Guests</span>
                  <button type="button" className="btn btn-sm" onClick={() => setForm({...form, chiefGuests: [...(form.chiefGuests || []), { name: '', description: '', logo: '', website: '', linkedinProfile: '' }]})}>+ Add Chief Guest</button>
                </label>
                {(form.chiefGuests || []).map((guest, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12, background: '#f8fafc', padding: 12, borderRadius: 8 }}>
                    <input value={guest.name} onChange={e => { const g = [...form.chiefGuests]; g[idx].name = e.target.value; setForm({...form, chiefGuests: g}); }} placeholder="Guest Name (e.g. G. Satheesh Reddy)" />
                    <input value={guest.description} onChange={e => { const g = [...form.chiefGuests]; g[idx].description = e.target.value; setForm({...form, chiefGuests: g}); }} placeholder="Designation / Description" />
                    <input value={guest.website} onChange={e => { const g = [...form.chiefGuests]; g[idx].website = e.target.value; setForm({...form, chiefGuests: g}); }} placeholder="Website URL (Optional)" />
                    <input value={guest.linkedinProfile} onChange={e => { const g = [...form.chiefGuests]; g[idx].linkedinProfile = e.target.value; setForm({...form, chiefGuests: g}); }} placeholder="LinkedIn URL (Optional)" />
                    
                    <div style={{ gridColumn: 'span 2', display: 'flex', gap: 10, alignItems: 'center' }}>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={uploadingImage}
                        onChange={e => {
                          if (e.target.files && e.target.files[0]) {
                            handleImageUpload(e.target.files[0], url => {
                              const g = [...form.chiefGuests];
                              g[idx].logo = url;
                              setForm({ ...form, chiefGuests: g });
                            });
                          }
                        }}
                      />
                      {guest.logo && (
                        <img src={guest.logo} alt="Preview" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 20 }} />
                      )}
                      <input style={{ flex: 1 }} value={guest.logo} onChange={e => { const g = [...form.chiefGuests]; g[idx].logo = e.target.value; setForm({...form, chiefGuests: g}); }} placeholder="Or enter image URL" />
                    </div>

                    <button type="button" onClick={() => { const g = [...form.chiefGuests]; g.splice(idx, 1); setForm({...form, chiefGuests: g}); }} style={{ color: 'red', background: 'transparent', border: 'none', cursor: 'pointer', gridColumn: 'span 2', textAlign: 'right', fontSize: 12 }}>Remove Chief Guest</button>
                  </div>
                ))}
              </div>

              <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: 8, marginBottom: 16, marginTop: 24 }}>Special Guests</h3>
              <div className="admin-form-group">
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Special Guests</span>
                  <button type="button" className="btn btn-sm" onClick={() => setForm({...form, specialGuests: [...(form.specialGuests || []), { name: '', description: '', logo: '', website: '', linkedinProfile: '' }]})}>+ Add Special Guest</button>
                </label>
                {(form.specialGuests || []).map((guest, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12, background: '#f8fafc', padding: 12, borderRadius: 8 }}>
                    <input value={guest.name} onChange={e => { const g = [...form.specialGuests]; g[idx].name = e.target.value; setForm({...form, specialGuests: g}); }} placeholder="Guest Name (e.g. Santosh Kumar Pabba ji)" />
                    <input value={guest.description} onChange={e => { const g = [...form.specialGuests]; g[idx].description = e.target.value; setForm({...form, specialGuests: g}); }} placeholder="Designation (Optional)" />
                    
                    <div style={{ gridColumn: 'span 2', display: 'flex', gap: 10, alignItems: 'center' }}>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={uploadingImage}
                        onChange={e => {
                          if (e.target.files && e.target.files[0]) {
                            handleImageUpload(e.target.files[0], url => {
                              const g = [...form.specialGuests];
                              g[idx].logo = url;
                              setForm({ ...form, specialGuests: g });
                            });
                          }
                        }}
                      />
                      {guest.logo && (
                        <img src={guest.logo} alt="Preview" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 20 }} />
                      )}
                      <input style={{ flex: 1 }} value={guest.logo} onChange={e => { const g = [...form.specialGuests]; g[idx].logo = e.target.value; setForm({...form, specialGuests: g}); }} placeholder="Or enter image URL" />
                    </div>

                    <button type="button" onClick={() => { const g = [...form.specialGuests]; g.splice(idx, 1); setForm({...form, specialGuests: g}); }} style={{ color: 'red', background: 'transparent', border: 'none', cursor: 'pointer', gridColumn: 'span 2', textAlign: 'right', fontSize: 12 }}>Remove Special Guest</button>
                  </div>
                ))}
              </div>

              <div className="admin-form-group" style={{ marginTop: 24, padding: 16, background: '#fffbeb', borderRadius: 8, border: '1px solid #fde68a' }}>
                <label>Status</label>
                <select
                  value={form.status}
                  onChange={e => setForm({ ...form, status: e.target.value })}
                  style={{ width: '100%', padding: 8 }}
                >
                  <option value="upcoming">Upcoming</option>
                  <option value="live">Live</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

            </div>
            <div className="admin-modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSave}>
                {editEvent ? 'Update Event' : 'Create Event'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
