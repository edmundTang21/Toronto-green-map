import React from 'react';

const COLOR_SCHEMES = [
  {
    id: 'blue',
    label: 'Blue',
    gradient: 'linear-gradient(to right, #ffffff, #0ea5e9)',
  },
  {
    id: 'red',
    label: 'Red',
    gradient: 'linear-gradient(to right, #ffffff, #ef4444)',
  },
  {
    id: 'yellow-red',
    label: 'Yellow–Red',
    gradient: 'linear-gradient(to right, #fef08a, #dc2626)',
  },
  {
    id: 'green-red',
    label: 'Green–Red',
    gradient: 'linear-gradient(to right, #22c55e, #ef4444)',
  },
];

export default function FsiControls({
  visible,
  min,
  max,
  onRangeChange,
  opacity,
  onOpacityChange,
  colorScheme,
  onColorSchemeChange,
}) {
  if (!visible) return null;

  const handleMinChange = (e) => {
    const v = Math.min(Number(e.target.value), max - 1);
    onRangeChange(v, max);
  };

  const handleMaxChange = (e) => {
    const v = Math.max(Number(e.target.value), min + 1);
    onRangeChange(min, v);
  };

  return (
    <div className="fsi-controls">
      {/* Range */}
      <div className="fsi-row">
        <span className="fsi-label">Range</span>
        <div className="fsi-range-inputs">
          <input
            type="number"
            className="fsi-number"
            min={0}
            max={99}
            value={min}
            onChange={handleMinChange}
          />
          <span className="fsi-range-dash">–</span>
          <input
            type="number"
            className="fsi-number"
            min={1}
            max={100}
            value={max}
            onChange={handleMaxChange}
          />
        </div>
      </div>

      {/* Opacity */}
      <div className="fsi-row">
        <span className="fsi-label">Opacity</span>
        <div className="fsi-opacity-row">
          <input
            type="range"
            className="fsi-slider"
            min={0}
            max={1}
            step={0.05}
            value={opacity}
            onChange={(e) => onOpacityChange(Number(e.target.value))}
          />
          <span className="fsi-opacity-pct">{Math.round(opacity * 100)}%</span>
        </div>
      </div>

      {/* Color scheme */}
      <div className="fsi-row fsi-color-row">
        <span className="fsi-label">Color</span>
        <div className="fsi-swatches">
          {COLOR_SCHEMES.map((s) => (
            <button
              key={s.id}
              title={s.label}
              className={`fsi-swatch${colorScheme === s.id ? ' active' : ''}`}
              style={{ background: s.gradient }}
              onClick={() => onColorSchemeChange(s.id)}
              aria-label={s.label}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
