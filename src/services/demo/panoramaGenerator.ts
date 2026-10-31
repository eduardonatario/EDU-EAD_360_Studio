/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Gerador de Panoramas Equirretangulares (360° × 180° - Proporção 2:1)
 * Renderiza ambientes arquitetônicos realistas diretamente no Canvas HTML5,
 * garantindo disponibilidade 100% offline, sem dependência de internet ou assets quebrados.
 */

export function generateEquirectangularPanorama(roomType: 'living' | 'kitchen' | 'bedroom' | 'bathroom'): string {
  const width = 2048;
  const height = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const midY = height / 2;

  // 1. Céu / Vista Externa através das janelas e iluminação zenital
  const skyGrad = ctx.createLinearGradient(0, 0, 0, midY);
  skyGrad.addColorStop(0, '#1e293b');
  skyGrad.addColorStop(0.3, '#334155');
  skyGrad.addColorStop(0.5, '#64748b');
  skyGrad.addColorStop(1, '#94a3b8');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. Chão (Piso de Madeira / Mármore / Porcelanato conforme o cômodo)
  const floorGrad = ctx.createLinearGradient(0, midY, 0, height);
  if (roomType === 'living' || roomType === 'bedroom') {
    // Madeira Nobre Carvalho Europeu
    floorGrad.addColorStop(0, '#9a7b56');
    floorGrad.addColorStop(0.4, '#785e3f');
    floorGrad.addColorStop(1, '#453320');
  } else if (roomType === 'kitchen') {
    // Porcelanato Cimento Queimado Acetinado
    floorGrad.addColorStop(0, '#cbd5e1');
    floorGrad.addColorStop(0.5, '#94a3b8');
    floorGrad.addColorStop(1, '#475569');
  } else {
    // Mármore Nero Marquina / Carrara
    floorGrad.addColorStop(0, '#e2e8f0');
    floorGrad.addColorStop(0.6, '#cbd5e1');
    floorGrad.addColorStop(1, '#334155');
  }
  ctx.fillStyle = floorGrad;
  ctx.fillRect(0, midY, width, height - midY);

  // Detalhes de tábuas de piso em perspectiva esférica
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.12)';
  ctx.lineWidth = 1.5;
  for (let x = 0; x < width; x += 64) {
    ctx.beginPath();
    ctx.moveTo(x, midY);
    ctx.lineTo(x + (x - width / 2) * 0.4, height);
    ctx.stroke();
  }

  // Linhas horizontais de juntas do piso
  for (let y = midY + 40; y < height; y += (y - midY) * 0.35 + 20) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // 3. Teto Arquitetônico com forro de gesso e sancas iluminadas
  const ceilingGrad = ctx.createLinearGradient(0, 0, 0, midY * 0.85);
  ceilingGrad.addColorStop(0, '#f8fafc');
  ceilingGrad.addColorStop(0.6, '#f1f5f9');
  ceilingGrad.addColorStop(1, '#e2e8f0');
  ctx.fillStyle = ceilingGrad;
  ctx.fillRect(0, 0, width, midY * 0.7);

  // Linha de sanca de iluminação LED embutida no teto
  ctx.fillStyle = 'rgba(255, 245, 210, 0.45)';
  ctx.fillRect(0, midY * 0.62, width, 18);
  ctx.fillStyle = 'rgba(255, 230, 160, 0.8)';
  ctx.fillRect(0, midY * 0.65, width, 4);

  // 4. Paredes Estruturais e Divisórias com Materiais Nobres
  ctx.fillStyle = 'rgba(248, 250, 252, 0.88)';
  ctx.fillRect(0, midY * 0.66, width, midY * 0.34);

  // Renderizar especificidades de cada ambiente
  if (roomType === 'living') {
    renderLivingRoomFeatures(ctx, width, height, midY);
  } else if (roomType === 'kitchen') {
    renderKitchenFeatures(ctx, width, height, midY);
  } else if (roomType === 'bedroom') {
    renderBedroomFeatures(ctx, width, height, midY);
  } else {
    renderBathroomFeatures(ctx, width, height, midY);
  }

  // 5. Vinheta sutil e iluminação ambiente esférica
  const vignette = ctx.createRadialGradient(width / 2, height / 2, width * 0.2, width / 2, height / 2, width * 0.6);
  vignette.addColorStop(0, 'rgba(255, 255, 255, 0.04)');
  vignette.addColorStop(1, 'rgba(15, 23, 42, 0.28)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);

  return canvas.toDataURL('image/jpeg', 0.88);
}

