// =======================
// MOBILE-OPTIMIZED BEEPS
// =======================
class AudioManager {
  constructor() {
    this.audioCtx = null;
    this.isAudioAwake = false;
    // Unlock on the very first user interaction. { once: true } cleans up the listener automatically.
    // We remove 'once: true' to aggressively re-unlock if the context ever suspends again.
    document.addEventListener('touchstart', () => this.unlockAudio(), { passive: true });
    document.addEventListener('click', () => this.unlockAudio(), { passive: true });
  }

  unlockAudio() {
    return new Promise((resolve, reject) => {
      if (this.audioCtx && this.audioCtx.state === 'running') {
        return resolve(true);
      }

      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().then(() => {
          console.log('AudioContext resumed successfully.');
          this._keepAudioAwake();
          resolve(true);
        }).catch(e => {
          console.error('AudioContext resume failed:', e);
          reject(e);
        });
        return;
      }

      try {
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        console.log(`New AudioContext created in state: ${this.audioCtx.state}`);
        if (this.audioCtx.state === 'suspended') {
          this.audioCtx.resume().then(() => {
            console.log('Newly created AudioContext resumed.');
            this._keepAudioAwake();
            resolve(true);
          }).catch(e => reject(e));
        } else {
          this._keepAudioAwake();
          resolve(true);
        }
      } catch (e) {
        console.error("Could not create AudioContext:", e);
        reject(e);
      }
    });
  }

  _keepAudioAwake() {
    if (this.isAudioAwake || !this.audioCtx || this.audioCtx.state !== 'running') return;
    // A 1-second silent buffer is more robust than a single-frame one.
    const buffer = this.audioCtx.createBuffer(1, this.audioCtx.sampleRate * 1, this.audioCtx.sampleRate);
    const source = this.audioCtx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const gain = this.audioCtx.createGain();
    gain.gain.value = 0; // Ensure it's silent
    source.connect(gain);
    gain.connect(this.audioCtx.destination);
    source.start();
    this.isAudioAwake = true;
    console.log('Silent audio loop initiated to keep AudioContext active.');
  }

  playBeep(duration = 100, frequency = 800, volume = 0.4, type = 'sine') {
    if (!this.audioCtx || this.audioCtx.state !== 'running') {
      console.warn('Audio not ready, trying to unlock.');
      this.unlockAudio().catch(() => {}); // Fire-and-forget attempt, main unlock is on start.
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

    // Use a gain envelope for smoother sound (prevents clicks)
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(volume, now + 0.01); // Quick attack
    gainNode.gain.linearRampToValueAtTime(0, now + durationInSeconds - 0.01); // Fade out before stop

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

    // Schedule the final flourish using the Web Audio clock, not setTimeout
    const lastNote = tune[tune.length - 1];
    const flourishStartTime = t + lastNote[2] + 0.020; // 20ms after last note ends
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
class TimerApp {
  constructor() {
    this.stretchDuration = 50;
    this.switchDuration = 10;
    this.totalWorkoutTime = 20 * 60; // in seconds
    this.sessionStartTime = 0;
    this.sessionEndTime = 0;
    this.currentIntervalEndTime = 0;
    this.currentMode = 'stretch'; // 'stretch' or 'switch'
    this.timerInterval = null;
    this.paused = false;
    this.pausedData = {};
    this.lastBeepSecond = null;
    this.lastDisplayedSecond = null;
    this.stopped = false;
    this.lastIntervalMode = null; // Used to detect mode changes for circle animation
    this.timerRunning = false;
    this.isFirstSwitch = true; // To show "Get Ready!" message
    this.circumference = 0;
    this.twinkleStars = [];

    this.circumference = 2 * Math.PI * progressCircle.r.baseVal.value;
    progressCircle.style.strokeDasharray = this.circumference;
    this.updateCircle(0, true); // Initialize circle to empty
    this.loadSettings();
    this.attachEventListeners();
    this.updateSliderValuesDisplay();
    this.createTwinkles();
  }
  
  updateSliderValuesDisplay() {
    stretchValueEl.textContent = stretchSlider.value;
    switchValueEl.textContent = switchSlider.value;
    totalWorkoutValueEl.textContent = totalWorkoutSlider.value;
  }
  
  attachEventListeners() {
    stretchSlider.addEventListener('input', () => {
      stretchValueEl.textContent = stretchSlider.value;
      this.stretchDuration = parseInt(stretchSlider.value);
    });
    switchSlider.addEventListener('input', () => {
      switchValueEl.textContent = switchSlider.value;
      this.switchDuration = parseInt(switchSlider.value);
    });
    totalWorkoutSlider.addEventListener('input', () => {
      totalWorkoutValueEl.textContent = totalWorkoutSlider.value;
      this.totalWorkoutTime = parseInt(totalWorkoutSlider.value) * 60;
    });

    presetButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        stretchSlider.value = btn.getAttribute('data-stretch');
        switchSlider.value = btn.getAttribute('data-switch');
        totalWorkoutSlider.value = btn.getAttribute('data-workout');
        this.updateSliderValuesDisplay();
        // Also update the internal state
        this.stretchDuration = parseInt(stretchSlider.value);
        this.switchDuration = parseInt(switchSlider.value);
        this.totalWorkoutTime = parseInt(totalWorkoutSlider.value) * 60;
      });
    });

    saveSettingsBtn.addEventListener('click', () => this.saveSettings()); 
    // 🔊 Start / Stop button — make sure AudioContext is resumed inside the user-gesture
    startBtn.addEventListener('click', async () => {
      // 1️⃣ Wait for the audio to be unlocked before proceeding. This fixes the race condition.
      try {
        await audioManager.unlockAudio();
      } catch (e) {
        console.error("Could not start timer because audio failed to unlock.", e);
        // We can still proceed without audio if we want, but for now we'll just log.
      }
    
      // 2️⃣ Original logic: Start or Stop the timer
      if (startBtn.textContent.includes('Start')) {
        this.startTimer();
      } else {
        this.stopped = true;   // handled in updateTimerRAF
      }
    });
    
    pauseBtn.addEventListener('click', () => this.pauseTimer());
    resetBtn.addEventListener('click', () => this.resetTimer());
  }

  loadSettings() {
    const saved = localStorage.getItem('stretchTimerSettings');
    if (saved) {
      const s = JSON.parse(saved);
      stretchSlider.value = s.stretch;
      switchSlider.value = s.switch;
      totalWorkoutSlider.value = s.totalWorkout;
      this.stretchDuration = s.stretch;
      this.switchDuration = s.switch;
      this.totalWorkoutTime = s.totalWorkout * 60;
    }
    this.updateSliderValuesDisplay(); // Ensure display matches loaded settings
  }
  
  saveSettings() {
    const s = {
      stretch: parseInt(stretchSlider.value),
      switch: parseInt(switchSlider.value),
      totalWorkout: parseInt(totalWorkoutSlider.value)
    };
    localStorage.setItem('stretchTimerSettings', JSON.stringify(s));
    // Show toast notification
    if (toastNotificationEl) {
      toastNotificationEl.textContent = "Settings Saved!"; // Can customize message
      toastNotificationEl.classList.add('show');
      setTimeout(() => {
        toastNotificationEl.classList.remove('show');
      }, 3000); // Hide after 3 seconds
    }
  }
  
  updateCircle(fraction, snap = false) {
    let offset;
    if (fraction >= 1) {
      offset = 0;
    } else if (fraction <= 0) {
      offset = this.circumference;
    } else {
      offset = this.circumference * (1 - fraction);
    }
    progressCircle.style.strokeDashoffset = offset;

    if (snap) {
      progressCircle.style.transition = "none";
      progressCircle.getBoundingClientRect(); // Force reflow
      progressCircle.style.transition = "stroke-dashoffset 0.25s linear";
    }
  }
  
  startTimer() {
    this.stretchDuration = parseInt(stretchSlider.value);
    this.switchDuration = parseInt(switchSlider.value);
    this.totalWorkoutTime = parseInt(totalWorkoutSlider.value) * 60;

    this.currentMode = 'switch';
    this.lastIntervalMode = null;
    const now = Date.now();
    this.sessionStartTime = now;
    this.sessionEndTime = now + this.totalWorkoutTime * 1000;
    this.currentIntervalEndTime = now + this.switchDuration * 1000;

    this.lastBeepSecond = null;
    this.lastDisplayedSecond = null;
    this.paused = false;
    this.stopped = false;
    this.timerRunning = true;
    this.isFirstSwitch = true;
    settingsPresets.classList.add("hide");

    startBtn.textContent = "■ Stop";
    startBtn.classList.add("stop-active");
    startBtn.disabled = false;
    pauseBtn.disabled = false;
    resetBtn.disabled = false;

    this.updateCircle(0, true);
    if (this.timerInterval) cancelAnimationFrame(this.timerInterval);
    this.timerInterval = requestAnimationFrame(() => this.updateTimerRAF());
  }
  
  _updateSessionProgress(now) {
    const elapsed = now - this.sessionStartTime;
    const totalSessionDuration = this.sessionEndTime - this.sessionStartTime;
    let progressPercent = (elapsed / totalSessionDuration) * 100;
    progressPercent = Math.min(progressPercent, 100);
    sessionBar.style.width = progressPercent + '%';
    sessionPercentage.textContent = Math.floor(progressPercent) + '% Complete';
  }
  
  _handleIntervalCountdown(now) {
    let remaining = (this.currentIntervalEndTime - now) / 1000;
    if (remaining < 0) remaining = 0;
    const currentSecond = Math.ceil(remaining);

    countdownEl.textContent = String(currentSecond).padStart(2, '0');

    // Throb animation & beeps for last 3 seconds
    if (currentSecond <= 3 && currentSecond > 0) {
      if (currentSecond !== this.lastDisplayedSecond) {
        countdownEl.classList.remove("throb");
        void countdownEl.offsetWidth; // Trigger reflow
        countdownEl.classList.add("throb");
        this.lastDisplayedSecond = currentSecond;
      }
      if (currentSecond !== this.lastBeepSecond) {
        this.lastBeepSecond = currentSecond;
        audioManager.beepShort();
      }
    } else if (currentSecond > 3) { // Reset if above 3 seconds
      this.lastDisplayedSecond = currentSecond; // Keep track
      this.lastBeepSecond = null; // Reset beep state if needed
      countdownEl.classList.remove("throb");
    }
    return remaining;
  }
  
  _updateSwitchMessage() {
    if (this.currentMode === "switch") {
      switchMsg.style.display = "block";
      switchMsg.textContent = this.isFirstSwitch ? "Get ready!" : "Switch to the next position!";
    } else {
      switchMsg.style.display = "none";
    }
  }
  
  _updateCircularProgress(remainingSeconds) {
    const totalIntervalDuration = (this.currentMode === 'stretch') ? this.stretchDuration : this.switchDuration;
    let fraction = 1 - (remainingSeconds / totalIntervalDuration);
    if (fraction < 0) fraction = 0;
    if (fraction > 1) fraction = 1;

    if (this.currentMode !== this.lastIntervalMode) {
      this.updateCircle(0, true); // Snap to start on mode change
      this.lastIntervalMode = this.currentMode;
    } else {
      this.updateCircle(fraction);
    }
  }
  
  _handleModeSwitch(now) {
    audioManager.beepLong();
    if (this.currentMode === 'switch') {
      this.isFirstSwitch = false;
    }
    this.currentMode = (this.currentMode === 'stretch') ? 'switch' : 'stretch';
    this.lastIntervalMode = null; // Force circle update
    this.lastBeepSecond = null;
    this.lastDisplayedSecond = null;
    const nextDuration = (this.currentMode === 'stretch') ? this.stretchDuration : this.switchDuration;
    this.currentIntervalEndTime = now + nextDuration * 1000;
  }
  
  updateTimerRAF() {
    if (this.stopped) {
      this.finishSession();
      return;
    }
    const now = Date.now();
    this._updateSessionProgress(now);

    if (now >= this.sessionEndTime) {
      this.finishSession();
      return;
    }

    const remainingSecondsInInterval = this._handleIntervalCountdown(now);
    this._updateSwitchMessage();
    this._updateCircularProgress(remainingSecondsInInterval);

    if (remainingSecondsInInterval === 0) {
      this._handleModeSwitch(now);
    }

    if (!this.paused && this.timerRunning) {
      this.timerInterval = requestAnimationFrame(() => this.updateTimerRAF());
    }
  }
  
  finishSession() {
    countdownEl.textContent = "Done!";
    this.updateCircle(1, true);
    countdownEl.classList.remove("throb");
    if (this.timerInterval) cancelAnimationFrame(this.timerInterval);
    this.timerInterval = null;
    audioManager.beepLong();
    pauseBtn.disabled = true;
    startBtn.textContent = "▶ Start";
    startBtn.classList.remove("stop-active");
    this.stopped = false;
    this.timerRunning = false;
    settingsPresets.classList.remove("hide");
    switchMsg.style.display = "none";
    launchConfetti();
    emojiRain();
  }
  
  pauseTimer() {
    if (!this.timerRunning) return; // Can't pause if not running

    if (!this.paused) {
      this.pausedData = {
        remainingInterval: this.currentIntervalEndTime - Date.now(),
        remainingSession: this.sessionEndTime - Date.now(),
        mode: this.currentMode,
        sessionElapsed: Date.now() - this.sessionStartTime,
        lastIntervalMode: this.lastIntervalMode,
        isFirstSwitch: this.isFirstSwitch
      };
      if (this.timerInterval) cancelAnimationFrame(this.timerInterval);
      this.timerInterval = null;
      this.paused = true;
      pauseBtn.textContent = "▶ Resume"; // Changed to ▶ to match Start button
    } else {
      const now = Date.now();
      this.currentIntervalEndTime = now + this.pausedData.remainingInterval;
      this.sessionStartTime = now - this.pausedData.sessionElapsed;
      this.sessionEndTime = now + this.pausedData.remainingSession;
      this.currentMode = this.pausedData.mode;
      this.lastIntervalMode = this.pausedData.lastIntervalMode;
      this.isFirstSwitch = this.pausedData.isFirstSwitch;

      this.paused = false;
      pauseBtn.textContent = "⏸ Pause";
      this.timerInterval = requestAnimationFrame(() => this.updateTimerRAF());
    }
  }
  
  resetTimer() {
    if (this.timerInterval) cancelAnimationFrame(this.timerInterval);
    this.timerInterval = null;
    countdownEl.textContent = "00";
    this.updateCircle(0, true);
    sessionBar.style.width = '0%';
    sessionPercentage.textContent = '0% Complete';
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    resetBtn.disabled = true;
    pauseBtn.textContent = "⏸ Pause";
    countdownEl.classList.remove("throb");
    this.paused = false;
    startBtn.textContent = "▶ Start";
    startBtn.classList.remove("stop-active");
    this.stopped = false;
    this.timerRunning = false;
    settingsPresets.classList.remove("hide");
    switchMsg.style.display = "none";
    this.isFirstSwitch = true;
    this.currentMode = 'stretch'; // Reset to initial sensible default
    this.lastIntervalMode = null;
    this.loadSettings(); // Reload settings to default or saved
  }
  
  // =======================
  // Twinkle Effect
  // =======================
  createTwinkles() {
    const twinkleCount = 14;
    if (!twinkleContainer) return;
    twinkleContainer.innerHTML = '';
    this.twinkleStars = [];
    for (let i = 0; i < twinkleCount; i++) {
      const star = document.createElement('div');
      star.className = 'twinkle-star';
      star.innerHTML = `
        <svg viewBox="0 0 18 18">
          <polygon points="9,1 11,7 17,7 12,11 14,17 9,13.5 4,17 6,11 1,7 7,7"
            fill="white" opacity="0.98"/>
        </svg>
      `;
      twinkleContainer.appendChild(star);
      this.twinkleStars.push(star);
      this.scheduleTwinkle(star, i);
    }
  }
  
  scheduleTwinkle(star, idx) {
    const bar = document.querySelector('.progress-bar');
    if (!bar || !twinkleContainer) return;
  
    const twinkle = () => {
      if (!this.timerRunning || this.paused) { // Stop twinkling if timer is not active
        star.style.opacity = 0;
        setTimeout(twinkle, 500); // Check again later
        return;
      }
      const containerRect = twinkleContainer.getBoundingClientRect();
      const percent = parseFloat(bar.style.width) || 0;
  
      if (percent < 2) {
        star.style.opacity = 0;
        setTimeout(twinkle, 500); // Check again later
        return;
      }
  
      const left = Math.random() * (percent / 100) * containerRect.width - (star.offsetWidth / 2);
      const top = Math.random() * (containerRect.height - star.offsetHeight);
      star.style.left = `${Math.max(0, Math.min(left, containerRect.width - star.offsetWidth))}px`;
      star.style.top = `${Math.max(0, Math.min(top, containerRect.height - star.offsetHeight))}px`;
      star.style.transform = `scale(${0.7 + Math.random() * 1.1}) rotate(${Math.floor(Math.random() * 360)}deg)`;
      star.style.transition = "opacity 0.34s cubic-bezier(.73,0,.45,1.9), transform 0.8s";
      star.style.opacity = 1;
  
      const duration = 300 + Math.random() * 650;
      setTimeout(() => {
        star.style.transition = "opacity 0.52s cubic-bezier(.73,0,.45,1.9), transform 0.8s";
        star.style.opacity = 0;
        setTimeout(twinkle, 380 + Math.random() * 700); // Schedule next twinkle
      }, duration);
    }
    setTimeout(twinkle, idx * 140 + Math.random() * 150); // Initial staggered start
  }
}


// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  const timerApp = new TimerApp();

  // Register Service Worker
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
