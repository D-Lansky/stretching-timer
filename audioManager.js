const toastNotificationEl = document.getElementById('toastNotification');

export function showAudioErrorToast() {
  if (!toastNotificationEl) return;
  toastNotificationEl.textContent = "Audio Unavailable in PWA";
  toastNotificationEl.classList.add('show', 'error');
  setTimeout(() => {
    toastNotificationEl.classList.remove('show', 'error');
  }, 3200);
}

export class AudioManager {
  constructor() {
    this.audioCtx = null;
    this.isAudioAwake = false;
    this.unlockingPromise = null;
    this.audioWorking = true;

    document.addEventListener('click', () => this.unlockAudio(), { once: true, capture: true });
    window.addEventListener('focus', () => this.unlockAudio());
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') this.unlockAudio();
    });
  }

  async unlockAudio() {
    if (this.audioCtx && this.audioCtx.state === 'running') return;
    if (this.unlockingPromise) { try { await this.unlockingPromise; } catch { } return; }
    const unlockTask = async () => {
      try {
        if (!this.audioCtx) {
          this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.audioCtx.state === 'suspended') {
          await Promise.race([
            this.audioCtx.resume(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('AudioContext.resume() timed out')), 1000))
          ]);
        }
        if (this.audioCtx.state === 'running') {
          this._keepAudioAwake();
          this.audioWorking = true;
        } else {
          throw new Error('AudioContext not running');
        }
      } catch (e) {
        this.audioCtx = null;
        this.isAudioAwake = false;
        this.audioWorking = false;
        showAudioErrorToast();
        console.warn('[AudioManager] Audio unavailable (likely PWA/iPadOS block):', e);
        throw e;
      }
    };
    this.unlockingPromise = unlockTask();
    try { await this.unlockingPromise; }
    catch { }
    finally { this.unlockingPromise = null; }
  }

  _keepAudioAwake() {
    if (this.isAudioAwake || !this.audioCtx || this.audioCtx.state !== 'running') return;
    const buffer = this.audioCtx.createBuffer(1, this.audioCtx.sampleRate, this.audioCtx.sampleRate);
    const source = this.audioCtx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const gain = this.audioCtx.createGain();
    gain.gain.value = 0;
    source.connect(gain);
    gain.connect(this.audioCtx.destination);
    source.start();
    this.isAudioAwake = true;
  }

  playBeep(duration = 100, frequency = 800, volume = 0.8, type = 'sine') {
    if (!this.audioCtx || this.audioCtx.state !== 'running') {
      this.audioWorking = false;
      this.unlockAudio();
      showAudioErrorToast();
      return;
    }
    const now = this.audioCtx.currentTime;
    const durationSec = duration / 1000;
    const oscillator = this.audioCtx.createOscillator();
    const gainNode = this.audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(this.audioCtx.destination);
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(volume, now + 0.01);
    gainNode.gain.linearRampToValueAtTime(0, now + durationSec - 0.01);
    oscillator.start(now);
    oscillator.stop(now + durationSec);
  }

  beepShort() { this.playBeep(100, 800, 0.7); }
  beepLong() { this.playBeep(490, 380, 0.7); }

  playCelebrationMusic() {
    if (!this.audioCtx || this.audioCtx.state !== 'running') {
      showAudioErrorToast();
      return;
    }
    let t = this.audioCtx.currentTime, baseVol = 0.22;
    const tunes = [
      [[523,0,0.14],[659,0.15,0.24],[784,0.25,0.32],[1047,0.33,0.45]],
      [[440,0,0.12],[587,0.13,0.2],[740,0.21,0.26],[880,0.27,0.38]],
      [[659,0,0.10],[784,0.10,0.19],[988,0.20,0.29],[1318,0.30,0.37],[1047,0.38,0.45]]
    ];
    const tune = tunes[Math.floor(Math.random() * tunes.length)];
    tune.forEach(([freq, start, end], i) => {
      const o = this.audioCtx.createOscillator(), g = this.audioCtx.createGain();
      o.type = 'triangle'; o.frequency.value = freq;
      g.gain.setValueAtTime(baseVol * (1.1 - 0.11 * i), t + start);
      g.gain.linearRampToValueAtTime(0.001, t + end);
      o.connect(g); g.connect(this.audioCtx.destination);
      o.start(t + start); o.stop(t + end);
    });
    const lastNote = tune[tune.length - 1];
    const flourishStartTime = t + lastNote[2] + 0.020;
    const flourishDuration = 0.21;
    const flourishEndTime = flourishStartTime + flourishDuration;
    const o = this.audioCtx.createOscillator(), g = this.audioCtx.createGain();
    o.type = 'sine';
    o.connect(g); g.connect(this.audioCtx.destination);
    o.frequency.setValueAtTime(1568, flourishStartTime);
    o.frequency.linearRampToValueAtTime(220, flourishEndTime);
    g.gain.setValueAtTime(baseVol * 1.7, flourishStartTime);
    g.gain.linearRampToValueAtTime(0.001, flourishEndTime);
    o.start(flourishStartTime);
    o.stop(flourishEndTime);
  }
}

export const audioManager = new AudioManager();
