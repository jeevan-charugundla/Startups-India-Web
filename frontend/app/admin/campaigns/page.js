'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api';

const FRONTEND_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_FRONTEND_URL ||
  'https://startupsindia.in';

const API_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:5000';

// All public pages on the site
const SITE_ROUTES = [
  { label: 'Home', path: '/' },
  { label: 'Courses', path: '/courses' },
  { label: 'Events', path: '/events' },
  { label: 'Programs', path: '/programs' },
  { label: 'Mentors', path: '/mentors' },
  { label: 'Investors', path: '/investors' },
  { label: 'Ecosystem', path: '/ecosystem' },
  { label: 'Knowledge Hub', path: '/knowledge-hub' },
  { label: 'Funding', path: '/funding' },
  { label: 'Market Access', path: '/market-access' },
  { label: 'Campus Startup', path: '/campus-startup' },
  { label: 'Incubators', path: '/incubators' },
  { label: 'Community', path: '/community' },
  { label: 'About', path: '/about' },
  { label: 'Team', path: '/team' },
  { label: 'Login', path: '/login' },
  { label: 'Sign Up', path: '/signup' },
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Profile', path: '/profile' },
  { label: 'Settings', path: '/settings' },
];

/**
 * Build the final destination URL with UTM params - this is what gets
 * encoded directly into the QR so scanners (Google Lens etc.) show the
 * clean site URL, not the API backend.
 */
function buildFinalUrl(route, campaignName) {
  const base = `${FRONTEND_URL}${route || '/'}`;
  const slug = (campaignName || '').toLowerCase().replace(/\s+/g, '_');
  const u = new URL(base);
  u.searchParams.set('utm_medium', 'qr');
  if (slug) u.searchParams.set('utm_campaign', slug);
  return u.toString();
}

function qrImageUrl(finalUrl, size = 200) {
  return `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(finalUrl)}&size=${size}x${size}&format=png&margin=10`;
}

