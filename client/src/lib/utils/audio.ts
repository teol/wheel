let audioCtx: AudioContext | null = null;

export function initAudio() {
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

export function playTickSound() {
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

export function playTadaSound() {
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
