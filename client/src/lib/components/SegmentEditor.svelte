<script lang="ts">
  import type { Wheel } from '../types.js';
  import { PALETTE } from '../constants.js';
  import { generateClientSeed } from '../utils/formatters.js';

  let {
    wheel = $bindable(),
    isSpinning,
    pfServerAvailable,
    pfClientSeed = $bindable(),
  }: {
    wheel: Wheel;
    isSpinning: boolean;
    pfServerAvailable: boolean;
    pfClientSeed: string;
  } = $props();

  let newSegmentText = $state('');

  function getNextColor() {
    const usedColors = new Set(wheel.segments.map((s) => s.color));
    const availableColor = PALETTE.find((c) => !usedColors.has(c));
    if (availableColor) return availableColor;
    return PALETTE[wheel.segments.length % PALETTE.length];
  }

  function addSegment() {
    if (newSegmentText.trim()) {
      wheel.segments = [
        ...wheel.segments,
        {
          id: crypto.randomUUID(),
          text: newSegmentText.trim(),
          color: getNextColor(),
        },
      ];
      newSegmentText = '';
    }
  }

  function removeSegment(id: string) {
    wheel.segments = wheel.segments.filter((s) => s.id !== id);
  }

  function shuffleSegments() {
    const shuffled = [...wheel.segments];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    wheel.segments = shuffled;
  }

  function sortSegmentsAsc() {
    wheel.segments = [...wheel.segments].sort((a, b) => a.text.localeCompare(b.text));
  }

  const handleKeypress = (e: KeyboardEvent) => {
    if (e.key === 'Enter') addSegment();
  };
</script>

<!-- Wheel name -->
<div class="mb-5">
  <label
    for="wheel-name-input"
    class="block text-xs text-primary/50 font-mono uppercase tracking-widest mb-1.5"
    >Wheel Name</label
  >
  <input
    id="wheel-name-input"
    type="text"
    class="input-elegant w-full px-3 py-2.5 rounded-lg text-base font-semibold"
    style="font-family: var(--font-display); font-size: 1.05rem;"
    bind:value={wheel.name}
    disabled={isSpinning}
    placeholder="Wheel Name"
  />
</div>

<div class="divider-gold"></div>

<!-- Section header -->
<div class="flex items-center justify-between mb-4">
  <h2 class="section-title">Options</h2>
  <div class="flex gap-1.5">
    <button
      class="px-2.5 py-1 rounded text-xs border border-base-content/10 text-base-content/40
             hover:border-primary/25 hover:text-primary/70 disabled:opacity-30
             disabled:cursor-not-allowed transition-all duration-150"
      onclick={shuffleSegments}
      disabled={isSpinning}
      aria-label="Shuffle"
      title="Shuffle"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-3.5 w-3.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
        />
      </svg>
    </button>
    <button
      class="px-2.5 py-1 rounded text-xs border border-base-content/10 text-base-content/40
             hover:border-primary/25 hover:text-primary/70 disabled:opacity-30
             disabled:cursor-not-allowed transition-all duration-150"
      onclick={sortSegmentsAsc}
      disabled={isSpinning}
      aria-label="Order ASC"
      title="Sort A–Z"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-3.5 w-3.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
        />
      </svg>
    </button>
  </div>
</div>

<!-- Add segment -->
<div class="flex gap-2 mb-4">
  <input
    type="text"
    bind:value={newSegmentText}
    placeholder="Add new option..."
    class="input-elegant flex-1 px-3 py-2 rounded-lg text-sm"
    onkeypress={handleKeypress}
    disabled={isSpinning}
  />
  <button
    class="px-4 py-2 rounded-lg text-sm font-medium border border-primary/25 text-primary/80
           bg-primary/8 hover:bg-primary/15 hover:border-primary/45 hover:text-primary
           disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150"
    onclick={addSegment}
    disabled={isSpinning}
  >
    Add
  </button>
</div>

<!-- Segment list -->
<ul class="space-y-1.5 max-h-60 overflow-y-auto pr-1">
  {#each wheel.segments as segment (segment.id)}
    <li class="segment-item">
      <div class="flex items-center gap-2.5 flex-1 min-w-0">
        <div class="relative flex-shrink-0">
          <input
            type="color"
            bind:value={segment.color}
            class="w-6 h-6 rounded-full cursor-pointer border-0 p-0 bg-transparent opacity-0 absolute inset-0"
            disabled={isSpinning}
          />
          <div
            class="w-6 h-6 rounded-full flex-shrink-0 ring-1 ring-black/20 pointer-events-none"
            style="background-color: {segment.color};"
          ></div>
        </div>
        <input
          type="text"
          bind:value={segment.text}
          class="bg-transparent border-none outline-none flex-1 w-full text-sm font-medium text-base-content/90
                 placeholder-base-content/30 disabled:opacity-40 disabled:cursor-not-allowed min-w-0"
          disabled={isSpinning}
        />
      </div>
      <button
        class="text-base-content/20 hover:text-error/70 transition-colors duration-150 flex-shrink-0 p-1 -mr-1
               disabled:opacity-20 disabled:cursor-not-allowed text-xs"
        onclick={() => removeSegment(segment.id)}
        disabled={isSpinning}
        aria-label="Remove"
      >
        ✕
      </button>
    </li>
  {/each}
  {#if wheel.segments.length === 0}
    <li
      class="text-center py-6 text-base-content/25 text-sm italic"
      style="font-family: var(--font-display);"
    >
      No options added yet
    </li>
  {/if}
</ul>

<!-- Provably Fair section -->
{#if pfServerAvailable}
  <div class="mt-5 pt-4 border-t border-primary/8">
    <p class="text-xs text-primary/45 font-mono uppercase tracking-widest mb-1.5">Client Seed</p>
    <p class="font-mono text-xs text-base-content/40 break-all leading-relaxed">{pfClientSeed}</p>
    <button
      class="mt-2 text-xs text-base-content/25 hover:text-primary/50 font-mono transition-colors duration-150
             disabled:opacity-20 disabled:cursor-not-allowed"
      onclick={() => (pfClientSeed = generateClientSeed())}
      disabled={isSpinning}
    >
      ↻ Regenerate
    </button>
  </div>
{/if}
