import React from 'react';

export default function InfoPanel({ stats }) {
  return (
    <div className="panel info-panel">
      <h2>Parking - Study Area</h2>
      <div className="stat">
        <span className="stat-label">Parking Lots</span>
        <span className="stat-value">{stats.lotCount}</span>
      </div>
      <div className="stat">
        <span className="stat-label">Est. Spaces</span>
        <span className="stat-value">{stats.estSpaces}</span>
      </div>
      <div className="stat">
        <span className="stat-label">Green P</span>
        <span className="stat-value">{stats.greenpCount}</span>
      </div>
      <div className="stat">
        <span className="stat-label">Green P Spaces</span>
        <span className="stat-value">{stats.greenpSpaces}</span>
      </div>
    </div>
  );
}
