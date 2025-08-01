const TILE_SIZE = 20;
const GRID_SIZE = 40;
const SPEED = 2; // tiles per second
const UPDATE_INTERVAL = 1000 / SPEED;

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const form = document.getElementById('player-form');
const playerConfigDiv = document.getElementById('players-config');
const loadingScreen = document.getElementById('loading-screen');
const gameContainer = document.getElementById('game-container');
const scoreboardDiv = document.getElementById('scoreboard');
const countdownDiv = document.getElementById('countdown');

let players = [];
let scores = {};
let trails = new Set();
let intervalId;

const emojiOptions = ["🦝", "🐸", "🐱", "🐶", "🐵", "🐧", "🐯"];

form.playerCount.addEventListener("change", updatePlayerInputs);
form.addEventListener("submit", startGame);

function updatePlayerInputs() {
  playerConfigDiv.innerHTML = "";
  const count = parseInt(form.playerCount.value);
  for (let i = 0; i < count; i++) {
    const div = document.createElement("div");
    div.innerHTML = `
      <label>Player ${i + 1} Name: <input required name="name-${i}" /></label>
      <label>Colour: <input type="color" name="color-${i}" value="#${Math.floor(Math.random()*16777215).toString(16)}" /></label>
      <label>Emoji:
        <select name="emoji-${i}">
          ${emojiOptions.map(e => `<option value="${e}">${e}</option>`).join("")}
        </select>
      </label>
    `;
    playerConfigDiv.appendChild(div);
  }
}
updatePlayerInputs();

function startGame(e) {
  e.preventDefault();
  const count = parseInt(form.playerCount.value);
  players = [];
  trails.clear();
  for (let i = 0; i < count; i++) {
    const name = form[`name-${i}`].value;
    const color = form[`color-${i}`].value;
    const emoji = form[`emoji-${i}`].value;
    const controls = getControls(i);

    const startPos = getStartPos(i, count);
    players.push({
      name, color, emoji, x: startPos.x, y: startPos.y,
      dir: { x: 0, y: 0 }, alive: true, controls
    });
    scores[name] = scores[name] || 0;
  }

  loadingScreen.classList.add("hidden");
  gameContainer.classList.remove("hidden");
  renderScoreboard();
  countdown(3, startLoop);
}

function getControls(index) {
  const schemes = [
    { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] },
    { w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0] },
    { i: [0, -1], k: [0, 1], j: [-1, 0], l: [1, 0] },
    { t: [0, -1], g: [0, 1], f: [-1, 0], h: [1, 0] },
  ];
  return schemes[index];
}

function getStartPos(i, count) {
  const edgeOffset = 4;
  const pos = [
    { x: edgeOffset, y: edgeOffset },
    { x: GRID_SIZE - edgeOffset, y: GRID_SIZE - edgeOffset },
    { x: edgeOffset, y: GRID_SIZE - edgeOffset },
    { x: GRID_SIZE - edgeOffset, y: edgeOffset },
  ];
  return pos[i];
}

function countdown(n, cb) {
  if (n === 0) {
    countdownDiv.textContent = "GO!";
    setTimeout(() => {
      countdownDiv.textContent = "";
      cb();
    }, 500);
  } else {
    countdownDiv.textContent = n;
    setTimeout(() => countdown(n - 1, cb), 1000);
  }
}

function startLoop() {
  document.addEventListener("keydown", handleKey);
  intervalId = setInterval(update, UPDATE_INTERVAL);
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

function update() {
  players.forEach(p => {
    if (!p.alive || (p.dir.x === 0 && p.dir.y === 0)) return;
    p.x += p.dir.x;
    p.y += p.dir.y;
    const key = `${p.x},${p.y}`;
    if (p.x < 0 || p.y < 0 || p.x >= GRID_SIZE || p.y >= GRID_SIZE || trails.has(key)) {
      p.alive = false;
      explode(p.x, p.y, p.color);
    } else {
      trails.add(key);
    }
  });

  const alive = players.filter(p => p.alive);
  if (alive.length <= 1) {
    if (alive[0]) scores[alive[0].name]++;
    clearInterval(intervalId);
    setTimeout(() => {
      renderScoreboard();
      startGame({ preventDefault: () => {} });
    }, 2000);
  }

  render();
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  trails.forEach(pos => {
    const [x, y] = pos.split(",").map(Number);
    ctx.fillStyle = "#333";
    ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
  });

  players.forEach(p => {
    if (!p.alive) return;
    ctx.fillStyle = p.color;
    ctx.font = `${TILE_SIZE}px sans-serif`;
    ctx.fillText(p.emoji, p.x * TILE_SIZE, (p.y + 1) * TILE_SIZE);
  });
}

function renderScoreboard() {
  scoreboardDiv.innerHTML = Object.entries(scores)
    .map(([name, score]) => `${name}: ${score}`)
    .join(" | ");
}

function explode(x, y, color) {
  for (let i = 0; i < 5; i++) {
    setTimeout(() => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x * TILE_SIZE + 10, y * TILE_SIZE + 10, i * 3, 0, Math.PI * 2);
      ctx.fill();
    }, i * 50);
  }
}
