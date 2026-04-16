// Run with: npm test
// CI: runs automatically via GitHub Actions on PR

import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LayerControl from '../components/LayerControl';

// ---------------------------------------------------------------------------
// LayerControl component tests
//
// Expected contract:
//   <LayerControl layers={layers} onToggle={fn} />
//   — renders a checkbox (or toggle) for each layer entry
//   — calling onToggle with the layer id when a checkbox is changed
//
// Layers that must be present: Parking Lots, Green P, Impermeable,
// Permeable, Trees (plus any others the component renders).
// ---------------------------------------------------------------------------

/** Default set of layers the component is expected to render. */
const DEFAULT_LAYERS = [
  { id: 'parking',     label: 'Parking Lots', visible: true },
  { id: 'greenp',      label: 'Green P',      visible: true },
  { id: 'impermeable', label: 'Impermeable',  visible: false },
  { id: 'permeable',   label: 'Permeable',    visible: false },
  { id: 'trees',       label: 'Trees',        visible: false },
];

describe('<LayerControl />', () => {
  test('renders without crashing', () => {
    const onToggle = vi.fn();
    expect(() =>
      render(<LayerControl layers={DEFAULT_LAYERS} onToggle={onToggle} />)
    ).not.toThrow();
  });

  test('renders a checkbox (or role="checkbox") for each layer', () => {
    const onToggle = vi.fn();
    render(<LayerControl layers={DEFAULT_LAYERS} onToggle={onToggle} />);

    const checkboxes = screen.getAllByRole('checkbox');
    // At minimum one checkbox per layer
    expect(checkboxes.length).toBeGreaterThanOrEqual(DEFAULT_LAYERS.length);
  });

  test('renders "Parking Lots" layer control', () => {
    const onToggle = vi.fn();
    render(<LayerControl layers={DEFAULT_LAYERS} onToggle={onToggle} />);
    expect(screen.getByLabelText(/Parking Lots/i)).toBeInTheDocument();
  });

  test('renders "Green P" layer control', () => {
    const onToggle = vi.fn();
    render(<LayerControl layers={DEFAULT_LAYERS} onToggle={onToggle} />);
    expect(screen.getByLabelText(/Green P/i)).toBeInTheDocument();
  });

  test('renders "Impermeable" layer control', () => {
    const onToggle = vi.fn();
    render(<LayerControl layers={DEFAULT_LAYERS} onToggle={onToggle} />);
    expect(screen.getByLabelText(/Impermeable/i)).toBeInTheDocument();
  });

  test('renders "Trees" layer control', () => {
    const onToggle = vi.fn();
    render(<LayerControl layers={DEFAULT_LAYERS} onToggle={onToggle} />);
    expect(screen.getByLabelText(/Trees/i)).toBeInTheDocument();
  });

  test('toggling a checkbox fires onToggle with the correct layer id', () => {
    const onToggle = vi.fn();
    render(<LayerControl layers={DEFAULT_LAYERS} onToggle={onToggle} />);

    const parkingCheckbox = screen.getByLabelText(/Parking Lots/i);
    fireEvent.click(parkingCheckbox);

    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(onToggle).toHaveBeenCalledWith('parking');
  });

  test('toggling the Trees checkbox fires onToggle with id "trees"', () => {
    const onToggle = vi.fn();
    render(<LayerControl layers={DEFAULT_LAYERS} onToggle={onToggle} />);

    const treesCheckbox = screen.getByLabelText(/Trees/i);
    fireEvent.click(treesCheckbox);

    expect(onToggle).toHaveBeenCalledWith('trees');
  });

  test('visible layers have their checkbox checked', () => {
    const onToggle = vi.fn();
    render(<LayerControl layers={DEFAULT_LAYERS} onToggle={onToggle} />);

    // parking and greenp start visible: true
    expect(screen.getByLabelText(/Parking Lots/i)).toBeChecked();
    expect(screen.getByLabelText(/Green P/i)).toBeChecked();
  });

  test('non-visible layers have their checkbox unchecked', () => {
    const onToggle = vi.fn();
    render(<LayerControl layers={DEFAULT_LAYERS} onToggle={onToggle} />);

    // trees starts visible: false
    expect(screen.getByLabelText(/Trees/i)).not.toBeChecked();
  });
});
