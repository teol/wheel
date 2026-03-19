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

<div class="mb-6">
  <input
    type="text"
    class="input input-bordered w-full font-bold text-lg"
    bind:value={wheel.name}
    disabled={isSpinning}
    placeholder="Wheel Name"
  />
</div>

<h2 class="text-xl font-bold mb-4">Edit Options</h2>

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

<div class="flex gap-2 mb-3">
  <button class="btn btn-sm btn-outline flex-1" onclick={shuffleSegments} disabled={isSpinning}>
    🔀 Shuffle
  </button>
  <button class="btn btn-sm btn-outline flex-1" onclick={sortSegmentsAsc} disabled={isSpinning}>
    🔤 Order ASC
  </button>
</div>

<ul class="space-y-2 max-h-64 overflow-y-auto pr-2">
  {#each wheel.segments as segment (segment.id)}
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
  {#if wheel.segments.length === 0}
    <li class="text-base-content/50 text-center py-4">No options added yet.</li>
  {/if}
</ul>

{#if pfServerAvailable}
  <div class="mt-6 pt-4 border-t border-base-300">
    <p class="text-xs text-base-content/50 mb-1 font-semibold uppercase tracking-wide">
      Your Client Seed
    </p>
    <p class="font-mono text-xs text-base-content/70 break-all">{pfClientSeed}</p>
    <button
      class="btn btn-ghost btn-xs mt-1 text-base-content/40"
      onclick={() => (pfClientSeed = generateClientSeed())}
      disabled={isSpinning}
    >
      Regenerate
    </button>
  </div>
{/if}
