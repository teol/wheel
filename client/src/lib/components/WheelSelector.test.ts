// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import WheelSelector from './WheelSelector.svelte';
import type { Wheel } from '../types.js';

const makeWheels = (n: number): Wheel[] =>
  Array.from({ length: n }, (_, i) => ({
    id: `wheel-${i}`,
    name: `Wheel ${i + 1}`,
    segments: [],
  }));

describe('WheelSelector', () => {
  it('renders all wheels as <option> elements', () => {
    const wheels = makeWheels(3);
    render(WheelSelector, {
      props: {
        wheels,
        currentWheelId: wheels[0].id,
        isSpinning: false,
        oncreate: vi.fn(),
        ondelete: vi.fn(),
      },
    });

    wheels.forEach((w) => {
      expect(screen.getByRole('option', { name: w.name })).toBeInTheDocument();
    });
  });

  it('has the current wheel selected', () => {
    const wheels = makeWheels(3);
    render(WheelSelector, {
      props: {
        wheels,
        currentWheelId: wheels[1].id,
        isSpinning: false,
        oncreate: vi.fn(),
        ondelete: vi.fn(),
      },
    });

    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe(wheels[1].id);
  });

  it('calls oncreate when the + button is clicked', async () => {
    const oncreate = vi.fn();
    const wheels = makeWheels(2);
    render(WheelSelector, {
      props: {
        wheels,
        currentWheelId: wheels[0].id,
        isSpinning: false,
        oncreate,
        ondelete: vi.fn(),
      },
    });

    await userEvent.click(screen.getByRole('button', { name: /new wheel/i }));
    expect(oncreate).toHaveBeenCalledOnce();
  });

  it('calls ondelete when the ✕ button is clicked', async () => {
    const ondelete = vi.fn();
    const wheels = makeWheels(2);
    render(WheelSelector, {
      props: {
        wheels,
        currentWheelId: wheels[0].id,
        isSpinning: false,
        oncreate: vi.fn(),
        ondelete,
      },
    });

    await userEvent.click(screen.getByRole('button', { name: /delete wheel/i }));
    expect(ondelete).toHaveBeenCalledOnce();
  });

  it('disables the delete button when only 1 wheel remains', () => {
    const wheels = makeWheels(1);
    render(WheelSelector, {
      props: {
        wheels,
        currentWheelId: wheels[0].id,
        isSpinning: false,
        oncreate: vi.fn(),
        ondelete: vi.fn(),
      },
    });

    expect(screen.getByRole('button', { name: /delete wheel/i })).toBeDisabled();
  });

  it('disables all controls while spinning', () => {
    const wheels = makeWheels(2);
    render(WheelSelector, {
      props: {
        wheels,
        currentWheelId: wheels[0].id,
        isSpinning: true,
        oncreate: vi.fn(),
        ondelete: vi.fn(),
      },
    });

    expect(screen.getByRole('combobox')).toBeDisabled();
    expect(screen.getByRole('button', { name: /new wheel/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /delete wheel/i })).toBeDisabled();
  });
});
