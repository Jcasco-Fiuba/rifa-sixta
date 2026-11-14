(() => {
  'use strict';
  const KEY = 'rifa-sixta-state-v1';
  const VALID = new Set(['available', 'reserved', 'paid']);
  const labels = { available: 'Disponible', reserved: 'Reservado', paid: 'Pagado' };
  const posterSans = '"Trebuchet MS", "Segoe UI", Arial, sans-serif';
  const posterSerif = '"Palatino Linotype", "Book Antiqua", Palatino, Georgia, serif';
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

  function roundRect(context, x, y, w, h, r, fill, stroke) {
    context.beginPath(); context.roundRect(x, y, w, h, r);
    if (fill) { context.fillStyle = fill; context.fill(); }
    if (stroke) { context.strokeStyle = stroke; context.lineWidth = 2; context.stroke(); }
  }
  function loadImage(src) { return new Promise((resolve, reject) => { const image = new Image(); image.onload = () => resolve(image); image.onerror = reject; image.src = src; }); }
  function fitImage(image, x, y, w, h, radius, crop = true, posY = 0.5) {
    ctx.save(); ctx.beginPath(); ctx.roundRect(x, y, w, h, radius); ctx.clip();
    if (!crop) {
      const scale = Math.min(w / image.width, h / image.height);
      const iw = image.width * scale, ih = image.height * scale;
      ctx.fillStyle = '#fffdfb'; ctx.fillRect(x, y, w, h);
      ctx.drawImage(image, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih);
    } else {
      const scale = Math.max(w / image.width, h / image.height);
      const iw = image.width * scale, ih = image.height * scale;
      ctx.drawImage(image, x + (w - iw) / 2, y + (h - ih) * posY, iw, ih);
    }
    ctx.restore();
  }
  async function drawPoster() {
    if (!ctx) return;
    const W = 1080, H = 1920;
    ctx.clearRect(0, 0, W, H); ctx.fillStyle = '#fbf6f1'; ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'left'; ctx.fillStyle = '#a94f51'; ctx.font = `600 31px ${posterSans}`; ctx.fillText('Rifa solidaria', 72, 102);
    ctx.fillStyle = '#3d302e'; ctx.font = `600 72px ${posterSerif}`; ctx.fillText('Una mano para', 72, 202);
    ctx.fillStyle = '#a94f51'; ctx.font = `italic 600 78px ${posterSerif}`; ctx.fillText('Sixta Ferreira', 72, 294);
    ctx.fillStyle = '#796b66'; ctx.font = `500 31px ${posterSans}`; ctx.fillText('Ayudanos a conseguir su marcapasos', 74, 362);
    const [sixta, banner] = await Promise.all([loadImage('assets/sixta.png'), loadImage('assets/premio-banner.jpg')]);
    const px = 876, py = 220, pr = 138;
    ctx.fillStyle = '#f5dfdb'; ctx.beginPath(); ctx.arc(px, py, pr + 10, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#cf726e'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(px, py, pr + 2, 0, Math.PI * 2); ctx.stroke();
    fitImage(sixta, px - pr, py - pr, pr * 2, pr * 2, pr, true, 0.22);
    ctx.fillStyle = '#cf726e'; ctx.beginPath(); ctx.arc(980, 106, 44, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#fbf6f1'; ctx.lineWidth = 5; ctx.stroke();
    ctx.fillStyle = '#fffdfb'; ctx.font = `600 21px ${posterSans}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('Rifa', 980, 107);
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    fitImage(banner, 66, 415, 948, 340, 26, true, 0.56);
    roundRect(ctx, 66, 415, 948, 340, 26, null, '#e4d7ce');
    ctx.fillStyle = '#3d302e'; ctx.font = `600 41px ${posterSerif}`; ctx.fillText('Un costillar entero + 2 kg de chorizos', 72, 815);
    ctx.fillStyle = '#a94f51'; ctx.font = `700 58px ${posterSans}`; ctx.fillText('$10.000', 73, 888);
    ctx.fillStyle = '#796b66'; ctx.font = `500 31px ${posterSans}`; ctx.fillText('cada número · elegí del 00 al 99', 367, 887);
    const x0 = 72, y0 = 935, cellW = 93.6, cellH = 59.5;
    for (let i = 0; i < 100; i++) {
      const n = numbers[i], s = status[n], x = x0 + (i % 10) * cellW, y = y0 + Math.floor(i / 10) * cellH;
      const fills = { available: '#fffdfb', reserved: '#f4dfad', paid: '#c86e68' };
      const ink = s === 'paid' ? '#fffdfb' : '#3d302e';
      ctx.fillStyle = fills[s]; ctx.fillRect(x + 2, y + 2, cellW - 4, cellH - 4);
      ctx.strokeStyle = '#dccdc3'; ctx.lineWidth = 2; ctx.strokeRect(x + 2, y + 2, cellW - 4, cellH - 4);
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = ink; ctx.font = `600 28px ${posterSans}`; ctx.fillText(n, x + cellW / 2, y + cellH / 2 - (s === 'available' ? 0 : 8));
      if (s !== 'available') { ctx.font = `700 13px ${posterSans}`; ctx.fillText(s === 'paid' ? '✓ PAGADO' : 'R · RES.', x + cellW / 2, y + cellH / 2 + 17); }
    }
    ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
    const legendY = 1580;
    const entries = [['#fffdfb', '#bba99d', 'Disponible'], ['#f4dfad', '#d2b66e', 'Reservado'], ['#c86e68', '#c86e68', 'Pagado']];
    let lx = 80;
    entries.forEach(([fill, stroke, text]) => { roundRect(ctx, lx, legendY - 25, 30, 30, 7, fill, stroke); ctx.fillStyle = '#5c504b'; ctx.font = `500 25px ${posterSans}`; ctx.fillText(text, lx + 43, legendY); lx += text === 'Disponible' ? 245 : 235; });
    ctx.fillStyle = '#3d302e'; ctx.font = `600 34px ${posterSerif}`; ctx.fillText('Se sortea cuando estén vendidos todos los números', 72, 1655);
    ctx.fillStyle = '#796b66'; ctx.font = `500 25px ${posterSans}`; ctx.fillText('Primer premio de la Quiniela de la Ciudad Nocturna', 74, 1698);
    ctx.fillStyle = '#a94f51'; ctx.font = `700 31px ${posterSans}`; ctx.fillText('Pedí tu número por mensaje privado', 74, 1770);
    ctx.fillStyle = '#796b66'; ctx.font = `500 24px ${posterSans}`; ctx.fillText('Gracias por ayudar a Sixta 💛', 74, 1814);
    ctx.textAlign = 'right'; ctx.font = `600 22px ${posterSans}`; ctx.fillText('Rifa familiar', 1005, 1870); ctx.textAlign = 'left';
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
  Promise.all([loadImage('assets/sixta.png'), loadImage('assets/premio-banner.jpg')]).then(render).catch(() => {
    render(); announce('No se pudieron cargar las fotos del afiche. Revisá que la carpeta assets esté junto a index.html.');
  });
})();
