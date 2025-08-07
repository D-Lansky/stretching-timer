import { TimerApp, requestWakeLock } from './timer.js';
import { audioManager } from './audioManager.js';

document.addEventListener('DOMContentLoaded', () => {
  const timerApp = new TimerApp();
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(() => {})
        .catch(() => {});
    });
  }
});

document.addEventListener('visibilitychange', () => {
  if (audioManager.audioCtx && audioManager.audioCtx.state === 'suspended') {
    audioManager.unlockAudio();
  }
  if (document.visibilityState === 'visible' && document.querySelector('.stop-active')) {
    requestWakeLock();
  }
});
