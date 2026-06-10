// ============================================================
// DESIGN: Gritty Wasteland Noir — renderer Canvas 2D
// Paleta: #1a1a1a / #8B3A1A / #D4A017 / #2d4a1e / #e8e0d0
// ============================================================

import { GameState, TileType, Card, Enemy } from './types';
import { TILE_DEFS, TILE_SIZE } from './mapData';
import { getSortedInventory } from './engine';

const CANVAS_W = 900;
const CANVAS_H = 600;

// ---- Utilitários de Desenho ----

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawHPBar(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, hp: number, maxHp: number, color: string): void {
  ctx.fillStyle = '#1a1a1a';
  roundRect(ctx, x, y, w, h, 3);
  ctx.fill();
  ctx.strokeStyle = '#444';
  ctx.lineWidth = 1;
  ctx.stroke();

  const ratio = Math.max(0, hp / maxHp);
  ctx.fillStyle = color;
  roundRect(ctx, x + 1, y + 1, Math.max(0, (w - 2) * ratio), h - 2, 2);
  ctx.fill();

  // Segmentos LED
  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
  ctx.lineWidth = 1;
  const segments = 10;
  for (let i = 1; i < segments; i++) {
    const sx = x + (w / segments) * i;
    ctx.beginPath();
    ctx.moveTo(sx, y);
    ctx.lineTo(sx, y + h);
    ctx.stroke();
  }
}

// ---- Overlay de Scanlines ----

function renderScanlines(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  for (let y = 0; y < CANVAS_H; y += 3) {
    ctx.fillRect(0, y, CANVAS_W, 1);
  }
}

// ---- Tela de Título ----

export function renderTitle(ctx: CanvasRenderingContext2D, titleImg: HTMLImageElement | null): void {
  if (titleImg && titleImg.complete) {
    ctx.drawImage(titleImg, 0, 0, CANVAS_W, CANVAS_H);
    // Overlay escuro
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  } else {
    ctx.fillStyle = '#0d0a08';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  }

  // Scanlines
  renderScanlines(ctx);

  // Título
  ctx.save();
  ctx.shadowColor = '#FF6B6B';
  ctx.shadowBlur = 40;
  ctx.fillStyle = '#e8e0d0';
  ctx.font = 'bold 72px "Bebas Neue", "Impact", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('FINAL', CANVAS_W / 2, 160);
  ctx.fillStyle = '#FF6B6B';
  ctx.fillText('JUDGMENT', CANVAS_W / 2, 235);
  ctx.restore();

  // Subtítulo
  ctx.fillStyle = '#00BCD4';
  ctx.font = '18px "Share Tech Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('— INVASÃO ALIENÍGENA — ESQUADRÃO ESPECIAL —', CANVAS_W / 2, 270);

  // Botão Iniciar
  const bx = CANVAS_W / 2 - 120, by = 320, bw = 240, bh = 55;
  ctx.fillStyle = '#8B3A1A';
  roundRect(ctx, bx, by, bw, bh, 6);
  ctx.fill();
  ctx.strokeStyle = '#D4A017';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#e8e0d0';
  ctx.font = 'bold 26px "Bebas Neue", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('INICIAR JOGO', CANVAS_W / 2, by + 36);

  // Controles
  ctx.fillStyle = '#6a6050';
  ctx.font = '13px "Share Tech Mono", monospace';
  ctx.fillText('WASD / Setas: Mover  |  E: Interagir  |  I: Inventário  |  Clique: Mover', CANVAS_W / 2, 430);
  ctx.fillText('Enfrente soldados alienígenas  |  Colete tecnologia inimiga  |  Derrote o General', CANVAS_W / 2, 455);

  // Versão
  ctx.fillStyle = '#3a3028';
  ctx.font = '11px monospace';
  ctx.fillText('v1.0 — Final Judgment', CANVAS_W / 2, CANVAS_H - 20);
}

// ---- Mapa ----

