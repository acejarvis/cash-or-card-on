import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Inject CSS for highlighted marker animation
const style = document.createElement('style');
style.textContent = `
  @keyframes pulse-marker {
    0%, 100% { 
      transform: scale(1) translateY(0); 
      filter: drop-shadow(0 4px 8px rgba(239, 68, 68, 0.4));
    }
    50% { 
      transform: scale(1.1) translateY(-3px); 
      filter: drop-shadow(0 8px 16px rgba(239, 68, 68, 0.6));
    }
  }
  .custom-highlighted-marker {
    background: transparent !important;
    border: none !important;
  }
`;
if (!document.getElementById('map-marker-styles')) {
  style.id = 'map-marker-styles';
  document.head.appendChild(style);
}

// Fix leaflet's default icon paths for CRA
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Create a highlighted marker icon
const createHighlightedIcon = () => {
  return L.divIcon({
    className: 'custom-highlighted-marker',
    html: `<div style="
      position: relative;
      width: 35px;
      height: 45px;
      animation: pulse-marker 1s ease-in-out infinite;
    ">
      <svg width="35" height="45" viewBox="0 0 35 45" xmlns="http://www.w3.org/2000/svg">
        <path d="M17.5 0C7.835 0 0 7.835 0 17.5C0 30.625 17.5 45 17.5 45C17.5 45 35 30.625 35 17.5C35 7.835 27.165 0 17.5 0Z" 
          fill="#EF4444" 
          stroke="#B91C1C" 
          stroke-width="2"
          filter="drop-shadow(0 4px 8px rgba(239, 68, 68, 0.4))"
        />
        <circle cx="17.5" cy="17.5" r="6" fill="white"/>
      </svg>
    </div>`,
    iconSize: [35, 45],
    iconAnchor: [17.5, 45],
    popupAnchor: [0, -45]
  });
};

const INITIAL_CENTER = [43.6532, -79.3832];

// Component to handle fitting bounds when markers change
const FitBoundsHandler = ({ markers }) => {
  const map = useMap();
  const hasFitRef = useRef(false);

  useEffect(() => {
    if (!markers.length || hasFitRef.current) return;


    const timer = setTimeout(() => {
      try {
        const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng]));
        map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15 });
        hasFitRef.current = true;
      } catch (e) {
        console.error('FitBounds error:', e);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [map, markers]);

  return null;
};

