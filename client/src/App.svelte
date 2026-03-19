<script lang="ts">
  import { onMount } from 'svelte';
  import gsap from 'gsap';
  import confetti from 'canvas-confetti';

  import type {
    Wheel,
    Segment,
    SpinLog,
    ProvablyFairSession,
    ProvablyFairResult,
    VerifyResult,
  } from './lib/types.js';
  import {
    PALETTE,
    MAX_SPIN_LOGS,
    CONFETTI_CONFIG,
    CONFETTI_FALLBACK_COLOR,
    CONFETTI_ACCENT_COLORS,
  } from './lib/constants.js';
  import { isWheel, isSpinLog } from './lib/utils/typeGuards.js';
  import { computeTargetRotation, getIndexFromRotation } from './lib/utils/wheelMath.js';
  import { initAudio, playTickSound, playTadaSound } from './lib/utils/audio.js';
  import { generateClientSeed, truncateHash } from './lib/utils/formatters.js';

  import WheelCanvas from './lib/components/WheelCanvas.svelte';
  import WheelSelector from './lib/components/WheelSelector.svelte';
  import SegmentEditor from './lib/components/SegmentEditor.svelte';
  import SpinHistoryTable from './lib/components/SpinHistoryTable.svelte';
  import ResultModal from './lib/components/ResultModal.svelte';
  import DeleteConfirmModal from './lib/components/DeleteConfirmModal.svelte';

  let canvasEl = $state<HTMLCanvasElement | null>(null);

  let wheels = $state<Wheel[]>([]);
  let currentWheelId = $state<string>('');

  let currentWheelIndex = $derived(
    Math.max(
      0,
      wheels.findIndex((w) => w.id === currentWheelId)
    )
  );

  let currentRotation = $state(0);
  let isSpinning = $state(false);
  let showResultModal = $state(false);
  let winningSegment = $state<Segment | null>(null);

  let spinLogs = $state<SpinLog[]>([]);

  // Provably Fair state
  let pfSession = $state<ProvablyFairSession | null>(null);
  let pfSessionLoading = $state(false);
  let pfResult = $state<ProvablyFairResult | null>(null);
  let pfServerAvailable = $state(true);
  let pfVerifyResult = $state<VerifyResult | null>(null);
  let pfVerifying = $state(false);
  let pfClientSeed = $state(generateClientSeed());

  // Toast state
  let toastMessage = $state<string | null>(null);
  let toastType = $state<'success' | 'error'>('success');
  let toastTimeoutId: ReturnType<typeof setTimeout> | undefined;

  let showConfirmDeleteModal = $state(false);

  function showToast(message: string, type: 'success' | 'error' = 'success') {
    clearTimeout(toastTimeoutId);
    toastMessage = message;
    toastType = type;
    toastTimeoutId = setTimeout(() => {
      toastMessage = null;
    }, 3000);
  }

  async function initProvablyFair() {
    if (pfSessionLoading) return;
    pfSessionLoading = true;
    try {
      const res = await fetch('/api/provably-fair/init', { method: 'POST' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      pfSession = (await res.json()) as ProvablyFairSession;
      pfServerAvailable = true;
    } catch (e) {
      console.error('Failed to initialise provably fair session:', e);
      pfSession = null;
      pfServerAvailable = false;
    } finally {
      pfSessionLoading = false;
    }
  }

  async function verifyPfResult() {
    if (!pfResult) return;
    pfVerifying = true;
    pfVerifyResult = null;
    try {
      const segments = wheels[currentWheelIndex]?.segments ?? [];
      const res = await fetch('/api/provably-fair/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serverSeed: pfResult.serverSeed,
          serverSeedHash: pfResult.serverSeedHash,
          clientSeed: pfResult.clientSeed,
          nonce: pfResult.nonce,
          resultIndex: pfResult.resultIndex,
          totalSegments: segments.length,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      pfVerifyResult = (await res.json()) as VerifyResult;
    } catch (e) {
      console.error('Failed to verify provably fair result:', e);
      pfVerifyResult = { valid: false, error: 'Verification request failed.' };
    } finally {
      pfVerifying = false;
    }
  }

  async function spinWheel() {
    const segments = wheels[currentWheelIndex]?.segments || [];
    if (isSpinning || segments.length === 0 || !canvasEl) return;
    isSpinning = true;
    pfResult = null;
    pfVerifyResult = null;
    initAudio();

    let targetRotation: number | undefined;
    let spinPfResult: ProvablyFairResult | null = null;

    if (pfSession && pfServerAvailable) {
      try {
        const res = await fetch('/api/provably-fair/spin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: pfSession.sessionId,
            clientSeed: pfClientSeed,
            totalSegments: segments.length,
          }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as {
          resultIndex: number;
          serverSeed: string;
          serverSeedHash: string;
          clientSeed: string;
          nonce: number;
        };
        spinPfResult = {
          serverSeed: data.serverSeed,
          serverSeedHash: data.serverSeedHash,
          clientSeed: data.clientSeed,
          nonce: data.nonce,
          resultIndex: data.resultIndex,
        };
        targetRotation = computeTargetRotation(currentRotation, data.resultIndex, segments.length);
      } catch (e) {
        console.error('Provably fair spin failed, falling back to client-side random:', e);
        showToast('Provably fair spin failed. Result uses client-side randomness.', 'error');
      }
    }

    if (targetRotation === undefined) {
      const randomExtraDegrees = Math.floor(Math.random() * 360);
      targetRotation = currentRotation + 1800 + randomExtraDegrees;
    }

    currentRotation = targetRotation;

    let lastTickIndex = -1;

    gsap.to(canvasEl, {
      rotation: currentRotation,
      duration: 4,
      ease: 'power4.out',
      onUpdate: () => {
        const currentAnimRotation = gsap.getProperty(canvasEl!, 'rotation') as number;
        const currentIndex = getIndexFromRotation(currentAnimRotation, segments.length);
        if (lastTickIndex !== -1 && currentIndex !== lastTickIndex) playTickSound();
        lastTickIndex = currentIndex;
      },
      onComplete: () => {
        isSpinning = false;
        playTadaSound();

        const winningIndex = getIndexFromRotation(currentRotation, segments.length);
        winningSegment = segments[winningIndex];
        pfResult = spinPfResult;
        showResultModal = true;

        const segmentColor = winningSegment?.color ?? CONFETTI_FALLBACK_COLOR;
        confetti({ ...CONFETTI_CONFIG, colors: [segmentColor, ...CONFETTI_ACCENT_COLORS] });

        spinLogs = [
          {
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            wheelName: wheels[currentWheelIndex].name,
            segmentText: winningSegment!.text,
            segmentColor: winningSegment!.color,
            provablyFair: spinPfResult ?? undefined,
          },
          ...spinLogs.slice(0, MAX_SPIN_LOGS - 1),
        ];

        pfClientSeed = generateClientSeed();
        initProvablyFair();
      },
    });
  }

  function createNewWheel() {
    const newWheelId = crypto.randomUUID();
    wheels = [
      ...wheels,
      {
        id: newWheelId,
        name: `Wheel #${wheels.length + 1}`,
        segments: [
          { id: crypto.randomUUID(), text: 'Option 1', color: PALETTE[0] },
          { id: crypto.randomUUID(), text: 'Option 2', color: PALETTE[1] },
          { id: crypto.randomUUID(), text: 'Option 3', color: PALETTE[2] },
        ],
      },
    ];
    currentWheelId = newWheelId;
  }

  function confirmDeleteCurrentWheel() {
    if (wheels.length <= 1) {
      showToast('You cannot delete the last wheel!', 'error');
      return;
    }
    showConfirmDeleteModal = true;
  }

  function executeDeleteWheel() {
    const deletedWheelName = wheels[currentWheelIndex].name;
    const deletedWheelIndex = currentWheelIndex;
    wheels = wheels.filter((w) => w.id !== currentWheelId);
    const newIndex = Math.min(deletedWheelIndex, wheels.length - 1);
    currentWheelId = wheels[newIndex].id;
    showToast(`Wheel "${deletedWheelName}" deleted`, 'success');
    showConfirmDeleteModal = false;
  }

  function loadInitialState() {
    const savedWheels = localStorage.getItem('wheels-data');
    if (savedWheels) {
      try {
        const parsed = JSON.parse(savedWheels);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed.every(isWheel)) {
          wheels = parsed;
          currentWheelId = wheels[0].id;
        }
      } catch (e) {
        console.error('Error parsing wheels from localStorage', e);
      }
    }

    const savedLogs = localStorage.getItem('wheel-spin-logs');
    if (savedLogs) {
      try {
        const parsed = JSON.parse(savedLogs);
        if (Array.isArray(parsed)) spinLogs = parsed.filter(isSpinLog);
      } catch (e) {
        console.error('Error parsing spin logs from localStorage', e);
      }
    }

    if (wheels.length === 0) {
      const savedSegments = localStorage.getItem('wheel-segments');
      let legacySegments: Segment[] = [];
      if (savedSegments) {
        try {
          const parsed = JSON.parse(savedSegments);
          if (
            Array.isArray(parsed) &&
            parsed.every(
              (item) => item && typeof item.text === 'string' && typeof item.color === 'string'
            )
          ) {
            legacySegments = parsed.map((s) => ({
              id: typeof s.id === 'string' && s.id.trim() !== '' ? s.id : crypto.randomUUID(),
              text: s.text,
              color: s.color,
            }));
          }
        } catch (e) {
          console.error('Error parsing legacy segments', e);
        }
      }

      if (legacySegments.length > 0) {
        wheels = [{ id: crypto.randomUUID(), name: 'My First Wheel', segments: legacySegments }];
      } else {
        wheels = [
          {
            id: crypto.randomUUID(),
            name: 'Food Wheel',
            segments: [
              { id: crypto.randomUUID(), text: 'Pizza', color: PALETTE[0] },
              { id: crypto.randomUUID(), text: 'Burger', color: PALETTE[1] },
              { id: crypto.randomUUID(), text: 'Sushi', color: PALETTE[2] },
              { id: crypto.randomUUID(), text: 'Pasta', color: PALETTE[3] },
              { id: crypto.randomUUID(), text: 'Ramen', color: PALETTE[4] },
            ],
          },
        ];
      }
      currentWheelId = wheels[0].id;
    }
  }

  onMount(() => {
    loadInitialState();

    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showResultModal) showResultModal = false;
    };
    window.addEventListener('keydown', handleKeydown);
    initProvablyFair();
    return () => {
      window.removeEventListener('keydown', handleKeydown);
      clearTimeout(toastTimeoutId);
    };
  });

  $effect(() => {
    localStorage.setItem('wheel-spin-logs', JSON.stringify(spinLogs));
  });

  $effect(() => {
    if (wheels.length > 0) localStorage.setItem('wheels-data', JSON.stringify(wheels));
  });
