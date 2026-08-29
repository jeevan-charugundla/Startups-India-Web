'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  CalendarClock, CheckCircle2, ChevronLeft, ChevronRight,
  AlertCircle, Loader2, Video, MapPin, RefreshCw,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';

function toYMD(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
function addDays(date, n) { const d = new Date(date); d.setDate(d.getDate() + n); return d; }
function isPastDate(dateStr) { return new Date(dateStr) < new Date(new Date().toDateString()); }
function isSunday(date) { return date.getDay() === 0; }

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

/** Parse a booked-slot shape out of the evaluation API response */
function extractBookedFromEvaluation(data) {
  const meeting = data?.meeting;
  if (!meeting?.scheduledAt) return null;
  const dt = new Date(meeting.scheduledAt);
  return {
    date: toYMD(dt),
    time: `${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}`,
    mode: meeting.mode === 'physical' ? 'offline' : 'online',
    scheduledAt: meeting.scheduledAt,
    location: meeting.location || null,
    link: meeting.link || null,
  };
}

export default function BookSlotPage() {
  const router = useRouter();
  const params = useSearchParams();
  const appId = params.get('appId');

  const [weekStart, setWeekStart] = useState(() => {
    const d = addDays(new Date(), 1);
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const [selectedDate, setSelectedDate] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedTime, setSelectedTime] = useState(null);
  const [mode, setMode] = useState(null); // 'online' | 'offline'
  const [booking, setBooking] = useState(false);
  const [booked, setBooked] = useState(null);
  const [checkingExisting, setCheckingExisting] = useState(true);
  const [rescheduling, setRescheduling] = useState(false);
  const [error, setError] = useState('');

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // On mount: check if this application already has a slot booked so we don't
  // show the booking form to someone who already booked.
  useEffect(() => {
    if (!appId) { setCheckingExisting(false); return; }
    apiFetch(`/api/v1/grants/applications/${appId}/evaluation`).then(({ data }) => {
      const existing = extractBookedFromEvaluation(data);
      if (existing) setBooked(existing);
    }).finally(() => setCheckingExisting(false));
  }, [appId]);

  const loadSlots = useCallback(async (date) => {
    setLoadingSlots(true);
    setSlots([]);
    setSelectedTime(null);
    setError('');

    const { data, error: err } = await apiFetch(`/api/v1/grants/slots?date=${date}`);

    if (err) {
      setError(err.message || 'Could not load slots.');
      setLoadingSlots(false);
      return;
    }

    let availableSlots = data?.slots || [];

    // Hide slots that have already started today.
    const today = toYMD(new Date());
    if (date === today) {
      const now = new Date();
      availableSlots = availableSlots.filter(slot => {
        const [hours, minutes] = slot.time.split(':').map(Number);
        const slotStart = new Date();
        slotStart.setHours(hours, minutes, 0, 0);
        return slotStart > now;
      });
    }

    setSlots(availableSlots);
    setLoadingSlots(false);
  }, []);

  useEffect(() => {
    if (selectedDate) loadSlots(selectedDate);
  }, [selectedDate, loadSlots]);

  const handleBook = async () => {
    if (!selectedDate || !selectedTime || !mode || !appId) return;
    setBooking(true);
    setError('');

    // If rescheduling, cancel the existing slot first so the new one can be booked
    if (rescheduling) {
      const { error: cancelErr } = await apiFetch('/api/v1/grants/slots/cancel', {
        method: 'DELETE',
        body: JSON.stringify({ applicationId: appId }),
      });
      if (cancelErr) {
        setError(cancelErr.message || 'Could not cancel the existing slot. Please try again.');
        setBooking(false);
        return;
      }
    }

    const { error: err } = await apiFetch('/api/v1/grants/slots/book', {
      method: 'POST',
      body: JSON.stringify({ applicationId: appId, date: selectedDate, time: selectedTime, mode }),
    });
    setBooking(false);
    if (err) { setError(err.message || 'Could not book this slot. Please try another.'); return; }
    // Re-fetch evaluation to get the full meeting details
    const { data: evalData } = await apiFetch(`/api/v1/grants/applications/${appId}/evaluation`);
    setBooked(extractBookedFromEvaluation(evalData));
    setRescheduling(false);
  };

  // ── Loading spinner while checking existing booking ──────────────────
  if (checkingExisting) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 24px' }}>
        <Loader2 size={32} color="#dc2626" style={{ animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  // ── Booked confirmation screen ────────────────────────────────────────
  if (booked && !rescheduling) {
    const bookedDate = new Date(`${booked.date}T${booked.time}:00`);
    const [h, m] = booked.time.split(':');
    const endTime = new Date(0, 0, 0, +h + 1, +m);
    const endStr = `${String(endTime.getHours()).padStart(2,'0')}:${String(endTime.getMinutes()).padStart(2,'0')}`;
    const isOnline = booked.mode === 'online';
    const isPast = bookedDate < new Date();

    return (
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '48px 24px 80px' }}>
        {/* Confirmation card */}
        <div style={{
          background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
          border: '1.5px solid #bbf7d0', borderRadius: '20px',
          padding: '32px 28px', marginBottom: '20px', textAlign: 'center',
        }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '18px', margin: '0 auto 18px',
            background: 'linear-gradient(135deg, #16a34a, #15803d)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 20px rgba(22,163,74,0.3)',
          }}>
            <CheckCircle2 size={32} color="#fff" />
          </div>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '100px', marginBottom: '14px', background: 'rgba(22,163,74,0.15)', border: '1px solid rgba(22,163,74,0.3)', fontSize: '11px', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', color: '#15803d' }}>
            ✅ Slot Booked
          </div>

          <h2 style={{ margin: '0 0 6px', fontSize: '22px', fontWeight: 900, color: '#0f172a' }}>
            Your 1:1 Session is Confirmed
          </h2>
          <p style={{ margin: '0 0 24px', fontSize: '14px', color: '#64748b', lineHeight: 1.5 }}>
            Your evaluation report will be revealed <strong>2 hours before</strong> this session.
          </p>

          {/* Slot details */}
          <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #bbf7d0', padding: '20px', marginBottom: '18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1 }}>
                <p style={{ margin: '0 0 3px', fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Date</p>
                <p style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                  {bookedDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </p>--
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: '0 0 3px', fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Time</p>
                <p style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#dc2626' }}>
                  {booked.time} – {endStr} IST
                </p>
              </div>
            </div>

            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
              <p style={{ margin: '0 0 3px', fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Format</p>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '7px 14px', borderRadius: '100px', background: isOnline ? '#eff6ff' : '#f0fdf4', border: `1px solid ${isOnline ? '#bfdbfe' : '#bbf7d0'}`, color: isOnline ? '#1d4ed8' : '#047857', fontSize: '13px', fontWeight: 700 }}>
                {isOnline ? <Video size={14} /> : <MapPin size={14} />}
                {isOnline ? 'Online - Google Meet / Zoom' : 'In-Person - StartupsIndia Office'}
              </div>
              {isOnline && booked.link && (
                <p style={{ margin: '8px 0 0', fontSize: '12.5px', color: '#64748b' }}>
                  🔗 Meeting link will be shared before the session
                </p>
              )}
              {!isOnline && booked.location && (
                <p style={{ margin: '8px 0 0', fontSize: '12.5px', color: '#64748b' }}>
                  📍 {booked.location}
                </p>
              )}
            </div>
          </div>

          <div style={{ padding: '12px 16px', background: 'rgba(22,163,74,0.08)', borderRadius: '10px', border: '1px solid rgba(22,163,74,0.2)', fontSize: '13px', color: '#15803d', fontWeight: 500, lineHeight: 1.5, marginBottom: '20px' }}>
            📋 Your evaluation report will be available <strong>2 hours before</strong> your session. Sessions run <strong>Mon–Sat, 11 AM – 6 PM</strong>.
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {!isPast && (
              <button
                type="button"
                onClick={() => {
                  setRescheduling(true);
                  setSelectedDate(null);
                  setSelectedTime(null);
                  setMode(booked.mode);
                  setError('');
                }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  padding: '12px 20px', borderRadius: '12px',
                  border: '1.5px solid #e2e8f0', background: '#fff',
                  color: '#374151', fontWeight: 600, fontSize: '14px', cursor: 'pointer',
                }}
              >
                <RefreshCw size={15} /> Reschedule Session
              </button>
            )}
            <button
              type="button"
              onClick={() => router.push('/dashboard/journey/idea-validation')}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                padding: '13px 20px', borderRadius: '12px', border: 'none',
                background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                color: '#fff', fontWeight: 700, fontSize: '15px', cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(220,38,38,0.3)',
              }}
            >
              Back to Idea Validation
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Booking form (new booking or rescheduling) ─────────────────────────
  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '32px 24px 80px' }}>

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        {rescheduling && (
          <button
            type="button"
            onClick={() => { setRescheduling(false); setError(''); }}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px', background: 'none', border: 'none', color: '#64748b', fontSize: '13px', fontWeight: 600, cursor: 'pointer', padding: 0 }}
          >
            <ChevronLeft size={16} /> Back to booking details
          </button>
        )}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '100px', marginBottom: '12px', background: '#eff6ff', border: '1px solid #bfdbfe', fontSize: '12px', fontWeight: 800, color: '#1d4ed8', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
          <CalendarClock size={13} /> {rescheduling ? 'Reschedule 1:1 Slot' : 'Book 1:1 Slot'}
        </div>
        <h1 style={{ margin: '0 0 6px', fontSize: '24px', fontWeight: 900, color: '#0f172a' }}>
          {rescheduling ? 'Choose a New Session' : 'Choose Your Session'}
        </h1>
        <p style={{ margin: 0, fontSize: '14px', color: '#64748b', lineHeight: 1.5 }}>
          1-hour sessions, <strong>Mon–Sat, 11 AM – 6 PM</strong>. Pick online or in-person.
        </p>
      </div>

      {error && (
        <div style={{ display: 'flex', gap: '10px', padding: '12px 16px', marginBottom: '16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', color: '#b91c1c', fontSize: '13.5px', fontWeight: 500 }}>
          <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '1px' }} /> {error}
        </div>
      )}

      {/* Mode selection */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '18px 20px', marginBottom: '16px' }}>
        <p style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 700, color: '#64748b' }}>Session format</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {[
            { value: 'online', label: 'Online', desc: 'Google Meet / Zoom', icon: <Video size={18} />, color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe' },
            { value: 'offline', label: 'In-Person', desc: 'StartupsIndia Office', icon: <MapPin size={18} />, color: '#047857', bg: '#f0fdf4', border: '#bbf7d0' },
          ].map(opt => (
            <button key={opt.value} type="button" onClick={() => setMode(opt.value)}
              style={{ padding: '14px 16px', borderRadius: '12px', border: `2px solid ${mode === opt.value ? opt.border : '#e2e8f0'}`, background: mode === opt.value ? opt.bg : '#fff', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', transition: 'all 0.15s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', color: mode === opt.value ? opt.color : '#64748b' }}>
                {opt.icon}
                <span style={{ fontSize: '14px', fontWeight: 700 }}>{opt.label}</span>
              </div>
              <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>{opt.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Week navigation */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '16px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <button type="button" onClick={() => setWeekStart(d => addDays(d, -7))}
            disabled={toYMD(weekStart) <= toYMD(addDays(new Date(), 1))}
            style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: toYMD(weekStart) <= toYMD(addDays(new Date(), 1)) ? 0.3 : 1 }}>
            <ChevronLeft size={16} />
          </button>
          <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
            {MONTHS[weekStart.getMonth()]} {weekStart.getFullYear()}
          </span>
          <button type="button" onClick={() => setWeekStart(d => addDays(d, 7))}
            style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <ChevronRight size={16} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
          {weekDays.map(day => {
            const ymd = toYMD(day);
            const past = isPastDate(ymd);
            const sun = isSunday(day);
            const disabled = past || sun;
            const sel = selectedDate === ymd;
            return (
              <button key={ymd} type="button" disabled={disabled} onClick={() => !disabled && setSelectedDate(ymd)}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 4px', borderRadius: '10px', border: 'none', background: sel ? 'linear-gradient(135deg, #dc2626, #b91c1c)' : disabled ? '#f8fafc' : '#f1f5f9', color: sel ? '#fff' : disabled ? '#cbd5e1' : '#1e293b', cursor: disabled ? 'default' : 'pointer', fontFamily: 'inherit' }}>
                <span style={{ fontSize: '10px', fontWeight: 700, marginBottom: '3px', opacity: disabled ? 0.5 : 1 }}>{DAYS[day.getDay()]}</span>
                <span style={{ fontSize: '15px', fontWeight: 800 }}>{day.getDate()}</span>
              </button>
            );
          })}
        </div>
        <p style={{ margin: '8px 0 0', fontSize: '11px', color: '#94a3b8', textAlign: 'center' }}>Sundays unavailable</p>
      </div>

      {/* Time slots */}
      {selectedDate && (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', marginBottom: '20px' }}>
          <p style={{ margin: '0 0 14px', fontSize: '13px', fontWeight: 700, color: '#64748b' }}>
            Available 1-hour slots · {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          {loadingSlots ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
              <Loader2 size={24} color="#dc2626" style={{ animation: 'spin 1s linear infinite' }} />
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                {slots.map(slot => {
                  const sel = selectedTime === slot.time;
                  const [h, m] = slot.time.split(':');
                  const end = new Date(0, 0, 0, +h + 1, +m);
                  const endStr = `${String(end.getHours()).padStart(2,'0')}:${String(end.getMinutes()).padStart(2,'0')}`;
                  return (
                    <button key={slot.time} type="button" disabled={!slot.available}
                      onClick={() => slot.available && setSelectedTime(slot.time)}
                      style={{ padding: '10px 6px', borderRadius: '10px', border: 'none', fontFamily: 'inherit', fontSize: '12px', fontWeight: 700, cursor: slot.available ? 'pointer' : 'default', textAlign: 'center', background: sel ? 'linear-gradient(135deg, #dc2626, #b91c1c)' : slot.available ? '#f8fafc' : '#f1f5f9', color: sel ? '#fff' : slot.available ? '#1e293b' : '#cbd5e1', border: sel ? 'none' : `1px solid ${slot.available ? '#e2e8f0' : '#f1f5f9'}` }}>
                      <div>{slot.time}</div>
                      <div style={{ fontSize: '10px', opacity: 0.7, marginTop: '2px' }}>–{endStr}</div>
                    </button>
                  );
                })}
              </div>
              {slots.every(s => !s.available) && (
                <p style={{ margin: '10px 0 0', fontSize: '13.5px', color: '#f59e0b', textAlign: 'center', fontWeight: 600 }}>No slots available for this date. Please pick another day.</p>
              )}
            </>
          )}
        </div>
      )}

      {/* Confirm */}
      <button type="button" onClick={handleBook}
        disabled={!selectedDate || !selectedTime || !mode || booking}
        style={{ width: '100%', padding: '14px', borderRadius: '12px', border: 'none', background: (selectedDate && selectedTime && mode && !booking) ? 'linear-gradient(135deg, #dc2626, #b91c1c)' : '#f1f5f9', color: (selectedDate && selectedTime && mode && !booking) ? '#fff' : '#94a3b8', fontWeight: 700, fontSize: '15px', cursor: (selectedDate && selectedTime && mode && !booking) ? 'pointer' : 'default', boxShadow: (selectedDate && selectedTime && mode && !booking) ? '0 4px 14px rgba(220,38,38,0.3)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
        <CalendarClock size={18} />
        {booking ? 'Booking…'
          : !mode ? 'Select online or in-person first'
          : selectedDate && selectedTime ? `Confirm ${selectedTime} on ${new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} · ${mode === 'online' ? 'Online' : 'In-Person'}`
          : 'Select a date and time'}
      </button>

      <p style={{ margin: '12px 0 0', textAlign: 'center', fontSize: '12px', color: '#94a3b8' }}>
        Session duration: 1 hour · Report revealed 2 hours before session
      </p>
    </div>
  );
}
