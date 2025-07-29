// =======================
// MOBILE-OPTIMIZED BEEPS
// =======================
class AudioManager {
  constructor() {
    this.audioCtx = null;
    this.isAudioAwake = false;
    this.unlockingPromise = null;

    // Always try to unlock on every pointerdown (extra bulletproof for iOS beta/PWA)
    document.addEventListener('pointerdown', () => this.unlockAudio(), { passive: true });

    // Try to resume audio context on focus and visibility change
    window.addEventListener('focus', () => this.unlockAudio());
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.unlockAudio();
      }
    });
  }

  // This async unlock never blocks UI; errors are logged but ignored for UI.
  async unlockAudio() {
    // If already running, nothing to do.
    if (this.audioCtx && this.audioCtx.state === 'running') return;

    // If another unlock is in progress, wait for it to finish.
    if (this.unlockingPromise) {
      try {
        await this.unlockingPromise;
      } catch (e) {
        // ignore, we’ll handle below
      }
      return;
    }

    // Actual unlock logic.
    const unlockTask = async () => {
      try {
        if (!this.audioCtx) {
          console.log('[AudioManager] Creating new AudioContext...');
          this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.audioCtx.state === 'suspended') {
          console.log('[AudioManager] AudioContext is suspended, attempting to resume...');
          await Promise.race([
            this.audioCtx.resume(),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('AudioContext.resume() timed out after 1 second.')), 1000)
            ),
          ]);
          console.log('[AudioManager] AudioContext resumed successfully.');
        }
        if (this.audioCtx.state === 'running') {
          this._keepAudioAwake();
        } else {
          throw new Error(`[AudioManager] AudioContext state is '${this.audioCtx.state}', not 'running'.`);
        }
      } catch (e) {
        console.error('[AudioManager] Failed to unlock audio:', e);
        // Wipe context and flags so we can try again later.
        this.audioCtx = null;
        this.isAudioAwake = false;
        throw e;
      }
    };

    this.unlockingPromise = unlockTask();
    try {
      await this.unlockingPromise;
    } catch (e) {
      // Log only, never block the UI
      // (Even if audio fails, timer app remains usable!)
      console.warn('[AudioManager] unlockAudio failed, but UI stays enabled.', e);
    } finally {
      this.unlockingPromise = null;
    }
  }

  _keepAudioAwake() {
    if (this.isAudioAwake || !this.audioCtx || this.audioCtx.state !== 'running') return;
    // 1-second silent buffer keeps audio context alive for iOS.
    const buffer = this.audioCtx.createBuffer(1, this.audioCtx.sampleRate * 1, this.audioCtx.sampleRate);
    const source = this.audioCtx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const gain = this.audioCtx.createGain();
    gain.gain.value = 0;
    source.connect(gain);
    gain.connect(this.audioCtx.destination);
    source.start();
    this.isAudioAwake = true;
    console.log('[AudioManager] Silent loop initiated to keep AudioContext alive.');
  }

  playBeep(duration = 100, frequency = 800, volume = 0.4, type = 'sine') {
    if (!this.audioCtx || this.audioCtx.state !== 'running') {
      // Try unlocking again if needed.
      this.unlockAudio();
      return;
    }
    const now = this.audioCtx.currentTime;
    const durationInSeconds = duration / 1000;
    const oscillator = this.audioCtx.createOscillator();
    const gainNode = this.audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(this.audioCtx.destination);

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(volume, now + 0.01);
    gainNode.gain.linearRampToValueAtTime(0, now + durationInSeconds - 0.01);
    oscillator.start(now);
    oscillator.stop(now + durationInSeconds);
  }

  beepShort() { this.playBeep(100, 800, 0.42); }
  beepLong() { this.playBeep(490, 380, 0.34); }

  playCelebrationMusic() {
    if (!this.audioCtx || this.audioCtx.state !== 'running') return;
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

    // Final flourish
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
const audioManager = new AudioManager();

// =======================
// DOM Element Selectors
// =======================
// ... (UNCHANGED: Keep your DOM selectors and everything below exactly as in your previous file)

const countdownEl = document.getElementById('countdown');
const progressCircle = document.getElementById('progressCircle');
const stretchSlider = document.getElementById('stretchSlider');
const switchSlider = document.getElementById('switchSlider');
const totalWorkoutSlider = document.getElementById('totalWorkoutSlider');
const stretchValueEl = document.getElementById('stretchValue');
const switchValueEl = document.getElementById('switchValue');
const totalWorkoutValueEl = document.getElementById('totalWorkoutValue');
const saveSettingsBtn = document.getElementById('saveSettings');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const sessionBar = document.getElementById('sessionBar');
const sessionPercentage = document.getElementById('sessionPercentage');
const presetButtons = document.querySelectorAll('.preset-btn');
const confettiCanvas = document.getElementById('confettiCanvas');
const confettiMsg = document.getElementById('confettiMsg');
const settingsPresets = document.getElementById('settingsPresets');
const switchMsg = document.getElementById('switchMsg');
const twinkleContainer = document.getElementById('barTwinkleContainer');
const toastNotificationEl = document.getElementById('toastNotification');

// =======================
// Timer State Object
// =======================
// ... (KEEP THE ENTIRE TimerApp class and all animation logic below UNCHANGED from your last good working version)

class TimerApp {
  // ... [EXACT COPY of your existing TimerApp code, unchanged]
  // All previous logic stays as-is!
  // No change needed to core logic or event listeners
  // (The only thing that’s changed is bulletproofing audio unlocking and UI enablement above!)
  // [Paste all of your TimerApp class code here, unchanged.]
  // ... see prior script (it’s long—left out here for clarity, but you should keep it all!)
  // [YOUR TimerApp implementation]
  // ... Twinkle, Confetti, Emoji logic also unchanged
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  const timerApp = new TimerApp();

  // Register Service Worker (unchanged)
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('ServiceWorker registration successful with scope: ', registration.scope);
        })
        .catch(error => {
          console.log('ServiceWorker registration failed: ', error);
        });
    });
  }
});