function renderLivingRoomFeatures(ctx: CanvasRenderingContext2D, width: number, height: number, midY: number) {
  // Grande Janela do Chão ao Teto com Jardim
  const winX = width * 0.12;
  const winW = width * 0.32;
  const winTop = midY * 0.68;
  const winH = midY * 0.6;

  // Vidro com reflexo e paisagem
  const glassGrad = ctx.createLinearGradient(winX, winTop, winX + winW, winTop + winH);
  glassGrad.addColorStop(0, '#38bdf8');
  glassGrad.addColorStop(0.3, '#7dd3fc');
  glassGrad.addColorStop(0.7, '#86efac');
  glassGrad.addColorStop(1, '#22c55e');
  ctx.fillStyle = glassGrad;
  ctx.fillRect(winX, winTop, winW, winH);

  // Caixilhos pretos em alumínio anodizado
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 8;
  ctx.strokeRect(winX, winTop, winW, winH);
  ctx.beginPath();
  ctx.moveTo(winX + winW / 2, winTop);
  ctx.lineTo(winX + winW / 2, winTop + winH);
  ctx.stroke();

  // Sofá Modular Contemporâneo de Linho Cru
  const sofaX = width * 0.48;
  const sofaW = width * 0.28;
  const sofaTop = midY * 0.95;
  const sofaH = height * 0.22;

  ctx.fillStyle = '#e2e8f0';
  roundRect(ctx, sofaX, sofaTop, sofaW, sofaH, 16);
  ctx.fill();
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Almofadas em tons terracota e azul petróleo
  ctx.fillStyle = '#c2410c';
  roundRect(ctx, sofaX + 30, sofaTop + 20, 80, 70, 8);
  ctx.fill();
  ctx.fillStyle = '#0e7490';
  roundRect(ctx, sofaX + 130, sofaTop + 20, 80, 70, 8);
  ctx.fill();

  // Painel Ripado em Carvalho na Parede Oposta
  const slatX = width * 0.8;
  const slatW = width * 0.16;
  ctx.fillStyle = '#78350f';
  ctx.fillRect(slatX, midY * 0.66, slatW, midY * 0.45);
  ctx.strokeStyle = '#451a03';
  ctx.lineWidth = 2;
  for (let sx = slatX; sx < slatX + slatW; sx += 12) {
    ctx.beginPath();
    ctx.moveTo(sx, midY * 0.66);
    ctx.lineTo(sx, midY * 1.11);
    ctx.stroke();
  }

  // Lareira Ecológica Embutida
  ctx.fillStyle = '#0f172a';
  roundRect(ctx, slatX + 40, midY * 0.9, slatW - 80, 60, 8);
  ctx.fill();
  ctx.fillStyle = '#f97316';
  ctx.beginPath();
  ctx.ellipse(slatX + slatW / 2, midY * 0.9 + 30, 45, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Pendente Escultural no Teto
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(width * 0.6, 0);
  ctx.lineTo(width * 0.6, midY * 0.5);
  ctx.stroke();
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.arc(width * 0.6, midY * 0.5, 32, 0, Math.PI * 2);
  ctx.fill();
}

function renderKitchenFeatures(ctx: CanvasRenderingContext2D, width: number, height: number, midY: number) {
  // Ilha Central de Mármore Calacatta
  const islandX = width * 0.38;
  const islandW = width * 0.35;
  const islandTop = midY * 0.92;
  const islandH = height * 0.28;

  const marbleGrad = ctx.createLinearGradient(islandX, islandTop, islandX + islandW, islandTop + islandH);
  marbleGrad.addColorStop(0, '#f8fafc');
  marbleGrad.addColorStop(0.5, '#e2e8f0');
  marbleGrad.addColorStop(1, '#cbd5e1');
  ctx.fillStyle = marbleGrad;
  roundRect(ctx, islandX, islandTop, islandW, islandH, 12);
  ctx.fill();
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Cooktop de Indução e Cuba de Semi-Encaixe
  ctx.fillStyle = '#0f172a';
  roundRect(ctx, islandX + 50, islandTop + 20, 160, 50, 4);
  ctx.fill();
  ctx.fillStyle = '#38bdf8';
  roundRect(ctx, islandX + 260, islandTop + 20, 140, 50, 4);
  ctx.fill();

  // Armários Planejados em Nogueira Escura com Nichos Iluminados
  const cabX = width * 0.08;
  const cabW = width * 0.24;
  ctx.fillStyle = '#292524';
  ctx.fillRect(cabX, midY * 0.66, cabW, midY * 0.45);
  ctx.strokeStyle = '#44403c';
  ctx.lineWidth = 2;
  ctx.strokeRect(cabX, midY * 0.66, cabW, midY * 0.45);

  // Torre de Fornos e Geladeira de Inox Embutida
  ctx.fillStyle = '#64748b';
  roundRect(ctx, cabX + 30, midY * 0.72, 80, 120, 4);
  ctx.fill();
  ctx.fillStyle = '#94a3b8';
  roundRect(ctx, cabX + 130, midY * 0.72, 90, 120, 4);
  ctx.fill();

  // Três Pendentes Tubulares Dourados sobre a Bancada
  for (let i = 0; i < 3; i++) {
    const px = islandX + 90 + i * 110;
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px, 0);
    ctx.lineTo(px, midY * 0.62);
    ctx.stroke();

    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(px - 10, midY * 0.62, 20, 50);
  }
}

