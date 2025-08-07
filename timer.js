import { audioManager } from './audioManager.js';
import { launchConfetti, emojiRain } from './animations.js';

let wakeLock = null;
export async function requestWakeLock() {
  if ('wakeLock' in navigator) {
    try {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => {});
    } catch (err) {
      // ignore errors
    }
  }
}

export async function releaseWakeLock() {
  if (wakeLock) {
    try { await wakeLock.release(); } catch {}
    wakeLock = null;
  }
}

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
const settingsPresets = document.getElementById('settingsPresets');
const switchMsg = document.getElementById('switchMsg');
const twinkleContainer = document.getElementById('barTwinkleContainer');
const toastNotificationEl = document.getElementById('toastNotification');

export class TimerApp {
  constructor() {
    this.stretchDuration = 50;
    this.switchDuration = 10;
    this.totalWorkoutTime = 20 * 60;
    this.sessionStartTime = 0;
    this.sessionEndTime = 0;
    this.currentIntervalEndTime = 0;
    this.currentMode = 'stretch';
    this.timerInterval = null;
    this.paused = false;
    this.pausedData = {};
    this.lastBeepSecond = null;
    this.lastDisplayedSecond = null;
    this.stopped = false;
    this.lastIntervalMode = null;
    this.timerRunning = false;
    this.isFirstSwitch = true;
    this.circumference = 2 * Math.PI * progressCircle.r.baseVal.value;
    progressCircle.style.strokeDasharray = this.circumference;
    this.updateCircle(0, true);
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
        this.stretchDuration = parseInt(stretchSlider.value);
        this.switchDuration = parseInt(switchSlider.value);
        this.totalWorkoutTime = parseInt(totalWorkoutSlider.value) * 60;
      });
    });

    saveSettingsBtn.addEventListener('click', () => this.saveSettings());

    startBtn.addEventListener('click', async () => {
      audioManager.unlockAudio();
      if (startBtn.textContent.includes('Start')) {
        this.startTimer();
      } else {
        this.stopped = true;
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
    this.updateSliderValuesDisplay();
  }

  saveSettings() {
    const s = {
      stretch: parseInt(stretchSlider.value),
      switch: parseInt(switchSlider.value),
      totalWorkout: parseInt(totalWorkoutSlider.value)
    };
    localStorage.setItem('stretchTimerSettings', JSON.stringify(s));
    if (toastNotificationEl) {
      toastNotificationEl.textContent = "Settings Saved!";
      toastNotificationEl.classList.add('show');
      setTimeout(() => {
        toastNotificationEl.classList.remove('show');
      }, 3000);
    }
  }

  updateCircle(fraction, snap = false) {
    let offset;
    if (fraction >= 1) offset = 0;
    else if (fraction <= 0) offset = this.circumference;
    else offset = this.circumference * (1 - fraction);
    progressCircle.style.strokeDashoffset = offset;
    if (snap) {
      progressCircle.style.transition = "none";
      progressCircle.getBoundingClientRect();
      progressCircle.style.transition = "stroke-dashoffset 0.25s linear";
    }
  }

  async startTimer() {
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
    await requestWakeLock();
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
    if (currentSecond <= 3 && currentSecond > 0) {
      if (currentSecond !== this.lastDisplayedSecond) {
        countdownEl.classList.remove("throb");
        void countdownEl.offsetWidth;
        countdownEl.classList.add("throb");
        this.lastDisplayedSecond = currentSecond;
      }
      if (currentSecond !== this.lastBeepSecond) {
        this.lastBeepSecond = currentSecond;
        audioManager.beepShort();
      }
    } else if (currentSecond > 3) {
      this.lastDisplayedSecond = currentSecond;
      this.lastBeepSecond = null;
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
      this.updateCircle(0, true);
      this.lastIntervalMode = this.currentMode;
    } else {
      this.updateCircle(fraction);
    }
  }

  _handleModeSwitch(now) {
    audioManager.beepLong();
    if (this.currentMode === 'switch') this.isFirstSwitch = false;
    this.currentMode = (this.currentMode === 'stretch') ? 'switch' : 'stretch';
    this.lastIntervalMode = null;
    this.lastBeepSecond = null;
    this.lastDisplayedSecond = null;
    const nextDuration = (this.currentMode === 'stretch') ? this.stretchDuration : this.switchDuration;
    this.currentIntervalEndTime = now + nextDuration * 1000;
  }

  updateTimerRAF() {
    if (this.stopped) { this.finishSession(); return; }
    const now = Date.now();
    this._updateSessionProgress(now);
    if (now >= this.sessionEndTime) { this.finishSession(); return; }
    const remainingSecondsInInterval = this._handleIntervalCountdown(now);
    this._updateSwitchMessage();
    this._updateCircularProgress(remainingSecondsInInterval);
    if (remainingSecondsInInterval <= 0) this._handleModeSwitch(now);
    if (!this.paused && this.timerRunning) {
      this.timerInterval = requestAnimationFrame(() => this.updateTimerRAF());
    }
  }

  async finishSession() {
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
    await releaseWakeLock();
  }

  async pauseTimer() {
    if (!this.timerRunning) return;
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
      pauseBtn.textContent = "▶ Resume";
      await releaseWakeLock();
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
      await requestWakeLock();
    }
  }

  async resetTimer() {
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
    this.currentMode = 'switch';
    this.lastIntervalMode = null;
    this.loadSettings();
    await releaseWakeLock();
  }

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
      if (!this.timerRunning || this.paused) {
        star.style.opacity = 0;
        setTimeout(twinkle, 500);
        return;
      }
      const containerRect = twinkleContainer.getBoundingClientRect();
      const percent = parseFloat(bar.style.width) || 0;

      if (percent < 2) {
        star.style.opacity = 0;
        setTimeout(twinkle, 500);
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
        setTimeout(twinkle, 380 + Math.random() * 700);
      }, duration);
    };
    setTimeout(twinkle, idx * 140 + Math.random() * 150);
  }
}
