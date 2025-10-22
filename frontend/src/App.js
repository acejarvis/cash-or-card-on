import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import siteLogo from './files/logo.svg';
import RestaurantCard from './components/RestaurantCard';
import RestaurantDetailsModal from './components/RestaurantDetailsModal';
import AdminPanelModal from './components/AdminPanelModal';
import Login from './components/Login';
import Account from './components/Account';
import { titleCase, formatPostalCode } from './utils/format';

const App = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  
  const [filters, setFilters] = useState({
    city: [],
    cuisine: [],
    paymentMethod: [],
    rating: '',
    cashDiscount: false,
  });
  const [cities, setCities] = useState([]);
  const [cuisines, setCuisines] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [isFiltering, setIsFiltering] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [loginMode, setLoginMode] = useState('signin'); // 'signin' or 'signup'
  const [user, setUser] = useState(null);
  const [view, setView] = useState('list'); // kept for backwards compatibility
  const [showAccount, setShowAccount] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [notification, setNotification] = useState(null);
  const notifTimer = useRef(null);

  const filterTimer = useRef(null);
  const restaurantsPerPage = 8;

  const API_BASE_URL = process.env.REACT_APP_API_BASE || 'http://localhost:3001/api';

  // Map common payment method name patterns to canonical keys and display labels
  const paymentCanonicalMap = {
    amex: 'Amex',
    americanexpress: 'American Express',
    visa: 'Visa',
    mastercard: 'Mastercard',
    cash: 'Cash',
    debit: 'Debit',
    applepay: 'Apple Pay',
    googlepay: 'Google Pay'
  };

  const normalizePaymentKey = (s) => {
    if (!s) return '';
    const raw = s.toString().toLowerCase().replace(/[^a-z0-9]/g, '');
    // common patterns
    if (raw.includes('amex') || (raw.includes('american') && raw.includes('express'))) return 'amex';
    if (raw.includes('americanexpress')) return 'americanexpress';
    if (raw.includes('visa')) return 'visa';
    if (raw.includes('master') || raw.includes('mastercard')) return 'mastercard';
    if (raw.includes('cash')) return 'cash';
    if (raw.includes('debit')) return 'debit';
    if (raw.includes('apple') && raw.includes('pay')) return 'applepay';
    if (raw.includes('google') && raw.includes('pay')) return 'googlepay';
    // fallback to raw string key
    return raw;
  };

  useEffect(() => {
    // load logged in user from localStorage
    try {
      // Load user from real auth storage (if previously logged in)
      const authUser = localStorage.getItem('auth_user');
      if (authUser) setUser(JSON.parse(authUser));
    } catch (e) {}
  }, []);

  useEffect(() => {
    return () => {
      if (notifTimer.current) clearTimeout(notifTimer.current);
    };
  }, []);

  const showNotification = (message, type = 'info', duration = 3200) => {
    if (notifTimer.current) clearTimeout(notifTimer.current);
    setNotification({ message, type });
    notifTimer.current = setTimeout(() => setNotification(null), duration);
  };

  

  useEffect(() => {
    // Fetch restaurants from backend API
    fetch(`${API_BASE_URL}/restaurants`)
      .then((response) => response.json())
      .then((data) => {
        // API returns { count, restaurants }
        const list = data.restaurants || [];
        setRestaurants(list);

  const uniqueCities = Array.from(new Set(list.map((restaurant) => titleCase(restaurant.city || '')).filter(Boolean)));
  setCities(uniqueCities);

        // API uses `cuisine_tags` (array of strings). Fall back to single `category` if needed.
        const uniqueCuisines = Array.from(new Set(list.flatMap((restaurant) => (restaurant.cuisine_tags && restaurant.cuisine_tags.length ? restaurant.cuisine_tags : (restaurant.category ? [restaurant.category] : []))).map((c) => titleCase(c || '')).filter(Boolean)));
        setCuisines(uniqueCuisines);

        // API payment_methods use `type` instead of `name`.
        const uniquePaymentMethods = Array.from(
          new Set(list.flatMap((restaurant) => (restaurant.payment_methods || []).map((method) => normalizePaymentKey((method && (method.type || method.name)) || ''))))
        );
        setPaymentMethods(uniquePaymentMethods);
      })
      .catch((error) => console.error('Error fetching restaurant data:', error));
  }, []);

  const triggerFilteringAnimation = () => {
    // clear any existing timer
    if (filterTimer.current) clearTimeout(filterTimer.current);
    setIsFiltering(true);
    filterTimer.current = setTimeout(() => setIsFiltering(false), 420); // allow stagger + fade (~420ms)
  };

  // Toggle multi-select filters (city, cuisine, paymentMethod)
  const toggleMultiFilter = (name, value) => {
    triggerFilteringAnimation();
    setFilters((prev) => {
      const prevArr = Array.isArray(prev[name]) ? prev[name] : [];
      const exists = prevArr.includes(value);
      const nextArr = exists ? prevArr.filter((v) => v !== value) : [...prevArr, value];
      return { ...prev, [name]: nextArr };
    });
    setCurrentPage(1);
  };

  // Rating is a single-select chip (toggle off when clicked again)
  const handleRatingClick = (r) => {
    triggerFilteringAnimation();
    setFilters((prev) => ({ ...prev, rating: prev.rating === String(r) ? '' : String(r) }));
    setCurrentPage(1);
  };

  const handleCheckboxChange = (e) => {
    triggerFilteringAnimation();
    const { name, checked } = e.target;
    setFilters((prev) => ({ ...prev, [name]: checked }));
    setCurrentPage(1);
  };

  const handleSearchChange = (value) => {
    triggerFilteringAnimation();
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const filteredRestaurants = restaurants.filter((restaurant) => {
    const matchesCity = filters.city.length ? filters.city.includes(titleCase(restaurant.city)) : true;

    // Use cuisine_tags (array of strings) or fall back to category
    const restaurantCuisineTags = restaurant.cuisine_tags || (restaurant.category ? [restaurant.category] : []);
    const matchesCuisine = filters.cuisine.length
      ? restaurantCuisineTags.some((tag) => filters.cuisine.includes(titleCase(tag)))
      : true;

    const activePaymentFilters = filters.paymentMethod.map(f => (f || '').toString().toLowerCase());
    const matchesPaymentMethod = filters.paymentMethod.length
      ? (restaurant.payment_methods || []).some((method) => {
          // Only consider a payment method if it is accepted (treat undefined as accepted)
          const isAccepted = (method.is_accepted === undefined ? true : method.is_accepted);
          if (!isAccepted) return false;
          const methodKey = normalizePaymentKey((method && (method.type || method.name)) || '');
          return activePaymentFilters.includes(methodKey);
        })
      : true;

    const matchesRating = filters.rating ? (restaurant.ratings?.[0]?.rating ?? 0) >= parseInt(filters.rating) : true;
    const matchesCashDiscount = filters.cashDiscount ? (restaurant.cash_discounts?.[0]?.percentage ?? 0) > 0 : true;

    // Search term matching: check name, address, city, cuisine tags, and postal code (normalized)
    const q = String(searchTerm || '').trim();
    let matchesSearch = true;
    if (q) {
      const qLower = q.toLowerCase();
      const nameMatch = String(restaurant.name || '').toLowerCase().includes(qLower);
      const addrMatch = String(restaurant.address || '').toLowerCase().includes(qLower);
      const cityMatch = String(restaurant.city || '').toLowerCase().includes(qLower);
      const cuisineStr = (restaurant.cuisine_tags && restaurant.cuisine_tags.length ? restaurant.cuisine_tags.join(' ') : (restaurant.category ? restaurant.category : ''));
      const cuisineMatch = String(cuisineStr || '').toLowerCase().includes(qLower);

      // postal code: compare cleaned alnum uppercase strings to tolerate spacing/case
      const qPostalClean = q.toUpperCase().replace(/[^A-Z0-9]/g, '');
      const restPostal = String(restaurant.postal_code || restaurant.postalCode || '');
      const restPostalClean = restPostal.toUpperCase().replace(/[^A-Z0-9]/g, '');
      const postalMatch = qPostalClean.length > 0 && restPostalClean.includes(qPostalClean);

      matchesSearch = nameMatch || addrMatch || cityMatch || cuisineMatch || postalMatch;
    }

    return (
      matchesCity &&
      matchesCuisine &&
      matchesPaymentMethod &&
      matchesRating &&
      matchesCashDiscount &&
      matchesSearch
    );
  });

  const indexOfLastRestaurant = currentPage * restaurantsPerPage;
  const indexOfFirstRestaurant = indexOfLastRestaurant - restaurantsPerPage;
  const currentRestaurants = filteredRestaurants.slice(indexOfFirstRestaurant, indexOfLastRestaurant);

  const totalPages = Math.ceil(filteredRestaurants.length / restaurantsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Authentication helpers
  const handleLogin = async (identifier, password) => {
    // Backend expects an email + password. We assume identifier is an email.
    // If identifier does not look like an email, return false and ask the user to use their email.
    if (!identifier || !identifier.includes('@')) {
      return { ok: false, message: 'Please enter a valid email address.' };
    }

    try {
      const resp = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: identifier.trim(), password }),
      });

      const body = await resp.json();
      if (!resp.ok) {
        // Bubble up message from backend if present
        const msg = body && body.message ? body.message : 'Login failed';
        return { ok: false, message: msg };
      }
      const returnedUser = body.user;
      const token = body.token;

      if (!returnedUser || !token) return { ok: false, message: 'Invalid server response' };

      // Store token and user for authenticated requests
      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_user', JSON.stringify(returnedUser));
      setUser(returnedUser);
      setShowLogin(false);
      // welcome message
      showNotification(`Welcome back, ${returnedUser.username || returnedUser.email}`, 'success');
      return { ok: true };
    } catch (e) {
      console.error('Login error', e);
      return { ok: false, message: 'Network or server error' };
    }
  };

  // Register handler for new users
  const handleRegister = async (email, username, password) => {
    if (!email || !email.includes('@')) {
      return { ok: false, message: 'Please provide a valid email address.' };
    }
    if (!username || username.length < 2) {
      return { ok: false, message: 'Please provide a username (2+ characters).' };
    }
    if (!password || password.length < 8) {
      return { ok: false, message: 'Password must be at least 8 characters.' };
    }

    try {
      const resp = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), username: username.trim(), password }),
      });

      const body = await resp.json();
      if (!resp.ok) {
        const msg = body && body.message ? body.message : 'Registration failed';
        return { ok: false, message: msg };
      }

      const returnedUser = body.user;
      const token = body.token;

      if (!returnedUser || !token) return { ok: false, message: 'Invalid server response' };

      // Store token and user
      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_user', JSON.stringify(returnedUser));
      setUser(returnedUser);
      setShowLogin(false);
      showNotification(`Welcome, ${returnedUser.username || returnedUser.email}`, 'success');
      return { ok: true };
    } catch (e) {
      console.error('Registration error', e);
      return { ok: false, message: 'Network or server error' };
    }
  };

  const handleLogout = () => {
    setUser(null);
    // Clear stored auth
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_token');
    setView('list');
    showNotification('You have been logged out', 'info');
  };

  return (
    <div className="App">
      {notification && (
        <div className={`top-notification ${notification.type || 'info'}`}>
          {notification.message}
        </div>
      )}
      <header>
        <div className="header-content">
          <div className="header-top">
            <img src={siteLogo} alt="Cash or Card" className="site-logo" />
          </div>

          <div className="header-bottom">
            <input
              type="text"
              placeholder="Search restaurants..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
            <div style={{ position: 'absolute', right: 32, top: 10 }}>
              {user ? (
                <>
                  <button className="chip" onClick={() => setShowAccount(true)}>My Account</button>
                  {user.role === 'admin' && (
                    <button className="chip" onClick={() => setShowAdminPanel(true)}>Admin Panel</button>
                  )}
                  <button className="chip" onClick={handleLogout}>Log out</button>
                </>
              ) : (
                <button className="chip" onClick={() => { setLoginMode('signin'); setShowLogin(true); }}>Log In</button>
              )}
            </div>
          </div>
        </div>
      </header>

      <>
        <div className="main-container">
          <aside className="filters">
            <h2>Filters</h2>

            <div className="filter-section">
              <div className="filter-title">City</div>
              <div className="filter-options">
                {cities.map((city) => (
                  <button key={city} type="button" className={`chip ${filters.city.includes(city) ? 'active' : ''}`} onClick={() => toggleMultiFilter('city', city)}>
                    {city}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-section">
              <div className="filter-title">Cuisine</div>
              <div className="filter-options">
                {cuisines.map((cuisine) => (
                  <button key={cuisine} type="button" className={`chip ${filters.cuisine.includes(cuisine) ? 'active' : ''}`} onClick={() => toggleMultiFilter('cuisine', cuisine)}>
                    {cuisine}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-section">
              <div className="filter-title">Payment Methods</div>
              <div className="filter-options">
                {paymentMethods.map((method) => (
                  <button key={method} type="button" className={`chip ${filters.paymentMethod.includes(method) ? 'active' : ''}`} onClick={() => toggleMultiFilter('paymentMethod', method)}>
                    {paymentCanonicalMap[method] || (method.charAt(0).toUpperCase() + method.slice(1))}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-section">
              <div className="filter-title">Minimum Rating</div>
              <div className="filter-options">
                {[5,4,3,2,1].map((r) => (
                  <button key={r} type="button" className={`chip ${filters.rating === String(r) ? 'active' : ''}`} onClick={() => handleRatingClick(r)}>
                    {r}+ stars
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-section">
              <label style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  name="cashDiscount"
                  checked={filters.cashDiscount}
                  onChange={handleCheckboxChange}
                />
                Cash Discount
              </label>
            </div>

          </aside>
          <main className={`restaurant-list ${isFiltering ? 'filtering' : ''}`}>
            {currentRestaurants.map((restaurant, idx) => (
              <RestaurantCard
                key={restaurant.id}
                restaurant={restaurant}
                onClick={() => setSelectedRestaurant(restaurant)}
                index={idx}
                isFiltering={isFiltering}
              />
            ))}
          </main>
        </div>
        <div className="pagination">
          {Array.from({ length: totalPages }, (_, index) => (
            <button
              key={index + 1}
              className={currentPage === index + 1 ? 'active' : ''}
              onClick={() => handlePageChange(index + 1)}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </>

      {selectedRestaurant && (
        <RestaurantDetailsModal
          restaurant={selectedRestaurant}
          onClose={() => setSelectedRestaurant(null)}
          user={user}
        />
      )}

      {showAdminPanel && (
        <AdminPanelModal
          restaurants={restaurants}
          onClose={() => setShowAdminPanel(false)}
        />
      )}

      {showLogin && (
        <Login
          onClose={() => setShowLogin(false)}
          onLogin={handleLogin}
          onRegister={handleRegister}
          showSignUp={loginMode === 'signup'}
        />
      )}

      {/* Account modal shown on top of restaurant view */}
      {showAccount && (
        <div className="account-overlay" onClick={() => setShowAccount(false)}>
          <div className="account-modal" onClick={(e) => e.stopPropagation()}>
            <Account
              user={user}
              onLogout={() => { handleLogout(); setShowAccount(false); }}
              onBack={() => setShowAccount(false)}
            />
          </div>
        </div>
      )}

    </div>
  );
};

export default App;