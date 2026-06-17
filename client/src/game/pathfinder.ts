// ============================================================
// DESIGN: Gritty Wasteland Noir — pathfinding A*
// Estrutura de dados: array/lista (grade do mapa), fila de prioridade
// ============================================================

import { TileType, Vec2, PathNode } from './types';
import { TILE_DEFS } from './mapData';

function heuristic(a: Vec2, b: Vec2): number {
  // Distância de Manhattan
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function isWalkable(map: TileType[][], x: number, y: number): boolean {
  if (y < 0 || y >= map.length || x < 0 || x >= map[0].length) return false;
  return TILE_DEFS[map[y][x]].walkable;
}

export function findPath(
  map: TileType[][],
  start: Vec2,
  goal: Vec2
): Vec2[] {
  const startNode: PathNode = {
    x: start.x, y: start.y,
    g: 0, h: heuristic(start, goal), f: 0,
    parent: null,
  };
  startNode.f = startNode.g + startNode.h;

  const open: PathNode[] = [startNode];
  const closed = new Set<string>();
  const openMap = new Map<string, PathNode>();
  openMap.set(`${start.x},${start.y}`, startNode);

  const DIRS = [
    { x: 0, y: -1 }, { x: 0, y: 1 },
    { x: -1, y: 0 }, { x: 1, y: 0 },
    // Diagonais
    { x: -1, y: -1 }, { x: 1, y: -1 },
    { x: -1, y: 1 },  { x: 1, y: 1 },
  ];

  let iterations = 0;
  const MAX_ITER = 2000;

  while (open.length > 0 && iterations < MAX_ITER) {
    iterations++;

    // Encontrar nó com menor f
    let lowestIdx = 0;
    for (let i = 1; i < open.length; i++) {
      if (open[i].f < open[lowestIdx].f) lowestIdx = i;
    }
    const current = open[lowestIdx];
    open.splice(lowestIdx, 1);
    openMap.delete(`${current.x},${current.y}`);

    if (current.x === goal.x && current.y === goal.y) {
      // Reconstruir caminho
      const path: Vec2[] = [];
      let node: PathNode | null = current;
      while (node) {
        path.unshift({ x: node.x, y: node.y });
        node = node.parent;
      }
      return path;
    }

    closed.add(`${current.x},${current.y}`);

    for (const dir of DIRS) {
      const nx = current.x + dir.x;
      const ny = current.y + dir.y;
      const key = `${nx},${ny}`;

      if (closed.has(key)) continue;
      if (!isWalkable(map, nx, ny)) continue;

      // Evitar corte de cantos em diagonais
      if (dir.x !== 0 && dir.y !== 0) {
        if (!isWalkable(map, current.x + dir.x, current.y)) continue;
        if (!isWalkable(map, current.x, current.y + dir.y)) continue;
      }

      const isDiag = dir.x !== 0 && dir.y !== 0;
      const moveCost = isDiag ? 1.414 : 1;
      const g = current.g + moveCost;
      const h = heuristic({ x: nx, y: ny }, goal);
      const f = g + h;

      const existing = openMap.get(key);
      if (existing && existing.g <= g) continue;

      const neighbor: PathNode = { x: nx, y: ny, g, h, f, parent: current };
      if (existing) {
        const idx = open.indexOf(existing);
        if (idx !== -1) open.splice(idx, 1);
      }
      open.push(neighbor);
      openMap.set(key, neighbor);
    }
  }

  return []; // Sem caminho encontrado
}
