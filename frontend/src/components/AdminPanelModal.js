import React, { useState, useMemo } from 'react';
import './AdminPanelModal.css';

const AdminPanelModal = ({ restaurants = [], onClose }) => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const perPage = 10;

  const filteredRestaurants = useMemo(() => {
    const q = String(search || '').trim().toLowerCase();
    if (!q) return restaurants;
    return restaurants.filter((r) => {
      const id = String(r.restaurant_id || '').toLowerCase();
      const name = String(r.name || '').toLowerCase();
      const city = String(r.city || '').toLowerCase();
      return id.includes(q) || name.includes(q) || city.includes(q);
    });
  }, [restaurants, search]);

  const total = filteredRestaurants.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const start = (page - 1) * perPage;
  const end = Math.min(total, start + perPage);

  const pageItems = useMemo(() => filteredRestaurants.slice(start, end), [filteredRestaurants, start, end]);
  const [toast, setToast] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 1800);
  };

  // Keep the modal height consistent whenever the current page contains fewer
  // than a full page of items (including when there are zero items on the
  // current page). This prevents the modal from shrinking on the last page.
  const needsFixedHeight = pageItems.length < perPage;

  return (
    <div className="admin-overlay" onClick={onClose}>
      {toast && <div className="admin-toast">{toast}</div>}
      <div className={`admin-modal ${needsFixedHeight ? 'fixed-height' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="admin-header">
          <h2>Restaurant Management</h2>
          <div className="admin-actions">
            <input
              className="admin-search"
              placeholder="Search by id, name or city..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
            <button className="button" onClick={onClose}>Close</button>
          </div>
        </div>

        <div className={`admin-table-wrap ${needsFixedHeight ? 'fixed' : ''}`}>
          <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>City</th>
              <th>Category</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((r, idx) => (
              <tr key={r.restaurant_id}>
                <td>{String(r.restaurant_id).padStart(3, '0')}</td>
                <td>{r.name}</td>
                <td>{r.city}</td>
                <td>{(r.categories || [])[0]?.name || '—'}</td>
                <td>
                  {r.status === 'active' && <span className="status-active">✓ Active</span>}
                  {r.status === 'pending' && <span className="status-pending">⚠️ Pending</span>}
                  {r.status === 'inactive' && <span className="status-inactive">❌ Inactive</span>}
                </td>
                <td>
                  <button className="button small" onClick={() => showToast('Edit (stub)')}>✏️</button>
                  <button className="button small" onClick={() => showToast('View (stub)')}>👁️</button>
                  <button className="button small" onClick={() => showToast('Delete (stub)')}>🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
          </table>
        </div>

        <div className="admin-footer">
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
        <div className="pending-reviews">
          <h3>Pending Reviews</h3>
          <div className="pending-reviews-list">
            {/* empty for now */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanelModal;
