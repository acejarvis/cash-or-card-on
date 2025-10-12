import React, { useEffect, useState } from 'react';
import './RestaurantDetailsModal.css';
import restaurantImg from '../files/restaurant.jpg';

const RestaurantDetailsModal = ({ restaurant, onClose }) => {
  const [isClosing, setIsClosing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Trigger enter animation after mount
    const t = setTimeout(() => setIsMounted(true), 8);
    return () => clearTimeout(t);
  }, []);

  // Helper: determine open/closed/closing soon based on operating_hours
  const getRestaurantStatus = (operatingHours) => {
    if (!operatingHours || operatingHours.length === 0) return 'closed';

    const now = new Date();
    const currentDay = now.toLocaleString('en-US', { weekday: 'long' });

    const todayHours = operatingHours.find(hours => hours.day_of_week === currentDay);
    if (!todayHours) return 'closed';

    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const [openHour, openMinute] = todayHours.open_time.split(':').map(Number);
    const [closeHour, closeMinute] = todayHours.close_time.split(':').map(Number);
    const openTimeMinutes = openHour * 60 + openMinute;
    const closeTimeMinutes = closeHour * 60 + closeMinute;

    if (currentMinutes < openTimeMinutes || currentMinutes >= closeTimeMinutes) {
      return 'closed';
    }

    const minutesUntilClosing = closeTimeMinutes - currentMinutes;
    if (minutesUntilClosing <= 60) {
      return 'closing-soon';
    }

    return 'open';
  };

  const status = getRestaurantStatus(restaurant.operating_hours);

  // Cuisine type(s)
  const cuisine = restaurant.categories && restaurant.categories.length > 0
    ? restaurant.categories.map((cat) => cat.name).join(', ')
    : 'Cuisine not specified';

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

  const operatingHours = restaurant.operating_hours && restaurant.operating_hours.length > 0
    ? (
        <div className="operating-hours">
          {restaurant.operating_hours.map((h, idx) => (
            <div key={idx} className="operating-row">
              <span className="day">{getDayAbbr(h.day_of_week)}:</span>
              <span className="time">{h.open_time} - {h.close_time}</span>
            </div>
          ))}
        </div>
      )
    : 'Hours not available';

  // Payment methods: show all with acceptability indicator
  const allPayments = (restaurant.payment_methods || []).length > 0
    ? (
      <div className="payment-list">
        {(restaurant.payment_methods || []).map((method, idx) => (
          <div key={idx} className={`payment-item payment-${method.status.replace(/\s+/g, '-')}`}>
            <span className="payment-name">{method.name}</span>
            <span className="payment-status">{method.status === 'acceptable' ? 'Accepted' : method.status === 'not acceptable' ? 'Not accepted' : 'Unknown'}</span>
          </div>
        ))}
      </div>
    ) : 'No payment information';

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

  return (
    <div className={`modal-overlay ${isMounted && !isClosing ? 'overlay-visible' : ''} ${isClosing ? 'overlay-hidden' : ''}`} onClick={handleClose}>
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
           <p className="address">📍 {restaurant.address || 'Address not available'}</p>
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
          <div className="section-title">Cash Discount</div>
          <div className="section-content centered">{cashDiscount}%</div>
        </div>

      </div>
    </div>
  );
};

export default RestaurantDetailsModal;