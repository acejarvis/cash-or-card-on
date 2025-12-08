import React, { useEffect, useState } from 'react';
import './RestaurantDetailsModal.css';
import { titleCase, formatPostalCode } from '../utils/format';
import defaultImage from '../files/restaurant.jpg';

// Import all images from ../files
const images = require.context('../files', false, /\.(png|jpe?g|svg)$/);

const getRestaurantImage = (imageName) => {
  if (!imageName) return null;
  try {
    return images(`./${imageName}`);
  } catch (err) {
    return null;
  }
};

const RestaurantDetailsModal = ({ restaurant, onClose, user, onRefresh }) => {
  // Normalize name to match server file naming convention (lowercase, alphanumeric only)
  const normalizeName = (name) => {
    return name ? name.toLowerCase().replace(/[^a-z0-9]/g, '') : '';
  };

  // Try to load image from database field first, then fallback to local files by name, then default
  const [imgSrc, setImgSrc] = useState(() => {
    if (restaurant.image_url) {
      const img = getRestaurantImage(restaurant.image_url);
      if (img) return img;
    }
    // Try by name if no explicit url
    const byName = getRestaurantImage(`${restaurant.name}.jpg`);
    if (byName) return byName;
    
    return defaultImage;
  });

  useEffect(() => {
    if (restaurant.image_url) {
      const img = getRestaurantImage(restaurant.image_url);
      if (img) {
        setImgSrc(img);
        return;
      }
    }
    // Fallback logic if needed or if prop changes
  }, [restaurant]);

  const handleImageError = () => {
    // Fallback to default image if external one fails
    if (imgSrc !== defaultImage) {
      setImgSrc(defaultImage);
    }
  };

  const [isClosing, setIsClosing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [localPayments, setLocalPayments] = useState(restaurant.payment_methods || []);
  const [localDiscounts, setLocalDiscounts] = useState(restaurant.cash_discounts || []);
  const [newDiscountValue, setNewDiscountValue] = useState('');
  const [editingDiscountValue, setEditingDiscountValue] = useState('');
  const [isEditingDiscount, setIsEditingDiscount] = useState(false);
  const [submittedMessage, setSubmittedMessage] = useState('');
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

  useEffect(() => {
    // Trigger enter animation after mount
    const t = setTimeout(() => setIsMounted(true), 8);
    return () => clearTimeout(t);
  }, []);

  // Prevent body from scrolling while the modal is open and preserve scrollbar width
  // to avoid content shift when modal opens
  useEffect(() => {
    // Calculate scrollbar width before hiding overflow
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.documentElement.style.setProperty('--scrollbar-width', `${scrollbarWidth}px`);

    // Add modal-open class to body
    document.body.classList.add('modal-open');

    return () => {
      // Remove modal-open class when modal unmounts
      document.body.classList.remove('modal-open');
      document.documentElement.style.removeProperty('--scrollbar-width');
    };
  }, []);

  // keep local copies in sync if restaurant prop changes
  useEffect(() => {
    setLocalPayments(restaurant.payment_methods || []);
    setLocalDiscounts(restaurant.cash_discounts || []);
    // Reset user rating when restaurant changes
    setUserRating(0);
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
    ? restaurant.cuisine_tags.map(titleCase).join(', ')
    : (restaurant.category ? titleCase(restaurant.category) : 'Cuisine not specified');

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
        const token = sessionStorage.getItem('auth_token');
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

        if (body.is_verified === false) {
          setSubmittedMessage('Discount submitted for review');
        } else {
          setSubmittedMessage('Discount submitted');
          // Refresh discounts from server if auto-approved (e.g. admin)
          try {
            const cdResp = await fetch(`${API_BASE_URL}/cash-discounts/restaurant/${restaurant.id}`);
            if (cdResp.ok) {
              const cdBody = await cdResp.json();
              setLocalDiscounts(cdBody.cashDiscounts || cdBody.cash_discounts || []);
            }
          } catch (e) { }
        }

        setNewDiscountValue('');
        setTimeout(() => setSubmittedMessage(''), 1800);
      } catch (err) {
        setSubmittedMessage('Network error');
        setTimeout(() => setSubmittedMessage(''), 1800);
      }
    })();
  };

  // Toggle payment method accept/not accept (separate from upvote/downvote)
  const togglePaymentAccept = async (index) => {
    const dp = displayPayments[index];
    if (!dp) return;
    if (!user) { setSubmittedMessage('Please log in to submit'); setTimeout(() => setSubmittedMessage(''), 1800); return; }
    setIsVoting(true);
    try {
      const token = sessionStorage.getItem('auth_token');
      // Use POST /api/payment-methods to upsert acceptance
      const resp = await fetch(`${API_BASE_URL}/payment-methods`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ restaurantId: restaurant.id, paymentType: dp.key, isAccepted: !dp.is_accepted }),
      });
      const body = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        setSubmittedMessage(body && body.message ? body.message : 'Failed to submit payment method');
        setTimeout(() => setSubmittedMessage(''), 2200);
        return;
      }
      setSubmittedMessage(body.message || 'Payment method updated');

      // Only update local state if the returned payment method is verified
      // If it's unverified (a proposal), don't show it to the user yet
      if (body.paymentMethod) {
        if (body.paymentMethod.is_verified === false) {
          // This is a proposal, show "Submitted for review" message
          setSubmittedMessage('Submitted for review');
        } else {
          // This is a verified update, update local state immediately
          setLocalPayments(prev => {
            const exists = prev.find(p => p.id === body.paymentMethod.id);
            if (exists) {
              return prev.map(p => p.id === body.paymentMethod.id ? { ...p, ...body.paymentMethod } : p);
            } else {
              return [...prev, body.paymentMethod];
            }
          });
        }
      }

      setTimeout(() => setSubmittedMessage(''), 1800);
    } catch (err) {
      setSubmittedMessage('Network error');
      setTimeout(() => setSubmittedMessage(''), 1800);
    } finally {
      setIsVoting(false);
    }
  };

  // Voting state to prevent double clicks
  const [isVoting, setIsVoting] = useState(false);

  const refreshPaymentMethods = async () => {
    try {
      const resp = await fetch(`${API_BASE_URL}/payment-methods/restaurant/${restaurant.id}`);
      if (!resp.ok) return;
      const body = await resp.json();
      // backend may return { paymentMethods } or raw array
      const list = body.paymentMethods || body.payment_methods || body || [];
      setLocalPayments(list);
    } catch (e) {
      // ignore
    }
  };

  const voteOnPayment = async (paymentMethodId, voteType) => {
    if (!user) { setSubmittedMessage('Please log in to vote'); setTimeout(() => setSubmittedMessage(''), 1800); return; }
    setIsVoting(true);
    try {
      const token = sessionStorage.getItem('auth_token');
      const resp = await fetch(`${API_BASE_URL}/payment-methods/${encodeURIComponent(paymentMethodId)}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ voteType }),
      });
      const body = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        setSubmittedMessage(body && body.message ? body.message : 'Vote failed');
        setTimeout(() => setSubmittedMessage(''), 2200);
        return;
      }
      setSubmittedMessage(body.message || 'Vote recorded');

      // Update local state immediately
      if (body.paymentMethod) {
        setLocalPayments(prev => prev.map(p =>
          p.id === body.paymentMethod.id ? { ...p, ...body.paymentMethod } : p
        ));
      }

      setTimeout(() => setSubmittedMessage(''), 1800);
    } catch (err) {
      setSubmittedMessage('Network error');
      setTimeout(() => setSubmittedMessage(''), 1800);
    } finally {
      setIsVoting(false);
    }
  };

  const createPaymentMethodAndMaybeVote = async (key, isAccepted, intendedVote) => {
    if (!user) { setSubmittedMessage('Please log in to submit'); setTimeout(() => setSubmittedMessage(''), 1800); return; }
    setIsVoting(true);
    try {
      const token = sessionStorage.getItem('auth_token');
      const resp = await fetch(`${API_BASE_URL}/payment-methods`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ restaurantId: restaurant.id, paymentType: key, isAccepted }),
      });
      const body = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        setSubmittedMessage(body && body.message ? body.message : 'Failed to submit payment method');
        setTimeout(() => setSubmittedMessage(''), 2200);
        return;
      }

      if (body.is_verified === false) {
        setSubmittedMessage('Submitted for review');
      } else {
        setSubmittedMessage(body.message || 'Payment method submitted');
        // Update local state if verified
        if (body.paymentMethod) {
          setLocalPayments(prev => [...prev, body.paymentMethod]);
        }
      }
      setTimeout(() => setSubmittedMessage(''), 1800);
    } catch (err) {
      setSubmittedMessage('Network error');
      setTimeout(() => setSubmittedMessage(''), 1800);
    } finally {
      setIsVoting(false);
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
  const displayPayments = React.useMemo(() => {
    const source = localPayments || [];
    // map source methods by normalized key
    const map = {};
    source.forEach((m) => {
      // Handle both 'type' (from view) and 'payment_type' (from raw DB return)
      const rawType = m.type || m.payment_type || m.name;
      const key = normalizePaymentKey(rawType || '');
      if (key) map[key] = m;
    });

    // ensure all canonical payments are present in display list
    const display = canonicalPayments.map((p) => {
      const found = map[p.key];
      if (found) {
        const up = Number(found.upvotes ?? found.up_votes ?? found.total_votes ?? 0) || 0;
        const down = Number(found.downvotes ?? found.down_votes ?? 0) || 0;
        const total = Number(found.total_votes ?? (up + down)) || (up + down);
        // Only use explicit server-provided is_accepted, don't derive from votes
        const serverAccepted = (found.is_accepted === undefined || found.is_accepted === null) ? null : !!found.is_accepted;
        // Use server value if available, otherwise default to false (not accepted)
        const displayedAccepted = serverAccepted !== null ? serverAccepted : false;
        return { key: p.key, id: found.id, label: p.label, is_accepted: displayedAccepted, server_is_accepted: serverAccepted, upvotes: up, downvotes: down, total_votes: total };
      }
      return { key: p.key, id: null, label: p.label, is_accepted: false, server_is_accepted: null, upvotes: 0, downvotes: 0, total_votes: 0 };
    });

    // include any non-canonical payments after canonical list
    Object.keys(map).forEach((k) => {
      if (!canonicalPayments.find(cp => cp.key === k)) {
        const m = map[k];
        const up = Number(m.upvotes ?? m.up_votes ?? m.total_votes ?? 0) || 0;
        const down = Number(m.downvotes ?? m.down_votes ?? 0) || 0;
        const total = Number(m.total_votes ?? (up + down)) || (up + down);
        const serverAccepted = (m.is_accepted === undefined || m.is_accepted === null) ? null : !!m.is_accepted;
        // Use server value if available, otherwise default to false (not accepted)
        const displayedAccepted = serverAccepted !== null ? serverAccepted : false;
        display.push({ key: k, id: m.id || null, label: m.type || m.payment_type || m.name || k, is_accepted: displayedAccepted, server_is_accepted: serverAccepted, upvotes: up, downvotes: down, total_votes: total });
      }
    });

    return display;
  }, [localPayments]);

  const allPayments = (
    <div className="payment-list">
      {displayPayments.map((method, idx) => (
        <div key={idx} className={`payment-item payment-${(method.is_accepted ? 'acceptable' : 'not-acceptable')}`}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="payment-name">{capitalize(method.label || method.key)}</span>
          </div>
          <div className="payment-right">
            <span className="payment-status">
              {method.is_accepted ? 'Accepted' : 'Not accepted'}
            </span>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {/* Mark accepted/not accepted button - available to logged-in users */}
              {user && (
                <button className="button small compact" disabled={isVoting} onClick={() => togglePaymentAccept(idx)}>
                  {method.is_accepted ? 'Mark not accepted' : 'Mark accepted'}
                </button>
              )}
              {/* Upvote button - only available for existing payment methods */}
              {user && method.id && (
                <>
                  <button className="button tiny vote-up" disabled={isVoting} onClick={() => {
                    return voteOnPayment(method.id, 'upvote');
                  }}>▲</button>
                  <span className="payment-votes-inline">{method.upvotes || 0}</span>
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // Cash discount
  const cashDiscount = restaurant.cash_discounts && restaurant.cash_discounts.length > 0
    ? restaurant.cash_discounts[0].percentage
    : 0;

  // Handle rating submission
  const handleRate = async (rating) => {
    if (!user) {
      setSubmittedMessage('Please log in to rate');
      setTimeout(() => setSubmittedMessage(''), 1800);
      return;
    }

    try {
      const token = sessionStorage.getItem('auth_token');
      const resp = await fetch(`${API_BASE_URL}/ratings/restaurant/${restaurant.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ rating }),
      });

      if (!resp.ok) throw new Error('Failed to rate');

      setUserRating(rating);
      setSubmittedMessage('Rating submitted!');
      setTimeout(() => setSubmittedMessage(''), 1800);

      // Trigger a refresh of the restaurant data here
      if (onRefresh) onRefresh();
    } catch (err) {
      setSubmittedMessage('Failed to submit rating');
      setTimeout(() => setSubmittedMessage(''), 1800);
    }
  };

  // Average rating (show stars) - interactive
  const renderStars = () => {
    const avgRating = parseFloat(restaurant.average_rating) || 0;
    const displayRating = hoverRating || userRating || avgRating;
    const rounded = Math.round(displayRating);

    return (
      <div className="rating-stars interactive" onMouseLeave={() => setHoverRating(0)}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`star ${star <= (hoverRating || rounded) ? 'filled' : ''}`}
            onMouseEnter={() => setHoverRating(star)}
            onClick={() => handleRate(star)}
            style={{ cursor: 'pointer', fontSize: '1.5rem', color: star <= (hoverRating || rounded) ? '#e00707' : '#ccc' }}
          >
            ★
          </span>
        ))}
        <span className="rating-num" style={{ marginLeft: '8px', fontSize: '1rem' }}>
          {avgRating ? avgRating.toFixed(1) : 'N/A'}
          {restaurant.rating_count ? ` (${restaurant.rating_count})` : ''}
        </span>
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
            src={imgSrc}
            alt={`${restaurant.name || 'Restaurant'} logo`}
            className="modal-logo"
            onError={handleImageError}
          />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
            <h2 style={{ margin: 0 }}>{titleCase(restaurant.name) || 'Unknown Restaurant'}</h2>
            <span className={`status-badge modal-${status}`}>{status === 'open' ? 'Open' : status === 'closing-soon' ? 'Closing Soon' : 'Closed'}</span>
          </div>
          {(() => {
            const addr = restaurant.address || '';
            const city = restaurant.city || '';
            const postal = restaurant.postal_code || restaurant.postalCode || '';
            const cityPostal = [titleCase(city), postal ? formatPostalCode(postal) : ''].filter(Boolean).join(' ');
            if (!addr && !cityPostal) return <p className="address">Address not available</p>;
            return (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {addr ? <p className="address">📍 {titleCase(addr)}</p> : null}
                {cityPostal ? <p className="address city-postal">{cityPostal}</p> : null}
              </div>
            );
          })()}
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

            {/* Submission form: show to all logged-in users including admins */}
            {user && (
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
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default RestaurantDetailsModal;