const express = require('express');
const axios = require('axios');
const router = express.Router();

// Proxy geocoding requests to Nominatim to avoid CORS issues
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q,
        format: 'json',
        limit: 1
      },
      headers: {
        'User-Agent': 'CashOrCard/1.0 (https://github.com/acejarvis/cash-or-card-on)',
        'Accept-Language': 'en'
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Geocoding error:', error.message);
    res.status(500).json({ error: 'Failed to geocode address' });
  }
});

module.exports = router;
