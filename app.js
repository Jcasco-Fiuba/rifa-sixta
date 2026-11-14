(() => {
  'use strict';
  const KEY = 'rifa-sixta-state-v1';
  const VALID = new Set(['available', 'reserved', 'paid']);
  const labels = { available: 'Disponible', reserved: 'Reservado', paid: 'Pagado' };
  const posterSans = '"Atkinson Hyperlegible", Arial, sans-serif';
  const posterSerif = '"Bree Serif", Georgia, serif';
  const posterColors = {
    paper: '#e9efe6', surface: '#faf7eb', ink: '#183f3c', muted: '#4c625a',
    line: '#9cb5a7', coral: '#d56d61', coralDark: '#963e36', gold: '#e0b548',
    reserved: '#f4d66e', paid: '#963e36'
  };
  const posterAssetsReady = Promise.all([
    loadImage('assets/sixta.png'),
    loadImage('assets/costillar.png'),
    loadImage('assets/chorizos.png')
  ]);
  const posterFontsReady = document.fonts
    ? Promise.all([
      document.fonts.load(`400 72px ${posterSerif}`),
      document.fonts.load(`700 28px ${posterSans}`)
    ])
    : Promise.resolve();
  const numbers = Array.from({ length: 100 }, (_, i) => String(i).padStart(2, '0'));
  const grid = document.getElementById('number-grid');
  const message = document.getElementById('status-message');
  const ctx = document.getElementById('poster-canvas').getContext('2d');
  let mode = 'reserved';
  let status = loadState();

  function blankState() { return Object.fromEntries(numbers.map(n => [n, 'available'])); }
  function loadState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(KEY) || 'null');
      const source = parsed && parsed.numbers ? parsed.numbers : parsed;
      if (!source || !numbers.every(n => VALID.has(source[n]))) return blankState();
      return Object.fromEntries(numbers.map(n => [n, source[n]]));
    } catch { return blankState(); }
  }
  function saveState() {
    try { localStorage.setItem(KEY, JSON.stringify({ version: 1, numbers: status })); }
    catch { announce('No se pudo guardar en este navegador. Liberá espacio o descargá una copia.'); }
  }
  function announce(text) { message.textContent = text; }
  function totals() {
    const paid = numbers.filter(n => status[n] === 'paid').length;
    const reserved = numbers.filter(n => status[n] === 'reserved').length;
    return { paid, reserved, raised: paid * 10000 };
  }
  function render() {
    const fragment = document.createDocumentFragment();
    for (const n of numbers) {
      const state = status[n];
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `number-cell ${state}`;
      button.dataset.number = n;
      button.setAttribute('aria-label', `Número ${n}, ${labels[state]}. Tocar para ${mode === 'available' ? 'liberar' : mode === 'paid' ? 'marcar pagado' : 'reservar'}.`);
      button.innerHTML = `${n}<span class="state-mark" aria-hidden="true">${state === 'reserved' ? 'R · RES.' : state === 'paid' ? '✓ · PAG.' : '&nbsp;'}</span>`;
      fragment.append(button);
    }
    grid.replaceChildren(fragment);
    const { paid, reserved, raised } = totals();
    document.getElementById('paid-count').textContent = `${paid} de 100 números pagados${reserved ? ` · ${reserved} reservados` : ''}`;
    document.getElementById('raised-total').textContent = `Recaudado: ${formatARS(raised)}`;
    const bar = document.getElementById('progress-bar');
    bar.setAttribute('aria-valuenow', String(paid));
    document.getElementById('progress-fill').style.width = `${paid}%`;
    drawPoster();
  }
  function updateActionLabels() {
    const action = mode === 'available' ? 'liberar' : mode === 'paid' ? 'marcar pagado' : 'reservar';
    grid.querySelectorAll('.number-cell').forEach(button => {
      const n = button.dataset.number;
      button.setAttribute('aria-label', `Número ${n}, ${labels[status[n]]}. Tocar para ${action}.`);
    });
  }
  function formatARS(value) { return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(value); }
  grid.addEventListener('click', event => {
    const button = event.target.closest('.number-cell');
    if (!button) return;
    const n = button.dataset.number;
    if (mode === 'available' && status[n] === 'available') { announce(`El ${n} ya está disponible.`); return; }
    if (mode !== 'available' && status[n] === mode) { announce(`El ${n} ya figura como ${labels[mode].toLowerCase()}.`); return; }
    if (mode === 'available' && !window.confirm(`¿Liberar el número ${n}?`)) return;
    status[n] = mode;
    saveState(); render();
    announce(`Número ${n}: ${labels[mode].toLowerCase()}.`);
  });
  document.querySelectorAll('.mode-button').forEach(button => button.addEventListener('click', () => {
    mode = button.dataset.mode;
    document.querySelectorAll('.mode-button').forEach(b => { b.classList.toggle('selected', b === button); b.setAttribute('aria-pressed', String(b === button)); });
    updateActionLabels();
    announce(`Modo seleccionado: ${mode === 'available' ? 'liberar' : labels[mode].toLowerCase()}.`);
  }));

  function loadImage(src) { return new Promise((resolve, reject) => { const image = new Image(); image.onload = () => resolve(image); image.onerror = reject; image.src = src; }); }
  function drawPhoto(image, cx, cy, w, h, rotation = 0, crop = false, posY = 0.4) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotation);
    ctx.fillStyle = posterColors.surface;
    ctx.fillRect(-w / 2 - 11, -h / 2 - 11, w + 22, h + 30);
    ctx.fillStyle = '#fffdfb';
    ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.save();
    ctx.beginPath();
    ctx.rect(-w / 2, -h / 2, w, h);
    ctx.clip();
    const scale = crop
      ? Math.max(w / image.width, h / image.height)
      : Math.min(w / image.width, h / image.height);
    const iw = image.width * scale;
    const ih = image.height * scale;
    ctx.drawImage(image, -iw / 2, -h / 2 + (h - ih) * posY, iw, ih);
    ctx.restore();
    ctx.strokeStyle = posterColors.ink;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-w / 2 - 8, -h / 2 - 8);
    ctx.lineTo(w / 2 + 7, -h / 2 - 10);
    ctx.lineTo(w / 2 + 10, h / 2 + 9);
    ctx.lineTo(-w / 2 - 9, h / 2 + 8);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
  function drawWavyUnderline(x, y, width, color, thickness = 4) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.bezierCurveTo(x + width * .22, y - 5, x + width * .3, y + 5, x + width * .52, y + 1);
    ctx.bezierCurveTo(x + width * .72, y - 4, x + width * .82, y + 4, x + width, y - 1);
    ctx.strokeStyle = color;
    ctx.lineWidth = thickness;
    ctx.lineCap = 'round';
    ctx.stroke();
  }
  async function drawPoster() {
    if (!ctx) return;
    const [sixta, ribs, sausages] = await posterAssetsReady;
    await posterFontsReady;
    const { paper, surface, ink, muted, line, coral, coralDark, gold, reserved, paid } = posterColors;
    const W = 1080, H = 1920;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = paper;
    ctx.fillRect(0, 0, W, H);

    // The slightly irregular outline borrows the shape of a paper raffle ticket.
    ctx.strokeStyle = '#85a092';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(38, 36); ctx.lineTo(1042, 31); ctx.lineTo(1045, 1887); ctx.lineTo(35, 1892); ctx.closePath();
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = ink;
    ctx.font = `700 31px ${posterSans}`;
    ctx.fillText('Rifa solidaria', 72, 101);
    ctx.fillStyle = ink;
    ctx.font = `400 88px ${posterSerif}`;
    ctx.fillText('Nos juntamos', 72, 213);
    ctx.fillText('por Sixta', 72, 309);
    drawWavyUnderline(76, 328, 484, coral, 5);
    ctx.fillStyle = muted;
    ctx.font = `400 29px ${posterSans}`;
    ctx.fillText('Para ayudarla a conseguir su marcapasos.', 76, 382, 640);

    // Sixta's own photo gets the treatment of a small family snapshot.
    drawPhoto(sixta, 872, 214, 224, 294, -0.035, true, 0.18);
    ctx.fillStyle = coralDark;
    ctx.font = `700 24px ${posterSans}`;
    ctx.fillText('Sixta', 956, 386);

    ctx.fillStyle = ink;
    ctx.font = `400 42px ${posterSerif}`;
    ctx.fillText('El premio', 72, 478);
    drawWavyUnderline(73, 493, 200, gold, 8);
    drawPhoto(ribs, 282, 630, 350, 252, -0.022, false);
    drawPhoto(sausages, 756, 630, 420, 252, 0.018, false);
    ctx.fillStyle = ink;
    ctx.font = `400 39px ${posterSerif}`;
    ctx.fillText('Un costillar entero + 2 kg de chorizos', 72, 807);

    // A marker-like swash gives the price one clear place to stand out.
    ctx.fillStyle = gold;
    ctx.beginPath();
    ctx.moveTo(72, 843); ctx.quadraticCurveTo(280, 832, 515, 842);
    ctx.quadraticCurveTo(720, 831, 1006, 847); ctx.lineTo(1008, 923);
    ctx.quadraticCurveTo(740, 935, 510, 922); ctx.quadraticCurveTo(290, 934, 72, 918);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = ink;
    ctx.font = `700 45px ${posterSans}`;
    ctx.fillText('El número cuesta $10.000', 88, 898);

    ctx.fillStyle = ink;
    ctx.font = `400 43px ${posterSerif}`;
    ctx.fillText('Elegí tu número', 72, 987);
    ctx.fillStyle = muted;
    ctx.font = `400 25px ${posterSans}`;
    ctx.fillText('Del 00 al 99', 824, 984);

    const x0 = 72, y0 = 1018, cellW = 93.6, cellH = 58.2;
    for (let i = 0; i < 100; i++) {
      const n = numbers[i], s = status[n], x = x0 + (i % 10) * cellW, y = y0 + Math.floor(i / 10) * cellH;
      const fill = s === 'reserved' ? reserved : s === 'paid' ? paid : surface;
      const foreground = s === 'paid' ? surface : ink;
      ctx.fillStyle = fill;
      ctx.fillRect(x + 1, y + 1, cellW - 3, cellH - 3);
      ctx.strokeStyle = line;
      ctx.lineWidth = 1.6;
      ctx.strokeRect(x + 1, y + 1, cellW - 3, cellH - 3);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = foreground;
      ctx.font = `700 28px ${posterSans}`;
      ctx.fillText(n, x + cellW / 2, y + cellH / 2 - (s === 'available' ? 0 : 7));
      if (s !== 'available') {
        ctx.font = `700 15px ${posterSans}`;
        ctx.fillText(s === 'paid' ? '✓' : 'R', x + cellW / 2, y + cellH / 2 + 15);
      }
    }
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';
    const legendY = 1624;
    const entries = [
      { x: 78, fill: surface, stroke: line, label: 'Disponible' },
      { x: 395, fill: reserved, stroke: '#b08b24', label: 'Reservado' },
      { x: 730, fill: paid, stroke: paid, label: 'Pagado' }
    ];
    entries.forEach(({ x, fill, stroke, label }) => {
      ctx.fillStyle = fill; ctx.strokeStyle = stroke; ctx.lineWidth = 2;
      ctx.fillRect(x, legendY - 25, 31, 31); ctx.strokeRect(x, legendY - 25, 31, 31);
      ctx.fillStyle = ink; ctx.font = `700 25px ${posterSans}`; ctx.fillText(label, x + 43, legendY);
    });
    ctx.fillStyle = ink;
    ctx.font = `400 36px ${posterSerif}`;
    ctx.fillText('Se sortea al venderse los 100 números', 72, 1707);
    ctx.fillStyle = muted;
    ctx.font = `400 24px ${posterSans}`;
    ctx.fillText('Quiniela de la Ciudad Nocturna', 76, 1749);
    drawWavyUnderline(74, 1772, 680, coral, 5);
    ctx.fillStyle = coralDark;
    ctx.font = `700 34px ${posterSans}`;
    ctx.fillText('Pedí tu número por mensaje privado', 74, 1824);
    ctx.fillStyle = ink;
    ctx.font = `400 25px ${posterSans}`;
    ctx.fillText('Gracias por acompañar a Sixta', 76, 1865);
    ctx.textAlign = 'right';
    ctx.fillStyle = muted;
    ctx.font = `400 21px ${posterSans}`;
    ctx.fillText('Una rifa familiar', 1004, 1865);
    ctx.textAlign = 'left';
  }
  async function makePosterBlob() {
    await drawPoster();
    return new Promise(resolve => document.getElementById('poster-canvas').toBlob(resolve, 'image/png'));
  }
  document.getElementById('download-poster').addEventListener('click', async () => {
    const blob = await makePosterBlob();
    if (!blob) { announce('No se pudo generar el afiche.'); return; }
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'rifa-solidaria-sixta.png'; link.click(); setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    announce('Afiche PNG descargado. Ya podés compartirlo por WhatsApp.');
  });
  document.getElementById('share-poster').addEventListener('click', async () => {
    const blob = await makePosterBlob();
    if (!blob) { announce('No se pudo generar el afiche.'); return; }
    const file = new File([blob], 'rifa-solidaria-sixta.png', { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], title: 'Rifa solidaria para Sixta', text: 'Una mano para Sixta 💛' }); announce('Afiche listo para compartir.'); }
      catch (error) { if (error.name !== 'AbortError') announce('No se pudo abrir compartir. Probá descargar el afiche.'); }
    } else {
      const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = file.name; link.click(); setTimeout(() => URL.revokeObjectURL(link.href), 1000);
      announce('Este navegador no comparte imágenes directamente. Descargué el afiche para que lo adjuntes en WhatsApp.');
    }
  });
  document.getElementById('export-json').addEventListener('click', () => {
    const file = new Blob([JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), numbers: status }, null, 2)], { type: 'application/json' });
    const link = document.createElement('a'); link.href = URL.createObjectURL(file); link.download = 'rifa-sixta-respaldo.json'; link.click(); setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    announce('Copia de datos guardada. Conservála para recuperar tus ventas.');
  });
  document.getElementById('import-file').addEventListener('change', async event => {
    const file = event.target.files[0]; if (!file) return;
    try {
      const data = JSON.parse(await file.text()); const source = data.numbers || data;
      if (!numbers.every(n => VALID.has(source[n]))) throw new Error('Datos incompletos');
      if (!window.confirm('Recuperar esta copia reemplazará los estados actuales de los 100 números. ¿Continuar?')) return;
      status = Object.fromEntries(numbers.map(n => [n, source[n]])); saveState(); render(); announce('Copia recuperada correctamente.');
    } catch { announce('El archivo no tiene un respaldo válido para esta rifa.'); }
    finally { event.target.value = ''; }
  });
  Promise.all([posterAssetsReady, posterFontsReady]).then(render).catch(() => {
    render(); announce('No se pudieron cargar las fotos o las tipografías. Revisá la carpeta assets.');
  });
})();