function renderBedroomFeatures(ctx: CanvasRenderingContext2D, width: number, height: number, midY: number) {
  // Cama King Size com Cabeceira Estofada
  const bedX = width * 0.35;
  const bedW = width * 0.38;
  const bedTop = midY * 0.9;
  const bedH = height * 0.3;

  // Cabeceira estofada em linho grafite
  ctx.fillStyle = '#334155';
  roundRect(ctx, bedX, bedTop - 90, bedW, 110, 8);
  ctx.fill();

  // Edredom em tom cru e peseira em terracota
  ctx.fillStyle = '#f1f5f9';
  roundRect(ctx, bedX + 20, bedTop + 10, bedW - 40, bedH, 12);
  ctx.fill();
  ctx.fillStyle = '#ea580c';
  ctx.fillRect(bedX + 20, bedTop + bedH - 60, bedW - 40, 50);

  // Travesseiros aconchegantes
  ctx.fillStyle = '#ffffff';
  roundRect(ctx, bedX + 50, bedTop - 30, 100, 50, 8);
  roundRect(ctx, bedX + 180, bedTop - 30, 100, 50, 8);
  ctx.fill();

  // Mesas de Cabeceira com Abajures
  ctx.fillStyle = '#78350f';
  roundRect(ctx, bedX - 80, bedTop + 30, 65, 80, 4);
  roundRect(ctx, bedX + bedW + 15, bedTop + 30, 65, 80, 4);
  ctx.fill();

  // Closet Integrado com Portas de Vidro Reflecta Bronze
  const closetX = width * 0.05;
  const closetW = width * 0.22;
  const closetGrad = ctx.createLinearGradient(closetX, 0, closetX + closetW, 0);
  closetGrad.addColorStop(0, '#451a03');
  closetGrad.addColorStop(1, '#78350f');
  ctx.fillStyle = closetGrad;
  ctx.fillRect(closetX, midY * 0.66, closetW, midY * 0.45);
  ctx.strokeStyle = '#d97706';
  ctx.lineWidth = 1;
  ctx.strokeRect(closetX, midY * 0.66, closetW, midY * 0.45);
}

