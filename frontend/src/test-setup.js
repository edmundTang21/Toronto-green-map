// Run with: npm test
// CI: runs automatically via GitHub Actions on PR

import '@testing-library/jest-dom';

// ---------------------------------------------------------------------------
// Mock mapbox-gl
// Mapbox GL JS requires a WebGL context that jsdom cannot provide.
// All tests that import components using mapbox-gl will get this stub instead.
// ---------------------------------------------------------------------------

const mapboxMock = {
  Map: class {
    constructor() {}
    on() { return this; }
    off() { return this; }
    remove() {}
    addControl() {}
    removeControl() {}
    setStyle() {}
    setCenter() {}
    setZoom() {}
    getZoom() { return 12; }
    getCenter() { return { lng: -79.42, lat: 43.64 }; }
    addSource() {}
    removeSource() {}
    getSource() { return null; }
    addLayer() {}
    removeLayer() {}
    getLayer() { return null; }
    setPaintProperty() {}
    setLayoutProperty() {}
    fitBounds() {}
    flyTo() {}
    isStyleLoaded() { return true; }
    loaded() { return true; }
  },
  NavigationControl: class {},
  GeolocateControl: class {},
  Marker: class {
    constructor() { this._lngLat = null; }
    setLngLat(ll) { this._lngLat = ll; return this; }
    addTo() { return this; }
    remove() {}
    getLngLat() { return this._lngLat; }
  },
  Popup: class {
    setLngLat() { return this; }
    setHTML() { return this; }
    addTo() { return this; }
    remove() {}
  },
  LngLatBounds: class {
    constructor() {}
    extend() { return this; }
  },
  accessToken: '',
};

vi.mock('mapbox-gl', () => ({ default: mapboxMock, ...mapboxMock }));

// Silence mapbox-gl worker errors in jsdom
global.URL.createObjectURL = vi.fn(() => 'blob:mock');
