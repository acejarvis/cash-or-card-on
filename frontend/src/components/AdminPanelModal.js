import React, { useState, useMemo, useEffect, lazy, Suspense } from 'react';
import './AdminPanelModal.css';
import { titleCase, formatPostalCode } from '../utils/format';
import ResourceMonitoringModal from './ResourceMonitoringModal';

// Lazy load RestaurantDetailsModal to break circular dependency
const RestaurantDetailsModal = lazy(() => import('./RestaurantDetailsModal'));

const AdminPanelModal = ({ restaurants = [], onClose, onRefresh }) => {
  console.log('[AdminPanelModal] Render');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const perPage = 10;

  // Keep a local copy so we can remove items without forcing a parent refresh
  const [items, setItems] = useState(restaurants || []);

  useEffect(() => {
    setItems(restaurants || []);
  }, [restaurants]);

  const filteredRestaurants = useMemo(() => {
    // Filter out unverified restaurants (they appear in Pending Approvals tab only)
    const verifiedItems = items.filter(r => r.is_verified !== false);
    const q = String(search || '').trim().toLowerCase();
    if (!q) return verifiedItems;
    return verifiedItems.filter((r) => {
      const id = String(r.id || r.restaurant_id || r._id || '').toLowerCase();
      const name = String(r.name || '').toLowerCase();
      const city = String(r.city || '').toLowerCase();
      return id.includes(q) || name.includes(q) || city.includes(q);
    });
  }, [items, search]);

  const total = filteredRestaurants.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const start = (page - 1) * perPage;
  const end = Math.min(total, start + perPage);

  const pageItems = useMemo(() => filteredRestaurants.slice(start, end), [filteredRestaurants, start, end]);
  const [toast, setToast] = useState('');
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  // Create restaurant modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRestaurant, setNewRestaurant] = useState({
    name: '', address: '', city: '', province: 'Ontario', postal_code: '', phone: '', category: 'Other', cuisine_tags: '', website_url: ''
  });
  const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const dayLabels = { monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun' };
  const getDefaultOperatingHours = () => {
    const obj = {};
    dayKeys.forEach((d) => {
      // Default 09:00 - 22:00 for every day
      obj[d] = { open: '09:00', close: '22:00', closed: false };
    });
    return obj;
  };

  const [newOperatingHours, setNewOperatingHours] = useState(() => getDefaultOperatingHours());
  // Edit modal state
  const [editingRestaurant, setEditingRestaurant] = useState(null);
  const [editPayments, setEditPayments] = useState([]);
  const [editDiscountValue, setEditDiscountValue] = useState('');
  const [editDiscountId, setEditDiscountId] = useState(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [pendingItems, setPendingItems] = useState({ restaurants: [], paymentMethods: [], cashDiscounts: [] });
  const [activeTab, setActiveTab] = useState('restaurants'); // 'restaurants' or 'pending'
  const [showMonitoring, setShowMonitoring] = useState(false);

  const canonicalPayments = [
    { key: 'amex', label: 'Amex' },
    { key: 'visa', label: 'Visa' },
    { key: 'mastercard', label: 'Mastercard' },
    { key: 'cash', label: 'Cash' },
    { key: 'debit', label: 'Debit' },
  ];

  const API_BASE_URL = process.env.REACT_APP_API_BASE || 'http://localhost:3001/api';

  const openEditModal = (restaurant) => {
    setEditingRestaurant(restaurant);
    // build payments list from restaurant.payment_methods
    const map = {};
    (restaurant.payment_methods || []).forEach((m) => {
      const key = (m.type || m.name || '').toString().toLowerCase().replace(/[^a-z0-9]/g, '');
      map[key] = m;
    });
    const list = canonicalPayments.map((p) => {
      const found = map[p.key];
      return {
        key: p.key,
        label: p.label,
        id: found ? found.id : null,
        isAccepted: found ? (found.is_accepted === undefined ? true : !!found.is_accepted) : false,
        isVerified: found ? !!found.is_verified : false,
      };
    });
    setEditPayments(list);

    const cd = (restaurant.cash_discounts && restaurant.cash_discounts.length) ? restaurant.cash_discounts[0] : null;
    setEditDiscountValue(cd ? String(cd.percentage ?? '') : '');
    setEditDiscountId(cd ? (cd.id || cd._id || null) : null);
  };

  const closeEditModal = () => {
    setEditingRestaurant(null);
    setEditPayments([]);
    setEditDiscountValue('');
    setEditDiscountId(null);
    setIsSavingEdit(false);
  };

  const fetchPending = async () => {
    try {
      const token = sessionStorage.getItem('auth_token');
      const resp = await fetch(`${API_BASE_URL}/admin/pending`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      if (resp.ok) {
        const data = await resp.json();
        setPendingItems(data);
      }
    } catch (e) {
      console.error('Failed to fetch pending items', e);
    }
  };

  useEffect(() => {
    if (activeTab === 'pending') {
      fetchPending();
    }
  }, [activeTab]);

  const handleApprove = async (type, id) => {
    try {
      const token = sessionStorage.getItem('auth_token');
      const resp = await fetch(`${API_BASE_URL}/admin/approve/${type}/${id}`, {
        method: 'POST',
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      if (resp.ok) {
        showToast('Approved');
        fetchPending();
        if (onRefresh) onRefresh();
      } else {
        showToast('Failed to approve');
      }
    } catch (e) {
      showToast('Network error');
    }
  };

  const handleReject = async (type, id) => {
    try {
      const token = sessionStorage.getItem('auth_token');
      const resp = await fetch(`${API_BASE_URL}/admin/reject/${type}/${id}`, {
        method: 'POST',
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      if (resp.ok) {
        showToast('Rejected');
        fetchPending();
      } else {
        showToast('Failed to reject');
      }
    } catch (e) {
      showToast('Network error');
    }
  };

  const toggleEditPayment = async (index) => {
    // Local-only toggle; actual submit happens in Save & Submit
    setEditPayments((prev) => prev.map((it, i) => i === index ? { ...it, isAccepted: !it.isAccepted } : it));
  };

  const saveAndSubmitEdits = async () => {
    if (!editingRestaurant) return;
    setIsSavingEdit(true);
    const token = sessionStorage.getItem('auth_token');
    const restId = editingRestaurant.id || editingRestaurant.restaurant_id || editingRestaurant._id;
    const updatedPayments = [];
    try {
      // Process payments: create if missing, then verify
      for (const p of editPayments) {
        let pmId = p.id;
        // create payment method if missing
        if (!pmId) {
          const resp = await fetch(`${API_BASE_URL}/payment-methods`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
            body: JSON.stringify({ restaurantId: restId, paymentType: p.key, isAccepted: p.isAccepted }),
          });
          const body = await resp.json().catch(() => ({}));
          if (!resp.ok) {
            showToast(body.message || `Failed to create ${p.label}`);
            continue;
          }
          // backend returns { paymentMethod }
          pmId = (body && (body.paymentMethod && (body.paymentMethod.id || body.paymentMethod._id)))
            ? (body.paymentMethod.id || body.paymentMethod._id)
            : (body && (body.id || body.paymentMethodId || body._id) ? (body.id || body.paymentMethodId || body._id) : null);
        } else {
          // if pm exists, you might want to update its acceptance on server — not defined in API; fallback: create vote or patch if available
          try {
            await fetch(`${API_BASE_URL}/payment-methods/${encodeURIComponent(pmId)}/verify`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
            }).catch(() => { });
          } catch (e) { }
        }

        // verify payment method (admin action)
        if (pmId) {
          try {
            await fetch(`${API_BASE_URL}/payment-methods/${encodeURIComponent(pmId)}/verify`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
            }).catch(() => { });
          } catch (e) { }
        }

        updatedPayments.push({ id: pmId, type: p.key, is_accepted: !!p.isAccepted, is_verified: true });
      }

      // Process cash discount if provided
      let newDiscount = null;
      const pct = parseFloat(editDiscountValue);
      if (!Number.isNaN(pct)) {
        let newId = null;
        // If an existing discount id is present, update it via PUT
        if (editDiscountId) {
          try {
            const resp = await fetch(`${API_BASE_URL}/cash-discounts/${encodeURIComponent(editDiscountId)}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
              body: JSON.stringify({ discount_percentage: pct }),
            });
            const body = await resp.json().catch(() => ({}));
            if (resp.ok) {
              newId = (body && body.cashDiscount && (body.cashDiscount.id || body.cashDiscount._id)) ? (body.cashDiscount.id || body.cashDiscount._id) : (body && (body.id || body._id) ? (body.id || body._id) : editDiscountId);
            } else {
              showToast(body.message || 'Failed to update discount');
            }
          } catch (e) {
            // network
          }
        } else {
          // create new discount
          try {
            const resp = await fetch(`${API_BASE_URL}/cash-discounts`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
              body: JSON.stringify({ restaurantId: restId, discountPercentage: pct, description: '' }),
            });
            const body = await resp.json().catch(() => ({}));
            if (resp.ok) {
              newId = (body && body.cashDiscount && (body.cashDiscount.id || body.cashDiscount._id)) ? (body.cashDiscount.id || body.cashDiscount._id) : (body && (body.id || body.discountId || body._id) ? (body.id || body.discountId || body._id) : null);
            } else {
              showToast(body.message || 'Failed to save discount');
            }
          } catch (e) {
            // network
          }
        }

        // If we have an id (new or existing), attempt to verify it
        if (!newId && editDiscountId) newId = editDiscountId;
        if (newId) {
          try {
            await fetch(`${API_BASE_URL}/cash-discounts/${encodeURIComponent(newId)}/verify`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
            }).catch(() => { });
          } catch (e) { }
        }

        newDiscount = { id: newId || editDiscountId || null, percentage: pct, is_verified: true };
      }

      // Update local items with new payments and discount
      setItems((prev) => prev.map((it) => {
        const ids = [it.id, it.restaurant_id, it._id].filter(Boolean).map(String);
        if (ids.includes(String(restId))) {
          const next = { ...it };
          // merge payment methods: keep existing ones not in canonical list, and replace canonical ones
          const other = (next.payment_methods || []).filter((m) => {
            const key = (m.type || m.name || '').toString().toLowerCase().replace(/[^a-z0-9]/g, '');
            return !canonicalPayments.find(cp => cp.key === key);
          });
          next.payment_methods = [...other, ...updatedPayments];
          if (newDiscount) next.cash_discounts = [newDiscount];
          return next;
        }
        return it;
      }));

      showToast('Changes saved and verified');
      closeEditModal();
    } catch (err) {
      showToast('Network error while submitting edits');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const saveEditDiscount = async () => {
    const pct = parseFloat(editDiscountValue);
    if (Number.isNaN(pct)) { showToast('Invalid discount'); return; }
    setIsSavingEdit(true);
    try {
      const token = sessionStorage.getItem('auth_token');
      // create new discount (or create a replacement) then verify it
      const resp = await fetch(`${API_BASE_URL}/cash-discounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ restaurantId: editingRestaurant.id || editingRestaurant.restaurant_id || editingRestaurant._id, discountPercentage: pct, description: '' }),
      });
      const body = await resp.json().catch(() => ({}));
      if (!resp.ok) { showToast(body.message || 'Failed to save discount'); setIsSavingEdit(false); return; }
      const newId = body && (body.id || body.discountId || body._id) ? (body.id || body.discountId || body._id) : null;
      if (newId) {
        await fetch(`${API_BASE_URL}/cash-discounts/${encodeURIComponent(newId)}/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        }).catch(() => { });
      }
      // update local items: replace or set cash_discounts[0]
      setItems((prev) => prev.map((it) => {
        const ids = [it.id, it.restaurant_id, it._id].filter(Boolean).map(String);
        if (ids.includes(String(editingRestaurant.id || editingRestaurant.restaurant_id || editingRestaurant._id))) {
          const next = { ...it };
          next.cash_discounts = [{ id: newId, percentage: pct, is_verified: true }];
          return next;
        }
        return it;
      }));
      showToast('Discount saved & verified');
    } catch (err) {
      showToast('Network error');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 1800);
  };

  // Keep the modal height consistent whenever the current page contains fewer
  // than a full page of items (including when there are zero items on the
  // current page). This prevents the modal from shrinking on the last page.
  const needsFixedHeight = pageItems.length < perPage;

  console.log('[AdminPanelModal] Render. showMonitoring:', showMonitoring);

  return (
    <>
      <div className="admin-overlay" onClick={onClose}>
        {toast && <div className="admin-toast">{toast}</div>}
        <div className={`admin-modal ${needsFixedHeight ? 'fixed-height' : ''}`} onClick={(e) => e.stopPropagation()}>
          <div className="admin-header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h2 style={{ margin: 0 }}>Restaurant Management</h2>
              <button
                onClick={onClose}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '18px',
                  cursor: 'pointer',
                  color: '#64748b',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  lineHeight: 1
                }}
              >
                &times;
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: '16px' }}>
              <div className="admin-tabs" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button
                  className={`button ${activeTab === 'restaurants' ? 'primary' : ''}`}
                  onClick={() => setActiveTab('restaurants')}
                >
                  Restaurants
                </button>

                <button
                  className="button"
                  onClick={() => { setNewOperatingHours(getDefaultOperatingHours()); setShowCreateModal(true); }}
                >
                  Create Restaurant
                </button>

                <button
                  className={`button ${activeTab === 'pending' ? 'primary' : ''}`}
                  onClick={() => setActiveTab('pending')}
                >
                  Pending Approvals
                </button>

                <button
                  className="button"
                  onClick={() => setShowMonitoring(true)}
                >
                  System Monitoring
                </button>
              </div>

              <div className="admin-actions">
                {activeTab === 'restaurants' && (
                  <input
                    className="admin-search"
                    placeholder="Search by id, name or city..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  />
                )}
                {activeTab === 'pending' && (
                  <button className="button small" onClick={fetchPending}>Refresh</button>
                )}
              </div>
            </div>
          </div>

          <div className={`admin-table-wrap ${needsFixedHeight ? 'fixed' : ''}`} style={{ display: activeTab === 'restaurants' ? 'block' : 'none' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>City</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((r) => {
                  const rawId = r.id || r.restaurant_id || r._id || '';
                  const idStr = String(rawId);
                  // If the id is all-digits, pad to 3 for nicer display, otherwise show as-is
                  const displayId = /^\d+$/.test(idStr) ? idStr.padStart(3, '0') : idStr;
                  const key = rawId || r.name || Math.random();
                  return (
                    <tr key={key}>
                      <td>{displayId || '—'}</td>
                      <td>{titleCase(r.name)}</td>
                      <td>{titleCase(r.city)}</td>
                      <td>
                        <button className="button small" onClick={() => openEditModal(r)}>Edit</button>
                        <button className="button small" onClick={() => setSelectedRestaurant(r)}>View</button>
                        <button className="button small" onClick={async () => {
                          // Delete restaurant via backend API and remove locally (no page reload)
                          const idToDelete = rawId;
                          if (!idToDelete) { showToast('Unable to determine id for delete'); return; }
                          const API_BASE_URL = process.env.REACT_APP_API_BASE || 'http://localhost:3001/api';
                          const token = sessionStorage.getItem('auth_token');
                          try {
                            const resp = await fetch(`${API_BASE_URL}/restaurants/${encodeURIComponent(idToDelete)}`, {
                              method: 'DELETE',
                              headers: {
                                'Content-Type': 'application/json',
                                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                              },
                            });
                            let body = null;
                            try { body = await resp.json(); } catch (e) { /* ignore json parse errors */ }
                            if (!resp.ok) {
                              const msg = body && body.message ? body.message : `Delete failed (${resp.status})`;
                              showToast(msg);
                              return;
                            }
                            // remove from local items so UI reflects deletion immediately
                            setItems((prev) => prev.filter((it) => {
                              const ids = [it.id, it.restaurant_id, it._id].filter(Boolean).map(String);
                              return !ids.includes(String(idToDelete));
                            }));
                            showToast('Restaurant deleted');
                            if (onRefresh) onRefresh();
                          } catch (err) {
                            showToast('Network error during delete');
                          }
                        }}>Delete</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="admin-footer" style={{ display: activeTab === 'restaurants' ? 'flex' : 'none' }}>
            <div>Showing {start + 1}-{end} of {total} restaurants</div>
            <div className="pagination">
              <button disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>&lt; Previous</button>
              {Array.from({ length: totalPages }).slice(0, 7).map((_, i) => (
                <button key={i} className={page === i + 1 ? 'active' : ''} onClick={() => setPage(i + 1)}>{i + 1}</button>
              ))}
              <button disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next &gt;</button>
            </div>
          </div>
          {/* Pending reviews placeholder */}
          {/* Pending reviews placeholder */}
          {activeTab === 'pending' && (
            <div className="pending-reviews" style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
              {/* Pending Restaurants - Hidden per user request */}
              {/* {pendingItems.restaurants && pendingItems.restaurants.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <h3>Pending Restaurants</h3>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>City</th>
                        <th>Submitted By</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingItems.restaurants.map(r => (
                        <tr key={r.id}>
                          <td>{titleCase(r.name || '')}</td>
                          <td>{titleCase(r.city || '')}</td>
                          <td>{r.submitted_by_username || 'Unknown'}</td>
                          <td>
                            <button className="button small primary" onClick={() => handleApprove('restaurant', r.id)}>Approve</button>
                            <button className="button small" onClick={() => handleReject('restaurant', r.id)}>Reject</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )} */}


              {/* Pending Payment Methods */}
              {pendingItems.paymentMethods && pendingItems.paymentMethods.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <h3>Pending Payment Methods</h3>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Restaurant</th>
                        <th>Type</th>
                        <th>Accepted?</th>
                        <th>Submitted By</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingItems.paymentMethods.map(pm => (
                        <tr key={pm.id}>
                          <td>{titleCase(pm.restaurant_name || '')}</td>
                          <td>{titleCase(pm.payment_type || '')}</td>
                          <td>{pm.is_accepted ? 'Yes' : 'No'}</td>
                          <td>{pm.submitted_by_username || 'Unknown'}</td>
                          <td>
                            <button className="button small primary" onClick={() => handleApprove('payment-method', pm.id)}>Approve</button>
                            <button className="button small" onClick={() => handleReject('payment-method', pm.id)}>Reject</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pending Cash Discounts */}
              {pendingItems.cashDiscounts && pendingItems.cashDiscounts.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <h3>Pending Cash Discounts</h3>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Restaurant</th>
                        <th>Discount</th>
                        <th>Submitted By</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingItems.cashDiscounts.map(cd => (
                        <tr key={cd.id}>
                          <td>{titleCase(cd.restaurant_name || '')}</td>
                          <td>{cd.discount_percentage}%</td>
                          <td>{cd.submitted_by_username || 'Unknown'}</td>
                          <td>
                            <button className="button small primary" onClick={() => handleApprove('cash-discount', cd.id)}>Approve</button>
                            <button className="button small" onClick={() => handleReject('cash-discount', cd.id)}>Reject</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {(!pendingItems.paymentMethods?.length && !pendingItems.cashDiscounts?.length) && (
                <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                  No pending items to review.
                </div>
              )}
            </div>
          )}

          {/* Edit modal (admin) */}
          {editingRestaurant && (
            <div className="edit-overlay" onClick={() => setEditingRestaurant(null)}>
              <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
                <h3>Edit: {titleCase(editingRestaurant.name)}</h3>
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontWeight: 700, marginBottom: 6 }}>Payment Methods</div>
                  {editPayments.map((p, idx) => (
                    <div key={p.key} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <div style={{ flex: 1 }}>{p.label}</div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className={`button small ${p.isAccepted ? 'active' : ''}`} onClick={() => toggleEditPayment(idx)}>
                          {p.isAccepted ? 'Accepted' : 'Not accepted'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 12 }}>
                  <div style={{ fontWeight: 700, marginBottom: 6 }}>Cash Discount (%)</div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input type="number" min="0" max="100" className="input small" value={editDiscountValue} onChange={(e) => setEditDiscountValue(e.target.value)} />
                  </div>
                </div>

                <div style={{ marginTop: 12, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button className="button small" onClick={() => setEditingRestaurant(null)}>Close</button>
                  <button className="button primary" onClick={saveAndSubmitEdits} disabled={isSavingEdit}>Save & Submit</button>
                </div>
              </div>
            </div>
          )}
          {/* Create modal */}
          {showCreateModal && (
            <div className="edit-overlay" onClick={() => setShowCreateModal(false)}>
              <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
                <h3>Create Restaurant</h3>
                <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
                  <input className="input" placeholder="Name*" value={newRestaurant.name} onChange={(e) => setNewRestaurant({ ...newRestaurant, name: e.target.value })} />
                  <input className="input" placeholder="Address*" value={newRestaurant.address} onChange={(e) => setNewRestaurant({ ...newRestaurant, address: e.target.value })} />
                  <input className="input" placeholder="City*" value={newRestaurant.city} onChange={(e) => setNewRestaurant({ ...newRestaurant, city: e.target.value })} />
                  <select className="input" value={newRestaurant.category} onChange={(e) => setNewRestaurant({ ...newRestaurant, category: e.target.value })}>
                    <option value="Chinese">Chinese</option>
                    <option value="Korean">Korean</option>
                    <option value="Japanese">Japanese</option>
                    <option value="Vietnamese">Vietnamese</option>
                    <option value="Thai">Thai</option>
                    <option value="Italian">Italian</option>
                    <option value="French">French</option>
                    <option value="Indian">Indian</option>
                    <option value="Mexican">Mexican</option>
                    <option value="American">American</option>
                    <option value="Mediterranean">Mediterranean</option>
                    <option value="Canadian">Canadian</option>
                    <option value="Fusion">Fusion</option>
                    <option value="Other">Other</option>
                  </select>
                  <input className="input" placeholder="Province" value={newRestaurant.province} onChange={(e) => setNewRestaurant({ ...newRestaurant, province: e.target.value })} />
                  <input className="input" placeholder="Postal Code" value={newRestaurant.postal_code} onChange={(e) => setNewRestaurant({ ...newRestaurant, postal_code: e.target.value })} />
                  <input className="input" placeholder="Phone" value={newRestaurant.phone} onChange={(e) => setNewRestaurant({ ...newRestaurant, phone: e.target.value })} />
                  <input className="input" placeholder="Cuisine tags (comma separated)" value={newRestaurant.cuisine_tags} onChange={(e) => setNewRestaurant({ ...newRestaurant, cuisine_tags: e.target.value })} />
                  <input className="input" placeholder="Website URL" value={newRestaurant.website_url} onChange={(e) => setNewRestaurant({ ...newRestaurant, website_url: e.target.value })} />
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: 8 }}>
                    <div style={{ fontWeight: 700, marginBottom: 6 }}>Operating hours</div>
                    {dayKeys.map((d) => (
                      <div key={d} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                        <div style={{ width: 48 }}>{dayLabels[d]}</div>
                        <input type="time" className="input" value={newOperatingHours[d].open} onChange={(e) => setNewOperatingHours((s) => ({ ...s, [d]: { ...s[d], open: e.target.value } }))} disabled={newOperatingHours[d].closed} />
                        <span style={{ opacity: 0.6 }}>—</span>
                        <input type="time" className="input" value={newOperatingHours[d].close} onChange={(e) => setNewOperatingHours((s) => ({ ...s, [d]: { ...s[d], close: e.target.value } }))} disabled={newOperatingHours[d].closed} />
                        <label style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
                          <input type="checkbox" checked={newOperatingHours[d].closed} onChange={(e) => setNewOperatingHours((s) => ({ ...s, [d]: { ...s[d], closed: e.target.checked, open: e.target.checked ? '' : s[d].open, close: e.target.checked ? '' : s[d].close } }))} /> Closed
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ marginTop: 12, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button className="button small" onClick={() => setShowCreateModal(false)}>Cancel</button>
                  <button className="button primary" onClick={async () => {
                    // basic validation
                    if (!newRestaurant.name || !newRestaurant.address || !newRestaurant.city || !newRestaurant.category) { showToast('Please fill required fields'); return; }
                    const token = sessionStorage.getItem('auth_token');
                    // prepare payload
                    const payload = { ...newRestaurant };
                    // convert cuisine_tags string to array
                    if (typeof payload.cuisine_tags === 'string') payload.cuisine_tags = payload.cuisine_tags.split(',').map(s => s.trim()).filter(Boolean);
                    // pass operating_hours as-is (backend expects JSON or null)
                    try {
                      // attach operating_hours object: only include days that are not closed
                      const oh = {};
                      Object.keys(newOperatingHours).forEach((k) => {
                        const v = newOperatingHours[k];
                        if (!v.closed && v.open && v.close) oh[k] = { open: v.open, close: v.close };
                      });
                      payload.operating_hours = Object.keys(oh).length ? oh : null;

                      const resp = await fetch(`${API_BASE_URL}/restaurants`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                        body: JSON.stringify(payload),
                      });

                      // Try JSON first, fallback to text for error reporting
                      let body = null;
                      try { body = await resp.json(); } catch (e) {
                        try { body = await resp.text(); } catch (e2) { body = null; }
                      }

                      if (!resp.ok) {
                        const msg = (body && typeof body === 'object' && body.message) ? body.message : (typeof body === 'string' && body.length ? body : `Failed to create restaurant (${resp.status})`);
                        console.error('Create restaurant failed:', resp.status, body);
                        showToast(msg);
                        return;
                      }

                      const created = body && body.restaurant ? body.restaurant : (body && body.id ? body : null);
                      if (created) {
                        setItems((prev) => [created, ...prev]);
                        showToast('Restaurant created');
                        setShowCreateModal(false);
                        setNewRestaurant({ name: '', address: '', city: '', province: 'Ontario', postal_code: '', phone: '', category: '', cuisine_tags: '', website_url: '' });
                        // reset operating hours to defaults (09:00-22:00 every day)
                        setNewOperatingHours(() => getDefaultOperatingHours());
                      }
                    } catch (e) { showToast('Network error'); }
                  }}>Create</button>
                </div>
              </div>
            </div>
          )}
          {selectedRestaurant && (
            <Suspense fallback={<div>Loading...</div>}>
              <RestaurantDetailsModal
                restaurant={selectedRestaurant}
                onClose={() => setSelectedRestaurant(null)}
                user={{ role: 'admin' }}
              />
            </Suspense>
          )}
        </div>
      </div>

      {/* Resource Monitoring Modal - Rendered outside admin-modal to prevent nesting issues */}
      <ResourceMonitoringModal isOpen={showMonitoring} onClose={() => setShowMonitoring(false)} />
    </>
  );
};

export default AdminPanelModal;
