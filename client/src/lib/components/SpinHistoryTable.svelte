<script lang="ts">
  import type { SpinLog } from '../types.js';
  import { CLOCK_ICON_PATH } from '../constants.js';
  import { formatTimestamp } from '../utils/formatters.js';

  let {
    spinLogs,
    onclear,
  }: {
    spinLogs: SpinLog[];
    onclear: () => void;
  } = $props();
</script>

<div class="w-full max-w-4xl mt-12">
  <div class="card-gold rounded-xl overflow-hidden">
    <div class="p-6 pb-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <h2 class="section-title">Spin Ledger</h2>
          {#if spinLogs.length > 0}
            <span
              class="badge badge-primary badge-sm text-xs font-mono border-primary/20 text-primary/60 bg-primary/8"
            >
              {spinLogs.length}
            </span>
          {/if}
        </div>
        {#if spinLogs.length > 0}
          <button
            class="text-xs font-mono text-base-content/25 hover:text-error/60 transition-colors duration-150 tracking-wide"
            onclick={onclear}
          >
            Clear all
          </button>
        {/if}
      </div>
    </div>

    {#if spinLogs.length === 0}
      <div class="flex flex-col items-center justify-center py-14 text-base-content/20 gap-3">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-8 w-8 text-primary/15"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="1.2"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d={CLOCK_ICON_PATH} />
        </svg>
        <p
          class="text-sm tracking-wide"
          style="font-family: var(--font-display); font-style: italic;"
        >
          No spins yet — the ledger awaits
        </p>
      </div>
    {:else}
      <div class="overflow-x-auto">
        <table class="w-full table-ledger">
          <thead>
            <tr>
              <th class="px-6 py-3 text-left">#</th>
              <th class="px-6 py-3 text-left">Result</th>
              <th class="px-6 py-3 text-left">Wheel</th>
              <th class="px-6 py-3 text-left">Fair</th>
              <th class="px-6 py-3 text-right">When</th>
            </tr>
          </thead>
          <tbody>
            {#each spinLogs as log, i (log.id)}
              <tr>
                <td class="px-6 py-3 font-mono text-xs text-base-content/20 w-10">{i + 1}</td>
                <td class="px-6 py-3">
                  <div class="flex items-center gap-2.5">
                    <span
                      class="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0 ring-1 ring-black/20"
                      style="background-color: {log.segmentColor};"
                    ></span>
                    <span class="font-medium text-sm text-base-content/85">{log.segmentText}</span>
                  </div>
                </td>
                <td class="px-6 py-3">
                  <span
                    class="text-xs font-mono px-2 py-0.5 rounded border border-base-content/10 text-base-content/35 bg-base-content/4"
                  >
                    {log.wheelName}
                  </span>
                </td>
                <td class="px-6 py-3">
                  {#if log.provablyFair}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-4 w-4 text-success/60"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      title="Provably fair spin"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clip-rule="evenodd"
                      />
                    </svg>
                  {:else}
                    <span class="text-base-content/15 text-sm" title="Client-side random">—</span>
                  {/if}
                </td>
                <td
                  class="px-6 py-3 text-right font-mono text-xs text-base-content/30 whitespace-nowrap"
                >
                  {formatTimestamp(log.timestamp)}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>
</div>
