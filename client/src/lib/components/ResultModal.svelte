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
  class="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop-gold"
  role="dialog"
  aria-modal="true"
  tabindex="-1"
  use:trapFocus
>
  <!-- Modal box -->
  <div
    class="relative w-full max-w-md rounded-2xl overflow-hidden"
    style="background: #111318; border: 1px solid rgba(201,152,58,0.25); box-shadow: 0 0 80px rgba(201,152,58,0.12), 0 25px 60px rgba(0,0,0,0.7);"
  >
    <!-- Gold top accent -->
    <div
      class="h-1 w-full"
      style="background: linear-gradient(to right, transparent, #C9983A 30%, #F0D080 50%, #C9983A 70%, transparent);"
    ></div>

    <div class="p-8 text-center">
      <!-- Title -->
      <p class="text-xs font-mono tracking-[0.4em] uppercase text-primary/40 mb-3">
        ✦ &nbsp; ✦ &nbsp; ✦
      </p>
      <h3
        class="uppercase tracking-[0.18em] text-base-content/50 mb-7 text-sm font-medium"
        style="font-family: var(--font-display);"
      >
        The Wheel Speaks
      </h3>

      <!-- Winner display -->
      <div
        class="relative rounded-xl p-8 mb-7 overflow-hidden"
        style="background: rgba(26,29,38,0.6); border: 1px solid rgba(201,152,58,0.1);"
      >
        <!-- Color glow -->
        <div
          class="absolute inset-0 opacity-8 pointer-events-none"
          style="background: radial-gradient(ellipse at center, {winningSegment?.color} 0%, transparent 70%);"
        ></div>
        <p
          class="text-5xl font-bold break-words relative z-10 leading-tight"
          style="font-family: var(--font-display); color: {winningSegment?.color}; text-shadow: 0 0 30px {winningSegment?.color}55, 0 2px 6px rgba(0,0,0,0.6);"
        >
          {winningSegment?.text}
        </p>
      </div>

      <!-- Provably Fair section -->
      {#if pfResult}
        <div class="mb-7 text-left">
          <button
            class="flex items-center gap-2 w-full text-xs font-mono text-success/60 hover:text-success/80 transition-colors mb-2"
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
              class="rounded-xl p-4 text-xs font-mono space-y-3"
              style="background: rgba(26,29,38,0.8); border: 1px solid rgba(201,152,58,0.1);"
            >
              <div>
                <p class="text-primary/40 font-sans text-xs uppercase tracking-widest mb-1">
                  Server Seed
                </p>
                <p class="break-all text-base-content/60">{pfResult.serverSeed}</p>
              </div>
              <div>
                <p class="text-primary/40 font-sans text-xs uppercase tracking-widest mb-1">
                  Server Seed Hash
                </p>
                <p class="break-all text-base-content/40">{pfResult.serverSeedHash}</p>
              </div>
              <div>
                <p class="text-primary/40 font-sans text-xs uppercase tracking-widest mb-1">
                  Client Seed
                </p>
                <p class="break-all text-base-content/60">{pfResult.clientSeed}</p>
              </div>
              <div>
                <p class="text-primary/40 font-sans text-xs uppercase tracking-widest mb-1">
                  Nonce
                </p>
                <p>{pfResult.nonce}</p>
              </div>
              <div class="pt-3 border-t border-white/5">
                <p class="font-sans text-base-content/35 text-xs mb-3 leading-relaxed">
                  HMAC-SHA256(serverSeed, clientSeed:nonce) mod segments → index {pfResult.resultIndex}
                </p>
                <button
                  class="text-xs font-mono border border-success/25 text-success/60 px-3 py-1.5 rounded
                         hover:border-success/45 hover:text-success/80 disabled:opacity-30
                         disabled:cursor-not-allowed transition-all duration-150"
                  onclick={onverify}
                  disabled={pfVerifying}
                >
                  {#if pfVerifying}
                    <span class="loading loading-spinner loading-xs mr-1"></span>Verifying…
                  {:else}
                    Verify on server
                  {/if}
                </button>

                {#if pfVerifyResult !== null}
                  <div
                    class="mt-3 p-2.5 rounded font-sans text-xs {pfVerifyResult.valid
                      ? 'bg-success/8 text-success/80 border border-success/15'
                      : 'bg-error/8 text-error/80 border border-error/15'}"
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

  <!-- Backdrop click -->
  <button
    class="absolute inset-0 -z-10 w-full h-full border-none bg-transparent cursor-default"
    aria-label="Close modal"
    tabindex="-1"
    onclick={onclose}
  ></button>
</div>
