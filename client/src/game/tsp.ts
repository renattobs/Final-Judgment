// ============================================================
// TSP — Travelling Salesman Problem
// Requisito Acadêmico: algoritmo de otimização de rota
//
// Implementação:
//   1. Heurística Nearest Neighbor (vizinho mais próximo)
//      — Constrói uma rota inicial gulosa O(n²)
//   2. Melhoria 2-opt
//      — Remove cruzamentos de arestas, melhorando a rota O(n²) por iteração
//
// Uso no jogo:
//   — Calcula a rota ótima aproximada entre todos os pontos de interesse
//     visíveis no minimapa (itens não coletados + inimigos vivos + boss)
//   — A rota é exibida no minimapa como uma linha colorida com setas
//   — Atualiza dinamicamente conforme itens são coletados / inimigos derrotados
// ============================================================

import { Vec2 } from './types';

// ---- Tipos ----

export type TSPNodeType = 'item' | 'enemy' | 'boss' | 'player';

export interface TSPNode {
  id: string;
  x: number;        // Coordenada em tiles
  y: number;        // Coordenada em tiles
  type: TSPNodeType;
  label: string;    // Nome do ponto
  color: string;    // Cor para renderização no minimapa
  priority: number; // Menor = mais prioritário (boss=0, enemy=1, item=2)
}

export interface TSPResult {
  route: TSPNode[];       // Rota ordenada (começa e termina no player)
  totalDistance: number;  // Distância total euclidiana da rota
  improved: boolean;      // Se o 2-opt melhorou a rota inicial
}

// ---- Distância Euclidiana ----

export function euclideanDist(a: Vec2, b: Vec2): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// ---- Distância total de uma rota ----

function routeDistance(nodes: TSPNode[]): number {
  let total = 0;
  for (let i = 0; i < nodes.length - 1; i++) {
    total += euclideanDist(nodes[i], nodes[i + 1]);
  }
  return total;
}

// ---- Heurística: Nearest Neighbor ----
//
// Algoritmo guloso: partindo do nó inicial (player),
// sempre visita o nó não visitado mais próximo.
// Complexidade: O(n²)
//
// Retorna a rota na ordem de visita (sem retornar ao início,
// pois o jogo não exige circuito fechado).

function nearestNeighbor(start: TSPNode, nodes: TSPNode[]): TSPNode[] {
  if (nodes.length === 0) return [start];

  const unvisited = [...nodes];
  const route: TSPNode[] = [start];
  let current = start;

  while (unvisited.length > 0) {
    let bestDist = Infinity;
    let bestIdx = 0;

    for (let i = 0; i < unvisited.length; i++) {
      const d = euclideanDist(current, unvisited[i]);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    }

    current = unvisited[bestIdx];
    route.push(current);
    unvisited.splice(bestIdx, 1);
  }

  return route;
}

// ---- Melhoria: 2-opt ----
//
// Tenta reverter sub-rotas para eliminar cruzamentos.
// Para cada par de arestas (i, k), verifica se inverter o segmento
// entre i+1 e k reduz a distância total.
// Repete até não haver mais melhorias.
// Complexidade: O(n²) por iteração, O(n³) no pior caso.

function twoOpt(route: TSPNode[], maxIterations: number = 100): { route: TSPNode[]; improved: boolean } {
  let improved = false;
  let current = [...route];
  const n = current.length;

  for (let iter = 0; iter < maxIterations; iter++) {
    let anyImprovement = false;

    for (let i = 0; i < n - 2; i++) {
      for (let k = i + 2; k < n; k++) {
        // Distância atual: i→i+1 e k→k+1
        const d1 = euclideanDist(current[i], current[i + 1]);
        const d2 = euclideanDist(current[k], current[k + 1 < n ? k + 1 : 0]);

        // Distância proposta: i→k e i+1→k+1
        const d3 = euclideanDist(current[i], current[k]);
        const d4 = euclideanDist(current[i + 1], current[k + 1 < n ? k + 1 : 0]);

        if (d3 + d4 < d1 + d2 - 0.001) {
          // Reverter o segmento entre i+1 e k
          const segment = current.slice(i + 1, k + 1).reverse();
          current = [...current.slice(0, i + 1), ...segment, ...current.slice(k + 1)];
          anyImprovement = true;
          improved = true;
        }
      }
    }

    if (!anyImprovement) break;
  }

  return { route: current, improved };
}

// ---- Função Principal: Resolver TSP ----
//
// Recebe a posição do player e a lista de nós de interesse.
// Retorna a rota ótima aproximada com estatísticas.

