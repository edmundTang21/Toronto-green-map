import React, { useRef, useState, useCallback } from 'react';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import Map from './components/Map.jsx';
import LayerControl from './components/LayerControl.jsx';
import Legend from './components/Legend.jsx';
import InfoPanel from './components/InfoPanel.jsx';
import WalkPanel from './components/WalkPanel.jsx';

export default function App() {
  const mapRef = useRef(null);

  // Layer visibility state — keys align with LayerControl's LAYER_DEFS ids
  const [layers, setLayers] = useState({
    parking: true,
    greenp: true,
    boundary: true,
    population: false,
    rain: false,
    impermeable: false,
    permeable: false,
    contours: false,
    flood: false,
    greenstreets: false,
    greenspaces: false,
    landcover: false,
    sewer: false,
    trees: false,
  });

  // Basemap style
  const [currentStyle, setCurrentStyle] = useState('street');

  // Info panel stats
  const [parkingStats, setParkingStats] = useState({
    lotCount: '-',
    estSpaces: '-',
    greenpCount: '-',
    greenpSpaces: '-',
  });

  // Viewport tree count
  const [viewportTreeCount, setViewportTreeCount] = useState('-');

  const toggleLayer = useCallback((id) => {
    setLayers(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  return (
    <>
      <Header />
      <div className="map-wrapper">
        <Map
          mapRef={mapRef}
          layers={layers}
          currentStyle={currentStyle}
          setParkingStats={setParkingStats}
          setViewportTreeCount={setViewportTreeCount}
        />

        {/* Viewport tree count badge */}
        <div
          className="panel"
          style={{ bottom: 12, right: 12, padding: '10px 14px', fontSize: 12 }}
        >
          <span style={{ color: '#228b22', fontWeight: 700 }}>{viewportTreeCount}</span> trees in view
        </div>

        <InfoPanel stats={parkingStats} />

        <LayerControl
          layers={layers}
          onToggle={toggleLayer}
          currentStyle={currentStyle}
          onStyleChange={setCurrentStyle}
        />

        <WalkPanel mapRef={mapRef} />

        <Legend />
      </div>
      <Footer />
    </>
  );
}