function renderBathroomFeatures(ctx: CanvasRenderingContext2D, width: number, height: number, midY: number) {
  // Banheira Freestanding de Imersão em Rocha Vulcânica
  const tubX = width * 0.38;
  const tubW = width * 0.28;
  const tubTop = midY * 1.05;
  const tubH = height * 0.2;

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(tubX + tubW / 2, tubTop + tubH / 2, tubW / 2, tubH / 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 4;
  ctx.stroke();

  // Água límpida e cristalina na banheira
  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.ellipse(tubX + tubW / 2, tubTop + tubH / 2 + 5, tubW / 2 - 20, tubH / 2 - 16, 0, 0, Math.PI * 2);
  ctx.fill();

  // Parede de Fundo: Porcelanato Nero Marquina com veios brancos
  const wallX = width * 0.32;
  const wallW = width * 0.4;
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(wallX, midY * 0.66, wallW, midY * 0.45);

  // Veios do mármore
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(wallX + 40, midY * 0.66);
  ctx.lineTo(wallX + 120, midY * 0.85);
  ctx.lineTo(wallX + 90, midY * 1.1);
  ctx.stroke();

  // Bancada Suspensa com Pia Dupla Esculpida
  const sinkX = width * 0.08;
  const sinkW = width * 0.22;
  ctx.fillStyle = '#e2e8f0';
  roundRect(ctx, sinkX, midY * 0.95, sinkW, 70, 8);
  ctx.fill();

  // Espelhos Orgânicos com Fita de LED Backlight
  ctx.fillStyle = '#f8fafc';
  ctx.shadowColor = 'rgba(255, 230, 160, 0.8)';
  ctx.shadowBlur = 24;
  ctx.beginPath();
  ctx.ellipse(sinkX + 60, midY * 0.8, 45, 60, 0, 0, Math.PI * 2);
  ctx.ellipse(sinkX + sinkW - 60, midY * 0.8, 45, 60, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0; // reset
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/**
 * Gera imagens ilustrativas complementares para os hotspots educativos
 */
export function generateEducationalCardImage(topic: 'bioclimatic' | 'lighting' | 'materials' | 'acoustics' | 'spa'): string {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 360;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const grad = ctx.createLinearGradient(0, 0, 640, 360);
  if (topic === 'bioclimatic') {
    grad.addColorStop(0, '#0284c7');
    grad.addColorStop(1, '#059669');
  } else if (topic === 'lighting') {
    grad.addColorStop(0, '#f59e0b');
    grad.addColorStop(1, '#b45309');
  } else if (topic === 'materials') {
    grad.addColorStop(0, '#78350f');
    grad.addColorStop(1, '#451a03');
  } else if (topic === 'acoustics') {
    grad.addColorStop(0, '#4338ca');
    grad.addColorStop(1, '#6366f1');
  } else {
    grad.addColorStop(0, '#0d9488');
    grad.addColorStop(1, '#0284c7');
  }

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 640, 360);

  // Overlay com malha gráfica técnica
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 1;
  for (let x = 0; x < 640; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 360);
    ctx.stroke();
  }
  for (let y = 0; y < 360; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(640, y);
    ctx.stroke();
  }

  // Título e Elemento Central do Diagrama
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  roundRect(ctx, 40, 40, 560, 280, 16);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px Plus Jakarta Sans, system-ui, sans-serif';
  ctx.fillText('DIAGRAMA TÉCNICO INSTRUCIONAL', 70, 90);

  ctx.font = '15px Plus Jakarta Sans, system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.fillText('Análise espacial e diretrizes pedagógicas para arquitetura moderna', 70, 120);

  // Gráfico vetorial abstrato
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(320, 220, 60, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px Plus Jakarta Sans, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Eficiência 360°', 320, 225);

  return canvas.toDataURL('image/jpeg', 0.85);
}