export function renderMap(ctx: CanvasRenderingContext2D, state: GameState): void {
  // Fundo base
  ctx.fillStyle = '#0d0a08';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  const { map, camera, tileSize } = state;
  const startX = Math.floor(camera.x / tileSize);
  const startY = Math.floor(camera.y / tileSize);
  const endX = Math.min(map[0].length, startX + Math.ceil(CANVAS_W / tileSize) + 2);
  const endY = Math.min(map.length, startY + Math.ceil(CANVAS_H / tileSize) + 2);

  for (let ty = Math.max(0, startY); ty < endY; ty++) {
    for (let tx = Math.max(0, startX); tx < endX; tx++) {
      const tile = map[ty][tx];
      const def = TILE_DEFS[tile];
      const px = tx * tileSize - camera.x;
      const py = ty * tileSize - camera.y;

      ctx.fillStyle = def.color;
      ctx.fillRect(px, py, tileSize, tileSize);

      if (def.borderColor) {
        ctx.strokeStyle = def.borderColor;
        ctx.lineWidth = 0.5;
        ctx.strokeRect(px + 0.5, py + 0.5, tileSize - 1, tileSize - 1);
      }

      // Detalhes visuais por tipo
      if (tile === 'rubble') {
        ctx.fillStyle = 'rgba(80,60,40,0.4)';
        ctx.fillRect(px + 4, py + 4, 8, 8);
        ctx.fillRect(px + 20, py + 15, 10, 6);
        ctx.fillRect(px + 8, py + 25, 12, 7);
      } else if (tile === 'debris') {
        ctx.fillStyle = 'rgba(0,180,100,0.15)';
        ctx.fillRect(px, py, tileSize, tileSize);
        // Ondas
        ctx.strokeStyle = 'rgba(0,200,120,0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(px + 10, py + 15, 6, 0, Math.PI);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(px + 25, py + 25, 8, 0, Math.PI);
        ctx.stroke();
      } else if (tile === 'metal') {
        ctx.fillStyle = 'rgba(30,60,15,0.3)';
        for (let i = 0; i < 3; i++) {
          const gx = px + 5 + i * 12;
          const gy = py + 8 + (i % 2) * 15;
          ctx.fillRect(gx, gy, 2, 8);
          ctx.fillRect(gx - 2, gy + 3, 2, 6);
          ctx.fillRect(gx + 2, gy + 2, 2, 7);
        }
      } else if (tile === 'boss_zone') {
        // Efeito pulsante vermelho
        const pulse = 0.3 + 0.15 * Math.sin(Date.now() / 400);
        ctx.fillStyle = `rgba(139,10,10,${pulse})`;
        ctx.fillRect(px, py, tileSize, tileSize);
        ctx.strokeStyle = `rgba(200,20,20,${pulse * 1.5})`;
        ctx.lineWidth = 1;
        ctx.strokeRect(px + 2, py + 2, tileSize - 4, tileSize - 4);
      }
    }
  }
}

// ---- Névoa e Efeitos do Mapa ----

export function renderMapOverlay(ctx: CanvasRenderingContext2D): void {
  // Névoa tóxica nos cantos
  const grad = ctx.createRadialGradient(CANVAS_W/2, CANVAS_H/2, CANVAS_W*0.3, CANVAS_W/2, CANVAS_H/2, CANVAS_W*0.8);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, 'rgba(0,0,0,0.5)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  // Scanlines sutis
  renderScanlines(ctx);
}

// ---- Caminho (Pathfinding visual) ----

export function renderPath(ctx: CanvasRenderingContext2D, state: GameState): void {
  if (!state.showPath || state.path.length === 0) return;
  const { camera, tileSize } = state;

  ctx.save();
  ctx.strokeStyle = 'rgba(212,160,23,0.6)';
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(state.player.x * tileSize - camera.x, state.player.y * tileSize - camera.y);
  for (const p of state.path) {
    ctx.lineTo(p.x * tileSize - camera.x, p.y * tileSize - camera.y);
  }
  ctx.stroke();
  ctx.setLineDash([]);

  // Destino
  if (state.pathTarget) {
    const px = state.pathTarget.x * tileSize - camera.x;
    const py = state.pathTarget.y * tileSize - camera.y;
    ctx.strokeStyle = '#D4A017';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px + 5, py + 5);
    ctx.lineTo(px + tileSize - 5, py + tileSize - 5);
    ctx.moveTo(px + tileSize - 5, py + 5);
    ctx.lineTo(px + 5, py + tileSize - 5);
    ctx.stroke();
  }
  ctx.restore();
}

// ---- Materiais ----

