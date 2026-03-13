<script lang="ts">
  import { onMount } from 'svelte';
  import gsap from 'gsap';
  import confetti from 'canvas-confetti';

  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D | null;

  type Segment = { id: string; text: string; color: string };
  type Wheel = { id: string; name: string; segments: Segment[] };
  type SpinLog = {
    id: string;
    timestamp: number;
    wheelName: string;
    segmentText: string;
    segmentColor: string;
    provablyFair?: ProvablyFairResult;
  };

  type ProvablyFairSession = {
    sessionId: string;
    serverSeedHash: string;
    nonce: number;
  };

  type ProvablyFairResult = {
    serverSeed: string;
    serverSeedHash: string;
    clientSeed: string;
    nonce: number;
    resultIndex: number;
  };

  function isSegment(s: unknown): s is Segment {
    if (typeof s !== 'object' || s === null) return false;
    const obj = s as Record<string, unknown>;
    return (
      typeof obj.id === 'string' && typeof obj.text === 'string' && typeof obj.color === 'string'
    );
  }

  function isWheel(w: unknown): w is Wheel {
    if (typeof w !== 'object' || w === null) return false;
    const obj = w as Record<string, unknown>;
    return (
      typeof obj.id === 'string' &&
      typeof obj.name === 'string' &&
      Array.isArray(obj.segments) &&
      obj.segments.every(isSegment)
    );
  }

  function isSpinLog(log: unknown): log is SpinLog {
    if (typeof log !== 'object' || log === null) return false;
    const obj = log as Record<string, unknown>;
    return (
      typeof obj.id === 'string' &&
      typeof obj.timestamp === 'number' &&
      typeof obj.wheelName === 'string' &&
      typeof obj.segmentText === 'string' &&
      typeof obj.segmentColor === 'string'
    );
  }

  const MAX_SPIN_LOGS = 50;
  const CLOCK_ICON_PATH = 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z';

  const CONFETTI_FALLBACK_COLOR = '#F59E0B';
  const CONFETTI_ACCENT_COLORS = ['#ffffff', '#FFD700'];
  const CONFETTI_CONFIG = {
    particleCount: 150,
    spread: 80,
    origin: { y: 0.5 },
    startVelocity: 45,
    gravity: 0.9,
    scalar: 1.1,
  };

  const PALETTE = [
    '#EF4444', // Red
    '#3B82F6', // Blue
    '#10B981', // Emerald
    '#F59E0B', // Amber
    '#8B5CF6', // Violet
    '#EC4899', // Pink
    '#14B8A6', // Teal
    '#F43F5E', // Rose
    '#84CC16', // Lime
    '#6366F1', // Indigo
    '#D946EF', // Fuchsia
    '#0EA5E9', // Sky
    '#F97316', // Orange
    '#06B6D4', // Cyan
    '#EAB308', // Yellow
    '#A855F7', // Purple
    '#34D399', // Emerald lighter
    '#FB923C', // Orange lighter
    '#2DD4BF', // Teal lighter
    '#FBBF24', // Amber lighter
    '#C084FC', // Purple lighter
    '#F472B6', // Pink lighter
    '#4ADE80', // Green lighter
    '#38BDF8', // Cyan lighter
  ];

  let wheels = $state<Wheel[]>([]);
  let currentWheelId = $state<string>('');

  let currentWheelIndex = $derived(
    Math.max(
      0,
      wheels.findIndex((w) => w.id === currentWheelId)
    )
  );

  let newSegmentText = $state('');

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
  let showPfDetails = $state(false);
  let pfVerifyResult = $state<{
    valid: boolean;
    hashValid: boolean;
    resultValid: boolean;
  } | null>(null);
  let pfVerifying = $state(false);
  let pfClientSeed = $state(generateClientSeed());

  // Web Audio API Context
  let audioCtx: AudioContext | null = null;

  function generateClientSeed(): string {
    return Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  function truncateHash(hash: string, chars = 16): string {
    return hash.slice(0, chars) + '…';
  }

  async function initProvablyFair() {
    if (pfSessionLoading) return;
    pfSessionLoading = true;
    try {
      const res = await fetch('/api/provably-fair/init', { method: 'POST' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as ProvablyFairSession;
      pfSession = data;
      pfServerAvailable = true;
    } catch {
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
      pfVerifyResult = (await res.json()) as {
        valid: boolean;
        hashValid: boolean;
        resultValid: boolean;
      };
    } catch {
      pfVerifyResult = { valid: false, hashValid: false, resultValid: false };
    } finally {
      pfVerifying = false;
    }
  }

  function initAudio() {
    if (!audioCtx) {
      const win = window as unknown as {
        AudioContext: typeof AudioContext;
        webkitAudioContext: typeof AudioContext;
      };
      audioCtx = new (win.AudioContext || win.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playTickSound() {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(400, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.05);

    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.05);
  }

  function playTadaSound() {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(400, audioCtx.currentTime);
    osc.frequency.setValueAtTime(600, audioCtx.currentTime + 0.1);
    osc.frequency.setValueAtTime(800, audioCtx.currentTime + 0.2);

    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.6);

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.6);
  }

  onMount(() => {
    ctx = canvas.getContext('2d');

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
        if (Array.isArray(parsed)) {
          spinLogs = parsed.filter(isSpinLog);
        }
      } catch (e) {
        console.error('Error parsing spin logs from localStorage', e);
      }
    }

    if (wheels.length === 0) {
      // Migrate legacy segments if any
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

    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showResultModal) {
        showResultModal = false;
      }
    };

    window.addEventListener('keydown', handleKeydown);

    // Pre-fetch initial provably fair session
    initProvablyFair();

    return () => {
      window.removeEventListener('keydown', handleKeydown);
    };
  });

  $effect(() => {
    localStorage.setItem('wheel-spin-logs', JSON.stringify(spinLogs));
  });

  $effect(() => {
    if (wheels.length > 0) {
      localStorage.setItem('wheels-data', JSON.stringify(wheels));
    }
    // Dependency to trigger draw on changes
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _currentWheel = wheels[currentWheelIndex];
    drawWheel();
  });

  function drawWheel() {
    if (!ctx || !canvas) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 140;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const segments = wheels[currentWheelIndex]?.segments || [];

    if (segments.length === 0) {
      // Draw empty wheel
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.fillStyle = '#4B5563';
      ctx.fill();
      return;
    }

    const sliceAngle = (2 * Math.PI) / segments.length;
    const startOffset = -Math.PI / 2; // Start from the top (12 o'clock)

    segments.forEach((segment, i) => {
      const startAngle = startOffset + i * sliceAngle;
      const endAngle = startOffset + (i + 1) * sliceAngle;

      ctx!.beginPath();
      ctx!.moveTo(centerX, centerY);
      ctx!.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx!.lineTo(centerX, centerY);
      ctx!.closePath();

      ctx!.fillStyle = segment.color;
      ctx!.fill();
      ctx!.lineWidth = 2;
      ctx!.strokeStyle = '#1F2937';
      ctx!.stroke();

      // Add text
      ctx!.save();
      ctx!.translate(centerX, centerY);
      ctx!.rotate(startAngle + sliceAngle / 2);
      ctx!.textAlign = 'right';
      ctx!.textBaseline = 'middle';
      ctx!.fillStyle = '#FFFFFF';
      ctx!.font = 'bold 16px sans-serif';
      ctx!.fillText(segment.text, radius - 20, 0);
      ctx!.restore();
    });

    // Draw outer border
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#1F2937';
    ctx.stroke();

    // Draw center dot
    ctx.beginPath();
    ctx.arc(centerX, centerY, 15, 0, 2 * Math.PI);
    ctx.fillStyle = '#1F2937';
    ctx.fill();
  }

  function getIndexFromRotation(rotationDegrees: number, totalSegments: number): number {
    if (totalSegments === 0) return -1;
    const sliceAngleDeg = 360 / totalSegments;
    const normalizedRotation = rotationDegrees % 360;
    const pointerAngle = (360 - normalizedRotation) % 360;
    return Math.floor(pointerAngle / sliceAngleDeg);
  }

  /**
   * Computes the target rotation (degrees) that will make the canvas pointer
   * land on `targetIndex` after at least 5 full extra rotations.
   */
  function computeTargetRotation(
    curRotation: number,
    targetIndex: number,
    totalSegments: number
  ): number {
    const sliceAngle = 360 / totalSegments;
    // Place pointer in the midpoint of the target segment
    const targetMod = (360 - (targetIndex + 0.5) * sliceAngle + 360) % 360;
    const minRotation = curRotation + 1800;
    const fullTurns = Math.ceil((minRotation - targetMod) / 360);
    const newRotation = fullTurns * 360 + targetMod;
    return newRotation > minRotation ? newRotation : newRotation + 360;
  }

  function formatTimestamp(ts: number): string {
    const date = new Date(ts);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isYesterday =
      new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).toDateString() ===
      date.toDateString();
    const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (isToday) return `Today at ${time}`;
    if (isYesterday) return `Yesterday at ${time}`;
    return (
      date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) +
      ` at ${time}`
    );
  }

  function clearLogs() {
    spinLogs = [];
  }

  async function spinWheel() {
    const segments = wheels[currentWheelIndex]?.segments || [];
    if (isSpinning || segments.length === 0) return;
    isSpinning = true;
    pfResult = null;
    pfVerifyResult = null;
    initAudio();

    let targetRotation: number;
    let spinPfResult: ProvablyFairResult | null = null;

    // --- Provably Fair path ---
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
      } catch {
        // Fall back to client-side random
        spinPfResult = null;
        const randomExtraDegrees = Math.floor(Math.random() * 360);
        targetRotation = currentRotation + 1800 + randomExtraDegrees;
      }
    } else {
      // No server available — use client-side random
      const randomExtraDegrees = Math.floor(Math.random() * 360);
      targetRotation = currentRotation + 1800 + randomExtraDegrees;
    }

    currentRotation = targetRotation;

    let lastTickIndex = -1;

    gsap.to(canvas, {
      rotation: currentRotation,
      duration: 4,
      ease: 'power4.out',
      onUpdate: () => {
        const currentAnimRotation = gsap.getProperty(canvas, 'rotation') as number;
        const currentIndex = getIndexFromRotation(currentAnimRotation, segments.length);

        if (lastTickIndex !== -1 && currentIndex !== lastTickIndex) {
          playTickSound();
        }
        lastTickIndex = currentIndex;
      },
      onComplete: () => {
        isSpinning = false;
        playTadaSound();

        const winningIndex = getIndexFromRotation(currentRotation, segments.length);
        winningSegment = segments[winningIndex];
        pfResult = spinPfResult;
        showPfDetails = false;
        showResultModal = true;

        const segmentColor = winningSegment?.color ?? CONFETTI_FALLBACK_COLOR;
        confetti({
          ...CONFETTI_CONFIG,
          colors: [segmentColor, ...CONFETTI_ACCENT_COLORS],
        });

        spinLogs = [
          {
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            wheelName: wheels[currentWheelIndex].name,
            segmentText: winningSegment!.text,
            segmentColor: winningSegment!.color,
            provablyFair: pfResult ?? undefined,
          },
          ...spinLogs.slice(0, MAX_SPIN_LOGS - 1),
        ];

        // Pre-fetch next session and rotate client seed
        pfClientSeed = generateClientSeed();
        initProvablyFair();
      },
    });
  }

  function getNextColor() {
    const segments = wheels[currentWheelIndex]?.segments || [];
    const usedColors = new Set(segments.map((s) => s.color));
    const availableColor = PALETTE.find((c) => !usedColors.has(c));
    if (availableColor) return availableColor;
    return PALETTE[segments.length % PALETTE.length];
  }

  function addSegment() {
    if (newSegmentText.trim() && wheels[currentWheelIndex]) {
      wheels[currentWheelIndex].segments = [
        ...wheels[currentWheelIndex].segments,
        {
          id: crypto.randomUUID(),
          text: newSegmentText.trim(),
          color: getNextColor(),
        },
      ];
      newSegmentText = '';
    }
  }

  function removeSegment(id: string) {
    if (wheels[currentWheelIndex]) {
      wheels[currentWheelIndex].segments = wheels[currentWheelIndex].segments.filter(
        (s) => s.id !== id
      );
    }
  }

  function handleKeypress(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      addSegment();
    }
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

  let showConfirmDeleteModal = $state(false);

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

  let toastMessage = $state<string | null>(null);
  let toastType = $state<'success' | 'error'>('success');

  function showToast(message: string, type: 'success' | 'error' = 'success') {
    toastMessage = message;
    toastType = type;
    setTimeout(() => {
      if (toastMessage === message) {
        toastMessage = null;
      }
    }, 3000);
  }

  let closeButton = $state<HTMLButtonElement | null>(null);
  let modalRef = $state<HTMLDivElement | null>(null);

  let confirmCancelButton = $state<HTMLButtonElement | null>(null);
  let confirmModalRef = $state<HTMLDivElement | null>(null);

  $effect(() => {
    if (showResultModal && closeButton) {
      closeButton.focus();
    }
    if (showConfirmDeleteModal && confirmCancelButton) {
      confirmCancelButton.focus();
    }
  });

  const handleModalKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault();
    }
  };

  const handleConfirmModalKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Tab') {
      // Focus trap for the confirm modal (2 buttons)
      e.preventDefault();
      // Simple toggle since there's only two buttons
      if (document.activeElement === confirmCancelButton) {
        // Find the other button (delete button)
        const deleteBtn = confirmModalRef?.querySelector('.btn-error') as HTMLButtonElement;
        deleteBtn?.focus();
      } else {
        confirmCancelButton?.focus();
      }
    }
  };
