import { audioManager } from './audioManager.js';

const confettiCanvas = document.getElementById('confettiCanvas');
const confettiMsg = document.getElementById('confettiMsg');

export function launchConfetti() {
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
    "Michelangelo would have sculpted you instead.",
    "Elasticity: Level Over 9000.",
    "Mobility so smooth, oil companies are jealous.",
    "Chuck Norris now warms up to *your* videos.",
    "Are you even human? Or just a yoga deity?",
    "You’re basically a bendy straw with abs.",
    "Your muscles filed for divorce from tightness.",
    "Certified Stretch Legend. Brag accordingly.",
    "The timer's scared of you now.",
    "Time bent. You did too."
  ];
  confettiMsg.textContent = messages[Math.floor(Math.random()*messages.length)];
  confettiMsg.style.display = 'block';
  const ctx = confettiCanvas.getContext('2d');
  confettiCanvas.width = window.innerWidth * 2;
  confettiCanvas.height = window.innerHeight * 2;
  ctx.setTransform(2,0,0,2,0,0);
  confettiCanvas.style.display = 'block';
  const cx = window.innerWidth/2, cy = window.innerHeight/2;
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
  let frame = 0, maxFrames = 420;
  function draw() {
    ctx.clearRect(0,0,confettiCanvas.width,confettiCanvas.height);
    for(const c of confetti) {
      ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.tilt);
      ctx.globalAlpha = Math.max(0, 1-frame/maxFrames);
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
    ctx.globalAlpha = 1;
  }
  function update() {
    for(const c of confetti){
      c.x += c.vx; c.y += c.vy;
      c.vy += c.gravity; c.vx *= 0.985; c.vy *= 0.985;
      c.tilt += c.tiltSpeed; c.rotation += c.rotSpeed;
      if(Math.random()<0.04) c.vx += (Math.random()-0.5)*1.4;
    }
    frame++;
  }
  function animate() {
    update(); draw();
    if(frame < maxFrames) requestAnimationFrame(animate);
    else setTimeout(()=>{
      confettiCanvas.style.display='none'; confettiMsg.style.display='none';
    }, 2300);
  }
  audioManager.playCelebrationMusic();
  animate();
}

export function emojiRain() {
  const emojis = [
    '✨','🎉','💜','💪','👑','😎','😃','🥳','🙆‍♂️','🙆‍♀️','🧘‍♂️','🧘‍♀️','🤸‍♂️','🤸‍♀️',
    '🦸‍♂️','🦸‍♀️','🏆','🎊','🎈','🕺','💃','💯','🔥','🦾','🥇','👟','🦵','🦶','😺',
    '🦄','🦋','🍀','🌈','🌞','😌','🎵','🔔','🥒','🥦','🍇','🍉','🍓','🦴','🧬'
  ];
  const emojiCount = 42 + Math.floor(Math.random() * 14);
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

  let frame = 0, maxFrames = 260;
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
