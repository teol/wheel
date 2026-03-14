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

<div class="flex items-center gap-2 mb-4">
  <select class="select select-bordered flex-1" bind:value={currentWheelId} disabled={isSpinning}>
    {#each wheels as wheel (wheel.id)}
      <option value={wheel.id}>{wheel.name}</option>
    {/each}
  </select>
  <button
    class="btn btn-square btn-outline btn-primary"
    onclick={oncreate}
    disabled={isSpinning}
    aria-label="New Wheel"
    title="Create new wheel"
  >
    +
  </button>
  <button
    class="btn btn-square btn-outline btn-error"
    onclick={ondelete}
    disabled={isSpinning || wheels.length <= 1}
    aria-label="Delete Wheel"
    title="Delete current wheel"
  >
    ✕
  </button>
</div>