export function solveTSP(playerPos: Vec2, nodes: TSPNode[]): TSPResult {
  if (nodes.length === 0) {
    return {
      route: [],
      totalDistance: 0,
      improved: false,
    };
  }

  // Nó do player (ponto de partida)
  const playerNode: TSPNode = {
    id: 'player',
    x: playerPos.x,
    y: playerPos.y,
    type: 'player',
    label: 'Você',
    color: '#D4A017',
    priority: -1,
  };

  // Ordenar nós por prioridade antes de aplicar NN
  // (boss primeiro, depois inimigos, depois itens)
  const sortedNodes = [...nodes].sort((a, b) => a.priority - b.priority);

  // Fase 1: Nearest Neighbor
  const nnRoute = nearestNeighbor(playerNode, sortedNodes);

  // Fase 2: 2-opt (apenas se houver nós suficientes)
  let finalRoute = nnRoute;
  let improved = false;

  if (nnRoute.length >= 4) {
    const result = twoOpt(nnRoute);
    finalRoute = result.route;
    improved = result.improved;
  }

  const totalDistance = routeDistance(finalRoute);

  return {
    route: finalRoute,
    totalDistance,
    improved,
  };
}

// ---- Construir Nós TSP a partir do GameState ----
//
// Extrai os pontos de interesse ativos do estado do jogo:
//   - Itens não coletados
//   - Inimigos vivos (não hidden, não dead)
//   - Boss (se desbloqueado e vivo)

import { GameState } from './types';

export function buildTSPNodes(state: GameState): TSPNode[] {
  const nodes: TSPNode[] = [];

  // Itens não coletados
  for (const mat of state.materials) {
    if (!mat.collected) {
      nodes.push({
        id: `item-${mat.id}`,
        x: mat.x + 0.5,
        y: mat.y + 0.5,
        type: 'item',
        label: mat.name,
        color: mat.color,
        priority: 2,
      });
    }
  }

  // Inimigos vivos (não ocultos)
  for (const enemy of state.enemies) {
    if (enemy.state === 'dead' || enemy.state === 'hidden') continue;
    if (enemy.isBoss) {
      nodes.push({
        id: `boss-${enemy.id}`,
        x: enemy.x + 0.5,
        y: enemy.y + 0.5,
        type: 'boss',
        label: enemy.name,
        color: '#D32F2F',
        priority: 0,
      });
    } else {
      nodes.push({
        id: `enemy-${enemy.id}`,
        x: enemy.x + 0.5,
        y: enemy.y + 0.5,
        type: 'enemy',
        label: enemy.name,
        color: '#FF5722',
        priority: 1,
      });
    }
  }

  return nodes;
}

// ---- Cache de resultado TSP ----
//
// Evita recalcular a cada frame — recalcula apenas quando
// o estado dos nós muda (item coletado, inimigo derrotado, etc.)

let cachedTSPResult: TSPResult | null = null;
let cachedNodeCount = -1;
let cachedPlayerTile = '';
let tspUpdateTimer = 0;
const TSP_UPDATE_INTERVAL = 60; // Recalcular a cada 60 frames (~1s)

export function getCachedTSP(state: GameState): TSPResult | null {
  const nodes = buildTSPNodes(state);
  const nodeCount = nodes.length;
  const playerTile = `${Math.floor(state.player.x)},${Math.floor(state.player.y)}`;

  tspUpdateTimer++;

  // Recalcular se: nós mudaram, player mudou de tile, ou timer expirou
  const needsUpdate =
    cachedTSPResult === null ||
    nodeCount !== cachedNodeCount ||
    playerTile !== cachedPlayerTile ||
    tspUpdateTimer >= TSP_UPDATE_INTERVAL;

  if (needsUpdate) {
    tspUpdateTimer = 0;
    cachedNodeCount = nodeCount;
    cachedPlayerTile = playerTile;

    if (nodes.length === 0) {
      cachedTSPResult = null;
    } else {
      cachedTSPResult = solveTSP(
        { x: state.player.x, y: state.player.y },
        nodes
      );
    }
  }

  return cachedTSPResult;
}

// ---- Invalidar cache (chamar ao coletar item ou derrotar inimigo) ----

export function invalidateTSPCache(): void {
  cachedTSPResult = null;
  cachedNodeCount = -1;
  cachedPlayerTile = '';
  tspUpdateTimer = TSP_UPDATE_INTERVAL; // Força recálculo imediato
}
