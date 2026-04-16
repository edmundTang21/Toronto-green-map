// Run with: npm test
// CI: runs automatically via GitHub Actions on PR

import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Header from '../components/Header';

// ---------------------------------------------------------------------------
// Header component tests
//
// Expected contract:
//   <Header /> renders a header element that contains the text "Toronto"
//   and the text "Green Map". The two strings may appear in separate elements
//   (e.g. <span> / <h1>) or together, as long as both are present in the DOM.
// ---------------------------------------------------------------------------

describe('<Header />', () => {
  test('renders without crashing', () => {
    // If render throws, the test fails — no assertion needed beyond this.
    expect(() => render(<Header />)).not.toThrow();
  });

  test('contains the text "Toronto"', () => {
    render(<Header />);
    // getAllByText tolerates the word appearing in multiple nodes.
    expect(screen.getByText(/Toronto/i)).toBeInTheDocument();
  });

  test('contains the text "Green Map"', () => {
    render(<Header />);
    expect(screen.getByText(/Green Map/i)).toBeInTheDocument();
  });

  test('renders a landmark header element (<header> or role="banner")', () => {
    const { container } = render(<Header />);
    const headerEl =
      container.querySelector('header') ||
      screen.queryByRole('banner');
    expect(headerEl).not.toBeNull();
  });
});
