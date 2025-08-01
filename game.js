const TILE = 20;
const GRID = 40;
const SPEED = 2; // tiles per second

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const form = document.getElementById('player-form');
const loading = document.getElementById('loading-screen');
const gameUI = document.getElementById('game-container');
const config = document.getElementById('players-config');
const countdownDiv = document.getElementById('countdown');
const scoreboard = document.getElementById('scoreboard');

const explodeSFX = document.getElementById('explode-sfx');
const winSFX = document.getElementById('win-sfx');

const emojiList = ["🦝", "🐸", "🐱", "🐶", "🐵", "🐧", "🐯"];
let trails = new Set();
let players = [];
let scores = {};
let intervalId;

form.playerCount.addEventListener("change", updateInputs);
form.addEventListener("submit", initGame);
updateInputs();

function updateInputs() {
  config.innerHTML = "";
  const count = parseInt(form.playerCount.value);
  for (let i = 0; i < count; i++) {
    const div = document.createElement("div");
    div.innerHTML = `
      <label>Player ${i + 1} Name: <input required name="name-${i}" /></label>
      <label>Color: <input type="color" name="color-${i}" value="#${Math.floor(Math.random()*0xffffff).toString(16)}" /></label>
      <label>Emoji:
        <select name="emoji-${i}">
          ${emojiList.map(e => `<option value="${e}">${e}</option>`).join("")}
        </select>
      </label>
    `;
    config.appendChild(div);
  }
}

function initGame(e) {
  e.preventDefault();
  trails.clear();
  players = [];
  const count = parseInt(form.playerCount.value);

  for (let i = 0; i < count; i++) {
    const name = form[`name-${i}`].value;
    const color = form[`color-${i}`].value;
    const emoji = form[`emoji-${i}`].value;
    const controls = getControlScheme(i);
    const pos = getStart(i, count);
    players.push({ name, color, emoji, ...pos, dir: { x: 0, y: 0 }, alive: true, controls });
    scores[name] = scores[name] || 0;
  }

  loading.classList.add("hidden");
  gameUI.classList.remove("hidden");
  drawScore();
  countdown(3, startGameLoop);
}

function getControlScheme(i) {
  const controlSets = [
    { ArrowUp:[0,-1], ArrowDown:[0,1], ArrowLeft:[-1,0], ArrowRight:[1,0] },
    { w:[0,-1], s:[0,1], a:[-1,0], d:[1,0] },
    { i:[0,-1], k:[0,1], j:[-1,0], l:[1,0] },
    { t:[0,-1], g:[0,1], f:[-1,0], h:[1,0] }
  ];
  return controlSets[i];
}

function getStart(i, total) {
  const offset = 5;
  const pos = [
    { x: offset, y: offset },
    { x: GRID - offset, y: GRID - offset },
    { x: offset, y: GRID - offset },
    { x: GRID - offset, y: offset }
  ];
  return pos[i];
}

function countdown(n, cb) {
  if (n === 0) {
    countdownDiv.textContent = "GO!";
    setTimeout(() => { countdownDiv.textContent = ""; cb(); }, 800);
  } else {
    countdownDiv.textContent = n;
    setTimeout(() => countdown(n - 1, cb), 1000);
  }
}

function startGameLoop() {
  document.addEventListener("keydown", handleKey);
  intervalId = setInterval(tick, 1000 / SPEED);
}

function handleKey(e) {
  players.forEach(p => {
    if (p.controls[e.key]) {
      const [dx, dy] = p.controls[e.key];
      if (!(p.dir.x === -dx && p.dir.y === -dy)) {
        p.dir = { x: dx, y: dy };
      }
    }
  });
}

function tick() {
  players.forEach(p => {
    if (!p.alive || (p.dir.x === 0 && p.dir.y === 0)) return;
    p.x += p.dir.x;
    p.y += p.dir.y;
    const key = `${p.x},${p.y}`;
    if (p.x < 0 || p.y < 0 || p.x >= GRID || p.y >= GRID || trails.has(key)) {
      p.alive = false;
      explodeSFX.currentTime = 0; explodeSFX.play();
    } else {
      trails.add(key);
    }
  });

  render();
  const alive = players.filter(p => p.alive);
  if (alive.length <= 1) {
    clearInterval(intervalId);
    if (alive[0]) {
      scores[alive[0].name]++;
      winSFX.currentTime = 0; winSFX.play();
    }
    setTimeout(() => initGame({ preventDefault: () => {} }), 2000);
  }
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  trails.forEach(pos => {
    const [x, y] = pos.split(',').map(Number);
    ctx.fillStyle = "#222";
    ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
  });

  players.forEach(p => {
    if (!p.alive) return;
    ctx.font = `${TILE}px serif`;
    ctx.fillStyle = p.color;
    ctx.fillText(p.emoji, p.x * TILE, (p.y + 1) * TILE - 3);
  });
}

function drawScore() {
  scoreboard.innerHTML = Object.entries(scores)
    .map(([name, score]) => `<span>${name}: ${score}</span>`)
    .join(" | ");
}