const MapView = ({ restaurants = [], hoveredRestaurantId = null }) => {
  const [geocodedMarkers, setGeocodedMarkers] = useState([]);

  // Helper: read/write local cache for geocoded addresses
  const geoCacheKey = 'map_geocode_cache_v1';
  const readCache = () => {
    try { return JSON.parse(localStorage.getItem(geoCacheKey) || '{}'); } catch (e) { return {}; }
  };
  const writeCache = (c) => {
    try { localStorage.setItem(geoCacheKey, JSON.stringify(c)); } catch (e) { /* ignore */ }
  };

  const explicitMarkers = useMemo(() => (restaurants || []).map((r) => {
    if (!r) return null;
    const lat = r.latitude || r.lat || (r.coords && r.coords.lat);
    const lng = r.longitude || r.lng || r.lon || (r.coords && r.coords.lng);
    if (lat == null || lng == null) return null;
    return { id: r.id, lat: Number(lat), lng: Number(lng), name: r.name, address: r.address, city: r.city, postal: r.postal_code || r.postalCode };
  }).filter(Boolean), [restaurants]);

  // Combined markers: explicit coords + geocoded results
  const markers = useMemo(() => {
    const byKey = new Map();
    explicitMarkers.forEach((m) => byKey.set(m.id || `${m.lat}-${m.lng}`, m));
    geocodedMarkers.forEach((m) => byKey.set(m.id || `${m.lat}-${m.lng}`, m));
    return Array.from(byKey.values());
  }, [explicitMarkers, geocodedMarkers]);

  // Geocode restaurants that lack explicit coords (lightweight, cached, rate-limited)
  useEffect(() => {
    let cancelled = false;
    const cache = readCache();

    // Build list of restaurants that need geocoding (address present, no coords)
    const needGeo = (restaurants || []).filter((r) => {
      if (!r) return false;
      const hasCoords = r.latitude || r.lat || (r.coords && r.coords.lat) || r.longitude || r.lng || r.lon || (r.coords && r.coords.lng);
      return !hasCoords && (r.address || r.postal_code || r.postalCode);
    });

    if (!needGeo.length) {
      setGeocodedMarkers([]);
      return () => { cancelled = true; };
    }

    // Helper to create a search string
    // Strip unit/suite/apt/etc from addresses to improve geocoding (e.g. "Unit 1A")
    const cleanAddress = (addr) => {
      if (!addr) return '';
      // remove parenthetical content
      let s = String(addr).replace(/\(.*?\)/g, '');
      // remove trailing unit/suite/apt hashtags and anything after them
      s = s.replace(/(?:,)?\s*(?:unit|ste|suite|apt|apartment|#|rm|room|floor|fl)\b.*$/i, '');
      // remove any isolated #123 or Unit 1A patterns anywhere
      s = s.replace(/\b(?:unit|suite|apt|apartment)\b[\s#.:,-]*[A-Za-z0-9-]*/ig, '');
      s = s.replace(/#/g, '');
      // collapse spaces and trim
      return s.replace(/\s+/g, ' ').trim();
    };

    const addrKey = (r) => {
      const raw = `${r.address || ''} ${r.city || ''} ${r.postal_code || r.postalCode || ''}`.trim();
      const cleaned = `${cleanAddress(r.address || '')} ${r.city || ''} ${r.postal_code || r.postalCode || ''}`.trim();
      return { raw, cleaned };
    };

    const toGeocode = needGeo.map((r) => {
      const { raw, cleaned } = addrKey(r);
      // If either cleaned or raw key is already cached, skip
      if (cache[cleaned] || cache[raw]) return null;
      return { r, raw, cleaned };
    }).filter(Boolean);

    // Load ONLY cached entries for current restaurants (match by ID or address key)
    const currentRestaurantIds = new Set((restaurants || []).map(r => r.id));
    const cachedEntries = needGeo
      .map((r) => {
        const { raw, cleaned } = addrKey(r);
        const cached = cache[cleaned] || cache[raw];
        if (cached && currentRestaurantIds.has(r.id)) {
          return {
            id: r.id,
            lat: cached.lat,
            lng: cached.lng,
            name: r.name,
            address: r.address,
            city: r.city
          };
        }
        return null;
      })
      .filter(Boolean);

    // Set cached markers immediately so they can be displayed
    setGeocodedMarkers(cachedEntries);

    if (!toGeocode.length) {
      // all cached, already set above
      return () => { cancelled = true; };
    }

    // Rate-limited sequential requests (1 per 1100ms)
    (async () => {
      const results = [];
      for (let i = 0; i < toGeocode.length; i++) {
        if (cancelled) break;
        const { r, raw, cleaned } = toGeocode[i];
        try {
          // prefer cleaned address for query
          const queryStr = cleaned || raw;
          const q = encodeURIComponent(queryStr);
          // Use backend proxy to avoid CORS issues
          const url = `/api/geocode/search?q=${q}`;
          const resp = await fetch(url);
          if (!resp.ok) throw new Error('geocode failed');
          const body = await resp.json();
          if (body && body.length) {
            const item = body[0];
            const lat = Number(item.lat);
            const lng = Number(item.lon);
            // store under the cleaned key for future robustness
            const storeKey = cleaned || raw;
            cache[storeKey] = { lat, lng, name: r.name, address: r.address, city: r.city, id: r.id };
            results.push({ id: r.id || storeKey, lat, lng, name: r.name, address: r.address, city: r.city });
            writeCache(cache);
          }
        } catch (e) {
          // ignore per-item errors
        }
        // sleep ~1.1s to be gentle to Nominatim
        await new Promise((res) => setTimeout(res, 1100));
      }

      if (!cancelled) {
        // Show ONLY markers for current restaurants, not all cached entries
        const currentRestaurantIds = new Set((restaurants || []).map(r => r.id));
        const currentMarkers = [];

        // Add newly geocoded results
        currentMarkers.push(...results);

        // Add cached entries that match current restaurants
        for (const r of needGeo) {
          if (currentRestaurantIds.has(r.id)) {
            const { raw, cleaned } = addrKey(r);
            const cached = cache[cleaned] || cache[raw];
            if (cached && !results.find(res => res.id === r.id)) {
              currentMarkers.push({
                id: r.id,
                lat: cached.lat,
                lng: cached.lng,
                name: r.name,
                address: r.address,
                city: r.city
              });
            }
          }
        }

        setGeocodedMarkers(currentMarkers);
      }
    })();

    return () => { cancelled = true; };
  }, [restaurants]);

  return (
    <div style={{
      height: '100%',
      width: '100%',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <MapContainer
        center={INITIAL_CENTER}
        zoom={13}
        style={{
          height: '100%',
          width: '100%',
          borderRadius: 0, // Remove border radius for full panel fit
          border: 'none'
        }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBoundsHandler markers={markers} />
        {markers.map((m) => {
          const isHighlighted = hoveredRestaurantId && m.id === hoveredRestaurantId;
          const markerKey = `${m.id || `${m.lat}-${m.lng}`}-${isHighlighted ? 'highlighted' : 'normal'}`;
          const markerProps = {
            key: markerKey,
            position: [m.lat, m.lng],
            zIndexOffset: isHighlighted ? 1000 : 0
          };

          // Only add icon prop if highlighted (otherwise use default Leaflet icon)
          if (isHighlighted) {
            markerProps.icon = createHighlightedIcon();
          }

          return (
            <Marker {...markerProps}>
              <Popup>
                <div style={{ minWidth: 160 }}>
                  <strong>{m.name}</strong>
                  <div style={{ fontSize: 12 }}>{m.address}</div>
                  <div style={{ fontSize: 12 }}>{m.city} {m.postal || ''}</div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default MapView;