// Confetti/music/emoji (largely unchanged, kept separate for now)
function launchConfetti() {
  const colors = [
    "#f72585","#b5179e","#7209b7","#560bad","#480ca8","#4361ee","#4cc9f0","#ffbe0b",
    "#fb5607","#ff006e","#8338ec","#3a86ff","#3cff00","#00ff99","#ffd700","#ffffff",
    "#39ff14","#ff1493","#00cfff","#fffc00","#ff5e00","#fe019a","#ffb300","#c6ff00",
    "#a020f0","#adff2f","#ed2939","#d72631","#faff00","#ffa600","#d0f400","#f900bf",
    "#f4a259","#43bccd","#fcf6b1","#fa8334","#20bf55","#9f86c0"
  ];
  const messages = [
    "You Did It!\n🏆 Stretch Complete! 🏆",
    "Victory!\nYou're a Flexibility Overlord!",
    "LEGENDARY.\nNo one stretches like you.",
    "Stretch Goal: ACHIEVED",
    "Unstoppable!\nNow go brag.",
    "You crushed it!\nOn to world domination.",
    "One small stretch for you, one giant leap for mankind.",
    "💪 FLEX LEVEL: GOD 💪",
    "Are you secretly Gumby?\nBecause DAMN.",
    "If stretching were an Olympic sport,\nyou’d already have gold.",
    "You survived. The timer did not.",
    "This timer was no match for your hamstrings.",
    "You stretched further than my patience for corporate jargon.",
    "Flex-ecution achieved. Consider the timer dominated.",
    "Michelangelo would have sculpted you instead.",
    "Elasticity: Level Over 9000.",
    "Mobility so smooth, oil companies are jealous.",
    "Bruce Lee called. He wants his flexibility back.",
    "Chuck Norris now warms up to *your* videos.",
    "Are you even human? Or just a yoga deity?",
    "You’re basically a bendy straw with abs.",
    "Certified Stretch Legend. Brag accordingly.",
    "Did someone order a full-body victory dance?",
    "Your muscles filed for divorce from tightness.",
    "The Matrix is calling. They want their Neo back.",
    "Most flexible on the block. Block confirmed.",
    "Game. Set. Stretch. Winner: You.",
    "You've stretched more than the truth at a corporate earnings call.",
    "Jeff Bezos called. He wants to know your flexibility secret.",
    "Certified Gumby-core achievement unlocked.",
    "You just unlocked the hidden yoga DLC. Namast-YES.",
    "Is this a timer or a portal to bendy enlightenment?",
    "NASA wants to study your joints for space missions.",
    "You stretched so hard, your Wi-Fi signal improved.",
    "Flexed so good, your smartwatch applied for early retirement.",
    "Mobility: maxed. Ego: deserved.",
    "If limbs had XP, yours just leveled up.",
    "Even your tight jeans are impressed.",
    "Legend says your hamstrings just signed a peace treaty.",
    "The timer's scared of you now.",
    "Stretch complete. Swagger enabled.",
    "Time bent. You did too."
  ];
  confettiMsg.textContent = messages[Math.floor(Math.random()*messages.length)];
  confettiMsg.style.display = 'block';
  const ctx = confettiCanvas.getContext('2d');
  confettiCanvas.width = window.innerWidth * 2; // For HDPI displays
  confettiCanvas.height = window.innerHeight * 2;
  ctx.setTransform(2,0,0,2,0,0); // Scale context for HDPI
  confettiCanvas.style.display = 'block';
  const cx = window.innerWidth/2, cy = window.innerHeight/2; // Center point
  const confettiCount = 1200;
  const shapes = ['ellipse','rect','triangle'], confetti = [];
  for(let i=0;i<confettiCount;i++){
    const angle = Math.random()*Math.PI*2, velocity = 12+Math.random()*19;
    confetti.push({
      x: cx, y: cy, r: 7+Math.random()*13,
      color: colors[Math.floor(Math.random()*colors.length)],
      tilt: Math.random()*Math.PI*2, tiltSpeed: (Math.random()-0.5)*0.15,
      vx: Math.cos(angle)*velocity, vy: Math.sin(angle)*velocity,
      gravity: 0.14+Math.random()*0.17,
      shape: shapes[Math.floor(Math.random()*shapes.length)],
      rotation: Math.random()*360, rotSpeed: (Math.random()-0.5)*9
    });
  }
  let frame = 0, maxFrames = 420; // Approx 7 seconds at 60fps
  function draw() {
    ctx.clearRect(0,0,confettiCanvas.width,confettiCanvas.height);
    for(const c of confetti) {
      ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.tilt);
      ctx.globalAlpha = Math.max(0, 1-frame/maxFrames); // Fade out
      if(c.shape==='ellipse'){
        ctx.beginPath();
        ctx.ellipse(0,0,c.r,c.r*0.45,0,0,2*Math.PI);
        ctx.fillStyle=c.color; ctx.fill();
      } else if(c.shape==='rect'){
        ctx.rotate(c.rotation * Math.PI / 180);
        ctx.fillStyle=c.color;
        ctx.fillRect(-c.r/2,-c.r/6,c.r, c.r/3);
      } else if(c.shape==='triangle'){
        ctx.beginPath();
        ctx.moveTo(0,-c.r/2); ctx.lineTo(-c.r/2,c.r/2); ctx.lineTo(c.r/2,c.r/2);
        ctx.closePath(); ctx.fillStyle=c.color; ctx.fill();
      }
      ctx.restore();
    }
    ctx.globalAlpha = 1; // Reset global alpha
  }
  function update() {
    for(const c of confetti){
      c.x += c.vx; c.y += c.vy;
      c.vy += c.gravity; c.vx *= 0.985; c.vy *= 0.985; // Air resistance
      c.tilt += c.tiltSpeed; c.rotation += c.rotSpeed;
      // Randomly apply a small horizontal push for more natural movement
      if(Math.random()<0.04) c.vx += (Math.random()-0.5)*1.4;
    }
    frame++;
  }
  function animate() {
    update(); draw();
    if(frame < maxFrames) requestAnimationFrame(animate);
    else setTimeout(()=>{ // Ensure cleanup after animation
      confettiCanvas.style.display='none'; confettiMsg.style.display='none';
    }, 2300); // A bit longer than animation to ensure fade out of message
  }
  audioManager.playCelebrationMusic();
  animate();
}

