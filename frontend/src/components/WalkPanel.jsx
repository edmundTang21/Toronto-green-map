import React, { useState, useRef, useCallback, useEffect } from 'react';

const WALK_COLORS = ['#8b5cf6', '#f59e0b', '#06b6d4', '#ec4899', '#10b981', '#f97316', '#6366f1', '#14b8a6'];

const API_URL = import.meta.env.VITE_API_URL || '';
const MAPBOX_TOKEN =
  import.meta.env.VITE_MAPBOX_TOKEN ||
  import.meta.env.VITE_MAPBOX_TOKEN;

export default function WalkPanel({ mapRef, onPlacePoint, onWalkTimeChange }) {
  const [minutes, setMinutes] = useState(5);
  const [placingMode, setPlacingMode] = useState(false);
  const [walkPoints, setWalkPoints] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [activeResults, setActiveResults] = useState(null);

  // Refs for data shared between event handlers without causing re-renders
  const walkIdCounter = useRef(0);
  const parkingAllRef = useRef(null);
  const greenpAllRef = useRef(null);
  const populationRef = useRef(null);
  const allDataLoadedRef = useRef(false);
  const turfRef = useRef(null);

  // Load turf and full city data once on mount
  useEffect(() => {
    import('@turf/turf').then(turf => { turfRef.current = turf; });

    Promise.all([
      fetch(`${API_URL}/api/parking/all`).then(r => r.json()),
      fetch(`${API_URL}/api/green/all`).then(r => r.json()),
      fetch(`${API_URL}/api/data/population`).then(r => r.json()),
    ]).then(([p, g, pop]) => {
      parkingAllRef.current = p;
      greenpAllRef.current = g;
      populationRef.current = pop;
      allDataLoadedRef.current = true;
    }).catch(err => console.warn('Full city data load failed:', err));
  }, []);

  // Toggle placing mode
  const handlePlaceClick = useCallback(() => {
    if (onPlacePoint) {
      onPlacePoint();
      return;
    }
    const map = mapRef ? mapRef.current : null;
    const next = !placingMode;
    setPlacingMode(next);
    if (map) map.getCanvas().style.cursor = next ? 'crosshair' : '';
  }, [placingMode, mapRef, onPlacePoint]);

  // Map click handler
  useEffect(() => {
    const map = mapRef ? mapRef.current : null;
    if (!map) return;

    const onClick = async (e) => {
      if (!placingMode) return;
      const turf = turfRef.current;

      const id = ++walkIdCounter.current;
      const color = WALK_COLORS[(id - 1) % WALK_COLORS.length];

      setPlacingMode(false);
      map.getCanvas().style.cursor = '';

      // Marker element
      const el = document.createElement('div');
      el.style.cssText = `width:24px;height:24px;border-radius:50%;background:${color};color:#fff;font-size:11px;font-weight:700;text-align:center;line-height:24px;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.3);`;
      el.textContent = minutes;

      const { default: mapboxgl } = await import('mapbox-gl');
      const marker = new mapboxgl.Marker(el).setLngLat(e.lngLat).addTo(map);

      try {
        const isoUrl = `https://api.mapbox.com/isochrone/v1/mapbox/walking/${e.lngLat.lng},${e.lngLat.lat}?contours_minutes=${minutes}&polygons=true&access_token=${MAPBOX_TOKEN}`;
        const isoGeoJSON = await (await fetch(isoUrl)).json();

        map.addSource(`iso-${id}`, { type: 'geojson', data: isoGeoJSON });
        map.addLayer({ id: `iso-fill-${id}`, source: `iso-${id}`, type: 'fill', paint: { 'fill-color': color, 'fill-opacity': 0.12 } });
        map.addLayer({ id: `iso-line-${id}`, source: `iso-${id}`, type: 'line', paint: { 'line-color': color, 'line-width': 2.5 } });

        let results = null;
        if (turf) {
          results = analyzeParkingInIsochrone(isoGeoJSON, turf);
        } else {
          results = { lotFeatures: [], totalEstSpaces: 0, totalGreenPSpaces: 0, lotCount: 0, greenpCount: 0, estPopulation: 0 };
        }

        // Highlight parking lots within isochrone
        if (results.lotFeatures.length > 0) {
          map.addSource(`hl-${id}`, { type: 'geojson', data: { type: 'FeatureCollection', features: results.lotFeatures } });
          map.addLayer({ id: `hl-fill-${id}`, source: `hl-${id}`, type: 'fill', paint: { 'fill-color': color, 'fill-opacity': 0.45 } });
          map.addLayer({
            id: `hl-labels-${id}`, source: `hl-${id}`, type: 'symbol',
            layout: {
              'text-field': ['concat', '~', ['to-string', ['get', 'estimated_spaces']]],
              'text-size': 11, 'text-font': ['DIN Pro Bold', 'Arial Unicode MS Bold'],
              'text-allow-overlap': false,
            },
            paint: { 'text-color': color, 'text-halo-color': '#fff', 'text-halo-width': 1.5 },
          });
        }

        const wp = { id, lngLat: e.lngLat, minutes, marker, color, results, _isoGeoJSON: isoGeoJSON };
        setWalkPoints(prev => [...prev, wp]);
        setActiveResults({ ...results, minutes, color, allDataLoaded: allDataLoadedRef.current });
        setShowResults(true);
      } catch (err) {
        console.error('Isochrone error:', err);
        marker.remove();
      }
    };

    map.on('click', onClick);
    return () => map.off('click', onClick);
  }, [placingMode, minutes, mapRef]);

  function analyzeParkingInIsochrone(isoGeoJSON, turf) {
    const isoPoly = isoGeoJSON.features[0];
    const results = { lotFeatures: [], totalEstSpaces: 0, totalGreenPSpaces: 0, lotCount: 0, greenpCount: 0, estPopulation: 0 };

    if (parkingAllRef.current) {
      parkingAllRef.current.features.forEach(f => {
        try {
          if (turf.booleanPointInPolygon(turf.centroid(f), isoPoly)) {
            results.totalEstSpaces += f.properties.estimated_spaces || 0;
            results.lotCount++;
            results.lotFeatures.push(f);
          }
        } catch (e) { /* skip invalid geometry */ }
      });
    }

    if (greenpAllRef.current) {
      greenpAllRef.current.features.forEach(f => {
        try {
          if (turf.booleanPointInPolygon(turf.point(f.geometry.coordinates), isoPoly)) {
            results.totalGreenPSpaces += parseInt(f.properties.capacity) || 0;
            results.greenpCount++;
          }
        } catch (e) { /* skip */ }
      });
    }

    if (populationRef.current) {
      populationRef.current.features.forEach(f => {
        try {
          const inter = turf.intersect(turf.featureCollection([isoPoly, f]));
          if (inter) {
            results.estPopulation += Math.round((turf.area(inter) / turf.area(f)) * (f.properties.population || 0));
          }
        } catch (e) { /* skip */ }
      });
    }

    return results;
  }

  function removeWalkPoint(id) {
    const map = mapRef.current;
    if (!map) return;
    setWalkPoints(prev => {
      const wp = prev.find(w => w.id === id);
      if (!wp) return prev;
      wp.marker.remove();
      if (map.getSource(`iso-${id}`)) {
        map.removeLayer(`iso-fill-${id}`);
        map.removeLayer(`iso-line-${id}`);
        map.removeSource(`iso-${id}`);
      }
      if (map.getSource(`hl-${id}`)) {
        if (map.getLayer(`hl-labels-${id}`)) map.removeLayer(`hl-labels-${id}`);
        map.removeLayer(`hl-fill-${id}`);
        map.removeSource(`hl-${id}`);
      }
      return prev.filter(w => w.id !== id);
    });
  }

  function clearAll() {
    const map = mapRef.current;
    walkPoints.forEach(wp => {
      wp.marker.remove();
      if (map && map.getSource(`iso-${wp.id}`)) {
        map.removeLayer(`iso-fill-${wp.id}`);
        map.removeLayer(`iso-line-${wp.id}`);
        map.removeSource(`iso-${wp.id}`);
      }
      if (map && map.getSource(`hl-${wp.id}`)) {
        if (map.getLayer(`hl-labels-${wp.id}`)) map.removeLayer(`hl-labels-${wp.id}`);
        map.removeLayer(`hl-fill-${wp.id}`);
        map.removeSource(`hl-${wp.id}`);
      }
    });
    setWalkPoints([]);
    setShowResults(false);
    setActiveResults(null);
  }

  function showPointResults(id) {
    const wp = walkPoints.find(w => w.id === id);
    if (wp && wp.results) {
      setActiveResults({ ...wp.results, minutes: wp.minutes, color: wp.color, allDataLoaded: allDataLoadedRef.current });
      setShowResults(true);
    }
  }

  const hasPoints = walkPoints.length > 0;

  return (
    <>
      {showResults && activeResults && (
        <div className="panel walk-results-panel active" style={{ top: 200, right: 12, width: 300 }}>
          <h2>
            <span style={{ color: activeResults.color }}>
              Parking - {activeResults.minutes} min walk
            </span>
            <button className="close-btn" onClick={() => setShowResults(false)}>&times;</button>
          </h2>
          <div className="walk-results-subtitle">
            {activeResults.allDataLoaded ? 'Full Toronto data' : 'Study area only'}
          </div>
          <div className="stat">
            <span className="stat-label">Parking Lots</span>
            <span className="stat-value">{activeResults.lotCount}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Est. Lot Spaces</span>
            <span className="stat-value">~{activeResults.totalEstSpaces.toLocaleString()}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Green P</span>
            <span className="stat-value green">{activeResults.greenpCount}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Green P Spaces</span>
            <span className="stat-value green">{activeResults.totalGreenPSpaces.toLocaleString()}</span>
          </div>
          <hr />
          <div className="stat">
            <span className="stat-label"><b>Total Spaces</b></span>
            <span className="stat-value purple">
              ~{(activeResults.totalEstSpaces + activeResults.totalGreenPSpaces).toLocaleString()}
            </span>
          </div>
          <hr />
          <div className="stat">
            <span className="stat-label">Est. Population</span>
            <span className="stat-value">~{(activeResults.estPopulation || 0).toLocaleString()}</span>
          </div>
        </div>
      )}

      <div className="panel walk-panel">
        <div className="walk-panel-header">
          <span className="walk-icon">🚶</span>
          <h3>Walk Time Isochrone</h3>
        </div>
        <div className="walk-minutes-row">
          <label>TIME</label>
          <input
            type="number"
            value={minutes}
            min={1}
            max={60}
            step={1}
            onChange={e => {
              const val = parseInt(e.target.value) || 5;
              setMinutes(val);
              if (onWalkTimeChange) onWalkTimeChange(val);
            }}
          />
          <span>min</span>
        </div>
        <button
          className={`walk-btn walk-btn-place${placingMode ? ' active' : ''}`}
          onClick={handlePlaceClick}
        >
          {placingMode ? 'Cancel' : '📍 Place Point'}
        </button>
        {placingMode && (
          <div className="walk-hint">Click on the map to place a point</div>
        )}
        {hasPoints && (
          <>
            <div className="walk-points-list">
              {walkPoints.map(wp => {
                const total = wp.results
                  ? wp.results.totalEstSpaces + wp.results.totalGreenPSpaces
                  : 0;
                return (
                  <div
                    key={wp.id}
                    className="walk-point-item"
                    style={{
                      cursor: 'pointer', borderRadius: 6, padding: '6px 8px',
                      marginBottom: 3, background: '#f8fafc', border: 'none',
                    }}
                    onClick={() => showPointResults(wp.id)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                      <div style={{
                        width: 10, height: 10, borderRadius: '50%',
                        background: wp.color, flexShrink: 0,
                      }} />
                      <span style={{ fontWeight: 600, fontSize: 12, color: '#1a1a2e' }}>
                        {wp.minutes} min walk
                      </span>
                      <span style={{ fontSize: 11, color: '#64748b', marginLeft: 'auto' }}>
                        ~{total} spaces
                      </span>
                    </div>
                    <button
                      style={{
                        background: 'none', border: 'none', color: '#94a3b8',
                        cursor: 'pointer', fontSize: 16, padding: '0 0 0 8px', lineHeight: 1,
                      }}
                      onClick={ev => { ev.stopPropagation(); removeWalkPoint(wp.id); }}
                    >
                      &times;
                    </button>
                  </div>
                );
              })}
            </div>
            <hr className="walk-divider" />
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="walk-btn walk-btn-clear" onClick={clearAll}>
                Clear All
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
