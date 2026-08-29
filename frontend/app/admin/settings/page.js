'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiGet, apiPost, apiDelete } from '@/lib/api';

// Keys whose values are stored in paise - display and edit in rupees.
const PAISE_KEYS = [
  'grant.evaluation.fee',
  'grant.preIncubation.fee',
  'grant.incubation.fee',
];

function isPaiseKey(key) {
  return PAISE_KEYS.includes(key);
}

function formatValue(key, value) {
  if (typeof value === 'object') return JSON.stringify(value);
  if (isPaiseKey(key) && Number(value) > 0) {
    const rupees = (Number(value) / 100).toLocaleString('en-IN');
    return `₹${rupees} (${value} paise)`;
  }
  return String(value);
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ key: '', value: '', category: 'general', description: '' });

  const load = useCallback(async () => {
    setLoading(true);
    const params = category ? `?category=${category}` : '';
    const { data } = await apiGet(`/api/v1/admin/settings${params}`);
    if (data) setSettings(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [category]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async () => {
    if (!form.key) return;
    let valueToSave = form.value;
    // Convert rupees → paise before saving fee keys.
    if (isPaiseKey(form.key) && form.value !== '') {
      valueToSave = String(Math.round(Number(form.value) * 100));
    }
    await apiPost('/api/v1/admin/settings', { ...form, value: valueToSave });
    setShowModal(false);
    setForm({ key: '', value: '', category: 'general', description: '' });
    load();
  };

  const handleDelete = async key => {
    if (!confirm(`Delete setting "${key}"?`)) return;
    await apiDelete(`/api/v1/admin/settings/${encodeURIComponent(key)}`);
    load();
  };

  const openEdit = s => {
    // Show fee keys in rupees so the admin types a natural number.
    let displayValue =
      typeof s.value === 'object' ? JSON.stringify(s.value) : String(s.value);
    if (isPaiseKey(s.key) && s.value !== '' && s.value !== null) {
      displayValue = String(Number(s.value) / 100);
    }
    setForm({
      key: s.key,
      value: displayValue,
      category: s.category,
      description: s.description || '',
    });
    setShowModal(true);
  };

  const categories = ['general', 'email', 'payment', 'seo', 'appearance', 'security'];

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
        <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Settings</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Add Setting
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <button
          className={`btn ${!category ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          onClick={() => setCategory('')}
        >
          All
        </button>
        {categories.map(c => (
          <button
            key={c}
            className={`btn ${category === c ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setCategory(c)}
            style={{ textTransform: 'capitalize' }}
          >
            {c}
          </button>
        ))}
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
                <th>Key</th>
                <th>Value</th>
                <th>Category</th>
                <th>Description</th>
                <th>Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {settings.map(s => (
                <tr key={s._id}>
                  <td style={{ fontFamily: 'monospace', fontSize: 12.5, fontWeight: 600 }}>
                    {s.key}
                  </td>
                  <td
                    style={{
                      maxWidth: 220,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {formatValue(s.key, s.value)}
                  </td>
                  <td>
                    <span className="badge badge-gray" style={{ textTransform: 'capitalize' }}>
                      {s.category}
                    </span>
                  </td>
                  <td
                    style={{
                      color: '#64748b',
                      maxWidth: 200,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {s.description || '-'}
                  </td>
                  <td style={{ fontSize: 12.5, color: '#94a3b8' }}>
                    {new Date(s.updatedAt).toLocaleDateString()}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => openEdit(s)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(s.key)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {settings.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                    No settings configured
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>Add / Update Setting</h2>
              <button className="admin-modal-close" onClick={() => setShowModal(false)}>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="admin-modal-body">
              <div className="admin-form-group">
                <label>Key</label>
                <input
                  value={form.key}
                  onChange={e => setForm({ ...form, key: e.target.value })}
                  placeholder="e.g. site_name"
                />
              </div>
              <div className="admin-form-group">
                <label>
                  Value
                  {isPaiseKey(form.key) && (
                    <span
                      style={{
                        marginLeft: 8,
                        fontSize: 11,
                        fontWeight: 600,
                        color: '#7A1F2B',
                        background: '#fef2f2',
                        padding: '2px 8px',
                        borderRadius: 6,
                      }}
                    >
                      Enter in ₹ rupees - saved as paise automatically
                    </span>
                  )}
                </label>
                <textarea
                  value={form.value}
                  onChange={e => setForm({ ...form, value: e.target.value })}
                  placeholder={isPaiseKey(form.key) ? 'e.g. 1499 for ₹1,499' : ''}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="admin-form-group">
                  <label>Category</label>
                  <select
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                  >
                    {categories.map(c => (
                      <option key={c} value={c} style={{ textTransform: 'capitalize' }}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="admin-form-group">
                  <label>Description</label>
                  <input
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <div className="admin-modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSave}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
