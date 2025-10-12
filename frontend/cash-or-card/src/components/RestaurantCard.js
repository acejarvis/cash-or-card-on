import React from 'react';
import './RestaurantCard.css';
import restaurantImg from '../files/restaurant.jpg';

const getRestaurantStatus = (operatingHours) => {
  if (!operatingHours || operatingHours.length === 0) return 'closed';

  const now = new Date();
  const currentDay = now.toLocaleString('en-US', { weekday: 'long' });

  const todayHours = operatingHours.find(hours => hours.day_of_week === currentDay);
  if (!todayHours) return 'closed';

  const currentHours = now.getHours();
  const currentMinutes = now.getMinutes();
  const currentTimeMinutes = currentHours * 60 + currentMinutes;

  const [openHour, openMinute] = todayHours.open_time.split(':').map(Number);
  const [closeHour, closeMinute] = todayHours.close_time.split(':').map(Number);
  const openTimeMinutes = openHour * 60 + openMinute;
  const closeTimeMinutes = closeHour * 60 + closeMinute;

  if (currentTimeMinutes < openTimeMinutes || currentTimeMinutes >= closeTimeMinutes) {
    return 'closed';
  }

  const minutesUntilClosing = closeTimeMinutes - currentTimeMinutes;
  if (minutesUntilClosing <= 60) {
    return 'closing-soon';
  }

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

const RestaurantCard = ({ restaurant, onClick, index = 0, isFiltering = false }) => {
  const status = getRestaurantStatus(restaurant.operating_hours);

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
          <p>{restaurant.address || 'Address not available'}</p>
        </div>

        <div className="card-section cuisine-section">
          <p>{(restaurant.categories || []).map((category) => category.name).join(', ') || 'Cuisine not specified'}</p>
        </div>

        <div className="card-section rating-section">
          {renderStars(restaurant)}
        </div>

        <div className="card-section payments-section">
          <p>{(restaurant.payment_methods || []).filter(m => m.status === 'acceptable').map((method) => method.name).join(', ') || 'No acceptable payment methods'}</p>
        </div>

        <div className="card-section discount-section">
          <p>{restaurant.cash_discounts?.[0]?.percentage ? `${restaurant.cash_discounts[0].percentage}% Cash Discount` : 'No cash discount'}</p>
        </div>
      </div>
    </div>
  );
};

export default RestaurantCard;