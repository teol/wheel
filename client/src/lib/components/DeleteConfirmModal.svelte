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

<div class="modal modal-open" role="dialog" aria-modal="true" tabindex="-1" use:trapFocus>
  <div class="modal-box text-center border-t-8 border-error relative">
    <h3 class="font-bold text-xl text-base-content mb-4">Delete Wheel?</h3>
    <p class="py-4">
      Are you sure you want to delete <strong class="text-error">"{wheelName}"</strong>?
      <br />This action cannot be undone.
    </p>
    <div class="modal-action justify-center mt-4">
      <button bind:this={confirmCancelButton} class="btn btn-ghost" onclick={oncancel}>
        Cancel
      </button>
      <button class="btn btn-error" onclick={onconfirm}> Delete </button>
    </div>
  </div>
  <button
    class="modal-backdrop border-none bg-transparent"
    aria-label="Close modal"
    tabindex="-1"
    onclick={oncancel}
  ></button>
</div>
