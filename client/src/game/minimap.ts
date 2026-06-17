// ============================================================
// MINIMAPA — renderização do mapa em escala reduzida
// com rota TSP sobreposta
//
// Posição: canto inferior direito do canvas
// Tamanho: 200×150 px (escala: MAP_WIDTH/200 × MAP_HEIGHT/150)
//
// Elementos renderizados:
//   — Tiles do mapa (simplificado por cor)
//   — Player (ponto dourado)
//   — Itens não coletados (pontos coloridos)
//   — Inimigos vivos (pontos vermelhos)
//   — Boss (ponto vermelho pulsante)
//   — NPCs (pontos amarelos)
//   — Câmera (retângulo branco semi-transparente)
//   — Rota TSP (linha colorida com setas e numeração)
//   — Painel de estatísticas TSP (distância, nós, algoritmo)
// ============================================================

import { GameState, TileType } from './types';
import { MAP_WIDTH, MAP_HEIGHT } from './mapData';
import { getCachedTSP, TSPNode, TSPResult } from './tsp';

// ---- Constantes do minimapa ----

const MM_W = 200;       // Largura do minimapa em px
const MM_H = 150;       // Altura do minimapa em px
const MM_PAD = 10;      // Padding da borda do canvas
const MM_BORDER = 2;    // Espessura da borda

// Escala: tile → pixel do minimapa
const SCALE_X = MM_W / MAP_WIDTH;   // 200/40 = 5 px/tile
const SCALE_Y = MM_H / MAP_HEIGHT;  // 150/30 = 5 px/tile

// Cores simplificadas dos tiles no minimapa
const TILE_MM_COLORS: Record<TileType, string | null> = {
  floor:     '#1a1a2e',
  road:      '#16213e',
  metal:     '#2a2a3e',
  wall:      '#4a4a6a',
  rubble:    '#3a3a5a',
  debris:    '#3a3a5a',
  building:  '#2e2e4e',
  barrier:   '#6a3a2a',
  door:      '#3a6a9a',
  boss_zone: '#4a0a1a',
};

// ---- Utilitários ----

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

// Converte coordenada de tile para pixel no minimapa (relativo ao canto do minimapa)
function tileToMM(tx: number, ty: number): { px: number; py: number } {
  return {
    px: tx * SCALE_X,
    py: ty * SCALE_Y,
  };
}

// Desenha uma seta de (x1,y1) para (x2,y2) no contexto
function drawArrow(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number,
  x2: number, y2: number,
  arrowSize: number = 4
): void {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;

  ctx.beginPath();
  ctx.moveTo(midX, midY);
  ctx.lineTo(
    midX - arrowSize * Math.cos(angle - Math.PI / 6),
    midY - arrowSize * Math.sin(angle - Math.PI / 6)
  );
  ctx.moveTo(midX, midY);
  ctx.lineTo(
    midX - arrowSize * Math.cos(angle + Math.PI / 6),
    midY - arrowSize * Math.sin(angle + Math.PI / 6)
  );
  ctx.stroke();
}

// ---- Renderização Principal do Minimapa ----

export function renderMinimap(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  canvasW: number,
  canvasH: number
): void {
  // Posição do minimapa (canto inferior direito)
  const mmX = canvasW - MM_W - MM_PAD;
  const mmY = canvasH - MM_H - MM_PAD - 60; // 60px acima da barra de controles

  ctx.save();

  // ---- Fundo e borda ----
  ctx.fillStyle = 'rgba(5, 3, 8, 0.92)';
  roundRect(ctx, mmX - MM_BORDER, mmY - MM_BORDER, MM_W + MM_BORDER * 2, MM_H + MM_BORDER * 2, 6);
  ctx.fill();

  ctx.strokeStyle = '#8B3A1A';
  ctx.lineWidth = MM_BORDER;
  ctx.stroke();

  // Clip para não vazar fora do minimapa
  ctx.beginPath();
  roundRect(ctx, mmX, mmY, MM_W, MM_H, 4);
  ctx.clip();

  // ---- Tiles do mapa ----
  renderMinimapTiles(ctx, state, mmX, mmY);

  // ---- Câmera (viewport atual) ----
  renderMinimapCamera(ctx, state, mmX, mmY);

  // ---- Rota TSP ----
  const tspResult = getCachedTSP(state);
  if (tspResult && tspResult.route.length > 1) {
    renderTSPRoute(ctx, tspResult, mmX, mmY);
  }

  // ---- Pontos de interesse ----
  renderMinimapPoints(ctx, state, mmX, mmY);

  // ---- Player ----
  renderMinimapPlayer(ctx, state, mmX, mmY);

  ctx.restore();

  // ---- Título e legenda (fora do clip) ----
  renderMinimapHeader(ctx, state, mmX, mmY, tspResult);
}

