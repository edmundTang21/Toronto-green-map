// Run with: npm test
// CI: runs automatically via GitHub Actions on PR

import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import InfoPanel from '../components/InfoPanel';

// ---------------------------------------------------------------------------
// InfoPanel component tests
//
// Expected contract:
//   <InfoPanel stats={stats} />
//   — renders 4 stat rows: Parking Lots, Est. Spaces, Green P, Green P Spaces
//   — accepts a stats object: { parkingLots, estSpaces, greenP, greenPSpaces }
//   — renders numeric values alongside each label
// ---------------------------------------------------------------------------

const SAMPLE_STATS = {
  parkingLots: 42,
  estSpaces: 1250,
  greenP: 7,
  greenPSpaces: 320,
};

describe('<InfoPanel />', () => {
  test('renders without crashing', () => {
    expect(() => render(<InfoPanel stats={SAMPLE_STATS} />)).not.toThrow();
  });

  test('renders "Parking Lots" stat row', () => {
    render(<InfoPanel stats={SAMPLE_STATS} />);
    expect(screen.getByText(/Parking Lots/i)).toBeInTheDocument();
  });

  test('renders "Est. Spaces" stat row (estimated spaces)', () => {
    render(<InfoPanel stats={SAMPLE_STATS} />);
    // Accept "Est. Spaces", "Estimated Spaces", or any variant
    expect(
      screen.getByText(/Est\.?\s*Spaces|Estimated Spaces/i)
    ).toBeInTheDocument();
  });

  test('renders "Green P" stat row', () => {
    render(<InfoPanel stats={SAMPLE_STATS} />);
    expect(screen.getByText(/Green\s*P\b/i)).toBeInTheDocument();
  });

  test('renders "Green P Spaces" stat row', () => {
    render(<InfoPanel stats={SAMPLE_STATS} />);
    expect(screen.getByText(/Green\s*P\s*Spaces/i)).toBeInTheDocument();
  });

  test('renders the numeric value for Parking Lots', () => {
    render(<InfoPanel stats={SAMPLE_STATS} />);
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  test('renders the numeric value for Est. Spaces', () => {
    render(<InfoPanel stats={SAMPLE_STATS} />);
    // Value may be formatted as "1,250" or "1250"
    const el =
      screen.queryByText('1250') || screen.queryByText('1,250');
    expect(el).not.toBeNull();
    expect(el).toBeInTheDocument();
  });

  test('renders the numeric value for Green P', () => {
    render(<InfoPanel stats={SAMPLE_STATS} />);
    expect(screen.getByText('7')).toBeInTheDocument();
  });

  test('renders the numeric value for Green P Spaces', () => {
    render(<InfoPanel stats={SAMPLE_STATS} />);
    const el =
      screen.queryByText('320') || screen.queryByText('320');
    expect(el).not.toBeNull();
  });

  test('renders all 4 stat rows — total of 4 label-value pairs', () => {
    const { container } = render(<InfoPanel stats={SAMPLE_STATS} />);
    // A stat row typically uses a <tr>, <li>, or a container div with a class.
    // We count by checking for all 4 required labels being present.
    const labels = ['Parking Lots', /Est\.?\s*Spaces/i, /Green\s*P\b/i, /Green\s*P\s*Spaces/i];
    const found = labels.filter((label) => {
      if (typeof label === 'string') {
        return container.textContent.includes(label);
      }
      return label.test(container.textContent);
    });
    expect(found).toHaveLength(4);
  });

  test('renders with zero stats without crashing', () => {
    const zeroStats = { parkingLots: 0, estSpaces: 0, greenP: 0, greenPSpaces: 0 };
    expect(() => render(<InfoPanel stats={zeroStats} />)).not.toThrow();
  });

  test('renders with undefined stats gracefully (no crash)', () => {
    // The component should handle missing stats via defaultProps or optional chaining
    expect(() => render(<InfoPanel />)).not.toThrow();
  });
});
