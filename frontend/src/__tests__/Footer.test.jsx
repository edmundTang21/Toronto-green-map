// Run with: npm test
// CI: runs automatically via GitHub Actions on PR

import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Footer from '../components/Footer';

// ---------------------------------------------------------------------------
// Footer component tests
//
// Expected contract:
//   <Footer /> renders a link whose href points to open.toronto.ca
//   and whose visible label includes "Toronto Open Data".
// ---------------------------------------------------------------------------

describe('<Footer />', () => {
  test('renders without crashing', () => {
    expect(() => render(<Footer />)).not.toThrow();
  });

  test('renders a link to open.toronto.ca', () => {
    render(<Footer />);
    const link = screen.getByRole('link', { name: /Toronto Open Data/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', expect.stringContaining('open.toronto.ca'));
  });

  test('link text includes "Toronto Open Data"', () => {
    render(<Footer />);
    expect(screen.getByText(/Toronto Open Data/i)).toBeInTheDocument();
  });

  test('link opens in a new tab (target="_blank") or is a standard anchor', () => {
    render(<Footer />);
    const link = screen.getByRole('link', { name: /Toronto Open Data/i });
    // Either opens in new tab or is a regular link — both are acceptable.
    const target = link.getAttribute('target');
    expect(target === '_blank' || target === null || target === '').toBeTruthy();
  });
});
