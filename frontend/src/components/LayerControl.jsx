import React, { useState } from 'react';
import FsiControls from './FsiControls.jsx';

const STYLE_LABELS = {
  street: 'Streets',
  mono: 'Mono',
  satellite: 'Satellite',
  terrain: 'Terrain',
};

/**
 * LayerControl accepts:
 *   layers: array of { id, label, visible, swatchStyle?, swatchClass? }
 *   onToggle(id): called when a checkbox is clicked
 *   currentStyle: 'street' | 'mono' | 'satellite' | 'terrain'
 *   onStyleChange(key): called when a style button is clicked
 *
 * The component groups known layer IDs into sections automatically.
 * Unknown IDs are rendered in an "Other" catch-all group.
 */

const LAYER_DEFS = [
  // id, label, swatchClass, swatchStyle, section
  { id: 'parking',      label: 'Parking Lots', swatchClass: '',       swatchStyle: { background: 'rgba(239,68,68,0.45)' },                      section: 'Parking' },
  { id: 'greenp',       label: 'Green P',      swatchClass: 'circle', swatchStyle: { background: '#16a34a' },                                    section: 'Parking' },
  { id: 'impermeable',  label: 'Impermeable',  swatchClass: '',       swatchStyle: { background: '#888' },                                       section: 'Environment' },
  { id: 'permeable',    label: 'Permeable',    swatchClass: '',       swatchStyle: { background: '#22c55e' },                                    section: 'Environment' },
  { id: 'trees',        label: 'Trees',        swatchClass: 'circle', swatchStyle: { background: '#228b22' },                                    section: 'Environment' },
  { id: 'greenspaces',  label: 'Green Spaces', swatchClass: '',       swatchStyle: { background: 'rgba(34,197,94,0.4)', borderColor: '#22c55e' }, section: 'Environment' },
  { id: 'greenstreets', label: 'Green Streets',swatchClass: 'circle', swatchStyle: { background: '#059669' },                                    section: 'Environment' },
  { id: 'landcover',    label: 'Land Cover',   swatchClass: '',       swatchStyle: { background: 'linear-gradient(135deg,#228b22,#4a90d9)' },    section: 'Environment' },
  { id: 'sewer',        label: 'Sewer Inlets',        swatchClass: 'circle', swatchStyle: { background: '#0ea5e9', borderColor: '#0369a1' },             section: 'Water & Drainage' },
  { id: 'rain',         label: 'Rain Gauges',         swatchClass: 'circle', swatchStyle: { background: '#0ea5e9' },                                    section: 'Water & Drainage' },
  { id: 'flood',        label: 'Flood Reports',       swatchClass: '',       swatchStyle: { background: 'linear-gradient(135deg,#dbeafe,#1e3a8a)' },    section: 'Water & Drainage' },
  { id: 'fsi',          label: 'FSI',                 swatchClass: '',       swatchStyle: { background: 'linear-gradient(135deg,#ffffff,#0ea5e9)' },    section: 'Water & Drainage' },
  { id: 'contours',     label: 'Contours',     swatchClass: 'line',   swatchStyle: { background: '#b45309' },                                    section: 'Terrain' },
  { id: 'boundary',     label: 'Boundary',     swatchClass: '',       swatchStyle: { background: 'rgba(59,130,246,0.15)', borderColor: '#3b82f6' }, section: 'Other' },
  { id: 'population',   label: 'Population',   swatchClass: '',       swatchStyle: { background: 'linear-gradient(135deg,#fee5d9,#a50f15)' },    section: 'Other' },
];

const SECTIONS = ['Parking', 'Environment', 'Water & Drainage', 'Terrain', 'Other'];

/**
 * Normalise `layers` prop into a Map of id → visible.
 * Accepts both:
 *   - Array: [{ id, label, visible, ... }, ...]
 *   - Object: { parking: true, greenp: false, ... }
 */
function normaliseVisibility(layers) {
  if (Array.isArray(layers)) {
    return Object.fromEntries(layers.map(l => [l.id, !!l.visible]));
  }
  return layers || {};
}

export default function LayerControl({
  layers = [],
  onToggle,
  currentStyle,
  onStyleChange,
  fsiMin,
  fsiMax,
  onFsiRangeChange,
  fsiOpacity,
  onFsiOpacityChange,
  colorStops,
  onColorStopsChange,
}) {
  const [collapsed, setCollapsed] = useState(false);

  const visibility = normaliseVisibility(layers);

  // Build a label map from the layers prop (supports extra labels from caller)
  const labelOverrides = Array.isArray(layers)
    ? Object.fromEntries(layers.map(l => [l.id, l.label]))
    : {};

  // Group LAYER_DEFS by section, only include layers present in the visibility map
  // (or always show the full set if it's the canonical object format)
  const isArray = Array.isArray(layers);
  const visibleIds = isArray ? new Set(layers.map(l => l.id)) : null;

  const grouped = {};
  SECTIONS.forEach(s => { grouped[s] = []; });

  LAYER_DEFS.forEach(def => {
    if (isArray && !visibleIds.has(def.id)) return; // only render layers passed in
    grouped[def.section] = grouped[def.section] || [];
    grouped[def.section].push({ ...def, label: labelOverrides[def.id] || def.label });
  });

  return (
    <>
      <button
        className="layer-menu-fab"
        style={{ opacity: collapsed ? 1 : 0, pointerEvents: collapsed ? 'auto' : 'none' }}
        onClick={() => setCollapsed(false)}
        aria-label="Open layers panel"
      >
        &#x2630;
      </button>

      <div className={`panel layer-control${collapsed ? ' collapsed' : ''}`}>
        <div className="layer-control-header">
          <span>&#x1F5FA; Layers</span>
          <button
            className="layer-close-btn"
            onClick={() => setCollapsed(true)}
            title="Close"
          >
            &times;
          </button>
        </div>

        <div className="layer-body">
          {onStyleChange && (
            <>
              <h3>Base Map</h3>
              <div className="style-grid">
                {Object.entries(STYLE_LABELS).map(([key, label]) => (
                  <button
                    key={key}
                    className={`style-btn${currentStyle === key ? ' active' : ''}`}
                    onClick={() => onStyleChange(key)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </>
          )}

          {SECTIONS.map(section => {
            const defs = grouped[section];
            if (!defs || defs.length === 0) return null;
            return (
              <React.Fragment key={section}>
                <h3>{section}</h3>
                <div className="layer-group">
                  {defs.map(def => (
                    <React.Fragment key={def.id}>
                      <label aria-label={def.label}>
                        <input
                          type="checkbox"
                          checked={!!visibility[def.id]}
                          onChange={() => onToggle && onToggle(def.id)}
                        />
                        <div
                          className={`layer-swatch${def.swatchClass ? ' ' + def.swatchClass : ''}`}
                          style={def.swatchStyle}
                        />
                        <span>{def.label}</span>
                      </label>
                      {def.id === 'fsi' && (
                        <FsiControls
                          visible={!!visibility['fsi']}
                          min={fsiMin}
                          max={fsiMax}
                          onRangeChange={onFsiRangeChange}
                          opacity={fsiOpacity}
                          onOpacityChange={onFsiOpacityChange}
                          colorStops={colorStops}
                          onColorStopsChange={onColorStopsChange}
                        />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </>
  );
}
