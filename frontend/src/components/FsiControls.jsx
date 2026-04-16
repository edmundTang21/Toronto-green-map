import React from 'react';

function computeGradient(stops) {
  const sorted = [...stops].sort((a, b) => a.value - b.value);
  const min = sorted[0].value;
  const max = sorted[sorted.length - 1].value;
  const range = max - min || 1;
  const parts = sorted.map(s => `${s.color} ${((s.value - min) / range * 100).toFixed(1)}%`);
  return `linear-gradient(to right, ${parts.join(', ')})`;
}

export default function FsiControls({
  visible,
  min,
  max,
  onRangeChange,
  opacity,
  onOpacityChange,
  colorStops = [{ value: 0, color: '#ffffff' }, { value: 100, color: '#0ea5e9' }],
  onColorStopsChange,
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

  // Work with a stable sorted copy; each row knows its index within that sorted array
  const sorted = [...colorStops].sort((a, b) => a.value - b.value);

  const handleValueChange = (sortedIdx, newValue) => {
    const updated = sorted.map((s, i) => i === sortedIdx ? { ...s, value: newValue } : s);
    onColorStopsChange(updated);
  };

  const handleColorChange = (sortedIdx, newColor) => {
    const updated = sorted.map((s, i) => i === sortedIdx ? { ...s, color: newColor } : s);
    onColorStopsChange(updated);
  };

  const handleRemove = (sortedIdx) => {
    if (sorted.length <= 2) return;
    onColorStopsChange(sorted.filter((_, i) => i !== sortedIdx));
  };

  const handleAdd = () => {
    const last = sorted[sorted.length - 1];
    const secondLast = sorted[sorted.length - 2];
    const midValue = Math.round((last.value + secondLast.value) / 2);
    onColorStopsChange([...sorted, { value: midValue, color: '#fbbf24' }]);
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

      {/* Color stops */}
      <div className="fsi-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
        <span className="fsi-label">Color stops</span>
        <div className="fsi-stops">
          {/* Gradient preview */}
          <div className="fsi-stops-preview" style={{ background: computeGradient(sorted) }} />

          {/* Stop rows */}
          {sorted.map((stop, i) => (
            <div key={i} className="fsi-stop-row">
              <input
                type="number"
                className="fsi-number"
                value={stop.value}
                min={0}
                max={100}
                onChange={e => handleValueChange(i, Number(e.target.value))}
              />
              <input
                type="color"
                value={stop.color}
                onChange={e => handleColorChange(i, e.target.value)}
              />
              <button
                className="fsi-stop-remove"
                onClick={() => handleRemove(i)}
                disabled={sorted.length <= 2}
              >
                &#x2715;
              </button>
            </div>
          ))}

          {/* Add button */}
          <button className="fsi-stop-add" onClick={handleAdd}>+ Add stop</button>
        </div>
      </div>
    </div>
  );
}