const emptyForm = { name: '', route: '/', description: '', status: 'active' };

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [qrCampaign, setQrCampaign] = useState(null); // campaign whose QR is shown full-screen

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await apiGet('/api/v1/admin/campaigns?limit=100');
    setCampaigns(data?.campaigns || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditItem(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (c) => {
    setEditItem(c);
    setForm({ name: c.name, route: c.route || '/', description: c.description || '', status: c.status });
    setShowModal(true);
  };

  const save = async () => {
    if (!form.name.trim()) return alert('Campaign name is required');
    setSaving(true);
    if (editItem) {
      const { data } = await apiPatch(`/api/v1/admin/campaigns/${editItem._id}`, form);
      if (data) setCampaigns(prev => prev.map(c => c._id === editItem._id ? { ...c, ...form, links: c.links } : c));
    } else {
      const { data } = await apiPost('/api/v1/admin/campaigns', form);
      if (data) {
        // Auto-create the single tracking link for this campaign
        await apiPost(`/api/v1/admin/campaigns/${data._id}/links`, {
          destinationUrl: `${FRONTEND_URL}${form.route}`,
          utmCampaign: form.name.toLowerCase().replace(/\s+/g, '_'),
          utmMedium: 'qr',
          label: form.name,
        });
        await load();
        // After saving, immediately show the QR for the new campaign
        const { data: fresh } = await apiGet(`/api/v1/admin/campaigns/${data._id}/links`);
        const finalUrl = buildFinalUrl(form.route, form.name);
        if (fresh?.[0]) setQrCampaign({ ...data, ...form, link: fresh[0], finalUrl });
      }
    }
    setSaving(false);
    setShowModal(false);
    if (editItem) load();
  };

  const remove = async (id) => {
    if (!confirm('Delete this campaign?')) return;
    await apiDelete(`/api/v1/admin/campaigns/${id}`);
    setCampaigns(prev => prev.filter(c => c._id !== id));
  };

  const showQR = async (c) => {
    // Fetch the link to get shortCode (still used for scan tracking on click)
    const { data } = await apiGet(`/api/v1/admin/campaigns/${c._id}/links`);
    const finalUrl = buildFinalUrl(c.route, c.name);
    setQrCampaign({ ...c, link: data?.[0] || null, finalUrl });
  };

  const downloadQR = (campaign) => {
    if (!campaign?.finalUrl) return;
    const url = qrImageUrl(campaign.finalUrl, 600);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qr-${campaign.name.replace(/\s+/g, '-').toLowerCase()}.png`;
    a.target = '_blank';
    a.click();
  };

  const copyLink = (finalUrl) => {
    navigator.clipboard.writeText(finalUrl);
  };

  return (
    <div className="admin-page">
      {/* Top bar */}
      <div style={{ margin: '-28px -28px 24px', padding: '18px 28px', background: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>QR Campaigns</h1>
        <button className="btn btn-primary" onClick={openCreate}>+ New Campaign</button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="admin-loading"><div className="admin-spinner" /></div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Campaign</th>
                <th>Redirects To</th>
                <th>Status</th>
                <th>Scans</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map(c => (
                <tr key={c._id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{c.name}</div>
                    {c.description && <div style={{ fontSize: 11, color: '#64748b' }}>{c.description}</div>}
                  </td>
                  <td style={{ fontSize: 12, color: '#6366f1', fontFamily: 'monospace' }}>
                    {c.route || '/'}
                  </td>
                  <td>
                    <span className={`badge ${c.status === 'active' ? 'badge-green' : c.status === 'paused' ? 'badge-orange' : 'badge-gray'}`}>
                      {c.status}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{(c.totalScans || 0).toLocaleString()}</td>
                  <td style={{ fontSize: 12, color: '#94a3b8' }}>{new Date(c.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-primary btn-sm" onClick={() => {
                        const finalUrl = buildFinalUrl(c.route, c.name);
                        setQrCampaign({ ...c, link: { shortCode: null }, finalUrl });
                      }}>View QR</button>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(c)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => remove(c._id)}>Del</button>
                    </div>
                  </td>
                </tr>
              ))}
              {campaigns.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
                    No campaigns yet - click "+ New Campaign" to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Create / Edit Modal ── */}
      {showModal && (
        <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="admin-modal" style={{ maxWidth: 460 }} onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>{editItem ? 'Edit Campaign' : 'New Campaign'}</h2>
              <button className="admin-modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="admin-modal-body">
              <div className="admin-form-group">
                <label>Campaign Name *</label>
                <input
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Ooty Summer Campaign"
                  autoFocus
                />
              </div>

              <div className="admin-form-group">
                <label>Redirect To (Page) *</label>
                <select value={form.route} onChange={e => setForm({ ...form, route: e.target.value })}>
                  {SITE_ROUTES.map(r => (
                    <option key={r.path} value={r.path}>{r.label} - {r.path}</option>
                  ))}
                </select>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                  Final URL: <span style={{ color: '#6366f1', fontFamily: 'monospace' }}>{FRONTEND_URL}{form.route}</span>
                </div>
              </div>

              <div className="admin-form-group">
                <label>Description</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Optional notes"
                />
              </div>

              <div className="admin-form-group">
                <label>Status</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>
                {saving ? 'Saving…' : editItem ? 'Save Changes' : 'Create & Get QR'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── QR Modal ── */}
      {qrCampaign && (
        <div className="admin-modal-overlay" onClick={() => setQrCampaign(null)}>
          <div
            className="admin-modal"
            style={{ maxWidth: 380, textAlign: 'center' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="admin-modal-header">
              <h2>QR Code</h2>
              <button className="admin-modal-close" onClick={() => setQrCampaign(null)}>✕</button>
            </div>
            <div style={{ padding: '24px 24px 8px' }}>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{qrCampaign.name}</div>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 20 }}>
                → {FRONTEND_URL}{qrCampaign.route || '/'}
              </div>

              {qrCampaign.finalUrl ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                    <img
                      src={qrImageUrl(qrCampaign.finalUrl, 240)}
                      alt="QR Code"
                      width={240}
                      height={240}
                      style={{ borderRadius: 12, border: '1px solid #e2e8f0' }}
                    />
                  </div>

                  {/* Final URL - what the QR encodes */}
                  <div style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 14px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#4f46e5', wordBreak: 'break-all' }}>
                      {qrCampaign.finalUrl}
                    </span>
                    <button
                      onClick={() => copyLink(qrCampaign.finalUrl)}
                      style={{ flexShrink: 0, fontSize: 11, color: '#6366f1', background: 'none', border: '1px solid #c7d2fe', borderRadius: 5, padding: '3px 8px', cursor: 'pointer' }}
                    >
                      Copy
                    </button>
                  </div>

                  <button
                    className="btn btn-primary"
                    style={{ width: '100%' }}
                    onClick={() => downloadQR(qrCampaign)}
                  >
                    ↓ Download QR as PNG
                  </button>
                </>
              ) : (
                <div style={{ padding: 40, color: '#94a3b8' }}>No tracking link found for this campaign.</div>
              )}
            </div>
            <div style={{ height: 16 }} />
          </div>
        </div>
      )}
    </div>
  );
}
