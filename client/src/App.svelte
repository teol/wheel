<script lang="ts">
  import { onMount } from 'svelte';
  import gsap from 'gsap';

  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D | null;

  type Segment = { id: string; text: string; color: string };

  const PALETTE = [
    '#EF4444', // Red
    '#3B82F6', // Blue
    '#10B981', // Emerald
    '#F59E0B', // Amber
    '#8B5CF6', // Violet
    '#EC4899', // Pink
    '#14B8A6', // Teal
    '#F43F5E', // Rose
    '#84CC16', // Lime
    '#6366F1', // Indigo
    '#D946EF', // Fuchsia
    '#0EA5E9', // Sky
  ];

  let segments = $state<Segment[]>([]);
  let newSegmentText = $state('');

  let currentRotation = $state(0);
  let isSpinning = $state(false);
  let showResultModal = $state(false);
  let winningSegment = $state<Segment | null>(null);

  onMount(() => {
    ctx = canvas.getContext('2d');

    // Load from localStorage on mount
    const saved = localStorage.getItem('wheel-segments');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (
          Array.isArray(parsed) &&
          parsed.every(
            (item) => item && typeof item.text === 'string' && typeof item.color === 'string'
          )
        ) {
          // Ensure they have ids
          segments = parsed.map((s) => ({
            id: s.id || crypto.randomUUID(),
            text: s.text,
            color: s.color,
          }));
        }
      } catch (e) {
        console.error('Error parsing segments from localStorage', e);
      }
    }

    if (segments.length === 0) {
      segments = [
        { id: crypto.randomUUID(), text: 'Pizza', color: PALETTE[0] },
        { id: crypto.randomUUID(), text: 'Burger', color: PALETTE[1] },
        { id: crypto.randomUUID(), text: 'Sushi', color: PALETTE[2] },
        { id: crypto.randomUUID(), text: 'Pasta', color: PALETTE[3] },
        { id: crypto.randomUUID(), text: 'Ramen', color: PALETTE[4] },
      ];
    }
  });

  // Save to localStorage and redraw wheel when segments change
  $effect(() => {
    localStorage.setItem('wheel-segments', JSON.stringify(segments));
    drawWheel();
  });

  function drawWheel() {
    if (!ctx || !canvas) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 140;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (segments.length === 0) {
      // Draw empty wheel
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

      // Add text
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

  function spinWheel() {
    if (isSpinning || segments.length === 0) return;
    isSpinning = true;

    // Spin at least 5 times (1800 degrees) plus a random amount
    const randomExtraDegrees = Math.floor(Math.random() * 360);
    currentRotation += 1800 + randomExtraDegrees;

    gsap.to(canvas, {
      rotation: currentRotation,
      duration: 4,
      ease: 'power4.out',
      onComplete: () => {
        isSpinning = false;

        // Calculate the winner
        const normalizedRotation = currentRotation % 360;
        const pointerAngle = (360 - normalizedRotation) % 360;
        const sliceAngleDeg = 360 / segments.length;
        const winningIndex = Math.floor(pointerAngle / sliceAngleDeg);

        winningSegment = segments[winningIndex];
        showResultModal = true;
      },
    });
  }

  function getNextColor() {
    const usedColors = new Set(segments.map((s) => s.color));
    const availableColor = PALETTE.find((c) => !usedColors.has(c));
    if (availableColor) return availableColor;
    return PALETTE[segments.length % PALETTE.length];
  }

  function addSegment() {
    if (newSegmentText.trim()) {
      segments.push({
        id: crypto.randomUUID(),
        text: newSegmentText.trim(),
        color: getNextColor(),
      });
      newSegmentText = '';
    }
  }

  function removeSegment(id: string) {
    segments = segments.filter((s) => s.id !== id);
  }

  function handleKeypress(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      addSegment();
    }
  }
</script>

<main class="min-h-screen bg-base-100 text-base-content flex flex-col items-center p-4 py-12">
  <h1 class="text-4xl font-bold mb-8 text-primary">Custom Wheel Creator</h1>

  <div class="flex flex-col md:flex-row gap-12 w-full max-w-4xl justify-center items-start">
    <div class="flex flex-col items-center">
      <div class="relative card bg-base-200 shadow-xl p-8 mb-8">
        <!-- Pointer -->
        <div
          class="absolute top-4 left-1/2 -translate-x-1/2 z-10 w-0 h-0 border-l-[12px] border-r-[12px] border-t-[24px] border-transparent border-t-primary filter drop-shadow-md"
        ></div>

        <canvas
          bind:this={canvas}
          width="300"
          height="300"
          class="rounded-full shadow-2xl origin-center"
        ></canvas>
      </div>

      <div class="flex gap-4">
        <button class="btn btn-primary btn-lg font-bold" onclick={spinWheel} disabled={isSpinning}>
          {isSpinning ? 'Spinning...' : 'SPIN THE WHEEL!'}
        </button>
      </div>
    </div>

    <div class="card bg-base-200 shadow-xl p-6 w-full max-w-sm">
      <h2 class="text-2xl font-bold mb-4">Edit Options</h2>

      <div class="flex gap-2 mb-6">
        <input
          type="text"
          bind:value={newSegmentText}
          placeholder="Add new option..."
          class="input input-bordered w-full"
          onkeypress={handleKeypress}
          disabled={isSpinning}
        />
        <button class="btn btn-primary" onclick={addSegment} disabled={isSpinning}>Add</button>
      </div>

      <ul class="space-y-2 max-h-80 overflow-y-auto pr-2">
        {#each segments as segment (segment.id)}
          <li class="flex items-center justify-between bg-base-100 p-2 rounded shadow-sm gap-2">
            <div class="flex items-center gap-3 flex-1">
              <input
                type="color"
                bind:value={segment.color}
                class="w-8 h-8 rounded cursor-pointer border-0 p-0 bg-transparent"
                disabled={isSpinning}
              />
              <input
                type="text"
                bind:value={segment.text}
                class="input input-sm input-ghost flex-1 w-full font-medium"
                disabled={isSpinning}
              />
            </div>
            <button
              class="btn btn-ghost btn-xs text-error ml-2"
              onclick={() => removeSegment(segment.id)}
              disabled={isSpinning}
              aria-label="Remove">✕</button
            >
          </li>
        {/each}
        {#if segments.length === 0}
          <li class="text-base-content/50 text-center py-4">No options added yet.</li>
        {/if}
      </ul>
    </div>
  </div>
</main>

{#if showResultModal}
  <div class="modal modal-open">
    <div class="modal-box text-center border-t-8 border-primary relative">
      <h3 class="font-bold text-2xl text-base-content/80 uppercase tracking-widest mb-6">
        We have a winner!
      </h3>
      <div class="p-8 bg-base-200 rounded-box shadow-inner mb-6 relative overflow-hidden">
        <div
          class="absolute inset-0 opacity-10"
          style="background-color: {winningSegment?.color}"
        ></div>
        <p
          class="text-5xl font-black break-words relative z-10"
          style="color: {winningSegment?.color}; text-shadow: 0px 2px 4px rgba(0,0,0,0.5);"
        >
          {winningSegment?.text}
        </p>
      </div>
      <div class="modal-action justify-center mt-0">
        <button class="btn btn-primary btn-wide font-bold" onclick={() => (showResultModal = false)}
          >CLOSE</button
        >
      </div>
    </div>
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="modal-backdrop" onclick={() => (showResultModal = false)}></div>
  </div>
{/if}
