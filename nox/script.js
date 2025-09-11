// Starfield background with performance considerations
const starCanvas = document.getElementById('starfield');
const ctx = starCanvas.getContext('2d');
let stars = [];
let animationId = null;

function resizeCanvas() {
  starCanvas.width = window.innerWidth;
  starCanvas.height = window.innerHeight;
}

function createStars() {
  const density = window.matchMedia('(min-width: 900px)').matches ? 0.0018 : 0.0012; // stars per pixel
  const count = Math.min(800, Math.floor(window.innerWidth * window.innerHeight * density));
  stars = Array.from({ length: count }, () => ({
    x: Math.random() * starCanvas.width,
    y: Math.random() * starCanvas.height,
    z: Math.random() * 0.8 + 0.2,
    tw: Math.random() * 0.6 + 0.2,
  }));
}

function renderStars(ts) {
  ctx.clearRect(0, 0, starCanvas.width, starCanvas.height);
  for (const s of stars) {
    const size = s.z * 1.6;
    const alpha = 0.6 + Math.sin((ts / 800) * s.tw + s.x) * 0.25;
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.beginPath();
    ctx.arc(s.x, s.y, size, 0, Math.PI * 2);
    ctx.fill();
  }
}

function loop(ts = 0) {
  renderStars(ts);
  animationId = requestAnimationFrame(loop);
}

function setupStarfield() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  resizeCanvas();
  createStars();
  cancelAnimationFrame(animationId);
  loop();
}

window.addEventListener('resize', () => {
  resizeCanvas();
  createStars();
});
setupStarfield();

// Radial menu behavior
const menuToggle = document.getElementById('menuToggle');
const menuItems = document.getElementById('menuItems');

function setMenu(open) {
  document.body.classList.toggle('radial-open', open);
  menuToggle.setAttribute('aria-expanded', String(open));
  menuItems.hidden = false; // keep in DOM for animation and a11y
}

menuToggle?.addEventListener('click', () => {
  const open = !document.body.classList.contains('radial-open');
  setMenu(open);
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') setMenu(false);
});

document.addEventListener('click', (e) => {
  if (!e.target.closest('.radial-nav')) setMenu(false);
});

// Smooth scroll and active state
for (const link of document.querySelectorAll('.nav-item')) {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const id = link.getAttribute('href');
    const el = document.querySelector(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setMenu(false);
    el?.focus({ preventScroll: true });
  });
}

// Curiosities grid
const curiosities = [
  { q: 'Qual signo está mais favorecido hoje?', a: 'Observe o regente do dia e a Lua. Lua em signos de fogo costuma elevar energia e iniciativa.' },
  { q: 'O que é retorno solar?', a: 'É o momento anual em que o Sol retorna à posição exata do seu nascimento, abrindo um novo ciclo pessoal.' },
  { q: 'Mercúrio retrógrado sempre é ruim?', a: 'Não. É um período ótimo para revisar, reorganizar e reescrever. Atenção a contratos e prazos.' },
  { q: 'Ascendente muda minha aparência?', a: 'Pode influenciar estilo e primeira impressão. É a "porta" do mapa: como você se lança ao mundo.' },
  { q: 'Casa 10 fala de carreira?', a: 'Sim. Ela mostra o topo da sua expressão pública, ambições e direção profissional.' },
  { q: 'Eclipse é perigoso?', a: 'Eclipses simbolizam viradas e reconfigurações. Cuidar de energia e descanso ajuda na adaptação.' },
  { q: 'Compatibilidade é só signo solar?', a: 'Não. Sinastria considera vários pontos: Lua, Vênus, Marte, casas e aspectos entre mapas.' },
  { q: 'Mapa natal muda?', a: 'O mapa em si não muda; quem muda é você. Trânsitos e progressões ativam temas do mapa.' },
];

const grid = document.getElementById('curiosityGrid');
function renderCuriosities() {
  if (!grid) return;
  grid.innerHTML = '';
  curiosities.forEach((c, idx) => {
    const item = document.createElement('article');
    item.className = 'card-curio';
    item.setAttribute('role', 'listitem');
    item.tabIndex = 0;
    item.innerHTML = `<div class="q">${c.q}</div><div class="a" data-revealed="false">Clique para revelar</div>`;
    const a = item.querySelector('.a');
    function reveal() { a.textContent = c.a; a.dataset.revealed = 'true'; }
    item.addEventListener('click', () => reveal());
    item.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); reveal(); } });
    grid.appendChild(item);
  });
}
renderCuriosities();

