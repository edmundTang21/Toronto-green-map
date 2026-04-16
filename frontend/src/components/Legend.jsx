import React, { useState } from 'react';

export default function Legend() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      <button
        className={`legend-toggle-fab${collapsed ? ' visible' : ''}`}
        onClick={() => setCollapsed(false)}
      >
        &#x25A4; Legend
      </button>

      <div className={`panel legend${collapsed ? ' collapsed' : ''}`}>
        <div className="legend-header">
          <span>&#x25A4; Legend</span>
          <button className="legend-close-btn" onClick={() => setCollapsed(true)}>
            &times;
          </button>
        </div>

        <h3>Parking</h3>
        <div className="legend-item">
          <div className="legend-color" style={{ background: 'rgba(239,68,68,0.45)' }} />
          <span>Parking Lot</span>
        </div>
        <div className="legend-item">
          <div className="legend-circle" style={{ background: '#16a34a', borderColor: '#fff' }} />
          <span>Green P</span>
        </div>
        <div className="legend-item">
          <div className="legend-circle" style={{ background: '#8b5cf6', borderColor: '#fff' }} />
          <span>Walk Isochrone</span>
        </div>

        <h3>Environment</h3>
        <div className="legend-item">
          <div className="legend-color" style={{ background: 'rgba(136,136,136,0.6)', borderColor: '#888' }} />
          <span>Impermeable</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ background: 'rgba(34,197,94,0.5)', borderColor: '#22c55e' }} />
          <span>Permeable</span>
        </div>
        <div className="legend-item">
          <div className="legend-circle" style={{ background: '#228b22', borderColor: '#fff' }} />
          <span>Trees</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ background: 'rgba(34,197,94,0.4)', borderColor: '#22c55e' }} />
          <span>Green Spaces</span>
        </div>
        <div className="legend-item">
          <div className="legend-circle" style={{ background: '#059669', borderColor: '#fff' }} />
          <span>Green Streets</span>
        </div>

        <h3>Water &amp; Drainage</h3>
        <div className="legend-item">
          <div className="legend-circle" style={{ background: '#0ea5e9', borderColor: '#0369a1' }} />
          <span>Sewer Inlets</span>
        </div>
        <div className="legend-item">
          <div className="legend-circle" style={{ background: '#0ea5e9', borderColor: '#fff' }} />
          <span>Rain Gauge</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ background: 'linear-gradient(to right,#dbeafe,#1e3a8a)', borderColor: '#ccc' }} />
          <span>Flood Reports</span>
        </div>

        <h3>Other</h3>
        <div className="legend-item">
          <div className="legend-color" style={{ background: 'rgba(59,130,246,0.15)', border: '2px solid #3b82f6' }} />
          <span>Study Area</span>
        </div>
        <div className="legend-item">
          <div className="legend-line" style={{ background: '#b45309' }} />
          <span>Contour</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ background: 'linear-gradient(to right,#fee5d9,#a50f15)', borderColor: '#ccc' }} />
          <span>Population Density</span>
        </div>
      </div>
    </>
  );
}
