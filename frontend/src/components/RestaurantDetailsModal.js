import React, { useEffect, useState } from 'react';
import './RestaurantDetailsModal.css';
import restaurantImg from '../files/restaurant.jpg';

const RestaurantDetailsModal = ({ restaurant, onClose, user }) => {
  const [isClosing, setIsClosing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [localPayments, setLocalPayments] = useState(restaurant.payment_methods || []);
  const [localDiscounts, setLocalDiscounts] = useState(restaurant.cash_discounts || []);
  const [newDiscountValue, setNewDiscountValue] = useState('');
  const [editingDiscountValue, setEditingDiscountValue] = useState('');
  const [isEditingDiscount, setIsEditingDiscount] = useState(false);
  const [submittedMessage, setSubmittedMessage] = useState('');

  useEffect(() => {
    // Trigger enter animation after mount
    const t = setTimeout(() => setIsMounted(true), 8);
    return () => clearTimeout(t);
  }, []);

  // keep local copies in sync if restaurant prop changes
  useEffect(() => {
    setLocalPayments(restaurant.payment_methods || []);
    setLocalDiscounts(restaurant.cash_discounts || []);
  }, [restaurant]);

  const API_BASE_URL = process.env.REACT_APP_API_BASE || 'http://localhost:3001/api';

  // Helper: determine open/closed/closing soon based on operating_hours
  const getRestaurantStatus = (operatingHours) => {
    // supports both old array format and new API object format
    if (!operatingHours) return 'closed';

    const now = new Date();
    const currentDayLong = now.toLocaleString('en-US', { weekday: 'long' });
    const currentDay = currentDayLong.toLowerCase();

    let todayHours = null;
    if (Array.isArray(operatingHours)) {
      // old mock format: [{ day_of_week, open_time, close_time }, ...]
      todayHours = operatingHours.find(h => h.day_of_week === currentDayLong);
      if (todayHours) todayHours = { open: todayHours.open_time, close: todayHours.close_time };
    } else if (typeof operatingHours === 'object') {
      // new API format: { monday: { open: '11:00', close: '22:00' }, ... }
      todayHours = operatingHours[currentDay] || operatingHours[currentDayLong.toLowerCase()];
    };

    if (!todayHours || !todayHours.open || !todayHours.close) return 'closed';

  let currentMinutes = now.getHours() * 60 + now.getMinutes();
    const [openHour, openMinute] = todayHours.open.split(':').map(Number);
    const [closeHour, closeMinute] = todayHours.close.split(':').map(Number);
    const openTimeMinutes = openHour * 60 + openMinute;
    let closeTimeMinutes = closeHour * 60 + closeMinute;

    // handle closing after midnight
    if (closeTimeMinutes <= openTimeMinutes) {
      closeTimeMinutes += 24 * 60;
      if (currentMinutes < openTimeMinutes) {
        // consider current time as next-day minutes
        currentMinutes += 24 * 60;
      }
    }

    if (currentMinutes < openTimeMinutes || currentMinutes >= closeTimeMinutes) return 'closed';

    const minutesUntilClosing = closeTimeMinutes - currentMinutes;
    if (minutesUntilClosing <= 60) return 'closing-soon';
    return 'open';
  }

  const status = getRestaurantStatus(restaurant.operating_hours);

  // Cuisine type(s)
  const cuisine = (restaurant.cuisine_tags && restaurant.cuisine_tags.length > 0)
    ? restaurant.cuisine_tags.join(', ')
    : (restaurant.category ? restaurant.category : 'Cuisine not specified');

  // Operating hours (all days)
  // If you want to show day abbreviations, use this mapping:
  const dayAbbrMap = {
    monday: 'Mon',
    tuesday: 'Tue',
    wednesday: 'Wed',
    thursday: 'Thu',
    friday: 'Fri',
    saturday: 'Sat',
    sunday: 'Sun',
  };

  // Operating hours as an ordered list of rows (one per day)
  const operatingHours = (() => {
    const hours = restaurant.operating_hours || {};
    const days = Object.keys(dayAbbrMap);
    const rows = days.map((d) => {
      const key = dayAbbrMap[d];
      const h = hours[d] || hours[key] || null;
      if (!h || !h.open || !h.close) return null;
      return { day: key, text: `${h.open} - ${h.close}` };
    }).filter(Boolean);
    return rows.length > 0 ? rows : null;
  })();

  // Submit a new cash discount
  const submitNewDiscount = () => {
    const pct = parseFloat(newDiscountValue);
    if (Number.isNaN(pct)) return;

    if (!user) {
      setSubmittedMessage('Please log in to submit a discount');
      setTimeout(() => setSubmittedMessage(''), 1800);
      return;
    }

    (async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const resp = await fetch(`${API_BASE_URL}/cash-discounts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ restaurantId: restaurant.id, discountPercentage: pct, description: '' }),
        });

        const body = await resp.json();
        if (!resp.ok) {
          setSubmittedMessage(body && body.message ? body.message : 'Failed to submit discount');
          setTimeout(() => setSubmittedMessage(''), 2200);
          return;
        }

        setSubmittedMessage('Discount submitted');

        // Refresh discounts from server
        try {
          const cdResp = await fetch(`${API_BASE_URL}/cash-discounts/restaurant/${restaurant.id}`);
          if (cdResp.ok) {
            const cdBody = await cdResp.json();
            setLocalDiscounts(cdBody.cashDiscounts || cdBody.cash_discounts || []);
          }
        } catch (e) {}

        setNewDiscountValue('');
        setTimeout(() => setSubmittedMessage(''), 1800);
      } catch (err) {
        setSubmittedMessage('Network error');
        setTimeout(() => setSubmittedMessage(''), 1800);
      }
    })();
  };

  // Toggle payment method accept/not accept
  const togglePaymentAccept = async (index) => {
    const dp = displayPayments[index];
    if (!dp) return;

    if (!user) {
      setSubmittedMessage('Please log in to vote');
      setTimeout(() => setSubmittedMessage(''), 1800);
      return;
    }

    // If there's no server record for this canonical method, submit it first
    if (!dp.id) {
      const isAccepted = !dp.is_accepted; // user intends to toggle to this state
      try {
        const token = localStorage.getItem('auth_token');
        const resp = await fetch(`${API_BASE_URL}/payment-methods`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ restaurantId: restaurant.id, paymentType: dp.key, isAccepted }),
        });

        const body = await resp.json();
        if (!resp.ok) {
          setSubmittedMessage(body && body.message ? body.message : 'Failed to submit payment method');
          setTimeout(() => setSubmittedMessage(''), 2200);
          return;
        }

        setSubmittedMessage(body.message || 'Payment method submitted');
        // Don't refresh local payment list here; only post the user's intent and show a message.
        setTimeout(() => setSubmittedMessage(''), 1800);
        return;
      } catch (err) {
        setSubmittedMessage('Network error');
        setTimeout(() => setSubmittedMessage(''), 1800);
        return;
      }
    }

    // Otherwise, vote on existing payment method
    const voteType = dp.is_accepted ? 'downvote' : 'upvote';
    try {
      const token = localStorage.getItem('auth_token');
      const resp = await fetch(`${API_BASE_URL}/payment-methods/${dp.id}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ voteType }),
      });

      const body = await resp.json();
      if (!resp.ok) {
        setSubmittedMessage(body && body.message ? body.message : 'Vote failed');
        setTimeout(() => setSubmittedMessage(''), 2200);
        return;
      }

      setSubmittedMessage(body.message || 'Vote recorded');
      // Don't refresh local payment list here; only post the user's vote and show a message.
      setTimeout(() => setSubmittedMessage(''), 1800);
    } catch (err) {
      setSubmittedMessage('Network error');
      setTimeout(() => setSubmittedMessage(''), 1800);
    }
  };
  // canonical payment keys and display labels - keep in sync with App.js mapping
  const canonicalPayments = [
    { key: 'amex', label: 'Amex' },
    { key: 'visa', label: 'Visa' },
    { key: 'mastercard', label: 'Mastercard' },
    { key: 'cash', label: 'Cash' },
    { key: 'debit', label: 'Debit' }
  ];

  // small utility - same implementation as in RestaurantCard.js
  const capitalize = (s) => (typeof s === 'string' && s.length ? s.charAt(0).toUpperCase() + s.slice(1) : s);

  // helper to normalize keys (small local implementation matching App.js behavior)
  const normalizePaymentKey = (s) => {
    if (!s) return '';
    const raw = s.toString().toLowerCase().replace(/[^a-z0-9]/g, '');
    if (raw.includes('amex') || (raw.includes('american') && raw.includes('express'))) return 'amex';
    if (raw.includes('americanexpress')) return 'americanexpress';
    if (raw.includes('visa')) return 'visa';
    if (raw.includes('master') || raw.includes('mastercard')) return 'mastercard';
    if (raw.includes('cash')) return 'cash';
    if (raw.includes('debit')) return 'debit';
    if (raw.includes('apple') && raw.includes('pay')) return 'applepay';
    if (raw.includes('google') && raw.includes('pay')) return 'googlepay';
    return raw;
  };

  // Build a display list that includes canonical payments; if a canonical payment isn't present mark as not accepted
  const buildDisplayPayments = () => {
    const source = localPayments || [];
    // map source methods by normalized key
    const map = {};
    source.forEach((m) => {
      const key = normalizePaymentKey((m && (m.type || m.name)) || '');
      map[key] = m;
    });

    // ensure all canonical payments are present in display list
    const display = canonicalPayments.map((p) => {
      const found = map[p.key];
  if (found) return { key: p.key, id: found.id, label: p.label, is_accepted: (found.is_accepted === undefined ? true : !!found.is_accepted) };
  return { key: p.key, id: null, label: p.label, is_accepted: false };
    });

    // include any non-canonical payments after canonical list
    Object.keys(map).forEach((k) => {
      if (!canonicalPayments.find(cp => cp.key === k)) {
        const m = map[k];
        display.push({ key: k, id: m.id || null, label: m.type || m.name || k, is_accepted: (m.is_accepted === undefined ? true : !!m.is_accepted) });
      }
    });

    return display;
  };

  const displayPayments = buildDisplayPayments();

  const allPayments = (
    <div className="payment-list">
      {displayPayments.map((method, idx) => (
        <div key={idx} className={`payment-item payment-${(method.is_accepted ? 'acceptable' : 'not-acceptable')}`}>
          <span className="payment-name">{capitalize(method.label || method.key)}</span>
          <div className="payment-right">
            <span className="payment-status">
              {method.is_accepted ? 'Accepted' : 'Not accepted'}
            </span>
            {user && user.role !== 'admin' && (
              <button className="button small" onClick={() => { togglePaymentAccept(idx); }}>
                {method.is_accepted ? 'Mark not accepted' : 'Mark accepted'}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  // Cash discount
  const cashDiscount = restaurant.cash_discounts && restaurant.cash_discounts.length > 0
    ? restaurant.cash_discounts[0].percentage
    : 0;

  // Average rating (show stars) - render same as card view
  const renderStars = () => {
    let avgRating = 0;
    if (restaurant.ratings && restaurant.ratings.length > 0) {
      avgRating = restaurant.ratings.reduce((sum, r) => sum + (r.rating || 0), 0) / restaurant.ratings.length;
    }
    const rounded = Math.round(avgRating);
    const stars = Array.from({ length: 5 }, (_, i) => (i < rounded ? '★' : '☆')).join('');
    const numeric = avgRating ? ` ${avgRating.toFixed(1)}` : ' N/A';
    return (
      <div className="rating-stars">
        <span className="stars" aria-hidden>{stars}</span>
        <span className="rating-num">{numeric}</span>
      </div>
    );
  };

  // Close with exit animation
  const handleClose = () => {
    setIsClosing(true);
    // match CSS animation duration (220ms) then call onClose
    setTimeout(() => {
      onClose();
    }, 260);
  };

  const renderDiscounts = (discounts) => {
    if (!discounts || discounts.length === 0) return 'No discounts available';

    const active = discounts.filter(d => (d.is_active === undefined ? true : d.is_active));
    if (active.length === 0) return 'No discounts available';

    // prefer verified; otherwise pick highest percentage
    const verified = active.find(d => d.is_verified);
    const top = verified || active.reduce((a, b) => ((b.percentage || 0) > (a.percentage || 0) ? b : a), active[0]);

    return (
      <div className="payment-list">
        <div className={`payment-item payment-acceptable`}>
          <span className="payment-name">{`${top.percentage}%`}</span>
        </div>
      </div>
    );
  };

  return (
    <div className={`modal-overlay ${isMounted && !isClosing ? 'overlay-visible' : ''} ${isClosing ? 'overlay-hidden' : ''}`} onClick={handleClose}>
      {submittedMessage && <div className="submitted-toast">{submittedMessage}</div>}
      <div className={`modal-content ${isMounted && !isClosing ? 'modal-enter' : ''} ${isClosing ? 'modal-exit' : ''}`} onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={handleClose}>X</button>

        <div className="modal-section header-section">
          <img
            src={restaurantImg}
            alt={`${restaurant.name || 'Restaurant'} logo`}
            className="modal-logo"
          />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
            <h2 style={{ margin: 0 }}>{restaurant.name || 'Unknown Restaurant'}</h2>
            <span className={`status-badge modal-${status}`}>{status === 'open' ? 'Open' : status === 'closing-soon' ? 'Closing Soon' : 'Closed'}</span>
          </div>
           <p className="address">📍 {(() => {
             const addr = restaurant.address || '';
             const city = restaurant.city || '';
             const postal = restaurant.postal_code || restaurant.postalCode || '';
             const cityPostal = [city, postal].filter(Boolean).join(' ');
             const parts = [];
             if (addr) parts.push(addr);
             if (cityPostal) parts.push(cityPostal);
             return parts.length ? parts.join(', ') : 'Address not available';
           })()}</p>
         </div>

        <div className="modal-section">
          <div className="section-title">Operating Hours</div>
          <div className="section-content compact">
            {operatingHours ? (
              <div className="operating-hours">
                {operatingHours.map((r) => (
                  <div key={r.day} className="operating-row">
                    <div className="day">{r.day}:</div>
                    <div className="hours">{r.text}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div>Hours not available</div>
            )}
          </div>
        </div>

        <div className="modal-section">
          <div className="section-title">Cuisine</div>
          <div className="section-content centered">{cuisine}</div>
        </div>

        <div className="modal-section">
          <div className="section-title">Rating</div>
          <div className="section-content centered">{renderStars()}</div>
        </div>

        <div className="modal-section">
          <div className="section-title">Payment Methods</div>
          <div className="section-content">{allPayments}</div>
        </div>

        <div className="modal-section">
          <div className="section-title">Cash Discounts</div>
          <div className="section-content">
            {renderDiscounts(restaurant.cash_discounts)}

            {/* Submission form: allow users to submit a discount even if one is verified */}
            <div className="discount-submit" style={{ marginTop: '12px' }}>
              <label style={{ display: 'block', marginBottom: '6px' }}>Submit a cash discount (%)</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={newDiscountValue}
                  onChange={(e) => setNewDiscountValue(e.target.value)}
                  placeholder="e.g. 10"
                  className="input small"
                  aria-label="New discount percentage"
                />
                <button className="button" onClick={submitNewDiscount}>Submit</button>
              </div>
              
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default RestaurantDetailsModal;