<script lang="ts">
  import { trapFocus } from '$lib/actions/trapFocus.js';

  let {
    wheelName,
    onconfirm,
    oncancel,
  }: {
    wheelName: string;
    onconfirm: () => void;
    oncancel: () => void;
  } = $props();

  let confirmCancelButton = $state<HTMLButtonElement | null>(null);

  $effect(() => {
    if (confirmCancelButton) {
      confirmCancelButton.focus();
    }
  });
</script>

<div
  class="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop-gold"
  role="dialog"
  aria-modal="true"
  tabindex="-1"
  use:trapFocus
>
  <div
    class="relative w-full max-w-sm rounded-2xl overflow-hidden"
    style="background: #111318; border: 1px solid rgba(122,24,24,0.3); box-shadow: 0 0 60px rgba(122,24,24,0.1), 0 20px 50px rgba(0,0,0,0.7);"
  >
    <!-- Red top accent -->
    <div
      class="h-1 w-full"
      style="background: linear-gradient(to right, transparent, #791818 30%, #C04040 50%, #791818 70%, transparent);"
    ></div>

    <div class="p-8 text-center">
      <h3
        class="uppercase tracking-[0.15em] text-base-content/70 mb-5 text-lg font-semibold"
        style="font-family: var(--font-display);"
      >
        Delete Wheel?
      </h3>
      <p class="text-sm text-base-content/45 leading-relaxed mb-8">
        This will permanently remove
        <strong class="text-error/70 font-semibold">"{wheelName}"</strong>.<br />
        This action cannot be undone.
      </p>
      <div class="flex gap-3">
        <button
          bind:this={confirmCancelButton}
          class="flex-1 py-2.5 rounded-lg text-sm font-medium border border-base-content/10 text-base-content/45
                 hover:border-base-content/25 hover:text-base-content/70 transition-all duration-150"
          onclick={oncancel}
        >
          Cancel
        </button>
        <button
          class="flex-1 py-2.5 rounded-lg text-sm font-medium
                 bg-error/12 text-error/75 border border-error/25
                 hover:bg-error/20 hover:border-error/45 hover:text-error
                 transition-all duration-150"
          onclick={onconfirm}
        >
          Delete
        </button>
      </div>
    </div>
  </div>

  <button
    class="absolute inset-0 -z-10 w-full h-full border-none bg-transparent cursor-default"
    aria-label="Close modal"
    tabindex="-1"
    onclick={oncancel}
  ></button>
</div>