function emojiRain() {
  const emojis = ['✨', '🎉', '💜', '💪', '👑', '😎'];
  const emojiCount = 35 + Math.floor(Math.random() * 15);
  const explosionObjects = [];
  const container = document.body;
  const cx = window.innerWidth / 2;
  const cy = window.innerHeight / 2;

  for (let i = 0; i < emojiCount; i++) {
    const el = document.createElement('div');
    el.style.position = 'fixed';
    el.style.left = `${cx}px`;
    el.style.top = `${cy}px`;
    el.style.fontSize = `${1.5 + Math.random() * 2}rem`;
    el.style.transform = 'translate(-50%, -50%)';
    el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    container.appendChild(el);

    const angle = Math.random() * Math.PI * 2;
    const velocity = 8 + Math.random() * 12;

    explosionObjects.push({
      el, x: cx, y: cy,
      vx: Math.cos(angle) * velocity,
      vy: Math.sin(angle) * velocity,
      gravity: 0.1 + Math.random() * 0.05,
      rotation: (Math.random() - 0.5) * 20, rot: 0, opacity: 1
    });
  }

  let frame = 0, maxFrames = 240;
  function animate() {
    explosionObjects.forEach(obj => {
      obj.x += obj.vx; obj.y += obj.vy;
      obj.vy += obj.gravity; obj.vx *= 0.99; obj.vy *= 0.99;
      obj.rot += obj.rotation;
      if (frame > maxFrames / 2) obj.opacity -= 1 / (maxFrames / 2);
      obj.el.style.transform = `translate(${obj.x - cx}px, ${obj.y - cy}px) rotate(${obj.rot}deg)`;
      obj.el.style.opacity = Math.max(0, obj.opacity);
    });
    frame++;
    if (frame < maxFrames) requestAnimationFrame(animate);
    else explosionObjects.forEach(obj => obj.el.remove());
  }
  requestAnimationFrame(animate);
}
document.addEventListener('visibilitychange', () => {
  // When the app becomes visible again, try to resume the audio context.
  if (audioManager.audioCtx && audioManager.audioCtx.state === 'suspended') {
    audioManager.unlockAudio();
  }
});
