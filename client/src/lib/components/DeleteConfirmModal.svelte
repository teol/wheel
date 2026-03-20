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
  class="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop-clean"
  role="dialog"
  aria-modal="true"
  tabindex="-1"
  use:trapFocus
>
  <div class="card-sharp w-full max-w-sm overflow-hidden">
    <div class="h-1.5 w-full bg-error"></div>

    <div class="p-8">
      <p class="label-section mb-3" style="color: #e8003d;">Delete Wheel</p>
      <h3
        class="text-xl font-bold text-base-content mb-2"
        style="font-family: var(--font-display);"
      >
        Are you sure?
      </h3>
      <p class="text-sm text-base-content/50 mb-6 leading-relaxed">
        <strong class="text-base-content/80">"{wheelName}"</strong> will be gone forever. No take-backs.
      </p>
      <div class="flex gap-3">
        <button
          bind:this={confirmCancelButton}
          class="btn-ghost-sm flex-1 py-2.5"
          onclick={oncancel}
        >
          Cancel
        </button>
        <button
          class="flex-1 py-2.5 rounded text-sm font-semibold bg-error text-white border-2 border-error
                 hover:bg-error/90 transition-colors duration-150"
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
