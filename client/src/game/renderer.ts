// ============================================================
// DESIGN: Gritty Wasteland Noir — renderer Canvas 2D
// Paleta: #1a1a1a / #8B3A1A / #D4A017 / #2d4a1e / #e8e0d0
// ============================================================

import { GameState, TileType, Card, Enemy } from './types';
import { TILE_DEFS, TILE_SIZE } from './mapData';
import { getSortedInventory, getSortedInventoryItems } from './engine';
import { getRarityColor, getSortLabel, getTotalWeight, getTotalValue } from './inventory';
import { renderMinimap, renderMinimapExpanded } from './minimap';

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
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  } else {
    ctx.fillStyle = '#0d0a08';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  }

  renderScanlines(ctx);

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

  ctx.fillStyle = '#6a6050';
  ctx.font = '13px "Share Tech Mono", monospace';
  ctx.fillText('WASD / Setas: Mover  |  E: Interagir  |  I: Inventário  |  Clique: Mover', CANVAS_W / 2, 430);
  ctx.fillText('Enfrente soldados alienígenas  |  Colete tecnologia inimiga  |  Derrote o General', CANVAS_W / 2, 455);

  ctx.fillStyle = '#3a3028';
  ctx.font = '11px monospace';
  ctx.fillText('v1.0 — Final Judgment | Nível 1', CANVAS_W / 2, CANVAS_H - 20);
}

// ---- Mapa ----

export function renderMap(ctx: CanvasRenderingContext2D, state: GameState): void {
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

      if (tile === 'rubble') {
        ctx.fillStyle = 'rgba(80,60,40,0.4)';
        ctx.fillRect(px + 4, py + 4, 8, 8);
        ctx.fillRect(px + 20, py + 15, 10, 6);
        ctx.fillRect(px + 8, py + 25, 12, 7);
      } else if (tile === 'debris') {
        ctx.fillStyle = 'rgba(0,180,100,0.15)';
        ctx.fillRect(px, py, tileSize, tileSize);
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
        // Efeito pulsante vermelho — mais intenso quando boss está desbloqueado
        const intensity = state.bossUnlocked ? 0.5 : 0.2;
        const pulse = intensity + 0.15 * Math.sin(Date.now() / 400);
        ctx.fillStyle = `rgba(139,10,10,${pulse})`;
        ctx.fillRect(px, py, tileSize, tileSize);
        ctx.strokeStyle = `rgba(200,20,20,${pulse * 1.5})`;
        ctx.lineWidth = 1;
        ctx.strokeRect(px + 2, py + 2, tileSize - 4, tileSize - 4);

        // Texto de aviso quando boss está desbloqueado
        if (state.bossUnlocked && !state.bossDefeated) {
          ctx.fillStyle = `rgba(255,50,50,${pulse * 2})`;
          ctx.font = 'bold 8px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('⚠', px + tileSize / 2, py + tileSize / 2 + 3);
        }
      }
    }
  }
}

// ---- Névoa e Efeitos do Mapa ----

