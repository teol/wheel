<script lang="ts">
  import { onMount } from 'svelte';
  import gsap from 'gsap';

  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D | null;

  onMount(() => {
    ctx = canvas.getContext('2d');
    if (ctx) {
      // Draw a simple placeholder wheel
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = 140;

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.fillStyle = '#4B5563'; // Tailwind gray-600
      ctx.fill();
      
      // Draw a slice line
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(centerX + radius, centerY);
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#1F2937'; // Tailwind gray-800
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.lineWidth = 8;
      ctx.strokeStyle = '#1F2937';
      ctx.stroke();
    }
  });

  function spinWheel() {
    gsap.to(canvas, {
      rotation: '+=1440', // Spin 4 times + extra
      duration: 3,
      ease: 'power4.out'
    });
  }
</script>

<main class="min-h-screen bg-base-100 text-base-content flex flex-col items-center justify-center p-4">
  <h1 class="text-4xl font-bold mb-8 text-primary">Custom Wheel Creator</h1>
  
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
    <button class="btn btn-secondary">Edit Segments</button>
  </div>
</main>