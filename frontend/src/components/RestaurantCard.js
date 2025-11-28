import React, { useState } from 'react';
import './RestaurantCard.css';
import defaultRestaurantImg from '../files/restaurant.jpg';
import { titleCase, formatPostalCode } from '../utils/format';

// Get the API base URL from environment or default
const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3001/api';

// Helper function to get restaurant image URL
// Uses relative URL so images are served from the same origin (via nginx proxy)
const getRestaurantImageUrl = (restaurant) => {
  if (restaurant.image_url) {
    return `/uploads/restaurants/${restaurant.image_url}`;
  }
  return null;
};

const getRestaurantStatus = (operatingHours) => {
  // operatingHours can be an array (old mock) or an object (API) keyed by weekday
  if (!operatingHours) return 'closed';

  const now = new Date();
  const currentDayLong = now.toLocaleString('en-US', { weekday: 'long' });
  const currentDay = currentDayLong.toLowerCase(); // monday, tuesday, ...

  let todayHours = null;

  if (Array.isArray(operatingHours)) {
    // old mock format: [{ day_of_week, open_time, close_time }, ...]
    todayHours = operatingHours.find((hours) => hours.day_of_week === currentDayLong);
    if (todayHours) {
      // normalize to { open: 'HH:MM', close: 'HH:MM' }
      todayHours = { open: todayHours.open_time, close: todayHours.close_time };
    }
  } else if (typeof operatingHours === 'object') {
    // API format: { monday: { open: '11:00', close: '22:00' }, ... }
    todayHours = operatingHours[currentDay] || operatingHours[currentDayLong.toLowerCase()];
  }

  if (!todayHours || !todayHours.open || !todayHours.close) return 'closed';

  const currentHours = now.getHours();
  const currentMinutes = now.getMinutes();
  let currentTimeMinutes = currentHours * 60 + currentMinutes;

  const [openHour, openMinute] = todayHours.open.split(':').map(Number);
  const [closeHour, closeMinute] = todayHours.close.split(':').map(Number);
  const openTimeMinutes = openHour * 60 + openMinute;
  let closeTimeMinutes = closeHour * 60 + closeMinute;

  // handle closing after midnight (close time less than open time)
  if (closeTimeMinutes <= openTimeMinutes) {
    closeTimeMinutes += 24 * 60;
    if (currentTimeMinutes < openTimeMinutes) {
      // if current time is before opening but close rolled over, consider it as current time + 24h for comparison
      currentTimeMinutes += 24 * 60;
    }
  }

  if (currentTimeMinutes < openTimeMinutes || currentTimeMinutes >= closeTimeMinutes) {
    return 'closed';
  }

  const minutesUntilClosing = closeTimeMinutes - currentTimeMinutes;
  if (minutesUntilClosing <= 60) return 'closing-soon';

  return 'open';
};

const renderStars = (restaurant) => {
  const avgRating = parseFloat(restaurant.average_rating) || 0;
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

const getTopDiscount = (discounts) => {
  if (!discounts || discounts.length === 0) return null;

  // API uses is_verified and upvotes/downvotes and is_active
  const active = discounts.filter(d => (d.is_active === undefined ? true : d.is_active));
  if (active.length === 0) return null;

  const verified = active.find(d => d.is_verified);
  if (verified) return verified;

  // choose by upvotes - downvotes, then by percentage
  return active.reduce((top, cur) => {
    const topScore = (top.upvotes || 0) - (top.downvotes || 0);
    const curScore = (cur.upvotes || 0) - (cur.downvotes || 0);
    if (curScore !== topScore) return curScore > topScore ? cur : top;
    return (cur.percentage || 0) > (top.percentage || 0) ? cur : top;
  }, active[0]);
};

const RestaurantCard = ({ restaurant, onClick, onMouseEnter, onMouseLeave, isFiltering = false }) => {
  const status = getRestaurantStatus(restaurant.operating_hours);
  const topDiscount = getTopDiscount(restaurant.cash_discounts);

  // compute stagger delay
  const delay = isFiltering ? 0 : 0; // removed index dependency for delay to simplify

  // Prioritize cuisine_tags, fallback to category. Filter out "Others" if possible or just use tags.
  let displayCategory = 'Category N/A';
  if (restaurant.cuisine_tags && restaurant.cuisine_tags.length > 0) {
    displayCategory = restaurant.cuisine_tags.map(titleCase).join(', ');
  } else if (restaurant.category) {
    displayCategory = titleCase(restaurant.category);
  }

  if (displayCategory === 'Others') displayCategory = ''; // Hide "Others" if that's all we have, per user preference? Or maybe just leave it empty.

  const paymentsText = (restaurant.payment_methods || [])
    .filter(m => (m.is_accepted === undefined ? true : m.is_accepted))
    .map((method) => titleCase(method.type || method.name))
    .join(', ') || 'No acceptable payment methods';

  const discountText = topDiscount ? `${topDiscount.percentage}% Cash Discount${topDiscount.verified ? ' (Verified)' : ''}` : 'No cash discount';

  // rating numeric for tooltip
  let ratingNumeric = 'N/A';
  if (restaurant.ratings && restaurant.ratings.length > 0) {
    const avg = restaurant.ratings.reduce((s, r) => s + (r.rating || 0), 0) / restaurant.ratings.length;
    ratingNumeric = avg.toFixed(1);
  }

  // Get restaurant image URL with fallback
  const imageUrl = getRestaurantImageUrl(restaurant);
  const [imgSrc, setImgSrc] = useState(imageUrl || defaultRestaurantImg);
  const [imgError, setImgError] = useState(false);

  const handleImageError = () => {
    if (!imgError) {
      setImgError(true);
      setImgSrc(defaultRestaurantImg);
    }
  };

  return (
    <div
      className={`restaurant-card horizontal animate-in`}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="card-image-container">
        <img
          src={imgSrc}
          alt={`${restaurant.name || 'Restaurant'} logo`}
          className="restaurant-image"
          onError={handleImageError}
        />
      </div>

      <div className="card-content">
        <div className="card-header">
          <h3 className="card-title">
            {titleCase(restaurant.name) || 'Unknown Restaurant'}
          </h3>
        </div>

        <div className="card-rating-row">
          {renderStars(restaurant)}
        </div>

        <div className="card-info-rows">
          {/* Row 1: Category */}
          {displayCategory && (
            <div className="info-row">
              <span className="tag-item category">{displayCategory}</span>
            </div>
          )}

          {/* Row 2: City */}
          <div className="info-row">
            <span className="tag-item city">{titleCase(restaurant.city || '')}</span>
          </div>

          {/* Row 3: Status */}
          <div className="info-row">
            {status === 'open' && (
              <span className="status-text open">Open until {restaurant.operating_hours && restaurant.operating_hours[new Date().toLocaleString('en-US', { weekday: 'long' }).toLowerCase()]?.close}</span>
            )}
            {status === 'closing-soon' && (
              <span className="status-text closing-soon">Closing soon</span>
            )}
            {status === 'closed' && (
              <span className="status-text closed">Closed</span>
            )}
          </div>
        </div>

        <div className="card-actions">
          {/* Tags for features */}
          <div className="feature-tags" style={{ flexWrap: 'wrap' }}>
            {topDiscount && (
              <span className="feature-tag discount">{topDiscount.percentage}% Off</span>
            )}
            {/* Show all payment methods */}
            {restaurant.payment_methods && restaurant.payment_methods.filter(m => (m.is_accepted === undefined ? true : m.is_accepted)).map((method, idx) => (
              <span key={idx} className="feature-tag">{titleCase(method.type || method.name)}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantCard;