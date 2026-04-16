import React from 'react';

export default function WalkResultsPanel({ results, onClose }) {
  if (!results) return null;

  const total = (results.totalEstSpaces || 0) + (results.totalGreenPSpaces || 0);

  return (
    <div className="panel walk-results-panel active">
      <h2>
        <span style={{ color: results.color }}>
          Parking - {results.minutes} min walk
        </span>
        <button className="close-btn" onClick={onClose}>&times;</button>
      </h2>
      <div className="walk-results-subtitle">
        {results.allDataLoaded ? 'Full Toronto data' : 'Study area only'}
      </div>
      <div className="stat">
        <span className="stat-label">Parking Lots</span>
        <span className="stat-value">{results.lotCount}</span>
      </div>
      <div className="stat">
        <span className="stat-label">Est. Lot Spaces</span>
        <span className="stat-value">~{results.totalEstSpaces.toLocaleString()}</span>
      </div>
      <div className="stat">
        <span className="stat-label">Green P</span>
        <span className="stat-value green">{results.greenpCount}</span>
      </div>
      <div className="stat">
        <span className="stat-label">Green P Spaces</span>
        <span className="stat-value green">{results.totalGreenPSpaces.toLocaleString()}</span>
      </div>
      <hr />
      <div className="stat">
        <span className="stat-label"><b>Total Spaces</b></span>
        <span className="stat-value purple">~{total.toLocaleString()}</span>
      </div>
      <hr />
      <div className="stat">
        <span className="stat-label">Est. Population</span>
        <span className="stat-value">~{(results.estPopulation || 0).toLocaleString()}</span>
      </div>
    </div>
  );
}
