/**
 * useMapLayers — sets up all Mapbox sources & layers, popups, and tree tile loading.
 * Called once after map load and again after style.load (basemap switch).
 */

const API_URL = import.meta.env.VITE_API_URL || '';
const V = '20260413';


// Tree tile grid size in degrees
const TREE_TILE_SIZE = 0.01;

export function setupMapLayers(map, { setParkingStats, setViewportTreeCount }, treeState) {
  // ===== SOURCES =====
  const dataSources = [
    ['boundary',    `${API_URL}/api/data/boundary?v=${V}`],
    ['parking',     `${API_URL}/api/data/parking?v=${V}`],
    ['greenp',      `${API_URL}/api/data/greenp?v=${V}`],
    ['population',  `${API_URL}/api/data/population?v=${V}`],
    ['rain',        `${API_URL}/api/data/rain?v=${V}`],
    ['impermeable', `${API_URL}/api/data/impermeable?v=${V}`],
    ['contours',    `${API_URL}/api/data/contours?v=${V}`],
    ['flood',       `${API_URL}/api/data/flood?v=${V}`],
    ['greenstreets',`${API_URL}/api/data/greenstreets?v=${V}`],
    ['greenspaces', `${API_URL}/api/data/greenspaces?v=${V}`],
    ['landcover',   `${API_URL}/api/data/landcover?v=${V}`],
    ['sewer',       `${API_URL}/api/data/sewer?v=${V}`],
  ];

  dataSources.forEach(([id, url]) => {
    const opts = { type: 'geojson', data: url };
    if (id === 'impermeable') opts.tolerance = 0;
    if (!map.getSource(id)) map.addSource(id, opts);
  });

  // Tree tiles — starts empty, filled on demand
  if (!map.getSource('trees')) {
    map.addSource('trees', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
  }

  // FSI GeoJSON source
  if (!map.getSource('fsi')) {
    map.addSource('fsi', {
      type: 'geojson',
      data: `${API_URL}/api/data/fsi-index`,
    });
  }

  // ===== LAYERS (bottom → top) =====

  // FSI fill layer (rendered beneath vector overlays)
  addLayer(map, {
    id: 'fsi-layer',
    type: 'fill',
    source: 'fsi',
    layout: { visibility: 'none' },
    paint: {
      'fill-opacity': 0.7,
      'fill-color': ['interpolate', ['linear'], ['get', 'val'], 0, '#ffffff', 100, '#0ea5e9'],
    },
  });
  if (map.getLayer('fsi-layer')) {
    map.setFilter('fsi-layer', ['all', ['>=', ['get', 'val'], 0], ['<=', ['get', 'val'], 100]]);
  }

  // Population choropleth
  addLayer(map, {
    id: 'population-fill', source: 'population', type: 'fill',
    paint: {
      'fill-color': ['interpolate', ['linear'], ['get', 'pop_density'],
        0, '#fee5d9', 3000, '#fcbba1', 5000, '#fc9272', 7000, '#fb6a4a',
        10000, '#ef3b2c', 15000, '#cb181d', 20000, '#a50f15'],
      'fill-opacity': 0.5,
    },
    layout: { visibility: 'none' },
  });
  addLayer(map, {
    id: 'population-line', source: 'population', type: 'line',
    paint: { 'line-color': '#999', 'line-width': 1 },
    layout: { visibility: 'none' },
  });

  // Flood reporting
  addLayer(map, {
    id: 'flood-fill', source: 'flood', type: 'fill',
    paint: {
      'fill-color': ['interpolate', ['linear'], ['get', 'total_floods'],
        0, '#dbeafe', 10, '#93c5fd', 25, '#60a5fa', 50, '#3b82f6',
        100, '#2563eb', 200, '#1e40af', 400, '#1e3a8a'],
      'fill-opacity': 0.45,
    },
    layout: { visibility: 'none' },
  });
  addLayer(map, {
    id: 'flood-line', source: 'flood', type: 'line',
    paint: { 'line-color': '#1e40af', 'line-width': 1 },
    layout: { visibility: 'none' },
  });

  // Green spaces
  addLayer(map, {
    id: 'greenspaces-fill', source: 'greenspaces', type: 'fill',
    paint: { 'fill-color': '#22c55e', 'fill-opacity': 0.35 },
    layout: { visibility: 'none' },
  });
  addLayer(map, {
    id: 'greenspaces-line', source: 'greenspaces', type: 'line',
    paint: { 'line-color': '#22c55e', 'line-width': 1 },
    layout: { visibility: 'none' },
  });

  // Land cover
  addLayer(map, {
    id: 'landcover-fill', source: 'landcover', type: 'fill',
    paint: {
      'fill-color': ['match', ['get', 'Desc'],
        'tree', '#228b22', 'grass/shrub', '#90ee90', 'bare earth', '#d2b48c',
        'water', '#4a90d9', 'buildings', '#888', 'roads', '#555',
        'other paved', '#999', 'agriculture', '#daa520', '#ccc'],
      'fill-opacity': 0.5,
    },
    layout: { visibility: 'none' },
  });

  // Sewer inlets
  addLayer(map, {
    id: 'sewer-circles', source: 'sewer', type: 'circle',
    paint: {
      'circle-radius': 3, 'circle-color': '#0ea5e9', 'circle-opacity': 0.7,
      'circle-stroke-width': 1, 'circle-stroke-color': '#0369a1',
    },
    layout: { visibility: 'none' },
  });

  // Impermeable surface
  addLayer(map, {
    id: 'impermeable-fill', source: 'impermeable', type: 'fill',
    filter: ['==', ['get', 'type'], 'impermeable'],
    paint: { 'fill-color': '#888888', 'fill-opacity': 0.6 },
    layout: { visibility: 'none' },
  });

  // Permeable surface
  addLayer(map, {
    id: 'permeable-fill', source: 'impermeable', type: 'fill',
    filter: ['==', ['get', 'type'], 'permeable'],
    paint: { 'fill-color': '#22c55e', 'fill-opacity': 0.5 },
    layout: { visibility: 'none' },
  });

  // Boundary
  addLayer(map, {
    id: 'boundary-line', source: 'boundary', type: 'line',
    paint: { 'line-color': '#3b82f6', 'line-width': 1.5, 'line-dasharray': [3, 2] },
  });
  addLayer(map, {
    id: 'boundary-fill', source: 'boundary', type: 'fill',
    paint: { 'fill-color': '#3b82f6', 'fill-opacity': 0.06 },
  });

  // Parking lots
  addLayer(map, {
    id: 'parking-fill', source: 'parking', type: 'fill',
    paint: { 'fill-color': '#ef4444', 'fill-opacity': 0.4 },
  });
  addLayer(map, {
    id: 'parking-line', source: 'parking', type: 'line',
    paint: { 'line-color': '#ef4444', 'line-width': 1.5 },
  });
  addLayer(map, {
    id: 'parking-labels', source: 'parking', type: 'symbol',
    layout: {
      'text-field': ['concat', '~', ['to-string', ['get', 'estimated_spaces']]],
      'text-size': 11, 'text-font': ['DIN Pro Bold', 'Arial Unicode MS Bold'],
      'text-allow-overlap': false,
    },
    paint: { 'text-color': '#dc2626', 'text-halo-color': '#fff', 'text-halo-width': 1.5 },
  });

  // Contours
  addLayer(map, {
    id: 'contours-line', source: 'contours', type: 'line',
    paint: {
      'line-color': ['interpolate', ['linear'], ['get', 'CONTOUR'],
        70, '#d4a373', 130, '#b45309', 189, '#78350f'],
      'line-width': ['case', ['==', ['%', ['get', 'CONTOUR'], 10], 0], 2.5, 1],
      'line-opacity': ['case', ['==', ['%', ['get', 'CONTOUR'], 10], 0], 0.9, 0.5],
    },
    layout: { visibility: 'none' },
  });
  addLayer(map, {
    id: 'contours-labels', source: 'contours', type: 'symbol',
    filter: ['==', ['%', ['get', 'CONTOUR'], 10], 0],
    layout: {
      'symbol-placement': 'line',
      'text-field': ['concat', ['to-string', ['get', 'CONTOUR']], 'm'],
      'text-size': 12, 'text-font': ['DIN Pro Bold', 'Arial Unicode MS Bold'],
      'text-max-angle': 30, visibility: 'none',
    },
    paint: { 'text-color': '#92400e', 'text-halo-color': '#fff', 'text-halo-width': 1.5 },
  });

  // Green P
  addLayer(map, {
    id: 'greenp-circles', source: 'greenp', type: 'circle',
    paint: {
      'circle-radius': 10, 'circle-color': '#16a34a',
      'circle-stroke-color': '#fff', 'circle-stroke-width': 2,
    },
  });
  addLayer(map, {
    id: 'greenp-labels', source: 'greenp', type: 'symbol',
    layout: {
      'text-field': ['get', 'capacity'],
      'text-size': 11, 'text-font': ['DIN Pro Bold', 'Arial Unicode MS Bold'],
      'text-allow-overlap': true,
    },
    paint: { 'text-color': '#fff' },
  });

  // Rain gauges
  addLayer(map, {
    id: 'rain-circles', source: 'rain', type: 'circle',
    paint: {
      'circle-radius': ['interpolate', ['linear'], ['get', 'Volume'], 0, 6, 140, 14],
      'circle-color': '#0ea5e9', 'circle-stroke-color': '#fff', 'circle-stroke-width': 2,
    },
    layout: { visibility: 'none' },
  });

  // Green streets
  addLayer(map, {
    id: 'greenstreets-circles', source: 'greenstreets', type: 'circle',
    paint: {
      'circle-radius': 8, 'circle-color': '#059669',
      'circle-stroke-color': '#fff', 'circle-stroke-width': 2,
    },
    layout: { visibility: 'none' },
  });

  // Trees
  addLayer(map, {
    id: 'trees-circles', source: 'trees', type: 'circle',
    minzoom: 13,
    paint: {
      'circle-radius': ['interpolate', ['linear'], ['get', 'd'],
        0, 3, 10, 3, 25, 5, 50, 7, 80, 9, 120, 12],
      'circle-color': '#228b22',
      'circle-stroke-color': '#fff', 'circle-stroke-width': 0.5,
      'circle-opacity': 0.8,
    },
    layout: { visibility: 'none' },
  });

  // ===== POPUPS =====
  setupPopups(map, treeState);

  // ===== TREE TILE LOADING =====
  setupTreeTileLoader(map, treeState, setViewportTreeCount);

  // ===== STATS =====
  fetch(`${API_URL}/api/data/parking?v=${V}`)
    .then(r => r.json())
    .then(data => {
      const lotCount = data.features.length;
      let estSpaces = 0;
      data.features.forEach(f => { estSpaces += f.properties.estimated_spaces || 0; });
      setParkingStats(prev => ({ ...prev, lotCount, estSpaces: estSpaces.toLocaleString() }));
    })
    .catch(() => {});

  fetch(`${API_URL}/api/data/greenp?v=${V}`)
    .then(r => r.json())
    .then(data => {
      const greenpCount = data.features.length;
      let greenpSpaces = 0;
      data.features.forEach(f => { greenpSpaces += parseInt(f.properties.capacity) || 0; });
      setParkingStats(prev => ({ ...prev, greenpCount, greenpSpaces }));
    })
    .catch(() => {});
}

function addLayer(map, spec) {
  if (!map.getLayer(spec.id)) map.addLayer(spec);
}

function setupPopups(map, treeState) {
  const mapboxgl = window.mapboxgl || map._mapboxgl;
  // We import mapboxgl in Map.jsx and attach to window for popup use in this module
  const mkPopup = () => new window.__mapboxgl.Popup({ closeButton: false, closeOnClick: false });
  const popup = mkPopup();

  // Parking hover
  map.on('mouseenter', 'parking-fill', (e) => {
    const p = e.features[0].properties;
    popup.setLngLat(e.lngLat)
      .setHTML(`<b>Lot #${p.id || '-'}</b><br>~${p.estimated_spaces || 0} spaces<br>${Math.round(p.area_m2 || 0).toLocaleString()} m&sup2;`)
      .addTo(map);
    map.setPaintProperty('parking-fill', 'fill-opacity', ['case',
      ['==', ['get', 'id'], p.id], 0.7, 0.4]);
  });
  map.on('mouseleave', 'parking-fill', () => {
    popup.remove();
    map.setPaintProperty('parking-fill', 'fill-opacity', 0.4);
  });

  // Green P click
  map.on('click', 'greenp-circles', (e) => {
    const p = e.features[0].properties;
    new window.__mapboxgl.Popup().setLngLat(e.lngLat).setHTML(
      `<b style="color:#16a34a">Green P</b><br><b>${p.address}</b><br>
       Type: ${p.carpark_type_str}<br>Capacity: ${p.capacity}<br>
       Rate: ${p.rate_half_hour ? '$' + p.rate_half_hour.trim() + '/30min' : '-'}`
    ).addTo(map);
  });

  // Population hover
  map.on('mouseenter', 'population-fill', (e) => {
    const p = e.features[0].properties;
    popup.setLngLat(e.lngLat).setHTML(
      `<b>${p.area_name || '-'}</b><br>Pop: ${(p.population || 0).toLocaleString()}<br>Density: ${(p.pop_density || 0).toLocaleString()}/km&sup2;`
    ).addTo(map);
  });
  map.on('mouseleave', 'population-fill', () => popup.remove());

  // Rain gauge click
  map.on('click', 'rain-circles', (e) => {
    const p = e.features[0].properties;
    new window.__mapboxgl.Popup().setLngLat(e.lngLat).setHTML(
      `<b>${p.name || '-'}</b><br>${p.location || ''}<br>Volume: ${p.volume || '-'} mm<br>Return: ${p.return_period || '-'}`
    ).addTo(map);
  });

  // Contour hover
  map.on('mouseenter', 'contours-line', (e) => {
    popup.setLngLat(e.lngLat).setHTML(`${e.features[0].properties.elevation || '-'}m`).addTo(map);
  });
  map.on('mouseleave', 'contours-line', () => popup.remove());

  // Flood hover
  map.on('mouseenter', 'flood-fill', (e) => {
    const p = e.features[0].properties;
    popup.setLngLat(e.lngLat).setHTML(
      `<b>${p.area_name || '-'}</b><br>Total: ${p.total_floods || 0}<br>` +
      `2013: ${p.y2013 || 0} | 2014: ${p.y2014 || 0}<br>` +
      `2015: ${p.y2015 || 0} | 2016: ${p.y2016 || 0} | 2017: ${p.y2017 || 0}`
    ).addTo(map);
  });
  map.on('mouseleave', 'flood-fill', () => popup.remove());

  // Green streets click
  map.on('click', 'greenstreets-circles', (e) => {
    const p = e.features[0].properties;
    new window.__mapboxgl.Popup().setLngLat(e.lngLat).setHTML(
      `<b>${p.common_name || '-'}</b><br>Type: ${p.project_type || '-'}<br>
       Infrastructure: ${p.infrastructure_type || '-'}<br>${p.description || ''}`
    ).addTo(map);
  });

  // Green spaces hover
  map.on('mouseenter', 'greenspaces-fill', (e) => {
    const p = e.features[0].properties;
    popup.setLngLat(e.lngLat).setHTML(`<b>${p.area_name || '-'}</b><br>${p.area_class || '-'}`).addTo(map);
  });
  map.on('mouseleave', 'greenspaces-fill', () => popup.remove());

  // Trees click
  map.on('click', 'trees-circles', (e) => {
    const p = e.features[0].properties;
    const zh = (treeState.namesZh || {})[p.c] || '';
    const zhLine = zh ? `<br><b style="color:#228b22">${zh}</b>` : '';
    new window.__mapboxgl.Popup().setLngLat(e.lngLat).setHTML(
      `<b>${p.c}</b>${zhLine}<br><i>${p.b}</i><br>DBH: ${p.d} cm<br>${p.a}`
    ).addTo(map);
  });

  // Land cover hover
  map.on('mouseenter', 'landcover-fill', (e) => {
    popup.setLngLat(e.lngLat).setHTML(`<b>${e.features[0].properties.description || 'Unknown'}</b>`).addTo(map);
  });
  map.on('mouseleave', 'landcover-fill', () => popup.remove());

  // Sewer inlets hover
  map.on('mouseenter', 'sewer-circles', (e) => {
    const p = e.features[0].properties;
    const year = p.install_date ? p.install_date.slice(0, 4) : 'Unknown';
    popup.setLngLat(e.lngLat).setHTML(
      `<b>Sewer Inlet</b><br>ID: ${p.asset_id || '-'}<br>Installed: ${year}`
    ).addTo(map);
  });
  map.on('mouseleave', 'sewer-circles', () => popup.remove());

  // Impermeable / Permeable hover
  ['impermeable-fill', 'permeable-fill'].forEach(layerId => {
    map.on('mouseenter', layerId, (e) => {
      const type = e.features[0].properties.type;
      popup.setLngLat(e.lngLat).setHTML(
        `<b>${type.charAt(0).toUpperCase() + type.slice(1)}</b>`
      ).addTo(map);
    });
    map.on('mouseleave', layerId, () => popup.remove());
  });

  // FSI hover — show val (crosshair cursor, dedicated popup)
  const fsiPopup = new window.__mapboxgl.Popup({ closeButton: false, closeOnClick: false });
  map.on('mouseenter', 'fsi-layer', (e) => {
    if (!e.features || !e.features[0]) return;
    map.getCanvas().style.cursor = 'crosshair';
    const val = e.features[0].properties.val;
    fsiPopup.setLngLat(e.lngLat)
      .setHTML(`<b>FSI</b><br>Value: ${val !== undefined ? Number(val).toFixed(2) : '-'}`)
      .addTo(map);
  });
  map.on('mousemove', 'fsi-layer', (e) => {
    if (!e.features || !e.features[0]) return;
    const val = e.features[0].properties.val;
    fsiPopup.setLngLat(e.lngLat)
      .setHTML(`<b>FSI</b><br>Value: ${val !== undefined ? Number(val).toFixed(2) : '-'}`);
  });
  map.on('mouseleave', 'fsi-layer', () => {
    map.getCanvas().style.cursor = '';
    fsiPopup.remove();
  });

  // Cursor changes (fsi-layer intentionally excluded — it uses crosshair above)
  [
    'parking-fill', 'greenp-circles', 'rain-circles',
    'greenstreets-circles', 'trees-circles', 'impermeable-fill', 'permeable-fill',
  ].forEach(id => {
    map.on('mouseenter', id, () => { map.getCanvas().style.cursor = 'pointer'; });
    map.on('mouseleave', id, () => { map.getCanvas().style.cursor = ''; });
  });
}

function setupTreeTileLoader(map, treeState, setViewportTreeCount) {
  function loadTreeTiles() {
    if (!treeState.enabled || map.getZoom() < 13) {
      if (map.getSource('trees')) {
        map.getSource('trees').setData({ type: 'FeatureCollection', features: [] });
      }
      return;
    }
    const bounds = map.getBounds();
    const keys = [];
    for (
      let tx = Math.floor(bounds.getWest() / TREE_TILE_SIZE);
      tx <= Math.floor(bounds.getEast() / TREE_TILE_SIZE);
      tx++
    ) {
      for (
        let ty = Math.floor(bounds.getSouth() / TREE_TILE_SIZE);
        ty <= Math.floor(bounds.getNorth() / TREE_TILE_SIZE);
        ty++
      ) {
        keys.push(`${tx}_${ty}`);
      }
    }

    const allFeatures = [];
    let pending = 0;

    keys.forEach(key => {
      const cached = treeState.loadedTiles[key];
      if (cached && cached.features) {
        allFeatures.push(...cached.features);
      } else if (cached !== 'loading') {
        treeState.loadedTiles[key] = 'loading';
        pending++;
        fetch(`${API_URL}/api/tiles/trees/${key}`)
          .then(r => r.ok ? r.json() : { features: [] })
          .then(data => {
            treeState.loadedTiles[key] = data;
            pending--;
            if (pending === 0) loadTreeTiles();
          })
          .catch(() => {
            treeState.loadedTiles[key] = { features: [] };
            pending--;
          });
      }
    });

    if (pending === 0 && map.getSource('trees')) {
      map.getSource('trees').setData({ type: 'FeatureCollection', features: allFeatures });
      setTimeout(() => {
        const features = map.queryRenderedFeatures({ layers: ['trees-circles'] });
        setViewportTreeCount(features.length.toLocaleString());
      }, 100);
    }
  }

  // Expose loader so Map component can call it when trees toggled
  treeState.loadTreeTiles = loadTreeTiles;

  map.on('moveend', () => {
    if (treeState.enabled) loadTreeTiles();
    const features = map.queryRenderedFeatures({ layers: ['trees-circles'] });
    if (treeState.enabled && map.getZoom() >= 13) {
      setViewportTreeCount(features.length.toLocaleString());
    } else {
      setViewportTreeCount('-');
    }
  });
}

/**
 * Apply React layer state to Mapbox visibility after style change or state update.
 */
export function applyLayerVisibility(map, layers) {
  const mapping = {
    parking:     ['parking-fill', 'parking-line', 'parking-labels'],
    greenp:      ['greenp-circles', 'greenp-labels'],
    boundary:    ['boundary-line', 'boundary-fill'],
    population:  ['population-fill', 'population-line'],
    rain:        ['rain-circles'],
    impermeable: ['impermeable-fill'],
    permeable:   ['permeable-fill'],
    contours:    ['contours-line', 'contours-labels'],
    flood:       ['flood-fill', 'flood-line'],
    greenstreets:['greenstreets-circles'],
    greenspaces: ['greenspaces-fill', 'greenspaces-line'],
    landcover:   ['landcover-fill'],
    sewer:       ['sewer-circles'],
    trees:       ['trees-circles'],
    fsi:         ['fsi-layer'],
  };

  Object.entries(mapping).forEach(([key, ids]) => {
    const vis = layers[key] ? 'visible' : 'none';
    ids.forEach(id => {
      if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', vis);
    });
  });
}

/**
 * Set FSI fill opacity (0–1).
 */
export function setFsiOpacity(map, value) {
  if (map && map.getLayer('fsi-layer')) {
    map.setPaintProperty('fsi-layer', 'fill-opacity', value);
  }
}

/**
 * Set FSI value range filter [min, max].
 */
export function setFsiRange(map, min, max) {
  if (map && map.getLayer('fsi-layer')) {
    map.setFilter('fsi-layer', ['all', ['>=', ['get', 'val'], min], ['<=', ['get', 'val'], max]]);
  }
}

/**
 * Set boundary line-width (in pixels).
 */
export function setBoundaryWidth(map, width) {
  if (!map.getLayer('boundary-line')) return;
  map.setPaintProperty('boundary-line', 'line-width', width);
}

/**
 * Set contour line-color (flat hex string).
 */
export const CONTOUR_COLOR_DEFAULT = '#b45309';

export function setContourColor(map, color) {
  if (!map.getLayer('contours-line')) return;
  map.setPaintProperty('contours-line', 'line-color', color);
}

/**
 * Set FSI fill color via multi-stop array [{ value, color }, ...].
 * Mapbox clamps at the last stop, so e.g. stop at 80=red means everything 80+ is solid red.
 */
export function setFsiColorStops(map, stops) {
  if (!map.getLayer('fsi-layer')) return;
  const sorted = [...stops].sort((a, b) => a.value - b.value);
  // Build: ['interpolate', ['linear'], ['get', 'val'], v1, c1, v2, c2, ...]
  const expr = ['interpolate', ['linear'], ['get', 'val']];
  sorted.forEach(s => { expr.push(s.value, s.color); });
  map.setPaintProperty('fsi-layer', 'fill-color', expr);
}
