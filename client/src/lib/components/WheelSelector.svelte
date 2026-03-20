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
      class="w-full appearance-none input-sharp px-3 py-2.5 pr-8 text-sm font-medium cursor-pointer
             disabled:opacity-40 disabled:cursor-not-allowed"
      bind:value={currentWheelId}
      disabled={isSpinning}
    >
      {#each wheels as wheel (wheel.id)}
        <option value={wheel.id}>{wheel.name}</option>
      {/each}
    </select>
    <div class="pointer-events-none absolute inset-y-0 right-2.5 flex items-center">
      <svg
        class="h-3.5 w-3.5 text-base-content/40"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2.5"
          d="M19 9l-7 7-7-7"
        />
      </svg>
    </div>
  </div>

  <button
    class="btn-ghost-sm w-9 h-9 flex items-center justify-center p-0 text-lg font-light"
    onclick={oncreate}
    disabled={isSpinning}
    aria-label="New Wheel"
    title="Create new wheel"
  >
    +
  </button>

  <button
    class="btn-ghost-sm w-9 h-9 flex items-center justify-center p-0 text-sm
           hover:border-error/50 hover:text-error hover:bg-error/5"
    onclick={ondelete}
    disabled={isSpinning || wheels.length <= 1}
    aria-label="Delete Wheel"
    title="Delete current wheel"
  >
    ✕
  </button>
</div>
