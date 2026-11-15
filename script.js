
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreElement = document.getElementById("score");
const bestElement = document.getElementById("best");
const overlay = document.getElementById("gameOverlay");
const startButton = document.getElementById("startButton");
const soundButton = document.getElementById("soundButton");
const soundIcon = document.getElementById("soundIcon");
const gameStatus = document.getElementById("gameStatus");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const GROUND_HEIGHT = 65;

let state = "ready";
let score = 0;
let best = Number(localStorage.getItem("flappyPenguinBest")) || 0;
let frames = 0;
let pipes = [];
let snowflakes = [];
let particles = [];
let soundEnabled = true;
let audioContext = null;
let lastTime = 0;

const penguin = {
  x: 105,
  y: 280,
  width: 42,
  height: 43,
  velocity: 0,
  gravity: 0.38,
  flapPower: -7.2,
  rotation: 0
};

bestElement.textContent = best;

// ---------- BACKGROUND ----------

function createSnowflakes() {
  snowflakes = [];

  for (let i = 0; i < 55; i++) {
    snowflakes.push({
      x: Math.random() * WIDTH,
      y: Math.random() * HEIGHT,
      radius: Math.random() * 2 + 1,
      speed: Math.random() * 1.1 + 0.3,
      alpha: Math.random() * 0.55 + 0.2
    });
  }
}

function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  gradient.addColorStop(0, "#65c4eb");
  gradient.addColorStop(0.65, "#b5e9f8");
  gradient.addColorStop(1, "#e6f9ff");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Sun
  ctx.beginPath();
  ctx.arc(370, 105, 38, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,.55)";
  ctx.fill();

  // Distant mountains
  drawMountain(0, 390, 130, 170, "#a4d9ed");
  drawMountain(115, 405, 150, 205, "#8bcce6");
  drawMountain(270, 390, 130, 180, "#9bd7eb");
  drawMountain(365, 420, 120, 160, "#b3e5f3");

  // Snow on mountain peaks
  drawSnowPeak(130, 220, 48);
  drawSnowPeak(265, 200, 52);
  drawSnowPeak(400, 240, 43);
}