// ---- Tiles ----

function renderMinimapTiles(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  mmX: number, mmY: number
): void {
  const { map } = state;

  // Renderizar agrupando por cor para performance
  for (let ty = 0; ty < map.length; ty++) {
    for (let tx = 0; tx < map[ty].length; tx++) {
      const tile = map[ty][tx];
      const color = TILE_MM_COLORS[tile];
      if (!color) continue;

      ctx.fillStyle = color;
      ctx.fillRect(
        mmX + tx * SCALE_X,
        mmY + ty * SCALE_Y,
        SCALE_X + 0.5, // +0.5 para evitar gaps
        SCALE_Y + 0.5
      );
    }
  }
}

// ---- Câmera ----

function renderMinimapCamera(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  mmX: number, mmY: number
): void {
  const { camera, tileSize } = state;
  const canvasW = 900, canvasH = 600;

  const camTileX = camera.x / tileSize;
  const camTileY = camera.y / tileSize;
  const camTileW = canvasW / tileSize;
  const camTileH = canvasH / tileSize;

  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 1;
  ctx.setLineDash([2, 2]);
  ctx.strokeRect(
    mmX + camTileX * SCALE_X,
    mmY + camTileY * SCALE_Y,
    camTileW * SCALE_X,
    camTileH * SCALE_Y
  );
  ctx.setLineDash([]);
}

// ---- Rota TSP ----

function renderTSPRoute(
  ctx: CanvasRenderingContext2D,
  result: TSPResult,
  mmX: number, mmY: number
): void {
  const { route } = result;
  if (route.length < 2) return;

  // Gradiente de cor ao longo da rota: verde → amarelo → vermelho
  for (let i = 0; i < route.length - 1; i++) {
    const from = route[i];
    const to = route[i + 1];

    const { px: fx, py: fy } = tileToMM(from.x, from.y);
    const { px: tx, py: ty } = tileToMM(to.x, to.y);

    // Cor da aresta baseada na posição na rota
    const t = i / (route.length - 1);
    const r = Math.round(50 + t * 200);
    const g = Math.round(200 - t * 150);
    const b = 50;
    const edgeColor = `rgba(${r},${g},${b},0.85)`;

    // Linha da aresta
    ctx.strokeStyle = edgeColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(mmX + fx, mmY + fy);
    ctx.lineTo(mmX + tx, mmY + ty);
    ctx.stroke();

    // Seta no meio da aresta
    ctx.strokeStyle = edgeColor;
    ctx.lineWidth = 1.5;
    drawArrow(ctx, mmX + fx, mmY + fy, mmX + tx, mmY + ty, 3);
  }

  // Numeração dos nós na rota (exceto player)
  for (let i = 1; i < route.length; i++) {
    const node = route[i];
    const { px, py } = tileToMM(node.x, node.y);

    // Fundo do número
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.beginPath();
    ctx.arc(mmX + px, mmY + py - 5, 4, 0, Math.PI * 2);
    ctx.fill();

    // Número da ordem de visita
    ctx.fillStyle = '#D4A017';
    ctx.font = 'bold 5px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(i), mmX + px, mmY + py - 5);
  }
}

// ---- Pontos de Interesse ----

