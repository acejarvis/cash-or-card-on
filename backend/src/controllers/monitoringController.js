const axios = require('axios');
const config = require('../config/env');

const DO_API_BASE = 'https://api.digitalocean.com/v2/monitoring/metrics/droplet';

const getMetrics = async (req, res) => {
  try {
    const { DO_API_TOKEN, DO_DROPLET_ID } = config;

    if (!DO_API_TOKEN || !DO_DROPLET_ID) {
      console.error('Missing DO Config:', { hasToken: !!DO_API_TOKEN, hasDropletId: !!DO_DROPLET_ID });
      return res.status(500).json({ error: 'DigitalOcean configuration missing' });
    }

    const headers = {
      Authorization: `Bearer ${DO_API_TOKEN}`,
    };

    const endTime = Math.floor(Date.now() / 1000);
    const startTime = endTime - 3600; // Last 1 hour

    const params = {
      host_id: DO_DROPLET_ID,
      start: startTime,
      end: endTime,
    };

    // Fetch multiple metrics in parallel
    const [cpuRes, memoryFreeRes, memoryTotalRes, diskFreeRes, diskTotalRes, bandwidthRes] = await Promise.all([
      axios.get(`${DO_API_BASE}/cpu`, { headers, params }),
      axios.get(`${DO_API_BASE}/memory_free`, { headers, params }),
      axios.get(`${DO_API_BASE}/memory_total`, { headers, params }),
      axios.get(`${DO_API_BASE}/filesystem_free`, { headers, params }),
      axios.get(`${DO_API_BASE}/filesystem_size`, { headers, params }),
      axios.get(`${DO_API_BASE}/bandwidth`, {
        headers,
        params: { ...params, interface: 'public', direction: 'inbound' }
      }),
    ]);

    // Helper to downsample data points
    const downsampleMetrics = (data, threshold = 100) => {
      if (!data || !data.data || !data.data.result || data.data.result.length === 0) {
        return data;
      }

      const downsampledResults = data.data.result.map(result => {
        const values = result.values;
        if (values.length <= threshold) {
          return result;
        }

        const step = Math.ceil(values.length / threshold);
        const sampledValues = [];
        for (let i = 0; i < values.length; i += step) {
          sampledValues.push(values[i]);
        }
        return { ...result, values: sampledValues };
      });

      return {
        ...data,
        data: {
          ...data.data,
          result: downsampledResults
        }
      };
    };

    res.json({
      cpu: downsampleMetrics(cpuRes.data),
      memory_free: downsampleMetrics(memoryFreeRes.data),
      memory_total: downsampleMetrics(memoryTotalRes.data),
      disk_free: downsampleMetrics(diskFreeRes.data),
      disk_total: downsampleMetrics(diskTotalRes.data),
      bandwidth: downsampleMetrics(bandwidthRes.data),
    });
  } catch (error) {
    console.error('Error fetching DO metrics:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
};

module.exports = {
  getMetrics,
};