// Theme extraction from uploaded logo
const logoInput = document.getElementById('logoInput');
const logoImg = document.getElementById('logo');

function setThemeFromColors(primaryHex, accentHex) {
  document.documentElement.style.setProperty('--primary', primaryHex);
  document.documentElement.style.setProperty('--accent', accentHex);
  const elev = mixHexWith(primaryHex, '#000000', 0.7);
  document.documentElement.style.setProperty('--bg-elev', elev);
}

function hexToRgb(hex) {
  const n = hex.replace('#', '');
  const v = n.length === 3 ? n.split('').map(x => x + x).join('') : n;
  const i = parseInt(v, 16);
  return { r: (i >> 16) & 255, g: (i >> 8) & 255, b: i & 255 };
}
function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}
function mixHexWith(hex, withHex, ratio) {
  const a = hexToRgb(hex), b = hexToRgb(withHex);
  const m = (x, y) => Math.round(x * (1 - ratio) + y * ratio);
  return rgbToHex(m(a.r, b.r), m(a.g, b.g), m(a.b, b.b));
}

function extractPaletteFromImage(img) {
  const c = document.createElement('canvas');
  const cx = c.getContext('2d', { willReadFrequently: true });
  const w = c.width = 64; const h = c.height = 64;
  cx.drawImage(img, 0, 0, w, h);
  const { data } = cx.getImageData(0, 0, w, h);
  let r = 0, g = 0, b = 0, n = 0;
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    if (a < 16) continue; // ignore transparent
    r += data[i]; g += data[i + 1]; b += data[i + 2]; n++;
  }
  if (!n) return null;
  r = Math.round(r / n); g = Math.round(g / n); b = Math.round(b / n);
  const base = rgbToHex(r, g, b);
  // create an accent by mixing with magenta/blue depending on hue
  const accent = mixHexWith(base, r > b ? '#b68cff' : '#6f7cff', 0.35);
  return { primary: base, accent };
}

logoInput?.addEventListener('change', (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const img = new Image();
  img.onload = () => {
    const pal = extractPaletteFromImage(img);
    if (pal) setThemeFromColors(pal.primary, pal.accent);
    if (logoImg) {
      logoImg.src = URL.createObjectURL(file);
      document.querySelector('.brand')?.classList.remove('no-logo');
    }
  };
  img.src = URL.createObjectURL(file);
});

if (logoImg) {
  logoImg.addEventListener('load', () => {
    const pal = extractPaletteFromImage(logoImg);
    if (pal) setThemeFromColors(pal.primary, pal.accent);
  });
}

// Login mock session
const form = document.getElementById('loginForm');
const logoutBtn = document.getElementById('logoutBtn');
const sessionStatus = document.getElementById('sessionStatus');

function updateSessionUI() {
  const session = JSON.parse(localStorage.getItem('nox.session') || 'null');
  if (session?.email) {
    sessionStatus.textContent = `Olá, ${session.email}. Sessão ativa.`;
    logoutBtn.hidden = false;
  } else {
    sessionStatus.textContent = '';
    logoutBtn.hidden = true;
  }
}

form?.addEventListener('submit', (e) => {
  e.preventDefault();
  const fd = new FormData(form);
  const email = String(fd.get('email') || '').trim();
  const password = String(fd.get('password') || '');
  const emailOk = /.+@.+\..+/.test(email);
  const passOk = password.length >= 6;
  if (!emailOk || !passOk) {
    sessionStatus.textContent = 'Verifique email e senha (mín. 6 caracteres).';
    return;
  }
  localStorage.setItem('nox.session', JSON.stringify({ email, at: Date.now() }));
  updateSessionUI();
  sessionStatus.textContent = 'Bem-vindo(a). Você já pode falar com a Noxie.';
});

logoutBtn?.addEventListener('click', () => {
  localStorage.removeItem('nox.session');
  updateSessionUI();
});

updateSessionUI();

// minor: year in footer
document.getElementById('year').textContent = String(new Date().getFullYear());