</script>

<main
  class="relative z-10 min-h-screen text-base-content flex flex-col items-center px-4 pt-10 pb-20"
>
  <!-- Header -->
  <header class="text-center mb-10 select-none">
    <p class="text-xs tracking-[0.5em] uppercase font-mono text-primary/40 mb-4">
      ✦ &nbsp; ✦ &nbsp; ✦
    </p>
    <h1
      class="title-gold text-5xl md:text-6xl font-bold tracking-[0.1em] uppercase leading-none mb-3"
    >
      Fortune Wheel
    </h1>
    <p class="text-xs text-base-content/30 tracking-[0.3em] uppercase font-light mt-3">
      Spin your fate
    </p>
    <div class="divider-gold w-48 mx-auto mt-5"></div>
  </header>

  <!-- Main layout -->
  <div class="flex flex-col md:flex-row gap-8 w-full max-w-4xl justify-center items-start">
    <!-- Left: Wheel + Spin -->
    <div class="flex flex-col items-center">
      <WheelCanvas
        segments={wheels[currentWheelIndex]?.segments ?? []}
        bind:canvasElement={canvasEl}
      />

      <div class="flex flex-col items-center gap-4 -mt-2">
        <button class="btn-spin" onclick={spinWheel} disabled={isSpinning}>
          {isSpinning ? '— Spinning —' : 'Spin the Wheel'}
        </button>

        <!-- Provably Fair badge -->
        <div class="flex items-center gap-2">
          {#if pfServerAvailable}
            <span class="badge-fair" title="Server seed hash committed before this spin">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-3 w-3"
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
            </span>
            {#if pfSession}
              <span
                class="font-mono text-xs text-base-content/25"
                title="SHA-256 hash of the server seed"
              >
                {truncateHash(pfSession.serverSeedHash)}
              </span>
            {:else if pfSessionLoading}
              <span class="loading loading-dots loading-xs text-primary/40"></span>
            {/if}
          {:else}
            <span class="badge-offline">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-3 w-3"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clip-rule="evenodd"
                />
              </svg>
              Server offline
            </span>
          {/if}
        </div>
      </div>
    </div>

    <!-- Right: Control Panel -->
    <div class="card-gold rounded-xl p-6 w-full max-w-sm">
      <WheelSelector
        {wheels}
        bind:currentWheelId
        {isSpinning}
        oncreate={createNewWheel}
        ondelete={confirmDeleteCurrentWheel}
      />

      {#if wheels[currentWheelIndex]}
        <SegmentEditor
          bind:wheel={wheels[currentWheelIndex]}
          {isSpinning}
          {pfServerAvailable}
          bind:pfClientSeed
        />
      {/if}
    </div>
  </div>

  <SpinHistoryTable {spinLogs} onclear={() => (spinLogs = [])} />
</main>

{#if showResultModal}
  <ResultModal
    {winningSegment}
    {pfResult}
    {pfVerifying}
    {pfVerifyResult}
    onclose={() => (showResultModal = false)}
    onverify={verifyPfResult}
  />
{/if}

{#if showConfirmDeleteModal}
  <DeleteConfirmModal
    wheelName={wheels[currentWheelIndex]?.name ?? ''}
    onconfirm={executeDeleteWheel}
    oncancel={() => (showConfirmDeleteModal = false)}
  />
{/if}

{#if toastMessage}
  <div class="fixed top-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
    <div
      class="px-5 py-3 rounded-lg font-mono text-sm tracking-wide border shadow-2xl
        {toastType === 'error'
        ? 'bg-error/15 text-error border-error/30'
        : 'bg-success/15 text-success border-success/30'}"
    >
      {toastMessage}
    </div>
  </div>
{/if}
