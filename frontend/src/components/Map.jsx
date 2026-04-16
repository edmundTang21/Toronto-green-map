import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { setupMapLayers, applyLayerVisibility } from '../hooks/useMapLayers.js';

const MAPBOX_TOKEN =
  import.meta.env.VITE_MAPBOX_TOKEN ||
  import.meta.env.VITE_MAPBOX_TOKEN;

const API_URL = import.meta.env.VITE_API_URL || '';

const STYLES = {
  street:    'mapbox://styles/mapbox/streets-v12',
  mono:      'mapbox://styles/mapbox/light-v11',
  satellite: 'mapbox://styles/mapbox/satellite-streets-v12',
  terrain:   'mapbox://styles/mapbox/outdoors-v12',
};

mapboxgl.accessToken = MAPBOX_TOKEN;
// Expose to useMapLayers for popup construction
window.__mapboxgl = mapboxgl;

export default function Map({
  mapRef,
  layers,
  currentStyle,
  setParkingStats,
  setViewportTreeCount,
  setWalkResults,
  walkResults,
}) {
  const containerRef = useRef(null);
  const styleRef = useRef(currentStyle);

  // Shared mutable state for tree tile loading (not React state — avoids re-render loops)
  const treeStateRef = useRef({
    enabled: layers.trees,
    loadedTiles: {},
    namesZh: {},
    loadTreeTiles: null,
  });

  // Load Chinese tree names once
  useEffect(() => {
    fetch(`${API_URL}/api/data/trees-names-zh`)
      .then(r => r.json())
      .then(d => { treeStateRef.current.namesZh = d; })
      .catch(() => {});
  }, []);

  // Mount map once
  useEffect(() => {
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: STYLES[currentStyle],
      center: [-79.4189, 43.6386],
      zoom: 14,
    });
    map.addControl(new mapboxgl.NavigationControl(), 'top-left');
    mapRef.current = map;

    map.on('load', () => {
      setupMapLayers(map, { setParkingStats, setViewportTreeCount }, treeStateRef.current);
      applyLayerVisibility(map, layers);
    });

    map.on('style.load', () => {
      setupMapLayers(map, { setParkingStats, setViewportTreeCount }, treeStateRef.current);
      applyLayerVisibility(map, layers);
    });

    return () => map.remove();
  }, []); // intentional empty deps: run once on mount

  // React to layer visibility changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    applyLayerVisibility(map, layers);

    // Special handling: trees need tile loading
    const treeState = treeStateRef.current;
    if (layers.trees !== treeState.enabled) {
      treeState.enabled = layers.trees;
      if (layers.trees) {
        if (map.getZoom() < 13) {
          alert('Zoom in to level 13 or closer to see trees');
        }
        if (treeState.loadTreeTiles) treeState.loadTreeTiles();
      } else {
        if (map.getSource('trees')) {
          map.getSource('trees').setData({ type: 'FeatureCollection', features: [] });
        }
        setViewportTreeCount('-');
      }
    }
  }, [layers, mapRef, setViewportTreeCount]);

  // React to basemap style changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (currentStyle === styleRef.current) return;
    styleRef.current = currentStyle;
    map.setStyle(STYLES[currentStyle]);
    // style.load event will re-run setupMapLayers
  }, [currentStyle, mapRef]);

  return (
    <div
      id="map"
      ref={containerRef}
      style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
    />
  );
}
