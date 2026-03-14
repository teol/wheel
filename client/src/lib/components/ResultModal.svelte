<script lang="ts">
  import type { Segment, ProvablyFairResult, VerifyResult } from '../types.js';
  import { trapFocus } from '$lib/actions/trapFocus.js';

  let {
    winningSegment,
    pfResult,
    pfVerifying,
    pfVerifyResult,
    onclose,
    onverify,
  }: {
    winningSegment: Segment | null;
    pfResult: ProvablyFairResult | null;
    pfVerifying: boolean;
    pfVerifyResult: VerifyResult | null;
    onclose: () => void;
    onverify: () => void;
  } = $props();

  let showPfDetails = $state(false);
  let closeButton = $state<HTMLButtonElement | null>(null);

  $effect(() => {
    if (closeButton) {
      closeButton.focus();
    }
  });
</script>

<div class="modal modal-open" role="dialog" aria-modal="true" tabindex="-1" use:trapFocus>
  <div class="modal-box text-center border-t-8 border-primary relative max-w-lg">
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

    {#if pfResult}
      <div class="mb-6 text-left">
        <button
          class="flex items-center gap-2 w-full text-sm font-semibold text-success mb-2"
          onclick={() => (showPfDetails = !showPfDetails)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clip-rule="evenodd"
            />
          </svg>
          Provably Fair
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-4 w-4 ml-auto transition-transform {showPfDetails ? 'rotate-180' : ''}"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {#if showPfDetails}
          <div class="bg-base-300 rounded-box p-4 text-xs font-mono space-y-3">
            <div>
              <p class="text-base-content/50 font-sans font-semibold mb-1">
                Server Seed (revealed)
              </p>
              <p class="break-all text-base-content/80">{pfResult.serverSeed}</p>
            </div>
            <div>
              <p class="text-base-content/50 font-sans font-semibold mb-1">
                Server Seed Hash (SHA-256)
              </p>
              <p class="break-all text-base-content/60">{pfResult.serverSeedHash}</p>
            </div>
            <div>
              <p class="text-base-content/50 font-sans font-semibold mb-1">Client Seed</p>
              <p class="break-all text-base-content/80">{pfResult.clientSeed}</p>
            </div>
            <div>
              <p class="text-base-content/50 font-sans font-semibold mb-1">Nonce</p>
              <p>{pfResult.nonce}</p>
            </div>
            <div class="pt-2 border-t border-base-content/10">
              <p class="font-sans text-base-content/50 text-xs mb-2">
                Verify: <span class="text-base-content/70"
                  >HMAC-SHA256(serverSeed, clientSeed:nonce) mod segments → index {pfResult.resultIndex}</span
                >
              </p>
              <button
                class="btn btn-xs btn-outline btn-success gap-1 font-sans"
                onclick={onverify}
                disabled={pfVerifying}
              >
                {#if pfVerifying}
                  <span class="loading loading-spinner loading-xs"></span>
                {:else}
                  Verify on server
                {/if}
              </button>

              {#if pfVerifyResult !== null}
                <div
                  class="mt-2 p-2 rounded font-sans {pfVerifyResult.valid
                    ? 'bg-success/10 text-success'
                    : 'bg-error/10 text-error'}"
                >
                  {#if pfVerifyResult.valid}
                    Result verified — this spin is provably fair.
                  {:else if pfVerifyResult.error}
                    {pfVerifyResult.error}
                  {:else}
                    Verification failed.
                    {#if !pfVerifyResult.hashValid}Hash mismatch.{/if}
                    {#if !pfVerifyResult.resultValid}Result mismatch.{/if}
                  {/if}
                </div>
              {/if}
            </div>
          </div>
        {/if}
      </div>
    {/if}

    <div class="modal-action justify-center mt-0">
      <button bind:this={closeButton} class="btn btn-primary btn-wide font-bold" onclick={onclose}>
        CLOSE
      </button>
    </div>
  </div>
  <button
    class="modal-backdrop border-none bg-transparent"
    aria-label="Close modal"
    tabindex="-1"
    onclick={onclose}
  ></button>
</div>
