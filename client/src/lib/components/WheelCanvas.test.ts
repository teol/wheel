// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import WheelCanvas from './WheelCanvas.svelte';

describe('WheelCanvas', () => {
  it('renders a <canvas> element', () => {
    const { container } = render(WheelCanvas, {
      props: { segments: [] },
    });

    const canvas = container.querySelector('canvas');
    expect(canvas).not.toBeNull();
  });

  it('renders with the correct canvas dimensions', () => {
    const { container } = render(WheelCanvas, {
      props: { segments: [] },
    });

    const canvas = container.querySelector('canvas') as HTMLCanvasElement;
    expect(canvas.width).toBe(300);
    expect(canvas.height).toBe(300);
  });

  it('mounts without throwing even with many segments', () => {
    const segments = Array.from({ length: 12 }, (_, i) => ({
      id: `seg-${i}`,
      text: `Option ${i + 1}`,
      color: '#EF4444',
    }));

    expect(() => render(WheelCanvas, { props: { segments } })).not.toThrow();
  });

  it('renders the pointer element above the canvas', () => {
    const { container } = render(WheelCanvas, {
      props: { segments: [] },
    });

    // The pointer is a div with the z-10 class (positioned above the canvas)
    const pointer = container.querySelector('.z-10');
    expect(pointer).not.toBeNull();
  });
});