</script>

<main class="min-h-screen bg-base-100 text-base-content flex flex-col items-center p-4 py-12">
  <h1 class="text-4xl font-bold mb-8 text-primary">Custom Wheel Creator</h1>

  <div class="flex flex-col md:flex-row gap-12 w-full max-w-4xl justify-center items-start">
    <div class="flex flex-col items-center">
      <div class="relative card bg-base-200 shadow-xl p-8 mb-8">
        <!-- Pointer -->
        <div
          class="absolute top-4 left-1/2 -translate-x-1/2 z-10 w-0 h-0 border-l-[12px] border-r-[12px] border-t-[24px] border-transparent border-t-primary filter drop-shadow-md"
        ></div>

        <canvas
          bind:this={canvas}
          width="300"
          height="300"
          class="rounded-full shadow-2xl origin-center"
        ></canvas>
      </div>

      <div class="flex flex-col items-center gap-3">
        <button class="btn btn-primary btn-lg font-bold" onclick={spinWheel} disabled={isSpinning}>
          {isSpinning ? 'Spinning...' : 'SPIN THE WHEEL!'}
        </button>

        <!-- Provably Fair badge -->
        <div class="flex items-center gap-2 text-xs text-base-content/50">
          {#if pfServerAvailable}
            <span
              class="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-success/10 text-success border border-success/20 font-mono"
              title="Server seed hash committed before this spin"
            >
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
              <span class="font-mono opacity-60" title="SHA-256 hash of the server seed">
                {truncateHash(pfSession.serverSeedHash)}
              </span>
            {:else if pfSessionLoading}
              <span class="loading loading-dots loading-xs"></span>
            {/if}
          {:else}
            <span
              class="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-warning/10 text-warning border border-warning/20"
            >
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
              Server offline — client random
            </span>
          {/if}
        </div>
      </div>
    </div>

    <div class="card bg-base-200 shadow-xl p-6 w-full max-w-sm">
      <div class="flex items-center gap-2 mb-4">
        <select
          class="select select-bordered flex-1"
          bind:value={currentWheelId}
          disabled={isSpinning}
        >
          {#each wheels as wheel (wheel.id)}
            <option value={wheel.id}>{wheel.name}</option>
          {/each}
        </select>
        <button
          class="btn btn-square btn-outline btn-primary"
          onclick={createNewWheel}
          disabled={isSpinning}
          aria-label="New Wheel"
          title="Create new wheel"
        >
          +
        </button>
        <button
          class="btn btn-square btn-outline btn-error"
          onclick={confirmDeleteCurrentWheel}
          disabled={isSpinning || wheels.length <= 1}
          aria-label="Delete Wheel"
          title="Delete current wheel"
        >
          ✕
        </button>
      </div>

      {#if wheels[currentWheelIndex]}
        <div class="mb-6">
          <input
            type="text"
            class="input input-bordered w-full font-bold text-lg"
            bind:value={wheels[currentWheelIndex].name}
            disabled={isSpinning}
            placeholder="Wheel Name"
          />
        </div>
      {/if}

      <h2 class="text-xl font-bold mb-4">Edit Options</h2>

      <div class="flex gap-2 mb-6">
        <input
          type="text"
          bind:value={newSegmentText}
          placeholder="Add new option..."
          class="input input-bordered w-full"
          onkeypress={handleKeypress}
          disabled={isSpinning}
        />
        <button class="btn btn-primary" onclick={addSegment} disabled={isSpinning}>Add</button>
      </div>

      <ul class="space-y-2 max-h-64 overflow-y-auto pr-2">
        {#if wheels[currentWheelIndex]}
          {#each wheels[currentWheelIndex].segments as segment (segment.id)}
            <li class="flex items-center justify-between bg-base-100 p-2 rounded shadow-sm gap-2">
              <div class="flex items-center gap-3 flex-1">
                <input
                  type="color"
                  bind:value={segment.color}
                  class="w-8 h-8 rounded cursor-pointer border-0 p-0 bg-transparent"
                  disabled={isSpinning}
                />
                <input
                  type="text"
                  bind:value={segment.text}
                  class="input input-sm input-ghost flex-1 w-full font-medium"
                  disabled={isSpinning}
                />
              </div>
              <button
                class="btn btn-ghost btn-xs text-error ml-2"
                onclick={() => removeSegment(segment.id)}
                disabled={isSpinning}
                aria-label="Remove">✕</button
              >
            </li>
          {/each}
          {#if wheels[currentWheelIndex].segments.length === 0}
            <li class="text-base-content/50 text-center py-4">No options added yet.</li>
          {/if}
        {/if}
      </ul>

      <!-- Client seed display -->
      {#if pfServerAvailable}
        <div class="mt-6 pt-4 border-t border-base-300">
          <p class="text-xs text-base-content/50 mb-1 font-semibold uppercase tracking-wide">
            Your Client Seed
          </p>
          <p class="font-mono text-xs text-base-content/70 break-all">{pfClientSeed}</p>
          <button
            class="btn btn-ghost btn-xs mt-1 text-base-content/40"
            onclick={() => (pfClientSeed = generateClientSeed())}
            disabled={isSpinning}
          >
            Regenerate
          </button>
        </div>
      {/if}
    </div>
  </div>

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
            <button class="btn btn-ghost btn-xs text-base-content/50" onclick={clearLogs}>
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
</main>

{#if showResultModal}
  <div
    bind:this={modalRef}
    class="modal modal-open"
    role="dialog"
    aria-modal="true"
    tabindex="-1"
    onkeydown={handleModalKeydown}
  >
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

      <!-- Provably Fair verification section -->
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
                  onclick={verifyPfResult}
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
        <button
          bind:this={closeButton}
          class="btn btn-primary btn-wide font-bold"
          onclick={() => (showResultModal = false)}
        >
          CLOSE
        </button>
      </div>
    </div>
    <button
      class="modal-backdrop border-none bg-transparent"
      aria-label="Close modal"
      tabindex="-1"
      onclick={() => (showResultModal = false)}
    ></button>
  </div>
{/if}

{#if showConfirmDeleteModal}
  <div
    bind:this={confirmModalRef}
    class="modal modal-open"
    role="dialog"
    aria-modal="true"
    tabindex="-1"
    onkeydown={handleConfirmModalKeydown}
  >
    <div class="modal-box text-center border-t-8 border-error relative">
      <h3 class="font-bold text-xl text-base-content mb-4">Delete Wheel?</h3>
      <p class="py-4">
        Are you sure you want to delete <strong class="text-error"
          >"{wheels[currentWheelIndex]?.name}"</strong
        >?
        <br />This action cannot be undone.
      </p>
      <div class="modal-action justify-center mt-4">
        <button
          bind:this={confirmCancelButton}
          class="btn btn-ghost"
          onclick={() => (showConfirmDeleteModal = false)}
        >
          Cancel
        </button>
        <button class="btn btn-error" onclick={executeDeleteWheel}> Delete </button>
      </div>
    </div>
    <button
      class="modal-backdrop border-none bg-transparent"
      aria-label="Close modal"
      tabindex="-1"
      onclick={() => (showConfirmDeleteModal = false)}
    ></button>
  </div>
{/if}

{#if toastMessage}
  <div class="toast toast-top toast-center z-50">
    <div class="alert {toastType === 'error' ? 'alert-error' : 'alert-success'}">
      <span>{toastMessage}</span>
    </div>
  </div>
{/if}
