import React, { useEffect, useState } from 'react';
import './AdminPanelModal.css';

const ResourceMonitoringModal = ({ isOpen, onClose }) => {
  const [metrics, setMetrics] = useState({
    cpu: null,
    memory: { free: null, total: null },
    disk: { free: null, total: null },
    bandwidth: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen) return;

    const fetchMetrics = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = sessionStorage.getItem('auth_token');
        const API_BASE_URL = process.env.REACT_APP_API_BASE || 'http://localhost:3001/api';
        const resp = await fetch(`${API_BASE_URL}/monitoring/metrics`, {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        });

        if (!resp.ok) throw new Error('Failed to fetch metrics');

        const data = await resp.json();

        // Helper to extract last value
        const getLastValue = (metricData) => {
          if (!metricData?.data?.result?.[0]?.values?.length) return null;
          const values = metricData.data.result[0].values;
          return parseFloat(values[values.length - 1][1]);
        };

        // Helper to calculate CPU usage from raw modes
        const calculateCpuUsage = (cpuData) => {
          if (!cpuData?.data?.result?.length) return null;

          const result = cpuData.data.result;
          const numPoints = result[0].values.length;

          if (numPoints < 2) return null;

          // Iterate backwards to find the first interval with a non-zero total delta
          // This handles cases where the API returns repeated/stale data at the end
          for (let i = numPoints - 1; i > 0; i--) {
            let totalDelta = 0;
            let idleDelta = 0;

            // Calculate deltas for this interval across all modes
            result.forEach(series => {
              const values = series.values;
              if (values.length > i) {
                const curr = parseFloat(values[i][1]);
                const prev = parseFloat(values[i - 1][1]);
                const delta = curr - prev;

                totalDelta += delta;
                if (series.metric.mode === 'idle') {
                  idleDelta = delta;
                }
              }
            });

            if (totalDelta > 0) {
              // Found a valid interval
              return (1 - (idleDelta / totalDelta)) * 100;
            }
          }

          return 0;
        };

        setMetrics({
          cpu: calculateCpuUsage(data.cpu),
          memory: {
            free: getLastValue(data.memory_free),
            total: getLastValue(data.memory_total)
          },
          disk: {
            free: getLastValue(data.disk_free),
            total: getLastValue(data.disk_total)
          },
          bandwidth: getLastValue(data.bandwidth)
        });
      } catch (err) {
        console.error('Error fetching metrics:', err);
        setError('Failed to load metrics');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  // Format helpers
  const formatPercent = (val) => val !== null ? `${val.toFixed(1)}%` : 'N/A';
  const formatBytes = (bytes) => {
    if (bytes === null) return 'N/A';
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatBandwidth = (mbps) => {
    if (mbps === null) return 'N/A';
    // If value is very small, it might be in Mbps but look like 0.00xxx
    if (mbps < 1) return `${(mbps * 1000).toFixed(2)} Kbps`;
    return `${mbps.toFixed(2)} Mbps`;
  };

  const calculateUsagePercent = (free, total) => {
    if (free === null || total === null || total === 0) return 0;
    return ((total - free) / total) * 100;
  };

  const memUsage = calculateUsagePercent(metrics.memory.free, metrics.memory.total);
  const diskUsage = calculateUsagePercent(metrics.disk.free, metrics.disk.total);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 99999,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backdropFilter: 'blur(4px)'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          padding: '24px',
          borderRadius: '12px',
          width: '90%',
          maxWidth: '500px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          color: '#1e293b',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#0f172a' }}>System Monitoring</h2>
          <button
            onClick={onClose}
            style={{
              cursor: 'pointer',
              border: 'none',
              background: 'transparent',
              fontSize: '24px',
              color: '#64748b',
              padding: '4px',
              lineHeight: 1
            }}
          >
            &times;
          </button>
        </div>

        {loading && <div style={{ textAlign: 'center', padding: '20px' }}>Loading metrics...</div>}

        {error && <div style={{ textAlign: 'center', padding: '20px', color: '#ef4444' }}>{error}</div>}

        {!loading && !error && (
          <div style={{ display: 'grid', gap: '16px' }}>
            {/* CPU Usage */}
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontWeight: 600, color: '#475569' }}>CPU Usage</span>
                <span style={{ fontWeight: 700, color: '#0ea5e9' }}>{formatPercent(metrics.cpu)}</span>
              </div>
              <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(metrics.cpu || 0, 100)}%`, height: '100%', background: '#0ea5e9', borderRadius: '4px', transition: 'width 0.5s ease' }}></div>
              </div>
            </div>

            {/* Memory Usage */}
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontWeight: 600, color: '#475569' }}>Memory Usage</span>
                <span style={{ fontWeight: 700, color: '#8b5cf6' }}>
                  {metrics.memory.total ? `${formatPercent(memUsage)} (${formatBytes(metrics.memory.total - metrics.memory.free)} / ${formatBytes(metrics.memory.total)})` : 'N/A'}
                </span>
              </div>
              <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(memUsage, 100)}%`, height: '100%', background: '#8b5cf6', borderRadius: '4px', transition: 'width 0.5s ease' }}></div>
              </div>
            </div>

            {/* Disk Usage */}
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontWeight: 600, color: '#475569' }}>Disk Usage</span>
                <span style={{ fontWeight: 700, color: '#10b981' }}>
                  {metrics.disk.total ? `${formatPercent(diskUsage)} (${formatBytes(metrics.disk.total - metrics.disk.free)} / ${formatBytes(metrics.disk.total)})` : 'N/A'}
                </span>
              </div>
              <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(diskUsage, 100)}%`, height: '100%', background: '#10b981', borderRadius: '4px', transition: 'width 0.5s ease' }}></div>
              </div>
            </div>

            {/* Bandwidth */}
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontWeight: 600, color: '#475569' }}>Bandwidth (Inbound)</span>
                <span style={{ fontWeight: 700, color: '#f59e0b' }}>{formatBandwidth(metrics.bandwidth)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResourceMonitoringModal;
