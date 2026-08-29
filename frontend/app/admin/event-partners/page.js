'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api';

const TYPE_OPTIONS = [
  { value: 'organizer',  label: 'Organizer',          color: '#eff6ff', text: '#1d4ed8' },
  { value: 'chiefGuest', label: 'Chief Guest',         color: '#fff1f2', text: '#be123c' },
  { value: 'specialGuest', label: 'Special Guest',      color: '#fff7ed', text: '#c2410c' },
  { value: 'supporting', label: 'Supporting Partner',  color: '#f0fdf4', text: '#15803d' },
  { value: 'academic',   label: 'Academic Partner',    color: '#fdf4ff', text: '#7e22ce' },
  { value: 'sponsor',    label: 'Sponsor',             color: '#fffbeb', text: '#b45309' },
];

const EMPTY_FORM = { name: '', logo: '', website: '', description: '', type: 'supporting', isActive: true };

export default function EventPartnersPage() {
  const [partners, setPartners] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editPartner, setEditPartner] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (typeFilter) params.set('type', typeFilter);
    const { data } = await apiGet(`/api/v1/admin/event-partners?${params}`);
    const list = Array.isArray(data) ? data : [];
    setPartners(list);
    setTotal(list.length);
    setLoading(false);
  }, [typeFilter]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditPartner(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = p => {
    setEditPartner(p);
    setForm({
      name: p.name || '',
      logo: p.logo || '',
      website: p.website || '',
      description: p.description || '',
      type: p.type || 'supporting',
      isActive: p.isActive !== false,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return alert('Name is required.');
    setSaving(true);
    if (editPartner) {
      await apiPatch(`/api/v1/admin/event-partners/${editPartner._id}`, form);
    } else {
      await apiPost('/api/v1/admin/event-partners', form);
    }
    setSaving(false);
    setShowModal(false);
    load();
  };

  const handleDelete = async id => {
    if (!confirm('Delete this partner from the library? This will not remove it from existing events.')) return;
    await apiDelete(`/api/v1/admin/event-partners/${id}`);
    load();
  };

  const typeMeta = v => TYPE_OPTIONS.find(t => t.value === v) || TYPE_OPTIONS[1];

  return (
    <div className="admin-page">
      {/* Top bar */}
      <div className="admin-topbar" style={{ margin: '-28px -28px 24px', padding: '18px 28px', background: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Partners Library</h1>
          <span style={{ fontSize: 13, color: '#64748b' }}>{total} entries - reused across events</span>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ Add Partner</button>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <button className={`btn btn-sm ${!typeFilter ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTypeFilter('')}>All</button>
        {TYPE_OPTIONS.map(t => (
          <button key={t.value} className={`btn btn-sm ${typeFilter === t.value ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTypeFilter(t.value)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="admin-loading"><div className="admin-spinner" /></div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Logo</th>
                <th>Name</th>
                <th>Type</th>
                <th>Website</th>
                <th>Description</th>
                <th>Active</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {partners.map(p => {
                const meta = typeMeta(p.type);
                return (
                  <tr key={p._id}>
                    <td>
                      {p.logo ? (
                        <img src={p.logo} alt={p.name} style={{ width: 40, height: 40, objectFit: 'contain', borderRadius: 6, border: '1px solid #e2e8f0', background: '#f8fafc' }} />
                      ) : (
                        <div style={{ width: 40, height: 40, borderRadius: 6, background: meta.color, border: `1px solid #e2e8f0`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16, color: meta.text }}>
                          {p.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </td>
                    <td style={{ fontWeight: 700 }}>{p.name}</td>
                    <td>
                      <span style={{ background: meta.color, color: meta.text, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                        {meta.label}
                      </span>
                    </td>
                    <td>
                      {p.website ? (
                        <a href={p.website} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', fontSize: 12 }}>
                          {p.website.replace(/^https?:\/\//, '').split('/')[0]}
                        </a>
                      ) : '–'}
                    </td>
                    <td style={{ color: '#64748b', fontSize: 12, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.description || '–'}
                    </td>
                    <td>
                      <span style={{ color: p.isActive ? '#10b981' : '#94a3b8', fontWeight: 700, fontSize: 12 }}>
                        {p.isActive ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(p)}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p._id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {partners.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                    No partners yet. Click &ldquo;+ Add Partner&rdquo; to build your library.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit modal */}
      {showModal && (
        <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="admin-modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>{editPartner ? 'Edit Partner' : 'Add Partner to Library'}</h2>
              <button className="admin-modal-close" onClick={() => setShowModal(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="admin-modal-body">
              <div className="admin-form-group">
                <label>Name *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. IIT Bombay, Google, NASSCOM" />
              </div>

              <div className="admin-form-group">
                <label>Type</label>
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                  {TYPE_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>

              <div className="admin-form-group">
                <label>Logo URL</label>
                <input value={form.logo} onChange={e => setForm({ ...form, logo: e.target.value })} placeholder="https://example.com/logo.png" />
                {form.logo && (
                  <div style={{ marginTop: 8 }}>
                    <img src={form.logo} alt="preview" style={{ height: 48, objectFit: 'contain', borderRadius: 6, border: '1px solid #e2e8f0', padding: 4, background: '#f8fafc' }} />
                  </div>
                )}
              </div>

              <div className="admin-form-group">
                <label>Website</label>
                <input value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} placeholder="https://example.com" />
              </div>

              <div className="admin-form-group">
                <label>{(form.type === 'chiefGuest' || form.type === 'specialGuest') ? 'Role / Designation' : 'Description (optional)'}</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} placeholder={(form.type === 'chiefGuest' || form.type === 'specialGuest') ? 'e.g. Minister of IT, Govt. of Telangana' : 'One-line description shown on event pages'} />
              </div>

              <div className="admin-form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} />
                  Active (visible in event form dropdowns)
                </label>
              </div>
            </div>
            <div className="admin-modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : editPartner ? 'Update' : 'Add to Library'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