function drawMountain(x, base, width, height, color) {
  ctx.beginPath();
  ctx.moveTo(x, base);
  ctx.lineTo(x + width / 2, base - height);
  ctx.lineTo(x + width, base);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function drawSnowPeak(x, y, size) {
  ctx.beginPath();
  ctx.moveTo(x - size, y + size);
  ctx.lineTo(x, y);
  ctx.lineTo(x + size, y + size);
  ctx.lineTo(x + size * .35, y + size * .7);
  ctx.lineTo(x, y + size * .85);
  ctx.lineTo(x - size * .35, y + size * .65);
  ctx.closePath();
  ctx.fillStyle = "#f4fdff";
  ctx.fill();
}

function updateSnow() {
  snowflakes.forEach(snow => {
    snow.y += snow.speed;
    snow.x -= 0.2;

    if (snow.y > HEIGHT) {
      snow.y = -5;
      snow.x = Math.random() * WIDTH;
    }

    if (snow.x < 0) snow.x = WIDTH;
  });
}

function drawSnow() {
  snowflakes.forEach(snow => {
    ctx.globalAlpha = snow.alpha;
    ctx.beginPath();
    ctx.arc(snow.x, snow.y, snow.radius, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
  });

  ctx.globalAlpha = 1;
}

// ---------- GROUND ----------

function drawGround() {
  const y = HEIGHT - GROUND_HEIGHT;

  ctx.fillStyle = "#e9faff";
  ctx.fillRect(0, y, WIDTH, GROUND_HEIGHT);

  ctx.fillStyle = "#b6e6f4";
  ctx.fillRect(0, y, WIDTH, 8);

  ctx.fillStyle = "#d0f1fa";

  for (let i = 0; i < WIDTH; i += 45) {
    ctx.beginPath();
    ctx.arc(i + (frames * 1.2) % 45, y + 18, 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ---------- PENGUIN ----------

function drawPenguin() {
  ctx.save();

  ctx.translate(
    penguin.x + penguin.width / 2,
    penguin.y + penguin.height / 2
  );

  ctx.rotate(penguin.rotation);

  // Shadow
  ctx.beginPath();
  ctx.ellipse(0, 23, 18, 5, 0, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(28,70,95,.15)";
  ctx.fill();

  // Body
  ctx.beginPath();
  ctx.ellipse(0, 0, 20, 23, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#152b42";
  ctx.fill();

  // Belly
  ctx.beginPath();
  ctx.ellipse(2, 5, 13, 16, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#f8fcff";
  ctx.fill();

  // Wing
  const wingMovement = state === "playing"
    ? Math.sin(frames * 0.35) * 0.35
    : -0.15;

  ctx.save();
  ctx.rotate(wingMovement);
  ctx.beginPath();
  ctx.ellipse(-16, 2, 6, 12, -0.3, 0, Math.PI * 2);
  ctx.fillStyle = "#294b65";
  ctx.fill();
  ctx.restore();

  // Eye
  ctx.beginPath();
  ctx.arc(9, -8, 3.3, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();

  ctx.beginPath();
  ctx.arc(10, -8, 1.7, 0, Math.PI * 2);
  ctx.fillStyle = "#101c29";
  ctx.fill();

  // Beak
  ctx.beginPath();
  ctx.moveTo(16, -1);
  ctx.lineTo(29, 3);
  ctx.lineTo(16, 7);
  ctx.closePath();
  ctx.fillStyle = "#ffad42";
  ctx.fill();

  // Feet
  ctx.fillStyle = "#ff9f36";

  ctx.beginPath();
  ctx.ellipse(-8, 20, 7, 3, -0.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(7, 20, 7, 3, 0.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// ---------- ICE OBSTACLES ----------

const PIPE_WIDTH = 67;
const PIPE_GAP = 175;
const PIPE_SPEED = 2.5;

function createPipe() {
  const minimumTop = 80;
  const maximumTop = HEIGHT - GROUND_HEIGHT - PIPE_GAP - 100;

  const topHeight =
    Math.random() * (maximumTop - minimumTop) + minimumTop;

  pipes.push({
    x: WIDTH + 20,
    top: topHeight,
    bottom: topHeight + PIPE_GAP,
    scored: false
  });
}

function drawIcePipe(x, y, width, height, isTop) {
  if (height <= 0) return;

  const gradient = ctx.createLinearGradient(x, 0, x + width, 0);
  gradient.addColorStop(0, "#67b8dd");
  gradient.addColorStop(0.3, "#e4fbff");
  gradient.addColorStop(0.6, "#8dd3ee");
  gradient.addColorStop(1, "#4d9bc6");

  ctx.fillStyle = gradient;
  ctx.fillRect(x, y, width, height);

  // Ice highlights
  ctx.fillStyle = "rgba(255,255,255,.4)";
  ctx.fillRect(x + 10, y, 7, height);

  ctx.fillStyle = "rgba(32,111,159,.18)";
  ctx.fillRect(x + width - 10, y, 7, height);

  // Snowy edge
  ctx.fillStyle = "#f3fdff";

  if (isTop) {
    ctx.fillRect(x - 5, y + height - 12, width + 10, 12);
  } else {
    ctx.fillRect(x - 5, y, width + 10, 12);
  }

  // Ice cracks
  ctx.strokeStyle = "rgba(255,255,255,.55)";
  ctx.lineWidth = 2;
  ctx.beginPath();

  if (isTop) {
    ctx.moveTo(x + 35, y + height - 30);
    ctx.lineTo(x + 25, y + height - 50);
  } else {
    ctx.moveTo(x + 32, y + 35);
    ctx.lineTo(x + 20, y + 53);
  }

  ctx.stroke();
}

function drawPipes() {
  pipes.forEach(pipe => {
    drawIcePipe(pipe.x, 0, PIPE_WIDTH, pipe.top, true);

    drawIcePipe(
      pipe.x,
      pipe.bottom,
      PIPE_WIDTH,
      HEIGHT - GROUND_HEIGHT - pipe.bottom,
      false
    );
  });
}

function updatePipes() {
  if (frames % 100 === 0) {
    createPipe();
  }

  pipes.forEach(pipe => {
    pipe.x -= PIPE_SPEED;

    if (!pipe.scored && pipe.x + PIPE_WIDTH < penguin.x) {
      pipe.scored = true;
      score++;
      scoreElement.textContent = score;
      playSound(650, 0.08);
    }
  });

  pipes = pipes.filter(pipe => pipe.x + PIPE_WIDTH > -10);
}

// ---------- COLLISION ----------

function checkCollision() {
  const padding = 7;

  const left = penguin.x + padding;
  const right = penguin.x + penguin.width - padding;
  const top = penguin.y + padding;
  const bottom = penguin.y + penguin.height - padding;

  if (top < 0 || bottom > HEIGHT - GROUND_HEIGHT) {
    return true;
  }

  for (const pipe of pipes) {
    const overlapsX = right > pipe.x && left < pipe.x + PIPE_WIDTH;
    const hitsTop = top < pipe.top;
    const hitsBottom = bottom > pipe.bottom;

    if (overlapsX && (hitsTop || hitsBottom)) {
      return true;
    }
  }

  return false;
}

// ---------- PARTICLES ----------

function createParticles() {
  for (let i = 0; i < 15; i++) {
    particles.push({
      x: penguin.x + 20,
      y: penguin.y + 20,
      vx: (Math.random() - 0.5) * 5,
      vy: (Math.random() - 0.5) * 5,
      life: 30,
      size: Math.random() * 4 + 2
    });
  }
}

function updateParticles() {
  particles.forEach(particle => {
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.life--;
  });

  particles = particles.filter(particle => particle.life > 0);
}

function drawParticles() {
  particles.forEach(particle => {
    ctx.globalAlpha = particle.life / 30;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
  });

  ctx.globalAlpha = 1;
}

// ---------- SOUND ----------

function playSound(frequency = 500, duration = 0.1) {
  if (!soundEnabled) return;

  try {
    audioContext ||= new (
      window.AudioContext || window.webkitAudioContext
    )();

    if (audioContext.state === "suspended") {
      audioContext.resume();
    }

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = "sine";
    oscillator.frequency.value = frequency;

    gain.gain.setValueAtTime(0.08, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      audioContext.currentTime + duration
    );

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);
  } catch (error) {
    console.warn("Audio is unavailable:", error);
  }
}

soundButton.addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  soundIcon.textContent = soundEnabled ? "🔊" : "🔇";
});

// ---------- GAME CONTROL ----------

function flap() {
  if (state === "ready") {
    startGame();
  }

  if (state !== "playing") return;

  penguin.velocity = penguin.flapPower;
  penguin.rotation = -0.3;
  playSound(430, 0.09);
}

function startGame() {
  state = "playing";
  score = 0;
  frames = 0;
  pipes = [];
  particles = [];

  penguin.y = 280;
  penguin.velocity = 0;
  penguin.rotation = 0;

  scoreElement.textContent = "0";
  overlay.classList.add("hidden");
  gameStatus.textContent = "FLYING!";
  playSound(520, 0.12);
}

function endGame() {
  if (state !== "playing") return;

  state = "over";
  createParticles();
  updateParticles();

  playSound(180, 0.25);

  if (score > best) {
    best = score;
    localStorage.setItem("flappyPenguinBest", best);
    bestElement.textContent = best;
  }

  document.getElementById("overlayPenguin").textContent = "💥";
  document.getElementById("overlayKicker").textContent = "PIP NEEDS A BREAK";
  document.getElementById("overlayTitle").textContent = "Game Over!";
  document.getElementById("overlayText").textContent =
    `You scored ${score} point${score === 1 ? "" : "s"}. Can you fly farther next time?`;

  startButton.innerHTML = "PLAY AGAIN <span>↻</span>";
  overlay.classList.remove("hidden");
  gameStatus.textContent = "GAME OVER";
}

startButton.addEventListener("click", startGame);

canvas.addEventListener("pointerdown", event => {
  event.preventDefault();
  flap();
});

document.addEventListener("keydown", event => {
  if (
    event.code === "Space" ||
    event.code === "ArrowUp"
  ) {
    event.preventDefault();

    if (!event.repeat) flap();
  }
});

// ---------- GAME LOOP ----------

function update(deltaTime) {
  if (state === "playing") {
    frames++;

    penguin.velocity += penguin.gravity * deltaTime;
    penguin.y += penguin.velocity * deltaTime;

    penguin.rotation = Math.min(
      1.15,
      Math.max(-0.35, penguin.velocity * 0.08)
    );

    updatePipes();

    if (checkCollision()) {
      endGame();
    }
  } else if (state === "ready") {
    penguin.y = 280 + Math.sin(performance.now() / 350) * 9;
    penguin.rotation = Math.sin(performance.now() / 450) * 0.08;
  }

  updateSnow();
  updateParticles();
}

function draw() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  drawBackground();
  drawSnow();
  drawPipes();
  drawGround();
  drawParticles();
  drawPenguin();
}

function gameLoop(timestamp) {
  const deltaTime = lastTime
    ? Math.min((timestamp - lastTime) / (1000 / 60), 2)
    : 1;

  lastTime = timestamp;

  update(deltaTime);
  draw();

  requestAnimationFrame(gameLoop);
}

// ---------- INITIALIZE ----------

createSnowflakes();
requestAnimationFrame(gameLoop);
