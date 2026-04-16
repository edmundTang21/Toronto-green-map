import React, { useState, useEffect } from 'react';

function computeGradient(stops) {
  const sorted = [...stops].sort((a, b) => a.value - b.value);
  const min = sorted[0].value;
  const max = sorted[sorted.length - 1].value;
  const range = max - min || 1;
  const parts = sorted.map(s => `${s.color} ${((s.value - min) / range * 100).toFixed(1)}%`);
  return `linear-gradient(to right, ${parts.join(', ')})`;
}

function StopRow({ stop, index, colorStops, onColorStopsChange }) {
  const [draft, setDraft] = useState(String(stop.value));

  // Sync draft if stop.value changes externally (e.g. loaded from localStorage)
  useEffect(() => { setDraft(String(stop.value)); }, [stop.value]);

  const handleValueChange = (e) => setDraft(e.target.value);

  const handleValueBlur = () => {
    const v = Math.max(0, Math.min(100, Number(draft) || 0));
    setDraft(String(v));
    const updated = colorStops.map((s, i) =>
      i === index ? { ...s, value: v } : s
    );
    onColorStopsChange(updated);
  };

  const handleColorChange = (e) => {
    const updated = colorStops.map((s, i) =>
      i === index ? { ...s, color: e.target.value } : s
    );
    onColorStopsChange(updated);
  };

  const handleRemove = () => {
    if (colorStops.length <= 2) return;
    onColorStopsChange(colorStops.filter((_, i) => i !== index));
  };

  return (
    <div className="fsi-stop-row">
      <input
        type="number"
        className="fsi-number"
        min={0} max={100}
        value={draft}
        onChange={handleValueChange}
        onBlur={handleValueBlur}
      />
      <input type="color" value={stop.color} onChange={handleColorChange} />
      <button className="fsi-stop-remove" onClick={handleRemove} disabled={colorStops.length <= 2}>&#x2715;</button>
    </div>
  );
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

  // Sorted copy only for gradient preview and add-stop midpoint logic
  const sorted = [...colorStops].sort((a, b) => a.value - b.value);

  const handleAdd = () => {
    const last = sorted[sorted.length - 1];
    const secondLast = sorted[sorted.length - 2];
    const midValue = Math.round((last.value + secondLast.value) / 2);
    onColorStopsChange([...colorStops, { value: midValue, color: '#fbbf24' }]);
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
          {/* Gradient preview — uses sorted stops */}
          <div className="fsi-stops-preview" style={{ background: computeGradient(sorted) }} />

          {/* Stop rows — use original (unsorted) indices so delete/update map correctly */}
          {colorStops.map((stop, i) => (
            <StopRow
              key={i}
              stop={stop}
              index={i}
              colorStops={colorStops}
              onColorStopsChange={onColorStopsChange}
            />
          ))}

          {/* Add button */}
          <button className="fsi-stop-add" onClick={handleAdd}>+ Add stop</button>
        </div>
      </div>
    </div>
  );
}