export function renderMapOverlay(ctx: CanvasRenderingContext2D): void {
  const grad = ctx.createRadialGradient(CANVAS_W/2, CANVAS_H/2, CANVAS_W*0.3, CANVAS_W/2, CANVAS_H/2, CANVAS_W*0.8);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, 'rgba(0,0,0,0.5)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
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

    const pulse = 0.6 + 0.4 * Math.sin(Date.now() / 500 + mat.x);
    ctx.save();
    ctx.shadowColor = mat.color;
    ctx.shadowBlur = 8 * pulse;

    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.beginPath();
    ctx.arc(px, py, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = mat.color;
    ctx.beginPath();
    ctx.arc(px, py, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

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

    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.ellipse(px, py + 14, 10, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = npc.color;
    ctx.beginPath();
    ctx.arc(px, py, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#D4A017';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#e8d0a0';
    ctx.beginPath();
    ctx.arc(px, py - 5, 6, 0, Math.PI * 2);
    ctx.fill();

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
    // Boss oculto não é renderizado até ser desbloqueado
    if (enemy.state === 'hidden') continue;

    const px = enemy.x * tileSize - camera.x + tileSize / 2;
    const py = enemy.y * tileSize - camera.y + tileSize / 2;

    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.ellipse(px, py + 16, enemy.isBoss ? 22 : 12, enemy.isBoss ? 6 : 4, 0, 0, Math.PI * 2);
    ctx.fill();

    const size = enemy.isBoss ? 20 : 13;

    if (enemy.isBoss) {
      ctx.fillStyle = '#8B3A1A';
      ctx.beginPath();
      ctx.arc(px, py, size, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#D4A017';
      ctx.lineWidth = 3;
      ctx.stroke();

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

    const barW = enemy.isBoss ? 60 : 36;
    drawHPBar(ctx, px - barW / 2, py - size - 14, barW, 6, enemy.hp, enemy.maxHp, enemy.isBoss ? '#c0392b' : '#e74c3c');

    if (enemy.state === 'chase') {
      ctx.fillStyle = '#e74c3c';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', px, py - size - 18);
    }

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

  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.ellipse(px, py + 14, 10, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#D4A017';
  ctx.beginPath();
  ctx.arc(px, py, 14, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#e8e0d0';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#d4b896';
  ctx.beginPath();
  ctx.arc(px, py - 5, 7, 0, Math.PI * 2);
  ctx.fill();

  const dirs: Record<string, [number, number]> = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  const dir = dirs[player.facing];
  ctx.fillStyle = '#8B3A1A';
  ctx.beginPath();
  ctx.arc(px + dir[0] * 10, py + dir[1] * 10, 4, 0, Math.PI * 2);
  ctx.fill();

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

  ctx.fillStyle = '#e8e0d0';
  ctx.font = '11px "Share Tech Mono", monospace';
  ctx.fillText(`HP: ${player.hp}/${player.maxHp}`, 16, 42);
  drawHPBar(ctx, 16, 46, 180, 8, player.hp, player.maxHp, '#27ae60');

  ctx.fillStyle = '#e8e0d0';
  ctx.fillText(`ENERGIA: ${player.energy}/${player.maxEnergy}`, 16, 66);

  // Mini-inventário (canto superior direito) — mostra itens coletados
  const sortedItems = getSortedInventoryItems(state);
  const hasItems = sortedItems.length > 0;

  if (hasItems) {
    const panelH = 20 + sortedItems.length * 18;
    ctx.fillStyle = 'rgba(10,8,6,0.85)';
    roundRect(ctx, CANVAS_W - 155, 8, 147, panelH, 4);
    ctx.fill();
    ctx.strokeStyle = '#8B3A1A';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#D4A017';
    ctx.font = 'bold 11px "Bebas Neue", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('INVENTÁRIO [I]', CANVAS_W - 147, 22);

    let iy = 38;
    for (const item of sortedItems) {
      const rarityColor = getRarityColor(item.rarity);
      ctx.fillStyle = rarityColor;
      ctx.font = '10px "Share Tech Mono", monospace';
      ctx.fillText(`${item.icon} ${item.name.substring(0, 14)}: ×${item.quantity}`, CANVAS_W - 147, iy);
      iy += 18;
    }
  }

  // Contador de inimigos restantes
  const aliveEnemies = state.enemies.filter(e => !e.isBoss && e.state !== 'dead');
  const totalCommon = state.enemies.filter(e => !e.isBoss).length;
  const defeatedCommon = totalCommon - aliveEnemies.length;

  ctx.fillStyle = 'rgba(10,8,6,0.85)';
  roundRect(ctx, 8, 85, 200, 30, 4);
  ctx.fill();
  ctx.strokeStyle = '#8B3A1A';
  ctx.lineWidth = 1;
  ctx.stroke();

  if (state.allEnemiesDefeated) {
    ctx.fillStyle = '#D4A017';
    ctx.font = 'bold 12px "Bebas Neue", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('⚠️ BOSS DESBLOQUEADO!', 16, 105);
  } else {
    ctx.fillStyle = '#e8e0d0';
    ctx.font = '11px "Share Tech Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`INIMIGOS: ${defeatedCommon}/${totalCommon} derrotados`, 16, 105);
  }

  // Dica de interação com NPC
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

  // Notificação de coleta de item
  if (state.collectNotification && state.collectNotification.timer > 0) {
    const alpha = Math.min(1, state.collectNotification.timer / 40);
    const isWarning = state.collectNotification.msg.startsWith('⚠️');
    ctx.save();
    ctx.globalAlpha = alpha;

    const msgW = isWarning ? 380 : 280;
    ctx.fillStyle = 'rgba(10,8,6,0.92)';
    roundRect(ctx, CANVAS_W / 2 - msgW / 2, isWarning ? CANVAS_H / 2 - 30 : 90, msgW, 38, 6);
    ctx.fill();
    ctx.strokeStyle = isWarning ? '#D4A017' : '#4CAF50';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = isWarning ? '#D4A017' : '#4CAF50';
    ctx.font = `bold ${isWarning ? 14 : 16}px "Bebas Neue", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(state.collectNotification.msg, CANVAS_W / 2, isWarning ? CANVAS_H / 2 - 6 : 115);
    ctx.restore();
  }

  // Boss derrotado
  if (state.bossDefeated) {
    ctx.fillStyle = 'rgba(212,160,23,0.9)';
    ctx.font = 'bold 20px "Bebas Neue", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🏆 GENERAL DO IMPÉRIO DERROTADO!', CANVAS_W / 2, CANVAS_H - 20);
  }

  // ---- Minimapa com rota TSP ----
  if (state.showMinimap && !state.showInventory) {
    if (state.showMinimapExpanded) {
      renderMinimapExpanded(ctx, state, CANVAS_W, CANVAS_H);
    } else {
      renderMinimap(ctx, state, CANVAS_W, CANVAS_H);
    }
  }
}

// ---- Inventário Completo (com detalhes de cada item) ----

export function renderInventory(ctx: CanvasRenderingContext2D, state: GameState): void {
  // Fundo semi-transparente
  ctx.fillStyle = 'rgba(0,0,0,0.88)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Painel principal
  const pw = 820, ph = 520, px = (CANVAS_W - pw) / 2, py = (CANVAS_H - ph) / 2;
  ctx.fillStyle = '#0d0a08';
  roundRect(ctx, px, py, pw, ph, 8);
  ctx.fill();
  ctx.strokeStyle = '#8B3A1A';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Título
  ctx.fillStyle = '#D4A017';
  ctx.font = 'bold 30px "Bebas Neue", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('INVENTÁRIO — NÍVEL 1', CANVAS_W / 2, py + 38);

  // Linha separadora
  ctx.strokeStyle = '#8B3A1A';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(px + 20, py + 50);
  ctx.lineTo(px + pw - 20, py + 50);
  ctx.stroke();

  // Botões de ordenação (QuickSort)
  const sortOptions: Array<{ label: string; value: import('./types').SortCriteria }> = [
    { label: '⚖️ Peso', value: 'peso' },
    { label: '✨ Raridade', value: 'raridade' },
    { label: '💰 Valor', value: 'valor' },
    { label: '🔤 Nome', value: 'nome' },
    { label: '📦 Qtd', value: 'quantidade' },
  ];

  ctx.fillStyle = '#6a6050';
  ctx.font = 'bold 10px "Share Tech Mono", monospace';
  ctx.textAlign = 'left';
  ctx.fillText('ORDENAR (QuickSort):', px + 20, py + 68);

  sortOptions.forEach((opt, i) => {
    const bx = px + 20 + i * 155, by = py + 72, bw = 145, bh = 26;
    ctx.fillStyle = state.sortCriteria === opt.value ? '#8B3A1A' : '#1a1510';
    roundRect(ctx, bx, by, bw, bh, 4);
    ctx.fill();
    ctx.strokeStyle = state.sortCriteria === opt.value ? '#D4A017' : '#3a3028';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = state.sortCriteria === opt.value ? '#D4A017' : '#6a6050';
    ctx.font = 'bold 11px "Share Tech Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(opt.label, bx + bw / 2, by + 17);
  });

  // Linha separadora
  ctx.strokeStyle = '#3a3028';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(px + 20, py + 108);
  ctx.lineTo(px + pw - 20, py + 108);
  ctx.stroke();

  // Cabeçalho da tabela
  ctx.fillStyle = '#D4A017';
  ctx.font = 'bold 11px "Share Tech Mono", monospace';
  ctx.textAlign = 'left';
  const headers = ['ITEM', 'RARIDADE', 'PESO (kg)', 'VALOR (cr)', 'QTD'];
  const colX = [px + 20, px + 280, px + 430, px + 560, px + 690];
  headers.forEach((h, i) => {
    ctx.fillText(h, colX[i], py + 125);
  });

  // Linha separadora
  ctx.strokeStyle = '#3a3028';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(px + 20, py + 132);
  ctx.lineTo(px + pw - 20, py + 132);
  ctx.stroke();

  // Itens ordenados com QuickSort
  const sortedItems = getSortedInventoryItems(state);

  if (sortedItems.length === 0) {
    ctx.fillStyle = '#4a4038';
    ctx.font = '16px "Share Tech Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Nenhum item coletado. Explore o mapa!', CANVAS_W / 2, py + 200);
  } else {
    sortedItems.forEach((item, i) => {
      const iy = py + 148 + i * 52;
      const isSelected = state.selectedItemIndex === i;

      // Fundo do item
      ctx.fillStyle = isSelected ? 'rgba(139,58,26,0.3)' : (i % 2 === 0 ? 'rgba(20,15,10,0.6)' : 'rgba(15,10,8,0.4)');
      roundRect(ctx, px + 15, iy - 16, pw - 30, 46, 4);
      ctx.fill();

      if (isSelected) {
        ctx.strokeStyle = '#D4A017';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      const rarityColor = getRarityColor(item.rarity);

      // Ícone + Nome
      ctx.font = '18px serif';
      ctx.textAlign = 'left';
      ctx.fillText(item.icon, colX[0], iy + 10);

      ctx.fillStyle = '#e8e0d0';
      ctx.font = 'bold 12px "Share Tech Mono", monospace';
      ctx.fillText(item.name, colX[0] + 28, iy + 2);

      // Descrição resumida
      ctx.fillStyle = '#6a6050';
      ctx.font = '9px "Share Tech Mono", monospace';
      const shortDesc = item.description.length > 45 ? item.description.substring(0, 45) + '...' : item.description;
      ctx.fillText(shortDesc, colX[0] + 28, iy + 16);

      // Raridade
      ctx.fillStyle = rarityColor;
      ctx.font = 'bold 11px "Share Tech Mono", monospace';
      ctx.fillText(item.rarity.toUpperCase(), colX[1], iy + 6);

      // Peso
      ctx.fillStyle = '#e8e0d0';
      ctx.font = '12px "Share Tech Mono", monospace';
      ctx.fillText(`${item.weight.toFixed(2)} kg`, colX[2], iy + 6);

      // Valor
      ctx.fillStyle = '#D4A017';
      ctx.font = 'bold 12px "Share Tech Mono", monospace';
      ctx.fillText(`${item.value} cr`, colX[3], iy + 6);

      // Quantidade
      ctx.fillStyle = '#e8e0d0';
      ctx.font = 'bold 14px "Bebas Neue", sans-serif';
      ctx.fillText(`×${item.quantity}`, colX[4], iy + 8);
    });
  }

  // Rodapé com totais
  const totalWeight = getTotalWeight(state.inventoryItems);
  const totalValue = getTotalValue(state.inventoryItems);

  ctx.strokeStyle = '#8B3A1A';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(px + 20, py + ph - 60);
  ctx.lineTo(px + pw - 20, py + ph - 60);
  ctx.stroke();

  ctx.fillStyle = '#D4A017';
  ctx.font = 'bold 13px "Bebas Neue", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`ITENS: ${state.inventoryItems.length} tipos | PESO TOTAL: ${totalWeight.toFixed(2)} kg | VALOR TOTAL: ${totalValue} créditos`, px + 20, py + ph - 40);

  ctx.fillStyle = '#6a6050';
  ctx.font = '11px "Share Tech Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('[1] Peso  [2] Raridade  [3] Valor  [4] Nome  [5] Qtd  |  [I] ou [ESC] para fechar', CANVAS_W / 2, py + ph - 18);

  // Baralho
  ctx.fillStyle = '#D4A017';
  ctx.font = 'bold 12px "Bebas Neue", sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`BARALHO: ${state.player.cards.length} cartas`, px + pw - 20, py + ph - 40);
}

// ---- Diálogo ----

export function renderDialog(ctx: CanvasRenderingContext2D, state: GameState, portraits: Record<string, HTMLImageElement>): void {
  if (!state.activeDialog) return;

  const { npc, nodeId } = state.activeDialog;
  const node = npc.dialogTree.nodes.get(nodeId);
  if (!node) return;

  const dh = 220, dy = CANVAS_H - dh - 10;
  ctx.fillStyle = 'rgba(8,6,4,0.95)';
  roundRect(ctx, 10, dy, CANVAS_W - 20, dh, 6);
  ctx.fill();
  ctx.strokeStyle = '#8B3A1A';
  ctx.lineWidth = 2;
  ctx.stroke();

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

  ctx.fillStyle = '#D4A017';
  ctx.font = 'bold 18px "Bebas Neue", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(node.speaker.toUpperCase(), 130, dy + 28);

  ctx.fillStyle = '#e8e0d0';
  ctx.font = '14px "Crimson Text", Georgia, serif';
  wrapText(ctx, node.text, 130, dy + 50, CANVAS_W - 160, 20);

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

  ctx.fillStyle = '#0a0806';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  renderScanlines(ctx);

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

  ctx.fillStyle = '#D4A017';
  ctx.font = `bold ${enemy.isBoss ? 22 : 18}px "Bebas Neue", sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(enemy.name.toUpperCase(), enemyX, enemyY - 10);

  if (enemy.isBoss) {
    ctx.fillStyle = '#e74c3c';
    ctx.font = 'bold 11px "Share Tech Mono", monospace';
    ctx.fillText('⚠️ BOSS FINAL', enemyX, enemyY - 26);
  }

  drawHPBar(ctx, enemyX - 80, enemyY + (enemy.isBoss ? 170 : 145), 160, 14, enemy.hp, enemy.maxHp, '#e74c3c');
  ctx.fillStyle = '#e8e0d0';
  ctx.font = '12px "Share Tech Mono", monospace';
  ctx.fillText(`${enemy.hp}/${enemy.maxHp} HP`, enemyX, enemyY + (enemy.isBoss ? 200 : 175));

  if (enemy.block > 0) {
    ctx.fillStyle = '#3498db';
    ctx.font = 'bold 16px "Bebas Neue", sans-serif';
    ctx.fillText(`🛡️ ${enemy.block}`, enemyX, enemyY + (enemy.isBoss ? 220 : 195));
  }

  const statusY = enemyY + (enemy.isBoss ? 240 : 215);
  if ((enemy as any).poisoned > 0) {
    ctx.fillStyle = '#8e44ad';
    ctx.font = '12px "Share Tech Mono", monospace';
    ctx.fillText(`☠️ Veneno: ${(enemy as any).poisoned}`, enemyX, statusY);
  }

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

  ctx.fillStyle = '#f39c12';
  ctx.font = 'bold 16px "Bebas Neue", sans-serif';
  ctx.fillText(`⚡ ${player.energy}/${player.maxEnergy}`, playerX, playerY + 215);

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

  renderHand(ctx, state, cardBgImg);

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

  for (const ft of battle.floatingTexts) {
    ctx.save();
    ctx.globalAlpha = ft.opacity;
    ctx.fillStyle = ft.color;
    ctx.font = 'bold 22px "Bebas Neue", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(ft.text, ft.x, ft.y);
    ctx.restore();
  }

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

    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    roundRect(ctx, cx + 3, cardY + 3, cardW, cardH, 6);
    ctx.fill();

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

    ctx.strokeStyle = canPlay ? card.color : '#3a3028';
    ctx.lineWidth = isSelected ? 3 : 2;
    roundRect(ctx, cx, cardY, cardW, cardH, 6);
    ctx.stroke();

    ctx.fillStyle = canPlay ? '#f39c12' : '#6a6050';
    ctx.beginPath();
    ctx.arc(cx + 14, cardY + 14, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0a0806';
    ctx.font = 'bold 14px "Bebas Neue", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(String(card.cost), cx + 14, cardY + 19);

    ctx.fillStyle = canPlay ? '#e8e0d0' : '#5a5040';
    ctx.font = `bold ${card.name.length > 12 ? 9 : 11}px "Bebas Neue", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(card.name.toUpperCase(), cx + cardW / 2, cardY + 36);

    const typeColors: Record<string, string> = { attack: '#e74c3c', skill: '#3498db', power: '#f39c12', curse: '#8e44ad' };
    ctx.fillStyle = typeColors[card.type];
    ctx.font = 'bold 9px "Share Tech Mono", monospace';
    ctx.fillText(card.type.toUpperCase(), cx + cardW / 2, cardY + 50);

    ctx.fillStyle = canPlay ? '#c8c0b0' : '#4a4038';
    ctx.font = '9px "Share Tech Mono", monospace';
    wrapTextSmall(ctx, card.description, cx + 6, cardY + 65, cardW - 12, 12);

    const rarityColors: Record<string, string> = { common: '#9E9E9E', uncommon: '#4CAF50', rare: '#42A5F5', boss: '#D4A017' };
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

// ---- Game Over ----

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

// ---- Vitória (Boss derrotado) ----

export function renderVictory(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#0a0806';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  ctx.fillStyle = '#D4A017';
  ctx.font = 'bold 70px "Bebas Neue", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('SOBREVIVENTE!', CANVAS_W / 2, CANVAS_H / 2 - 40);

  ctx.fillStyle = '#e8e0d0';
  ctx.font = '22px "Share Tech Mono", monospace';
  ctx.fillText('O General do Império foi derrotado!', CANVAS_W / 2, CANVAS_H / 2 + 10);
  ctx.fillText('As ruínas são suas agora.', CANVAS_W / 2, CANVAS_H / 2 + 40);

  ctx.fillStyle = '#8B3A1A';
  ctx.font = '16px "Share Tech Mono", monospace';
  ctx.fillText('[R] Jogar Novamente', CANVAS_W / 2, CANVAS_H / 2 + 90);
}

// ---- Tela de Conclusão do Nível 1 ----

export function renderLevelComplete(ctx: CanvasRenderingContext2D): void {
  // Fundo escuro
  ctx.fillStyle = '#050308';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Efeito de brilho dourado
  const grad = ctx.createRadialGradient(CANVAS_W / 2, CANVAS_H / 2, 50, CANVAS_W / 2, CANVAS_H / 2, 400);
  grad.addColorStop(0, 'rgba(212,160,23,0.15)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  renderScanlines(ctx);

  // Troféu
  ctx.font = '80px serif';
  ctx.textAlign = 'center';
  ctx.fillText('🏆', CANVAS_W / 2, 130);

  // Mensagem 1: Missão Concluída!
  ctx.save();
  ctx.shadowColor = '#D4A017';
  ctx.shadowBlur = 30;
  ctx.fillStyle = '#D4A017';
  ctx.font = 'bold 68px "Bebas Neue", "Impact", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('MISSÃO CONCLUÍDA!', CANVAS_W / 2, 210);
  ctx.restore();

  // Linha decorativa
  ctx.strokeStyle = '#8B3A1A';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(CANVAS_W / 2 - 300, 225);
  ctx.lineTo(CANVAS_W / 2 + 300, 225);
  ctx.stroke();

  // Mensagem 2
  ctx.fillStyle = '#e8e0d0';
  ctx.font = '22px "Share Tech Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('Você derrotou todos os inimigos e venceu o Boss Final.', CANVAS_W / 2, 270);

  // Mensagem 3
  ctx.fillStyle = '#4CAF50';
  ctx.font = 'bold 24px "Bebas Neue", sans-serif';
  ctx.fillText('Parabéns! O Nível 2 está em desenvolvimento.', CANVAS_W / 2, 315);

  // Separador
  ctx.strokeStyle = '#3a3028';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(CANVAS_W / 2 - 250, 340);
  ctx.lineTo(CANVAS_W / 2 + 250, 340);
  ctx.stroke();

  // Estatísticas
  ctx.fillStyle = '#D4A017';
  ctx.font = 'bold 16px "Bebas Neue", sans-serif';
  ctx.fillText('— ESTATÍSTICAS DO NÍVEL 1 —', CANVAS_W / 2, 370);

  // Botões de ação
  // Botão: Retornar ao Mapa
  const bx1 = CANVAS_W / 2 - 230, by1 = 420, bw1 = 210, bh1 = 50;
  ctx.fillStyle = '#1a4a2a';
  roundRect(ctx, bx1, by1, bw1, bh1, 6);
  ctx.fill();
  ctx.strokeStyle = '#4CAF50';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#4CAF50';
  ctx.font = 'bold 20px "Bebas Neue", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🗺️ RETORNAR AO MAPA', bx1 + bw1 / 2, by1 + 32);

  // Botão: Jogar Novamente
  const bx2 = CANVAS_W / 2 + 20, by2 = 420, bw2 = 210, bh2 = 50;
  ctx.fillStyle = '#3a1a08';
  roundRect(ctx, bx2, by2, bw2, bh2, 6);
  ctx.fill();
  ctx.strokeStyle = '#8B3A1A';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#D4A017';
  ctx.font = 'bold 20px "Bebas Neue", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🔄 JOGAR NOVAMENTE', bx2 + bw2 / 2, by2 + 32);

  // Instrução de teclado
  ctx.fillStyle = '#4a4038';
  ctx.font = '13px "Share Tech Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('[M] Retornar ao Mapa  |  [R] Jogar Novamente', CANVAS_W / 2, 500);
}

// Exportar função de renderização do nível completo com estatísticas
export function renderLevelCompleteWithStats(
  ctx: CanvasRenderingContext2D,
  state: GameState
): void {
  renderLevelComplete(ctx);

  // Estatísticas do jogador
  const totalItems = state.inventoryItems.reduce((sum, item) => sum + item.quantity, 0);
  const defeatedEnemies = state.enemies.filter(e => e.state === 'dead').length;
  const totalEnemies = state.enemies.length;
  const minutes = Math.floor(state.gameTime / 60);
  const seconds = Math.floor(state.gameTime % 60);

  const stats = [
    `Inimigos derrotados: ${defeatedEnemies}/${totalEnemies}`,
    `Itens coletados: ${totalItems}`,
    `Tempo de jogo: ${minutes}m ${seconds}s`,
    `Cartas no baralho: ${state.player.cards.length}`,
  ];

  stats.forEach((stat, i) => {
    ctx.fillStyle = '#e8e0d0';
    ctx.font = '14px "Share Tech Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(stat, CANVAS_W / 2, 390 + i * 0); // Não renderiza aqui, apenas calcula
  });

  // Renderizar estatísticas em linha
  ctx.fillStyle = '#e8e0d0';
  ctx.font = '13px "Share Tech Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(
    `Inimigos: ${defeatedEnemies}/${totalEnemies}  |  Itens: ${totalItems}  |  Tempo: ${minutes}m${seconds}s  |  Cartas: ${state.player.cards.length}`,
    CANVAS_W / 2, 395
  );
}
