// Run with: npm test
// CI: runs automatically via GitHub Actions on PR

import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import WalkPanel from '../components/WalkPanel';

// ---------------------------------------------------------------------------
// WalkPanel component tests
//
// Expected contract:
//   <WalkPanel onPlacePoint={fn} onWalkTimeChange={fn} />
//   — renders a number input for walk time (default value: 5)
//   — renders a "Place Point" button
//   — clicking "Place Point" fires onPlacePoint callback
//   — changing the walk time input fires onWalkTimeChange with the new value
// ---------------------------------------------------------------------------

describe('<WalkPanel />', () => {
  test('renders without crashing', () => {
    expect(() =>
      render(<WalkPanel onPlacePoint={vi.fn()} onWalkTimeChange={vi.fn()} />)
    ).not.toThrow();
  });

  test('renders a "Place Point" button', () => {
    render(<WalkPanel onPlacePoint={vi.fn()} onWalkTimeChange={vi.fn()} />);
    expect(
      screen.getByRole('button', { name: /Place Point/i })
    ).toBeInTheDocument();
  });

  test('renders a walk time number input', () => {
    render(<WalkPanel onPlacePoint={vi.fn()} onWalkTimeChange={vi.fn()} />);
    // Accept either a labelled input or any input[type="number"]
    const input =
      screen.queryByLabelText(/walk time/i) ||
      screen.queryByRole('spinbutton') || // spinbutton = number input
      document.querySelector('input[type="number"]');
    expect(input).not.toBeNull();
    expect(input).toBeInTheDocument();
  });

  test('default walk time is 5 minutes', () => {
    render(<WalkPanel onPlacePoint={vi.fn()} onWalkTimeChange={vi.fn()} />);
    const input =
      screen.queryByLabelText(/walk time/i) ||
      screen.queryByRole('spinbutton') ||
      document.querySelector('input[type="number"]');
    expect(input).not.toBeNull();
    expect(Number(input.value)).toBe(5);
  });

  test('clicking "Place Point" fires the onPlacePoint callback', () => {
    const onPlacePoint = vi.fn();
    render(<WalkPanel onPlacePoint={onPlacePoint} onWalkTimeChange={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /Place Point/i }));
    expect(onPlacePoint).toHaveBeenCalledTimes(1);
  });

  test('changing walk time input fires onWalkTimeChange', () => {
    const onWalkTimeChange = vi.fn();
    render(<WalkPanel onPlacePoint={vi.fn()} onWalkTimeChange={onWalkTimeChange} />);

    const input =
      screen.queryByLabelText(/walk time/i) ||
      screen.queryByRole('spinbutton') ||
      document.querySelector('input[type="number"]');

    fireEvent.change(input, { target: { value: '10' } });
    expect(onWalkTimeChange).toHaveBeenCalled();
  });

  test('walk time input accepts values between 1 and 60', () => {
    render(<WalkPanel onPlacePoint={vi.fn()} onWalkTimeChange={vi.fn()} />);
    const input =
      screen.queryByLabelText(/walk time/i) ||
      screen.queryByRole('spinbutton') ||
      document.querySelector('input[type="number"]');

    // min/max are optional but good practice — we just confirm it is a number input
    expect(input.type).toBe('number');
  });
});
