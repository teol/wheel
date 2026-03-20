<script lang="ts">
  import type { Segment } from '../types.js';

  const CANVAS_SIZE = 300;

  let {
    segments,
    canvasElement = $bindable<HTMLCanvasElement | null>(null),
    currentSegmentIndex = 0,
    onspin,
  }: {
    segments: Segment[];
    canvasElement?: HTMLCanvasElement | null;
    currentSegmentIndex?: number;
    onspin?: () => void;
  } = $props();

  let ctx: CanvasRenderingContext2D | null = null;

  let pointerColor = $derived(segments[currentSegmentIndex]?.color ?? '#6366f1');

  function drawWheel() {
    if (!ctx) return;

    const centerX = CANVAS_SIZE / 2;
    const centerY = CANVAS_SIZE / 2;
    const radius = 140;

    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    if (segments.length === 0) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.fillStyle = '#4B5563';
      ctx.fill();
      return;
    }

    const sliceAngle = (2 * Math.PI) / segments.length;
    const startOffset = -Math.PI / 2;

    // 1. Draw filled segments (no stroke — avoids thick overlap artefacts)
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
    });

    // 2. Draw hair-thin radial dividers
    ctx.lineWidth = 0.5;
    ctx.strokeStyle = '#111827';
    ctx.lineCap = 'round';
    for (let i = 0; i < segments.length; i++) {
      const angle = startOffset + i * sliceAngle;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(centerX + radius * Math.cos(angle), centerY + radius * Math.sin(angle));
      ctx.stroke();
    }

    // 3. Draw text
    segments.forEach((segment, i) => {
      const startAngle = startOffset + i * sliceAngle;
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

    // 4. Outer border
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#111827';
    ctx.stroke();

    // 5. Center dot
    ctx.beginPath();
    ctx.arc(centerX, centerY, 15, 0, 2 * Math.PI);
    ctx.fillStyle = '#111827';
    ctx.fill();
  }

  $effect(() => {
    if (canvasElement) {
      const dpr = window.devicePixelRatio || 1;
      canvasElement.width = CANVAS_SIZE * dpr;
      canvasElement.height = CANVAS_SIZE * dpr;
      ctx = canvasElement.getContext('2d');
      if (ctx) ctx.scale(dpr, dpr);
    }
    drawWheel();
  });
</script>

<div class="relative card bg-base-200 shadow-xl p-8 mb-8 overflow-visible">
  <div class="relative overflow-visible" style="width: 300px; height: 300px;">
    <!-- Pointer: right side of wheel, pointing left, colour tracks current segment -->
    <div
      class="absolute z-10 pointer-events-none"
      style="left: 284px; top: 50%; transform: translateY(-50%); width: 0; height: 0; border-top: 16px solid transparent; border-bottom: 16px solid transparent; border-right: 28px solid {pointerColor}; filter: drop-shadow(2px 0 4px rgba(0,0,0,0.55));"
    ></div>

    <canvas
      bind:this={canvasElement}
      width="300"
      height="300"
      style="width: 300px; height: 300px;"
      class="rounded-full shadow-2xl origin-center {onspin ? 'cursor-pointer' : ''}"
      onclick={onspin}
    ></canvas>
  </div>
</div>
