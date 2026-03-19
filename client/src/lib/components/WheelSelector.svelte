<script lang="ts">
  import type { Wheel } from '../types.js';

  let {
    wheels,
    currentWheelId = $bindable(),
    isSpinning,
    oncreate,
    ondelete,
  }: {
    wheels: Wheel[];
    currentWheelId: string;
    isSpinning: boolean;
    oncreate: () => void;
    ondelete: () => void;
  } = $props();
</script>

<div class="flex items-center gap-2 mb-5">
  <div class="relative flex-1">
    <select
      class="w-full appearance-none bg-base-300/60 border border-primary/15 text-base-content rounded-lg
             px-3 py-2.5 pr-8 text-sm font-medium cursor-pointer
             hover:border-primary/30 focus:outline-none focus:border-primary/45 focus:ring-2 focus:ring-primary/10
             disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
      bind:value={currentWheelId}
      disabled={isSpinning}
    >
      {#each wheels as wheel (wheel.id)}
        <option value={wheel.id}>{wheel.name}</option>
      {/each}
    </select>
    <div class="pointer-events-none absolute inset-y-0 right-2.5 flex items-center">
      <svg
        class="h-3.5 w-3.5 text-primary/40"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  </div>

  <button
    class="w-9 h-9 flex items-center justify-center rounded-lg border border-primary/20 text-primary/60
           bg-primary/5 hover:bg-primary/12 hover:border-primary/40 hover:text-primary
           disabled:opacity-35 disabled:cursor-not-allowed transition-all duration-200 text-lg font-light"
    onclick={oncreate}
    disabled={isSpinning}
    aria-label="New Wheel"
    title="Create new wheel"
  >
    +
  </button>

  <button
    class="w-9 h-9 flex items-center justify-center rounded-lg border border-error/20 text-error/50
           bg-error/5 hover:bg-error/12 hover:border-error/40 hover:text-error
           disabled:opacity-35 disabled:cursor-not-allowed transition-all duration-200 text-sm"
    onclick={ondelete}
    disabled={isSpinning || wheels.length <= 1}
    aria-label="Delete Wheel"
    title="Delete current wheel"
  >
    ✕
  </button>
</div>