function renderMinimapPoints(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  mmX: number, mmY: number
): void {
  const time = Date.now();

  // Itens não coletados
  for (const mat of state.materials) {
    if (mat.collected) continue;
    const { px, py } = tileToMM(mat.x + 0.5, mat.y + 0.5);
    const pulse = 0.6 + 0.4 * Math.sin(time / 600 + mat.x);

    ctx.fillStyle = mat.color;
    ctx.globalAlpha = pulse;
    ctx.beginPath();
    ctx.arc(mmX + px, mmY + py, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // Inimigos vivos
  for (const enemy of state.enemies) {
    if (enemy.state === 'dead' || enemy.state === 'hidden') continue;
    const { px, py } = tileToMM(enemy.x + 0.5, enemy.y + 0.5);

    if (enemy.isBoss) {
      // Boss: pulsante e maior
      const pulse = 0.5 + 0.5 * Math.sin(time / 300);
      ctx.fillStyle = '#D32F2F';
      ctx.globalAlpha = pulse;
      ctx.beginPath();
      ctx.arc(mmX + px, mmY + py, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = '#FF5252';
      ctx.lineWidth = 1;
      ctx.stroke();
    } else {
      ctx.fillStyle = '#FF5722';
      ctx.beginPath();
      ctx.arc(mmX + px, mmY + py, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // NPCs
  for (const npc of state.npcs) {
    const { px, py } = tileToMM(npc.x + 0.5, npc.y + 0.5);
    ctx.fillStyle = '#D4A017';
    ctx.beginPath();
    ctx.arc(mmX + px, mmY + py, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ---- Player ----

function renderMinimapPlayer(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  mmX: number, mmY: number
): void {
  const { player } = state;
  const { px, py } = tileToMM(player.x, player.y);

  // Halo pulsante
  const pulse = 0.3 + 0.2 * Math.sin(Date.now() / 200);
  ctx.fillStyle = `rgba(212,160,23,${pulse})`;
  ctx.beginPath();
  ctx.arc(mmX + px, mmY + py, 6, 0, Math.PI * 2);
  ctx.fill();

  // Ponto do player
  ctx.fillStyle = '#D4A017';
  ctx.beginPath();
  ctx.arc(mmX + px, mmY + py, 3.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1;
  ctx.stroke();
}

// ---- Cabeçalho e Legenda TSP ----

function renderMinimapHeader(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  mmX: number, mmY: number,
  tspResult: TSPResult | null
): void {
  ctx.save();

  // Título do minimapa
  ctx.fillStyle = '#D4A017';
  ctx.font = 'bold 10px "Bebas Neue", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('MINIMAPA', mmX, mmY - 6);

  // Painel TSP abaixo do minimapa
  const panelY = mmY + MM_H + 4;
  const panelH = 52;

  ctx.fillStyle = 'rgba(5,3,8,0.92)';
  roundRect(ctx, mmX - MM_BORDER, panelY, MM_W + MM_BORDER * 2, panelH, 4);
  ctx.fill();
  ctx.strokeStyle = '#8B3A1A';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Título TSP
  ctx.fillStyle = '#D4A017';
  ctx.font = 'bold 10px "Bebas Neue", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('TSP — ROTA ÓTIMA', mmX + 4, panelY + 12);

  if (tspResult && tspResult.route.length > 1) {
    const nodeCount = tspResult.route.length - 1; // Excluir player
    const dist = tspResult.totalDistance.toFixed(1);

    ctx.fillStyle = '#e8e0d0';
    ctx.font = '9px "Share Tech Mono", monospace';
    ctx.fillText(`Nós: ${nodeCount}  |  Dist: ${dist} tiles`, mmX + 4, panelY + 24);

    ctx.fillStyle = tspResult.improved ? '#4CAF50' : '#FF9800';
    ctx.fillText(
      `Algoritmo: NN${tspResult.improved ? ' + 2-opt ✓' : ' (sem melhoria)'}`,
      mmX + 4, panelY + 34
    );

    // Legenda de cores
    const legend = [
      { color: '#D4A017', label: 'Você' },
      { color: '#FF5722', label: 'Inimigo' },
      { color: '#D32F2F', label: 'Boss' },
    ];
    legend.forEach((item, i) => {
      const lx = mmX + 4 + i * 66;
      ctx.fillStyle = item.color;
      ctx.beginPath();
      ctx.arc(lx + 4, panelY + 44, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#6a6050';
      ctx.font = '8px "Share Tech Mono", monospace';
      ctx.fillText(item.label, lx + 10, panelY + 47);
    });
  } else {
    ctx.fillStyle = '#4a4038';
    ctx.font = '9px "Share Tech Mono", monospace';
    ctx.fillText('Nenhum ponto de interesse ativo', mmX + 4, panelY + 26);
    ctx.fillStyle = '#3a3028';
    ctx.fillText('Explore o mapa para ativar a rota', mmX + 4, panelY + 38);
  }

  // Tecla de toggle
  ctx.fillStyle = '#3a3028';
  ctx.font = '8px "Share Tech Mono", monospace';
  ctx.textAlign = 'right';
  ctx.fillText('[Tab] ocultar', mmX + MM_W, mmY - 6);

  ctx.restore();
}

// ---- Minimapa expandido (tecla Tab) ----
// Versão maior para visualização detalhada

export function renderMinimapExpanded(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  canvasW: number,
  canvasH: number
): void {
  const EXP_W = 480;
  const EXP_H = 360;
  const EXP_SCALE_X = EXP_W / MAP_WIDTH;
  const EXP_SCALE_Y = EXP_H / MAP_HEIGHT;
  const ex = (canvasW - EXP_W) / 2;
  const ey = (canvasH - EXP_H) / 2 - 30;

  ctx.save();

  // Fundo semi-transparente
  ctx.fillStyle = 'rgba(0,0,0,0.75)';
  ctx.fillRect(0, 0, canvasW, canvasH);

  // Painel
  ctx.fillStyle = 'rgba(5,3,8,0.97)';
  roundRect(ctx, ex - 4, ey - 30, EXP_W + 8, EXP_H + 90, 8);
  ctx.fill();
  ctx.strokeStyle = '#8B3A1A';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Título
  ctx.fillStyle = '#D4A017';
  ctx.font = 'bold 18px "Bebas Neue", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('MAPA TÁTICO — ROTA TSP', canvasW / 2, ey - 10);

  // Clip
  ctx.beginPath();
  roundRect(ctx, ex, ey, EXP_W, EXP_H, 4);
  ctx.clip();

  // Tiles
  const { map } = state;
  for (let ty = 0; ty < map.length; ty++) {
    for (let tx = 0; tx < map[ty].length; tx++) {
      const tile = map[ty][tx];
      const color = TILE_MM_COLORS[tile];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(ex + tx * EXP_SCALE_X, ey + ty * EXP_SCALE_Y, EXP_SCALE_X + 0.5, EXP_SCALE_Y + 0.5);
    }
  }

  // Câmera
  const { camera, tileSize } = state;
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);
  ctx.strokeRect(
    ex + (camera.x / tileSize) * EXP_SCALE_X,
    ey + (camera.y / tileSize) * EXP_SCALE_Y,
    (900 / tileSize) * EXP_SCALE_X,
    (600 / tileSize) * EXP_SCALE_Y
  );
  ctx.setLineDash([]);

  // Rota TSP expandida
  const tspResult = getCachedTSP(state);
  if (tspResult && tspResult.route.length > 1) {
    const { route } = tspResult;

    for (let i = 0; i < route.length - 1; i++) {
      const from = route[i];
      const to = route[i + 1];
      const t = i / (route.length - 1);
      const r = Math.round(50 + t * 200);
      const g = Math.round(200 - t * 150);

      ctx.strokeStyle = `rgba(${r},${g},50,0.9)`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(ex + from.x * EXP_SCALE_X, ey + from.y * EXP_SCALE_Y);
      ctx.lineTo(ex + to.x * EXP_SCALE_X, ey + to.y * EXP_SCALE_Y);
      ctx.stroke();

      drawArrow(
        ctx,
        ex + from.x * EXP_SCALE_X, ey + from.y * EXP_SCALE_Y,
        ex + to.x * EXP_SCALE_X, ey + to.y * EXP_SCALE_Y,
        6
      );
    }

    // Nós com rótulos
    for (let i = 0; i < route.length; i++) {
      const node = route[i];
      const nx = ex + node.x * EXP_SCALE_X;
      const ny = ey + node.y * EXP_SCALE_Y;

      ctx.fillStyle = node.color;
      ctx.beginPath();
      ctx.arc(nx, ny, node.type === 'boss' ? 8 : node.type === 'player' ? 7 : 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.stroke();

      if (i > 0) {
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.beginPath();
        ctx.arc(nx, ny - 10, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#D4A017';
        ctx.font = 'bold 7px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(i), nx, ny - 10);
      }

      // Rótulo do nó (apenas para boss e player)
      if (node.type === 'boss' || node.type === 'player') {
        ctx.fillStyle = node.color;
        ctx.font = 'bold 9px "Share Tech Mono", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(node.label.substring(0, 12), nx, ny + 10);
      }
    }
  }

  // Itens no mapa expandido
  for (const mat of state.materials) {
    if (mat.collected) continue;
    ctx.fillStyle = mat.color;
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.arc(ex + (mat.x + 0.5) * EXP_SCALE_X, ey + (mat.y + 0.5) * EXP_SCALE_Y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // Player
  ctx.fillStyle = '#D4A017';
  ctx.beginPath();
  ctx.arc(
    ex + state.player.x * EXP_SCALE_X,
    ey + state.player.y * EXP_SCALE_Y,
    6, 0, Math.PI * 2
  );
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.restore();

  // Estatísticas TSP fora do clip
  if (tspResult) {
    ctx.save();
    const statsY = ey + EXP_H + 10;
    ctx.fillStyle = '#D4A017';
    ctx.font = 'bold 12px "Bebas Neue", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      `TSP: ${tspResult.route.length - 1} pontos | Distância total: ${tspResult.totalDistance.toFixed(1)} tiles | ` +
      `Nearest Neighbor${tspResult.improved ? ' + 2-opt' : ''}`,
      canvasW / 2, statsY + 14
    );
    ctx.fillStyle = '#6a6050';
    ctx.font = '11px "Share Tech Mono", monospace';
    ctx.fillText('[Tab] fechar mapa tático', canvasW / 2, statsY + 30);
    ctx.restore();
  }
}
