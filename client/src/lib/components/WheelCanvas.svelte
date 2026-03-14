<script lang="ts">
  import type { Segment } from '../types.js';

  let {
    segments,
    canvasElement = $bindable<HTMLCanvasElement | null>(null),
  }: {
    segments: Segment[];
    canvasElement?: HTMLCanvasElement | null;
  } = $props();

  let ctx: CanvasRenderingContext2D | null = null;

  function drawWheel() {
    if (!ctx || !canvasElement) return;

    const centerX = canvasElement.width / 2;
    const centerY = canvasElement.height / 2;
    const radius = 140;

    ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);

    if (segments.length === 0) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.fillStyle = '#4B5563';
      ctx.fill();
      return;
    }

    const sliceAngle = (2 * Math.PI) / segments.length;
    const startOffset = -Math.PI / 2; // Start from the top (12 o'clock)

    segments.forEach((segment, i) => {
      const startAngle = startOffset + i * sliceAngle;
      const endAngle = startOffset + (i + 1) * sliceAngle;

      ctx!.beginPath();
      ctx!.moveTo(centerX, centerY);
      ctx!.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx!.lineTo(centerX, centerY);
      ctx!.closePath();

      ctx!.fillStyle = segment.color;
      ctx!.fill();
      ctx!.lineWidth = 2;
      ctx!.strokeStyle = '#1F2937';
      ctx!.stroke();

      ctx!.save();
      ctx!.translate(centerX, centerY);
      ctx!.rotate(startAngle + sliceAngle / 2);
      ctx!.textAlign = 'right';
      ctx!.textBaseline = 'middle';
      ctx!.fillStyle = '#FFFFFF';
      ctx!.font = 'bold 16px sans-serif';
      ctx!.fillText(segment.text, radius - 20, 0);
      ctx!.restore();
    });

    // Draw outer border
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#1F2937';
    ctx.stroke();

    // Draw center dot
    ctx.beginPath();
    ctx.arc(centerX, centerY, 15, 0, 2 * Math.PI);
    ctx.fillStyle = '#1F2937';
    ctx.fill();
  }

  $effect(() => {
    if (canvasElement) {
      ctx = canvasElement.getContext('2d');
    }
    // Re-draw whenever segments change
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _seg = segments;
    drawWheel();
  });
</script>

<div class="relative card bg-base-200 shadow-xl p-8 mb-8">
  <!-- Pointer -->
  <div
    class="absolute top-4 left-1/2 -translate-x-1/2 z-10 w-0 h-0 border-l-[12px] border-r-[12px] border-t-[24px] border-transparent border-t-primary filter drop-shadow-md"
  ></div>

  <canvas
    bind:this={canvasElement}
    width="300"
    height="300"
    class="rounded-full shadow-2xl origin-center"
  ></canvas>
</div>
