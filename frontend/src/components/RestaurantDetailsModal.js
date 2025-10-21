import React, { useEffect, useState } from 'react';
import './RestaurantDetailsModal.css';
import restaurantImg from '../files/restaurant.jpg';

const RestaurantDetailsModal = ({ restaurant, onClose, user }) => {
  const [isClosing, setIsClosing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  // Local-only editable copies so changes don't affect global display or persist
  const [localPayments, setLocalPayments] = useState(restaurant.payment_methods || []);
  const [localDiscounts, setLocalDiscounts] = useState(restaurant.cash_discounts || []);
  const [newDiscountValue, setNewDiscountValue] = useState('');
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
    }

    if (!todayHours || !todayHours.open || !todayHours.close) return 'closed';

    const currentMinutes = now.getHours() * 60 + now.getMinutes();
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
  };

  const status = getRestaurantStatus(restaurant.operating_hours);

  // Cuisine type(s)
  const cuisine = (restaurant.cuisine_tags && restaurant.cuisine_tags.length > 0)
    ? restaurant.cuisine_tags.join(', ')
    : (restaurant.category ? restaurant.category : 'Cuisine not specified');

  // Operating hours (all days)
  const dayAbbrMap = {
    Monday: 'Mon',
    Tuesday: 'Tue',
    Wednesday: 'Wed',
    Thursday: 'Thu',
    Friday: 'Fri',
    Saturday: 'Sat',
    Sunday: 'Sun'
  };
  const getDayAbbr = (d) => dayAbbrMap[d] || (typeof d === 'string' ? d.slice(0,3) : d);
  const capitalize = (s) => (typeof s === 'string' && s.length ? s.charAt(0).toUpperCase() + s.slice(1) : s);
  // Build operating hours display for both array and object formats
  const operatingHours = (() => {
    const oh = restaurant.operating_hours;
    if (!oh) return 'Hours not available';

    let rows = [];
    if (Array.isArray(oh)) {
      rows = oh.map(h => ({
        day: h.day_of_week,
        open: h.open_time,
        close: h.close_time
      }));
    } else if (typeof oh === 'object') {
      // object keys may be lowercase weekdays
      rows = Object.keys(oh).map((k) => ({ day: k, open: oh[k].open, close: oh[k].close }));
      // sort by weekday order
      const weekdayOrder = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
      rows.sort((a,b) => weekdayOrder.indexOf(a.day.toLowerCase()) - weekdayOrder.indexOf(b.day.toLowerCase()));
    }

    if (!rows || rows.length === 0) return 'Hours not available';

    return (
      <div className="operating-hours">
        {rows.map((h, idx) => (
          <div key={idx} className="operating-row">
            <span className="day">{(getDayAbbr(h.day) || '').charAt(0).toUpperCase() + (getDayAbbr(h.day) || '').slice(1)}:</span>
            <span className="hours">{h.open} - {h.close}</span>
          </div>
        ))}
      </div>
    );
  })();

  // Payment methods: show all with acceptability indicator
  // Render payment methods using local state; for logged-in normal users provide toggles to edit acceptability (local-only)
  const togglePaymentAccept = (index) => {
    // Do not change display; show a transient submitted message instead (reserved for future REST API)
    setSubmittedMessage('Payment preference submitted');
    setTimeout(() => setSubmittedMessage(''), 1800);
  };
  // canonical payment keys and display labels - keep in sync with App.js mapping
  const canonicalPayments = [
    { key: 'amex', label: 'Amex' },
    { key: 'visa', label: 'Visa' },
    { key: 'mastercard', label: 'Mastercard' },
    { key: 'cash', label: 'Cash' },
    { key: 'debit', label: 'Debit' }
  ];

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
      if (found) return { key: p.key, label: p.label, is_accepted: (found.is_accepted === undefined ? true : !!found.is_accepted) };
      return { key: p.key, label: p.label, is_accepted: false };
    });

    // include any non-canonical payments after canonical list
    Object.keys(map).forEach((k) => {
      if (!canonicalPayments.find(cp => cp.key === k)) {
        const m = map[k];
        display.push({ key: k, label: m.type || m.name || k, is_accepted: (m.is_accepted === undefined ? true : !!m.is_accepted) });
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
              <button className="button small" onClick={() => togglePaymentAccept(idx)}>
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

  const voteDiscount = (index, delta) => {
    // Do not change displayed votes locally; show submitted toast instead
    setSubmittedMessage('Vote submitted');
    setTimeout(() => setSubmittedMessage(''), 1800);
  };

  const addDiscount = () => {
    const pct = parseFloat(newDiscountValue);
    if (Number.isNaN(pct)) return;
    // Do not modify displayed discounts; show submitted toast and clear input
    setSubmittedMessage('Discount submitted');
    setTimeout(() => setSubmittedMessage(''), 1800);
    setNewDiscountValue('');
  };

  const renderDiscounts = (discounts) => {
    if (!discounts || discounts.length === 0) return 'No discounts available';

    // API uses is_verified, upvotes/downvotes, percentage, description
    const active = discounts.filter(d => (d.is_active === undefined ? true : d.is_active));
    if (active.length === 0) return 'No discounts available';

    const verified = active.find(d => d.is_verified);
    if (verified) {
      return (
        <div className="payment-list">
          <div className={`payment-item payment-acceptable`}>
            <span className="payment-name">{`${verified.percentage}% - ${verified.description || ''}`}</span>
            <span className="payment-status"><span style={{ marginLeft: 8, fontWeight: 700 }}>(Verified)</span></span>
          </div>
        </div>
      );
    }

    // rank by upvotes - downvotes
    const scores = active.map(d => ({ d, score: (d.upvotes || 0) - (d.downvotes || 0) }));
    scores.sort((a,b) => b.score - a.score || (b.d.percentage || 0) - (a.d.percentage || 0));
    const top = scores[0].d;

    return (
      <>
        <div className="payment-list">
          {active.map((discount, idx) => (
            <div key={idx} className={`payment-item ${discount === top ? 'payment-acceptable' : ''}`}>
              <span className="payment-name">{`${discount.percentage}% - ${discount.description || ''}`}</span>
              <div className="payment-right">
                <span className="payment-status">Score: {(discount.upvotes || 0) - (discount.downvotes || 0)}</span>
                {user && user.role !== 'admin' && (
                  <button className="button small" onClick={() => voteDiscount(idx, 1)}>Upvote</button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Add discount UI for logged-in normal users (local-only) */}
        {user && user.role !== 'admin' && (
          <div style={{ marginTop: 8 }}>
            <div className="payment-item" style={{ alignItems: 'center' }}>
              <span className="payment-name">
                <input placeholder="Percent (e.g. 5)" value={newDiscountValue} onChange={(e) => setNewDiscountValue(e.target.value)} style={{ width: 120 }} />
              </span>
              <div className="payment-right">
                <button className="button small" onClick={addDiscount}>Add Discount</button>
              </div>
            </div>
          </div>
        )}
      </>
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
          <div className="section-content compact">{operatingHours}</div>
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
          <div className="section-content">{renderDiscounts(restaurant.cash_discounts)}</div>
        </div>

      </div>
    </div>
  );
};

export default RestaurantDetailsModal;