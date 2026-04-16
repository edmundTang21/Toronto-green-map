import React from 'react';

export default function FsiControls({
  visible,
  min,
  max,
  onRangeChange,
  opacity,
  onOpacityChange,
  colorLow = '#ffffff',
  onColorLowChange,
  colorHigh = '#0ea5e9',
  onColorHighChange,
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

      {/* Color pickers */}
      <div className="fsi-row fsi-color-row">
        <span className="fsi-label">Color</span>
        <div className="fsi-color-pickers">
          <input
            type="color"
            value={colorLow}
            onChange={(e) => onColorLowChange(e.target.value)}
            title="Low value color"
          />
          <div
            className="fsi-gradient-preview"
            style={{ background: `linear-gradient(to right, ${colorLow}, ${colorHigh})` }}
          />
          <input
            type="color"
            value={colorHigh}
            onChange={(e) => onColorHighChange(e.target.value)}
            title="High value color"
          />
        </div>
      </div>
    </div>
  );
}
