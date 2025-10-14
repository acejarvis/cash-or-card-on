import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import siteLogo from './files/logo.svg';
import RestaurantCard from './components/RestaurantCard';
import RestaurantDetailsModal from './components/RestaurantDetailsModal';
import AdminPanelModal from './components/AdminPanelModal';
import Login from './components/Login';
import Account from './components/Account';

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
  const [user, setUser] = useState(null);
  const [view, setView] = useState('list'); // kept for backwards compatibility
  const [showAccount, setShowAccount] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  const filterTimer = useRef(null);
  const restaurantsPerPage = 8;

  useEffect(() => {
    // load logged in user from localStorage
    try {
      const s = localStorage.getItem('mock_user');
      if (s) setUser(JSON.parse(s));
    } catch (e) {}
  }, []);

  

  useEffect(() => {
    fetch('/mock_restaurants.json')
      .then((response) => response.json())
      .then((data) => {
        setRestaurants(data.restaurants);

        const uniqueCities = Array.from(new Set(data.restaurants.map((restaurant) => restaurant.city)));
        setCities(uniqueCities);

        const uniqueCuisines = Array.from(
          new Set(data.restaurants.flatMap((restaurant) => restaurant.categories.map((category) => category.name)))
        );
        setCuisines(uniqueCuisines);

        const uniquePaymentMethods = Array.from(
          new Set(data.restaurants.flatMap((restaurant) => restaurant.payment_methods.map((method) => method.name)))
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
    const matchesCity = filters.city.length ? filters.city.includes(restaurant.city) : true;
    const matchesCuisine = filters.cuisine.length
      ? restaurant.categories.some((category) => filters.cuisine.includes(category.name))
      : true;
    const matchesPaymentMethod = filters.paymentMethod.length
      ? restaurant.payment_methods.some((method) => filters.paymentMethod.includes(method.name))
      : true;
    const matchesRating = filters.rating ? restaurant.ratings[0]?.rating >= parseInt(filters.rating) : true;
    const matchesCashDiscount = filters.cashDiscount ? restaurant.cash_discounts[0]?.percentage > 0 : true;

    return (
      matchesCity &&
      matchesCuisine &&
      matchesPaymentMethod &&
      matchesRating &&
      matchesCashDiscount &&
      restaurant.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const indexOfLastRestaurant = currentPage * restaurantsPerPage;
  const indexOfFirstRestaurant = indexOfLastRestaurant - restaurantsPerPage;
  const currentRestaurants = filteredRestaurants.slice(indexOfFirstRestaurant, indexOfLastRestaurant);

  const totalPages = Math.ceil(filteredRestaurants.length / restaurantsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Authentication helpers (client-side mock against public/mock_users.json)
  const handleLogin = async (identifier, password) => {
    // First try admin users from mock_admin.json
    try {
      const adminResp = await fetch('/mock_admin.json');
      const adminData = await adminResp.json();
      const adminUsers = adminData.users || [];
      const adminFound = adminUsers.find(u => (u.username === identifier || u.email === identifier) && u.password === password);
      if (adminFound) {
        setUser(adminFound);
        localStorage.setItem('mock_user', JSON.stringify(adminFound));
        setShowLogin(false);
        return true;
      }
    } catch (e) {
      // ignore admin fetch error and fall back to regular users
    }

    // Fall back to regular users
    try {
      const resp = await fetch('/mock_users.json');
      const data = await resp.json();
      const users = data.users || [];
      const found = users.find(u => (u.username === identifier || u.email === identifier) && u.password === password);
      if (found) {
        setUser(found);
        localStorage.setItem('mock_user', JSON.stringify(found));
        setShowLogin(false);
        return true;
      }
    } catch (e) {
      console.error('Login error', e);
    }

    return false;
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('mock_user');
    setView('list');
  };

  return (
    <div className="App">
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
                <button className="chip" onClick={() => setShowLogin(true)}>Log In</button>
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
                    {method}
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
                key={restaurant.restaurant_id}
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
        <Login onClose={() => setShowLogin(false)} onLogin={handleLogin} />
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