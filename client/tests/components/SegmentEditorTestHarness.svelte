<script lang="ts">
  import SegmentEditor from '../../src/lib/components/SegmentEditor.svelte';
  import type { Wheel } from '../../src/lib/types.js';

  let {
    initialWheel,
    isSpinning,
    pfServerAvailable,
    pfClientSeed,
  }: {
    initialWheel: Wheel;
    isSpinning: boolean;
    pfServerAvailable: boolean;
    pfClientSeed: string;
  } = $props();

  let wheel = $state<Wheel>(initialWheel);
  let seed = $state(pfClientSeed);
</script>

<SegmentEditor bind:wheel {isSpinning} {pfServerAvailable} bind:pfClientSeed={seed} />
