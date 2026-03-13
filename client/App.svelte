<script lang="ts">
  import { onMount } from 'svelte';
  import gsap from 'gsap';

  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D | null;

  type Segment = { text: string; color: string };

  let segments = $state<Segment[]>([
    { text: 'Option 1', color: '#EF4444' },
    { text: 'Option 2', color: '#3B82F6' },
    { text: 'Option 3', color: '#10B981' },
    { text: 'Option 4', color: '#F59E0B' },
  ]);

  let newSegmentText = $state('');

  onMount(() => {
    ctx = canvas.getContext('2d');
    
    // Load from localStorage on mount
    const saved = localStorage.getItem('wheel-segments');
    if (saved) {
      try {
        segments = JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing segments from localStorage');
      }
    }
  });

  // Save to localStorage and redraw wheel when segments change
  $effect(() => {
    localStorage.setItem('wheel-segments', JSON.stringify(segments));
    drawWheel();
  });

  function drawWheel() {
    if (!ctx || !canvas) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 140;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (segments.length === 0) {
      // Draw empty wheel
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.fillStyle = '#4B5563';
      ctx.fill();
      return;
    }

    const sliceAngle = (2 * Math.PI) / segments.length;

    segments.forEach((segment, i) => {
      const startAngle = i * sliceAngle;
      const endAngle = (i + 1) * sliceAngle;

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
      ctx!.fillStyle = '#FFFFFF';
      ctx!.font = 'bold 16px sans-serif';
      ctx!.fillText(segment.text, radius - 15, 5);
      ctx!.restore();
    });

    // Draw outer border
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#1F2937';
    ctx.stroke();
  }

  function spinWheel() {
    gsap.to(canvas, {
      rotation: '+=1440', // Spin 4 times + extra
      duration: 3,
      ease: 'power4.out'
    });
  }

  function addSegment() {
    if (newSegmentText.trim()) {
      const colors = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];
      segments.push({
        text: newSegmentText.trim(),
        color: colors[segments.length % colors.length]
      });
      newSegmentText = '';
    }
  }

  function removeSegment(index: number) {
    segments.splice(index, 1);
  }

  function handleKeypress(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      addSegment();
    }
  }
</script>

<main class="min-h-screen bg-base-100 text-base-content flex flex-col items-center p-4 py-12">
  <h1 class="text-4xl font-bold mb-8 text-primary">Custom Wheel Creator</h1>
  
  <div class="flex flex-col md:flex-row gap-12 w-full max-w-4xl justify-center items-start">
    <div class="flex flex-col items-center">
      <div class="card bg-base-200 shadow-xl p-8 mb-8">
        <canvas 
          bind:this={canvas} 
          width="300" 
          height="300" 
          class="rounded-full shadow-2xl origin-center"
        ></canvas>
      </div>
      
      <div class="flex gap-4">
        <button class="btn btn-primary" onclick={spinWheel}>Spin Wheel</button>
      </div>
    </div>

    <div class="card bg-base-200 shadow-xl p-6 w-full max-w-sm">
      <h2 class="text-2xl font-bold mb-4">Segments</h2>
      
      <div class="flex gap-2 mb-4">
        <input 
          type="text" 
          bind:value={newSegmentText} 
          placeholder="New segment..." 
          class="input input-bordered w-full"
          onkeypress={handleKeypress}
        />
        <button class="btn btn-primary" onclick={addSegment}>Add</button>
      </div>

      <ul class="space-y-2 max-h-64 overflow-y-auto">
        {#each segments as segment, i}
          <li class="flex items-center justify-between bg-base-100 p-2 rounded shadow-sm">
            <div class="flex items-center gap-2">
              <div class="w-4 h-4 rounded-full" style="background-color: {segment.color};"></div>
              <span>{segment.text}</span>
            </div>
            <button class="btn btn-ghost btn-xs text-error" onclick={() => removeSegment(i)}>✕</button>
          </li>
        {/each}
        {#if segments.length === 0}
          <li class="text-base-content/50 text-center py-4">No segments added yet.</li>
        {/if}
      </ul>
    </div>
  </div>
</main>