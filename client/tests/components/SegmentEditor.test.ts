// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import SegmentEditorTestHarness from './SegmentEditorTestHarness.svelte';
import type { Wheel } from '../../src/lib/types.js';

const makeWheel = (segmentTexts: string[] = ['Pizza', 'Burger', 'Sushi']): Wheel => ({
  id: 'wheel-1',
  name: 'Food Wheel',
  segments: segmentTexts.map((text, i) => ({
    id: `seg-${i}`,
    text,
    color: '#EF4444',
  })),
});

describe('SegmentEditor', () => {
  it('renders the wheel name input', () => {
    const wheel = makeWheel();
    render(SegmentEditorTestHarness, {
      props: {
        initialWheel: wheel,
        isSpinning: false,
        pfServerAvailable: false,
        pfClientSeed: 'abc',
      },
    });

    expect(screen.getByDisplayValue('Food Wheel')).toBeInTheDocument();
  });

  it('renders all segment text inputs', () => {
    const wheel = makeWheel(['Pizza', 'Burger', 'Sushi']);
    render(SegmentEditorTestHarness, {
      props: {
        initialWheel: wheel,
        isSpinning: false,
        pfServerAvailable: false,
        pfClientSeed: 'abc',
      },
    });

    expect(screen.getByDisplayValue('Pizza')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Burger')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Sushi')).toBeInTheDocument();
  });

  it('adds a segment when the Add button is clicked', async () => {
    const wheel = makeWheel(['Pizza']);
    render(SegmentEditorTestHarness, {
      props: {
        initialWheel: wheel,
        isSpinning: false,
        pfServerAvailable: false,
        pfClientSeed: 'abc',
      },
    });

    await userEvent.type(screen.getByPlaceholderText(/add new option/i), 'Ramen');
    await userEvent.click(screen.getByRole('button', { name: /^add$/i }));

    expect(screen.getByDisplayValue('Ramen')).toBeInTheDocument();
  });

  it('adds a segment when Enter is pressed in the input', async () => {
    const wheel = makeWheel(['Pizza']);
    render(SegmentEditorTestHarness, {
      props: {
        initialWheel: wheel,
        isSpinning: false,
        pfServerAvailable: false,
        pfClientSeed: 'abc',
      },
    });

    await userEvent.type(screen.getByPlaceholderText(/add new option/i), 'Pasta{Enter}');

    expect(screen.getByDisplayValue('Pasta')).toBeInTheDocument();
  });

  it('clears the input after adding a segment', async () => {
    const wheel = makeWheel([]);
    render(SegmentEditorTestHarness, {
      props: {
        initialWheel: wheel,
        isSpinning: false,
        pfServerAvailable: false,
        pfClientSeed: 'abc',
      },
    });

    const input = screen.getByPlaceholderText(/add new option/i);
    await userEvent.type(input, 'Ramen');
    await userEvent.click(screen.getByRole('button', { name: /^add$/i }));

    expect(input).toHaveValue('');
  });

  it('removes a segment when its ✕ button is clicked', async () => {
    const wheel = makeWheel(['Pizza', 'Burger']);
    render(SegmentEditorTestHarness, {
      props: {
        initialWheel: wheel,
        isSpinning: false,
        pfServerAvailable: false,
        pfClientSeed: 'abc',
      },
    });

    // There are multiple Remove buttons — click the first one (Pizza)
    const removeButtons = screen.getAllByRole('button', { name: /remove/i });
    await userEvent.click(removeButtons[0]);

    expect(screen.queryByDisplayValue('Pizza')).not.toBeInTheDocument();
    expect(screen.getByDisplayValue('Burger')).toBeInTheDocument();
  });

  it('disables shuffle and sort buttons when isSpinning is true', () => {
    const wheel = makeWheel();
    render(SegmentEditorTestHarness, {
      props: {
        initialWheel: wheel,
        isSpinning: true,
        pfServerAvailable: false,
        pfClientSeed: 'abc',
      },
    });

    expect(screen.getByRole('button', { name: /shuffle/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /order asc/i })).toBeDisabled();
  });

  it('hides the client seed section when pfServerAvailable is false', () => {
    const wheel = makeWheel();
    render(SegmentEditorTestHarness, {
      props: {
        initialWheel: wheel,
        isSpinning: false,
        pfServerAvailable: false,
        pfClientSeed: 'seed123',
      },
    });

    expect(screen.queryByText('seed123')).not.toBeInTheDocument();
  });

  it('shows the client seed section when pfServerAvailable is true', () => {
    const wheel = makeWheel();
    render(SegmentEditorTestHarness, {
      props: {
        initialWheel: wheel,
        isSpinning: false,
        pfServerAvailable: true,
        pfClientSeed: 'seed123',
      },
    });

    expect(screen.getByText('seed123')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /regenerate/i })).toBeInTheDocument();
  });

  it('shows "No options added yet" when segments list is empty', () => {
    const wheel = makeWheel([]);
    render(SegmentEditorTestHarness, {
      props: {
        initialWheel: wheel,
        isSpinning: false,
        pfServerAvailable: false,
        pfClientSeed: 'abc',
      },
    });

    expect(screen.getByText(/no options added yet/i)).toBeInTheDocument();
  });
});
