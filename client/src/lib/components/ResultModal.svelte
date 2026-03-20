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

<div
  class="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop-clean"
  role="dialog"
  aria-modal="true"
  tabindex="-1"
  use:trapFocus
>
  <div class="card-sharp w-full max-w-md overflow-hidden">
    <!-- Pink top stripe -->
    <div class="h-1.5 w-full bg-primary"></div>

    <div class="p-8">
      <!-- Label -->
      <p class="label-section mb-4">we have a winner</p>

      <!-- Winner name -->
      <div
        class="rounded mb-6 p-6 text-center"
        style="background: {winningSegment?.color}15; border: 2px solid {winningSegment?.color}40;"
      >
        <p
          class="text-4xl font-extrabold break-words leading-tight"
          style="font-family: var(--font-display); color: {winningSegment?.color};"
        >
          {winningSegment?.text}
        </p>
      </div>

      <!-- Provably Fair section -->
      {#if pfResult}
        <div class="mb-6">
          <button
            class="flex items-center gap-2 w-full text-xs font-medium text-success hover:text-success/80 transition-colors mb-2"
            onclick={() => (showPfDetails = !showPfDetails)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-3.5 w-3.5"
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
              class="h-3.5 w-3.5 ml-auto transition-transform duration-200 {showPfDetails
                ? 'rotate-180'
                : ''}"
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
            <div
              class="bg-base-300 rounded p-4 text-xs font-mono space-y-3 border border-base-content/10"
            >
              <div>
                <p class="label-section mb-1 font-sans text-[0.6rem]">Server Seed</p>
                <p class="break-all text-base-content/70">{pfResult.serverSeed}</p>
              </div>
              <div>
                <p class="label-section mb-1 font-sans text-[0.6rem]">Server Seed Hash</p>
                <p class="break-all text-base-content/50">{pfResult.serverSeedHash}</p>
              </div>
              <div>
                <p class="label-section mb-1 font-sans text-[0.6rem]">Client Seed</p>
                <p class="break-all text-base-content/70">{pfResult.clientSeed}</p>
              </div>
              <div>
                <p class="label-section mb-1 font-sans text-[0.6rem]">Nonce</p>
                <p>{pfResult.nonce}</p>
              </div>
              <div class="pt-2 border-t border-base-content/10">
                <p class="font-sans text-base-content/40 text-xs mb-2 leading-relaxed">
                  HMAC-SHA256(serverSeed, clientSeed:nonce) mod segments → index {pfResult.resultIndex}
                </p>
                <button class="btn-ghost-sm text-xs" onclick={onverify} disabled={pfVerifying}>
                  {#if pfVerifying}
                    <span class="loading loading-spinner loading-xs mr-1"></span>Verifying…
                  {:else}
                    Verify on server
                  {/if}
                </button>

                {#if pfVerifyResult !== null}
                  <div
                    class="mt-2 p-2 rounded font-sans text-xs border {pfVerifyResult.valid
                      ? 'bg-success/8 text-success border-success/20'
                      : 'bg-error/8 text-error border-error/20'}"
                  >
                    {#if pfVerifyResult.valid}
                      ✓ Result verified — this spin is provably fair.
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

      <!-- Close button -->
      <button
        bind:this={closeButton}
        class="btn-spin w-full"
        style="min-width: unset;"
        onclick={onclose}
      >
        CLOSE
      </button>
    </div>
  </div>

  <button
    class="absolute inset-0 -z-10 w-full h-full border-none bg-transparent cursor-default"
    aria-label="Close modal"
    tabindex="-1"
    onclick={onclose}
  ></button>
</div>
