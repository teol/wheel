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

<div class="w-full max-w-4xl mt-10">
  <div class="card bg-base-200 shadow-xl">
    <div class="card-body p-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="card-title text-lg font-bold gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5 text-primary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d={CLOCK_ICON_PATH} />
          </svg>
          Spin History
          {#if spinLogs.length > 0}
            <span class="badge badge-primary badge-sm">{spinLogs.length}</span>
          {/if}
        </h2>
        {#if spinLogs.length > 0}
          <button class="btn btn-ghost btn-xs text-base-content/50" onclick={onclear}>
            Clear
          </button>
        {/if}
      </div>

      {#if spinLogs.length === 0}
        <div class="flex flex-col items-center justify-center py-10 text-base-content/30 gap-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-10 w-10"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="1.5"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d={CLOCK_ICON_PATH} />
          </svg>
          <p class="text-sm">No spins yet. Spin the wheel to get started!</p>
        </div>
      {:else}
        <div class="overflow-x-auto">
          <table class="table table-sm">
            <thead>
              <tr class="text-base-content/50 text-xs uppercase tracking-wider">
                <th>#</th>
                <th>Result</th>
                <th>Wheel</th>
                <th>Fair</th>
                <th class="text-right">When</th>
              </tr>
            </thead>
            <tbody>
              {#each spinLogs as log, i (log.id)}
                <tr class="hover">
                  <td class="text-base-content/30 text-xs font-mono w-8">{i + 1}</td>
                  <td>
                    <div class="flex items-center gap-2">
                      <span
                        class="inline-block w-3 h-3 rounded-full flex-shrink-0"
                        style="background-color: {log.segmentColor};"
                      ></span>
                      <span class="font-semibold">{log.segmentText}</span>
                    </div>
                  </td>
                  <td>
                    <span class="badge badge-ghost badge-sm">{log.wheelName}</span>
                  </td>
                  <td>
                    {#if log.provablyFair}
                      <span class="text-success" title="Provably fair spin">
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
                      </span>
                    {:else}
                      <span class="text-base-content/20" title="Client-side random">—</span>
                    {/if}
                  </td>
                  <td class="text-right text-base-content/50 text-xs whitespace-nowrap">
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
</div>