export function renderMaterials(ctx: CanvasRenderingContext2D, state: GameState): void {
  const { materials, camera, tileSize } = state;
  for (const mat of materials) {
    if (mat.collected) continue;
    const px = mat.x * tileSize - camera.x + tileSize / 2;
    const py = mat.y * tileSize - camera.y + tileSize / 2;

    // Brilho
    const pulse = 0.6 + 0.4 * Math.sin(Date.now() / 500 + mat.x);
    ctx.save();
    ctx.shadowColor = mat.color;
    ctx.shadowBlur = 8 * pulse;

    // Círculo de fundo
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.beginPath();
    ctx.arc(px, py, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = mat.color;
    ctx.beginPath();
    ctx.arc(px, py, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Ícone
    ctx.font = '12px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(mat.icon, px, py);
  }
}

// ---- NPCs ----

export function renderNPCs(ctx: CanvasRenderingContext2D, state: GameState): void {
  const { npcs, camera, tileSize, player } = state;
  for (const npc of npcs) {
    const px = npc.x * tileSize - camera.x + tileSize / 2;
    const py = npc.y * tileSize - camera.y + tileSize / 2;

    // Sombra
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.ellipse(px, py + 14, 10, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Corpo
    ctx.fillStyle = npc.color;
    ctx.beginPath();
    ctx.arc(px, py, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#D4A017';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Cabeça
    ctx.fillStyle = '#e8d0a0';
    ctx.beginPath();
    ctx.arc(px, py - 5, 6, 0, Math.PI * 2);
    ctx.fill();

    // Indicador de interação
    const dx = npc.x + 0.5 - player.x;
    const dy = npc.y + 0.5 - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 1.5) {
      const pulse = 0.7 + 0.3 * Math.sin(Date.now() / 300);
      ctx.fillStyle = `rgba(212,160,23,${pulse})`;
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('[E]', px, py - 26);
    }

    // Nome
    ctx.fillStyle = '#D4A017';
    ctx.font = 'bold 11px "Share Tech Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(npc.name, px, py + 26);
  }
}

// ---- Inimigos ----

export function renderEnemies(ctx: CanvasRenderingContext2D, state: GameState): void {
  const { enemies, camera, tileSize } = state;
  for (const enemy of enemies) {
    if (enemy.state === 'dead') continue;

    const px = enemy.x * tileSize - camera.x + tileSize / 2;
    const py = enemy.y * tileSize - camera.y + tileSize / 2;

    // Sombra
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.ellipse(px, py + 16, enemy.isBoss ? 22 : 12, enemy.isBoss ? 6 : 4, 0, 0, Math.PI * 2);
    ctx.fill();

    const size = enemy.isBoss ? 20 : 13;

    // Corpo
    if (enemy.isBoss) {
      // Boss tem forma especial
      ctx.fillStyle = '#8B3A1A';
      ctx.beginPath();
      ctx.arc(px, py, size, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#D4A017';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Aura pulsante
      const pulse = 0.3 + 0.2 * Math.sin(Date.now() / 300);
      ctx.strokeStyle = `rgba(212,60,20,${pulse})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(px, py, size + 6, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#e8e0d0';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('💀', px, py);
    } else {
      ctx.fillStyle = enemy.color;
      ctx.beginPath();
      ctx.arc(px, py, size, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.5)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = '#e8e0d0';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('☠', px, py);
    }

    // Barra de HP
    const barW = enemy.isBoss ? 60 : 36;
    drawHPBar(ctx, px - barW / 2, py - size - 14, barW, 6, enemy.hp, enemy.maxHp, enemy.isBoss ? '#c0392b' : '#e74c3c');

    // Estado de perseguição
    if (enemy.state === 'chase') {
      ctx.fillStyle = '#e74c3c';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', px, py - size - 18);
    }

    // Nome do boss
    if (enemy.isBoss) {
      ctx.fillStyle = '#D4A017';
      ctx.font = 'bold 12px "Bebas Neue", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(enemy.name.toUpperCase(), px, py + size + 16);
    }
  }
}

// ---- Player ----

export function renderPlayer(ctx: CanvasRenderingContext2D, state: GameState): void {
  const { player, camera, tileSize } = state;
  const px = player.x * tileSize - camera.x;
  const py = player.y * tileSize - camera.y;

  // Sombra
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.ellipse(px, py + 14, 10, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Corpo
  ctx.fillStyle = '#D4A017';
  ctx.beginPath();
  ctx.arc(px, py, 14, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#e8e0d0';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Cabeça
  ctx.fillStyle = '#d4b896';
  ctx.beginPath();
  ctx.arc(px, py - 5, 7, 0, Math.PI * 2);
  ctx.fill();

  // Indicador de direção
  const dirs = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  const dir = dirs[player.facing];
  ctx.fillStyle = '#8B3A1A';
  ctx.beginPath();
  ctx.arc(px + dir[0] * 10, py + dir[1] * 10, 4, 0, Math.PI * 2);
  ctx.fill();

  // Barra de HP do player (acima)
  drawHPBar(ctx, px - 20, py - 26, 40, 6, player.hp, player.maxHp, '#27ae60');
}

// ---- HUD ----

export function renderHUD(ctx: CanvasRenderingContext2D, state: GameState): void {
  const { player, inventory } = state;

  // Painel superior esquerdo — HP e Energia
  ctx.fillStyle = 'rgba(10,8,6,0.85)';
  roundRect(ctx, 8, 8, 200, 70, 4);
  ctx.fill();
  ctx.strokeStyle = '#8B3A1A';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = '#D4A017';
  ctx.font = 'bold 13px "Bebas Neue", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('SOBREVIVENTE', 16, 26);

  // HP
  ctx.fillStyle = '#e8e0d0';
  ctx.font = '11px "Share Tech Mono", monospace';
  ctx.fillText(`HP: ${player.hp}/${player.maxHp}`, 16, 42);
  drawHPBar(ctx, 16, 46, 180, 8, player.hp, player.maxHp, '#27ae60');

  // Energia
  ctx.fillStyle = '#e8e0d0';
  ctx.fillText(`ENERGIA: ${player.energy}/${player.maxEnergy}`, 16, 66);

  // Mini-inventário (canto superior direito)
  const sorted = getSortedInventory(inventory, state.sortOrder);
  const hasItems = sorted.some(e => e.amount > 0);

  if (hasItems) {
    ctx.fillStyle = 'rgba(10,8,6,0.85)';
    roundRect(ctx, CANVAS_W - 140, 8, 132, 20 + sorted.filter(e => e.amount > 0).length * 18, 4);
    ctx.fill();
    ctx.strokeStyle = '#8B3A1A';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#D4A017';
    ctx.font = 'bold 11px "Bebas Neue", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('INVENTÁRIO [I]', CANVAS_W - 132, 22);

    let iy = 38;
    for (const { type, amount } of sorted) {
      if (amount === 0) continue;
      const icons: Record<string, string> = {
        erva: '🌿', minerio: '⛏️', madeira: '🪵', gema: '💎', sucata: '⚙️', agua: '💧',
      };
      ctx.fillStyle = '#e8e0d0';
      ctx.font = '11px "Share Tech Mono", monospace';
      ctx.fillText(`${icons[type]} ${type}: ${amount}`, CANVAS_W - 132, iy);
      iy += 18;
    }
  }

  // Dica de interação
  if (state.activeDialog === null) {
    const nearNPC = state.npcs.some(npc => {
      const dx = npc.x + 0.5 - player.x;
      const dy = npc.y + 0.5 - player.y;
      return Math.sqrt(dx * dx + dy * dy) < 1.5;
    });
    if (nearNPC) {
      ctx.fillStyle = 'rgba(10,8,6,0.85)';
      roundRect(ctx, CANVAS_W / 2 - 100, CANVAS_H - 50, 200, 32, 4);
      ctx.fill();
      ctx.fillStyle = '#D4A017';
      ctx.font = 'bold 14px "Bebas Neue", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('[E] Falar com NPC', CANVAS_W / 2, CANVAS_H - 28);
    }
  }

  // Notificação de coleta
  const collectInfo = (window as any).__collectMsg;
  if (collectInfo && collectInfo.timer > 0) {
    const alpha = Math.min(1, collectInfo.timer / 30);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(10,8,6,0.85)';
    roundRect(ctx, CANVAS_W / 2 - 100, 90, 200, 32, 4);
    ctx.fill();
    ctx.fillStyle = '#4CAF50';
    ctx.font = 'bold 15px "Bebas Neue", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(collectInfo.msg, CANVAS_W / 2, 111);
    ctx.restore();
  }

  // Boss derrotado
  if (state.bossDefeated) {
    ctx.fillStyle = 'rgba(212,160,23,0.9)';
    ctx.font = 'bold 20px "Bebas Neue", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🏆 SENHOR DAS RUÍNAS DERROTADO!', CANVAS_W / 2, CANVAS_H - 20);
  }
}

// ---- Inventário Completo ----

export function renderInventory(ctx: CanvasRenderingContext2D, state: GameState): void {
  // Fundo semi-transparente
  ctx.fillStyle = 'rgba(0,0,0,0.85)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Painel
  const pw = 500, ph = 420, px = (CANVAS_W - pw) / 2, py = (CANVAS_H - ph) / 2;
  ctx.fillStyle = '#0d0a08';
  roundRect(ctx, px, py, pw, ph, 8);
  ctx.fill();
  ctx.strokeStyle = '#8B3A1A';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Título
  ctx.fillStyle = '#D4A017';
  ctx.font = 'bold 28px "Bebas Neue", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('INVENTÁRIO', CANVAS_W / 2, py + 38);

  // Linha separadora
  ctx.strokeStyle = '#8B3A1A';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(px + 20, py + 50);
  ctx.lineTo(px + pw - 20, py + 50);
  ctx.stroke();

  // Botões de ordenação
  const sortOptions: Array<{ label: string; value: import('./types').SortOrder }> = [
    { label: 'Por Tipo', value: 'type' },
    { label: 'Por Nome', value: 'name' },
    { label: 'Por Qtd', value: 'quantity' },
  ];
  sortOptions.forEach((opt, i) => {
    const bx = px + 30 + i * 150, by = py + 60, bw = 130, bh = 28;
    ctx.fillStyle = state.sortOrder === opt.value ? '#8B3A1A' : '#1a1510';
    roundRect(ctx, bx, by, bw, bh, 4);
    ctx.fill();
    ctx.strokeStyle = state.sortOrder === opt.value ? '#D4A017' : '#3a3028';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = state.sortOrder === opt.value ? '#D4A017' : '#6a6050';
    ctx.font = 'bold 12px "Share Tech Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(opt.label, bx + bw / 2, by + 18);
  });

  // Itens
  const sorted = getSortedInventory(state.inventory, state.sortOrder);
  const ICONS: Record<string, string> = {
    erva: '🌿', minerio: '⛏️', madeira: '🪵', gema: '💎', sucata: '⚙️', agua: '💧',
  };
  const NAMES: Record<string, string> = {
    erva: 'Erva Mutante', minerio: 'Minério Ferroso', madeira: 'Madeira Podre',
    gema: 'Gema Tóxica', sucata: 'Sucata Metálica', agua: 'Água Contaminada',
  };
  const COLORS: Record<string, string> = {
    erva: '#4CAF50', minerio: '#9E9E9E', madeira: '#8D6E63',
    gema: '#42A5F5', sucata: '#FF7043', agua: '#26C6DA',
  };

  sorted.forEach(({ type, amount }, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const ix = px + 30 + col * 220;
    const iy = py + 110 + row * 70;

    ctx.fillStyle = amount > 0 ? 'rgba(30,20,15,0.8)' : 'rgba(15,10,8,0.5)';
    roundRect(ctx, ix, iy, 200, 55, 4);
    ctx.fill();
    ctx.strokeStyle = amount > 0 ? COLORS[type] : '#2a2018';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Ícone
    ctx.font = '24px serif';
    ctx.textAlign = 'left';
    ctx.fillText(ICONS[type], ix + 10, iy + 34);

    // Nome
    ctx.fillStyle = amount > 0 ? '#e8e0d0' : '#4a4038';
    ctx.font = `bold 13px "Share Tech Mono", monospace`;
    ctx.fillText(NAMES[type], ix + 44, iy + 22);

    // Quantidade
    ctx.fillStyle = amount > 0 ? COLORS[type] : '#3a3028';
    ctx.font = `bold 20px "Bebas Neue", sans-serif`;
    ctx.fillText(`×${amount}`, ix + 44, iy + 44);
  });

  // Baralho
  ctx.fillStyle = '#D4A017';
  ctx.font = 'bold 14px "Bebas Neue", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`BARALHO: ${state.player.cards.length} cartas`, CANVAS_W / 2, py + ph - 30);

  // Fechar
  ctx.fillStyle = '#6a6050';
  ctx.font = '13px "Share Tech Mono", monospace';
  ctx.fillText('[I] ou [ESC] para fechar', CANVAS_W / 2, py + ph - 12);
}

// ---- Diálogo ----

export function renderDialog(ctx: CanvasRenderingContext2D, state: GameState, portraits: Record<string, HTMLImageElement>): void {
  if (!state.activeDialog) return;

  const { npc, nodeId } = state.activeDialog;
  const node = npc.dialogTree.nodes.get(nodeId);
  if (!node) return;

  // Fundo
  const dh = 220, dy = CANVAS_H - dh - 10;
  ctx.fillStyle = 'rgba(8,6,4,0.95)';
  roundRect(ctx, 10, dy, CANVAS_W - 20, dh, 6);
  ctx.fill();
  ctx.strokeStyle = '#8B3A1A';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Retrato
  const portrait = portraits[npc.id];
  if (portrait && portrait.complete) {
    ctx.save();
    ctx.beginPath();
    roundRect(ctx, 18, dy + 10, 100, 130, 4);
    ctx.clip();
    ctx.drawImage(portrait, 18, dy + 10, 100, 130);
    ctx.restore();
    ctx.strokeStyle = '#D4A017';
    ctx.lineWidth = 2;
    roundRect(ctx, 18, dy + 10, 100, 130, 4);
    ctx.stroke();
  } else {
    ctx.fillStyle = npc.color;
    roundRect(ctx, 18, dy + 10, 100, 130, 4);
    ctx.fill();
  }

  // Nome do falante
  ctx.fillStyle = '#D4A017';
  ctx.font = 'bold 18px "Bebas Neue", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(node.speaker.toUpperCase(), 130, dy + 28);

  // Texto do diálogo
  ctx.fillStyle = '#e8e0d0';
  ctx.font = '14px "Crimson Text", Georgia, serif';
  wrapText(ctx, node.text, 130, dy + 50, CANVAS_W - 160, 20);

  // Opções
  node.options.forEach((opt, i) => {
    const oy = dy + 150 + i * 22;
    ctx.fillStyle = '#D4A017';
    ctx.font = `bold 13px "Share Tech Mono", monospace`;
    ctx.textAlign = 'left';
    ctx.fillText(`[${i + 1}] ${opt.text}`, 130, oy);
  });
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lineH: number): void {
  const words = text.split(' ');
  let line = '';
  let cy = y;
  for (const word of words) {
    const testLine = line + word + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxW && line !== '') {
      ctx.fillText(line, x, cy);
      line = word + ' ';
      cy += lineH;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, cy);
}

// ---- Batalha ----

export function renderBattle(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  cardBgImg: HTMLImageElement | null,
  bossImg: HTMLImageElement | null
): void {
  const { battle, player } = state;
  if (!battle.enemy) return;

  const enemy = battle.enemy;

  // Fundo da batalha
  ctx.fillStyle = '#0a0806';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Scanlines
  renderScanlines(ctx);

  // Zona do inimigo (direita)
  const enemyX = 620, enemyY = 80;
  const enemyShake = battle.enemyShake ? (Math.random() - 0.5) * 8 : 0;

  if (enemy.isBoss && bossImg && bossImg.complete) {
    ctx.save();
    ctx.translate(enemyShake, 0);
    ctx.drawImage(bossImg, enemyX - 80, enemyY - 20, 200, 200);
    ctx.restore();
  } else {
    ctx.save();
    ctx.translate(enemyShake, 0);
    ctx.fillStyle = enemy.color;
    ctx.beginPath();
    ctx.arc(enemyX, enemyY + 80, enemy.isBoss ? 70 : 50, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#D4A017';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.font = enemy.isBoss ? '60px serif' : '40px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('💀', enemyX, enemyY + 80);
    ctx.restore();
  }

  // Nome e HP do inimigo
  ctx.fillStyle = '#D4A017';
  ctx.font = `bold ${enemy.isBoss ? 22 : 18}px "Bebas Neue", sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(enemy.name.toUpperCase(), enemyX, enemyY - 10);
  drawHPBar(ctx, enemyX - 80, enemyY + (enemy.isBoss ? 170 : 145), 160, 14, enemy.hp, enemy.maxHp, '#e74c3c');
  ctx.fillStyle = '#e8e0d0';
  ctx.font = '12px "Share Tech Mono", monospace';
  ctx.fillText(`${enemy.hp}/${enemy.maxHp} HP`, enemyX, enemyY + (enemy.isBoss ? 200 : 175));

  // Bloqueio do inimigo
  if (enemy.block > 0) {
    ctx.fillStyle = '#3498db';
    ctx.font = 'bold 16px "Bebas Neue", sans-serif';
    ctx.fillText(`🛡️ ${enemy.block}`, enemyX, enemyY + (enemy.isBoss ? 220 : 195));
  }

  // Status do inimigo
  const statusY = enemyY + (enemy.isBoss ? 240 : 215);
  if ((enemy as any).poisoned > 0) {
    ctx.fillStyle = '#8e44ad';
    ctx.font = '12px "Share Tech Mono", monospace';
    ctx.fillText(`☠️ Veneno: ${(enemy as any).poisoned}`, enemyX, statusY);
  }

  // Intenção do inimigo
  const intent = enemy.intents[enemy.intentIndex % enemy.intents.length];
  ctx.fillStyle = 'rgba(20,10,8,0.85)';
  roundRect(ctx, enemyX - 120, enemyY + (enemy.isBoss ? 260 : 230), 240, 36, 4);
  ctx.fill();
  ctx.strokeStyle = '#8B3A1A';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = '#e74c3c';
  ctx.font = 'bold 12px "Share Tech Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`⚡ ${intent.description}`, enemyX, enemyY + (enemy.isBoss ? 282 : 252));

  // Zona do player (esquerda)
  const playerX = 160, playerY = 80;
  const playerShake = battle.playerShake ? (Math.random() - 0.5) * 8 : 0;

  ctx.save();
  ctx.translate(playerShake, 0);
  ctx.fillStyle = '#D4A017';
  ctx.beginPath();
  ctx.arc(playerX, playerY + 80, 50, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#e8e0d0';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.font = '40px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🧍', playerX, playerY + 80);
  ctx.restore();

  ctx.fillStyle = '#D4A017';
  ctx.font = 'bold 18px "Bebas Neue", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('SOBREVIVENTE', playerX, playerY - 10);
  drawHPBar(ctx, playerX - 80, playerY + 145, 160, 14, player.hp, player.maxHp, '#27ae60');
  ctx.fillStyle = '#e8e0d0';
  ctx.font = '12px "Share Tech Mono", monospace';
  ctx.fillText(`${player.hp}/${player.maxHp} HP`, playerX, playerY + 175);

  if (player.block > 0) {
    ctx.fillStyle = '#3498db';
    ctx.font = 'bold 16px "Bebas Neue", sans-serif';
    ctx.fillText(`🛡️ ${player.block}`, playerX, playerY + 195);
  }

  // Energia
  ctx.fillStyle = '#f39c12';
  ctx.font = 'bold 16px "Bebas Neue", sans-serif';
  ctx.fillText(`⚡ ${player.energy}/${player.maxEnergy}`, playerX, playerY + 215);

  // Turno e log
  ctx.fillStyle = 'rgba(10,8,6,0.9)';
  roundRect(ctx, 10, 10, 200, 60, 4);
  ctx.fill();
  ctx.strokeStyle = '#8B3A1A';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = '#D4A017';
  ctx.font = 'bold 14px "Bebas Neue", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`TURNO ${battle.turn}`, 18, 28);

  const phaseLabel = battle.phase === 'player_turn' ? '⚔️ SEU TURNO' : '⏳ INIMIGO...';
  ctx.fillStyle = battle.phase === 'player_turn' ? '#27ae60' : '#e74c3c';
  ctx.font = 'bold 13px "Share Tech Mono", monospace';
  ctx.fillText(phaseLabel, 18, 46);

  ctx.fillStyle = '#6a6050';
  ctx.font = '11px "Share Tech Mono", monospace';
  ctx.fillText(`Baralho: ${player.deck.length} | Descarte: ${player.discard.length}`, 18, 62);

  // Log de batalha
  ctx.fillStyle = 'rgba(10,8,6,0.85)';
  roundRect(ctx, 220, 10, 440, 70, 4);
  ctx.fill();
  ctx.strokeStyle = '#3a3028';
  ctx.lineWidth = 1;
  ctx.stroke();

  battle.log.slice(0, 4).forEach((msg, i) => {
    ctx.fillStyle = i === 0 ? '#e8e0d0' : `rgba(232,224,208,${0.5 - i * 0.1})`;
    ctx.font = `${i === 0 ? 'bold ' : ''}12px "Share Tech Mono", monospace`;
    ctx.textAlign = 'left';
    ctx.fillText(msg, 228, 26 + i * 14);
  });

  // Mão do player (cartas)
  renderHand(ctx, state, cardBgImg);

  // Botão Encerrar Turno
  if (battle.phase === 'player_turn') {
    const bx = CANVAS_W - 130, by = CANVAS_H - 90, bw = 120, bh = 40;
    ctx.fillStyle = '#8B3A1A';
    roundRect(ctx, bx, by, bw, bh, 4);
    ctx.fill();
    ctx.strokeStyle = '#D4A017';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#e8e0d0';
    ctx.font = 'bold 15px "Bebas Neue", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ENCERRAR [T]', bx + bw / 2, by + 26);
  }

  // Textos flutuantes
  for (const ft of battle.floatingTexts) {
    ctx.save();
    ctx.globalAlpha = ft.opacity;
    ctx.fillStyle = ft.color;
    ctx.font = 'bold 22px "Bebas Neue", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(ft.text, ft.x, ft.y);
    ctx.restore();
  }

  // Tela de resultado
  if (battle.phase === 'victory' || battle.phase === 'defeat') {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    ctx.fillStyle = battle.phase === 'victory' ? '#D4A017' : '#e74c3c';
    ctx.font = 'bold 64px "Bebas Neue", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(battle.phase === 'victory' ? 'VITÓRIA!' : 'DERROTA...', CANVAS_W / 2, CANVAS_H / 2 - 20);

    ctx.fillStyle = '#e8e0d0';
    ctx.font = '18px "Share Tech Mono", monospace';
    ctx.fillText(battle.phase === 'victory' ? 'Carta adicionada ao baralho!' : 'Fim de jogo...', CANVAS_W / 2, CANVAS_H / 2 + 30);
  }
}

function renderHand(ctx: CanvasRenderingContext2D, state: GameState, cardBgImg: HTMLImageElement | null): void {
  const { player, battle } = state;
  if (battle.phase !== 'player_turn' && battle.phase !== 'enemy_turn') return;

  const hand = player.hand;
  const cardW = 90, cardH = 130;
  const totalW = hand.length * (cardW + 8) - 8;
  const startX = (CANVAS_W - totalW) / 2;
  const baseY = CANVAS_H - cardH - 15;

  hand.forEach((card, i) => {
    const cx = startX + i * (cardW + 8);
    const isSelected = battle.selectedCardIndex === i;
    const canPlay = card.cost <= player.energy && battle.phase === 'player_turn';
    const cardY = isSelected ? baseY - 15 : baseY;

    // Sombra
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    roundRect(ctx, cx + 3, cardY + 3, cardW, cardH, 6);
    ctx.fill();

    // Fundo da carta
    if (cardBgImg && cardBgImg.complete) {
      ctx.save();
      roundRect(ctx, cx, cardY, cardW, cardH, 6);
      ctx.clip();
      ctx.drawImage(cardBgImg, cx, cardY, cardW, cardH);
      ctx.restore();
    } else {
      ctx.fillStyle = '#1a1208';
      roundRect(ctx, cx, cardY, cardW, cardH, 6);
      ctx.fill();
    }

    // Borda colorida por tipo
    ctx.strokeStyle = canPlay ? card.color : '#3a3028';
    ctx.lineWidth = isSelected ? 3 : 2;
    roundRect(ctx, cx, cardY, cardW, cardH, 6);
    ctx.stroke();

    // Custo
    ctx.fillStyle = canPlay ? '#f39c12' : '#6a6050';
    ctx.beginPath();
    ctx.arc(cx + 14, cardY + 14, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0a0806';
    ctx.font = 'bold 14px "Bebas Neue", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(String(card.cost), cx + 14, cardY + 19);

    // Nome da carta
    ctx.fillStyle = canPlay ? '#e8e0d0' : '#5a5040';
    ctx.font = `bold ${card.name.length > 12 ? 9 : 11}px "Bebas Neue", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(card.name.toUpperCase(), cx + cardW / 2, cardY + 36);

    // Tipo
    const typeColors = { attack: '#e74c3c', skill: '#3498db', power: '#f39c12', curse: '#8e44ad' };
    ctx.fillStyle = typeColors[card.type];
    ctx.font = 'bold 9px "Share Tech Mono", monospace';
    ctx.fillText(card.type.toUpperCase(), cx + cardW / 2, cardY + 50);

    // Descrição
    ctx.fillStyle = canPlay ? '#c8c0b0' : '#4a4038';
    ctx.font = '9px "Share Tech Mono", monospace';
    wrapTextSmall(ctx, card.description, cx + 6, cardY + 65, cardW - 12, 12);

    // Rarity
    const rarityColors = { common: '#9E9E9E', uncommon: '#4CAF50', rare: '#42A5F5', boss: '#D4A017' };
    ctx.fillStyle = rarityColors[card.rarity];
    ctx.font = 'bold 8px "Share Tech Mono", monospace';
    ctx.fillText(card.rarity.toUpperCase(), cx + cardW / 2, cardY + cardH - 8);
  });
}

function wrapTextSmall(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lineH: number): void {
  const words = text.split(' ');
  let line = '';
  let cy = y;
  for (const word of words) {
    const testLine = line + word + ' ';
    if (ctx.measureText(testLine).width > maxW && line !== '') {
      ctx.fillText(line.trim(), x + maxW / 2, cy);
      line = word + ' ';
      cy += lineH;
      if (cy > y + lineH * 4) break;
    } else {
      line = testLine;
    }
  }
  if (line.trim()) ctx.fillText(line.trim(), x + maxW / 2, cy);
}

// ---- Game Over / Vitória ----

export function renderGameOver(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#0a0806';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  ctx.fillStyle = '#e74c3c';
  ctx.font = 'bold 80px "Bebas Neue", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('FIM DE JOGO', CANVAS_W / 2, CANVAS_H / 2 - 30);

  ctx.fillStyle = '#6a6050';
  ctx.font = '20px "Share Tech Mono", monospace';
  ctx.fillText('O mundo das ruínas te consumiu...', CANVAS_W / 2, CANVAS_H / 2 + 20);

  ctx.fillStyle = '#8B3A1A';
  ctx.font = '16px "Share Tech Mono", monospace';
  ctx.fillText('[R] Recomeçar', CANVAS_W / 2, CANVAS_H / 2 + 60);
}

export function renderVictory(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#0a0806';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  ctx.fillStyle = '#D4A017';
  ctx.font = 'bold 70px "Bebas Neue", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('SOBREVIVENTE!', CANVAS_W / 2, CANVAS_H / 2 - 40);

  ctx.fillStyle = '#e8e0d0';
  ctx.font = '22px "Share Tech Mono", monospace';
  ctx.fillText('O Senhor das Ruínas foi derrotado!', CANVAS_W / 2, CANVAS_H / 2 + 10);
  ctx.fillText('As ruínas são suas agora.', CANVAS_W / 2, CANVAS_H / 2 + 40);

  ctx.fillStyle = '#8B3A1A';
  ctx.font = '16px "Share Tech Mono", monospace';
  ctx.fillText('[R] Jogar Novamente', CANVAS_W / 2, CANVAS_H / 2 + 90);
}
