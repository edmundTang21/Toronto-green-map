import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';

// ---------------------------------------------------------------------------
// App smoke tests
//
// These tests verify that the top-level App component renders without crashing
// and that the core UI landmarks (Header, Footer) are present.
// ---------------------------------------------------------------------------

// Mock fetch globally — App triggers API calls on mount
beforeEach(() => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ features: [] }),
  });
});

describe('<App />', () => {
  test('renders without crashing', () => {
    expect(() => render(<App />)).not.toThrow();
  });

  test('renders Header with "Toronto" and "Green Map"', () => {
    render(<App />);
    expect(screen.getByText(/Toronto/i)).toBeInTheDocument();
    expect(screen.getByText(/Green Map/i)).toBeInTheDocument();
  });

  test('renders Footer with Toronto Open Data link', () => {
    render(<App />);
    expect(screen.getByRole('link', { name: /Toronto Open Data/i })).toBeInTheDocument();
  });

  test('renders the layers panel trigger button', () => {
    render(<App />);
    // The FAB is rendered by LayerControl (initially hidden via CSS opacity:0)
    // The panel itself has "Layers" text visible
    expect(screen.getByText(/Layers/i)).toBeInTheDocument();
  });

  test('renders the Legend section', () => {
    render(<App />);
    expect(screen.getByText(/Legend/i)).toBeInTheDocument();
  });
});
