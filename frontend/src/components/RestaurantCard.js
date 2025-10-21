import React from 'react';
import './RestaurantCard.css';
import restaurantImg from '../files/restaurant.jpg';

const capitalize = (s) => (typeof s === 'string' && s.length ? s.charAt(0).toUpperCase() + s.slice(1) : s);

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

const RestaurantCard = ({ restaurant, onClick, index = 0, isFiltering = false }) => {
  const status = getRestaurantStatus(restaurant.operating_hours);
  const topDiscount = getTopDiscount(restaurant.cash_discounts);

  // compute stagger delay
  const delay = isFiltering ? Math.min(12, index) * 35 : 0; // up to ~420ms

  return (
    <div className={`restaurant-card animate-in`} onClick={onClick} style={{ animationDelay: `${delay}ms` }}>
      <div className="card-header centered-header">
        <img
          src={restaurantImg}
          alt={`${restaurant.name || 'Restaurant'} logo`}
          className="restaurant-logo"
        />
        <h2 className="card-title">{restaurant.name || 'Unknown Restaurant'}</h2>
        <div className={`status-badge ${status}`}>
          {status === 'open' && 'Open'}
          {status === 'closed' && 'Closed'}
          {status === 'closing-soon' && 'Closing Soon'}
        </div>
      </div>

      <div className="card-body">
        <div className="card-section address-section">
          {(() => {
            const addr = restaurant.address || '';
            const city = restaurant.city || '';
            // support different possible field names for postal code
            const postal = restaurant.postal_code || restaurant.postalCode || '';
            const cityPostal = [city, postal].filter(Boolean).join(' ');
            const parts = [];
            if (addr) parts.push(addr);
            if (cityPostal) parts.push(cityPostal);
            const line = parts.length ? parts.join(', ') : null;
            return <p>{line || 'Address not available'}</p>;
          })()}
        </div>

        <div className="card-section cuisine-section">
          <p>{(restaurant.cuisine_tags && restaurant.cuisine_tags.length ? restaurant.cuisine_tags.join(', ') : (restaurant.category ? restaurant.category : 'Cuisine not specified'))}</p>
        </div>

        <div className="card-section rating-section">
          {renderStars(restaurant)}
        </div>

        <div className="card-section payments-section">
          <p>{(restaurant.payment_methods || []).filter(m => (m.is_accepted === undefined ? true : m.is_accepted)).map((method) => capitalize(method.type || method.name)).join(', ') || 'No acceptable payment methods'}</p>
        </div>

        <div className="card-section discount-section">
          {topDiscount ? (
            <p>{`${topDiscount.percentage}% Cash Discount ${topDiscount.verified ? '(Verified)' : ''}`}</p>
          ) : (
            <p>No cash discount</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default RestaurantCard;