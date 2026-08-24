import React, { useState, useEffect } from 'react';

export default function AboutModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem('about-dismissed');
    if (!dismissed) setOpen(true);
  }, []);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener('show-about', handler);
    return () => window.removeEventListener('show-about', handler);
  }, []);

  const handleClose = (dontShowAgain) => {
    if (dontShowAgain) localStorage.setItem('about-dismissed', '1');
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div className="about-overlay" onClick={() => handleClose(false)}>
      <div className="about-modal" onClick={(e) => e.stopPropagation()}>
        <div className="about-header">
          <h2>Toronto Green Map</h2>
          <button className="about-close" onClick={() => handleClose(false)}>✕</button>
        </div>

        <div className="about-body">
          <h3>Disclaimer</h3>
          <p>
            The information provided on this map is sourced from public datasets
            and is provided "as is" without warranty of any kind. Data may not
            reflect the most current conditions.
          </p>

          <h3>Data Sources</h3>
          <ul>
            <li><strong>Parking Lots</strong> — City of Toronto Open Data</li>
            <li><strong>Green P Parking</strong> — City of Toronto Open Data</li>
            <li><strong>Green Streets</strong> — City of Toronto Open Data</li>
            <li><strong>Trees</strong> — City of Toronto Urban Forestry</li>
            <li><strong>Contours</strong> — City of Toronto Open Data</li>
            <li><strong>Flood Reports</strong> — City of Toronto Open Data</li>
            <li><strong>Sewer Inlets</strong> — City of Toronto Open Data</li>
            <li><strong>Impermeable Surfaces</strong> — City of Toronto Open Data</li>
            <li><strong>Population</strong> — Statistics Canada / City of Toronto</li>
            <li><strong>Rain Gauges</strong> — Toronto and Region Conservation Authority (TRCA)</li>
            <li><strong>Flood Susceptibility Index (FSI)</strong> — Natural Resources Canada (NRCan), 2015</li>
            <li><strong>Basemap</strong> — Mapbox</li>
          </ul>
        </div>

        <div className="about-footer">
          <label className="about-dont-show">
            <input
              type="checkbox"
              onChange={(e) => { if (e.target.checked) localStorage.setItem('about-dismissed', '1'); else localStorage.removeItem('about-dismissed'); }}
            />
            Don't show again
          </label>
          <button className="about-got-it" onClick={() => handleClose(false)}>Got it</button>
        </div>
      </div>
    </div>
  );
}
