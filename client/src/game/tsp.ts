// ============================================================
// TSP — Problema do Caixeiro Viajante (Travelling Salesman Problem)
// Heurística: Vizinho Mais Próximo (Nearest Neighbor)
//
// CONCEITO:
//   Dado um conjunto de pontos de interesse (POIs) no mapa, queremos
//   encontrar uma rota que passe por todos eles e retorne ao ponto
//   inicial, minimizando a distância total percorrida.
//
// HEURÍSTICA VIZINHO MAIS PRÓXIMO:
//   1. Começa em um ponto inicial (índice 0).
//   2. A cada passo, visita o ponto ainda não visitado mais próximo.
//   3. Ao visitar todos os pontos, retorna ao ponto inicial.
//   Complexidade: O(n²) — simples e eficiente para fins acadêmicos.
// ============================================================

export interface POIPoint {
  x: number;
  y: number;
  label: string;
  color: string;
  type: 'npc' | 'enemy' | 'boss' | 'material' | 'player';
}

/**
 * Calcula a distância euclidiana entre dois pontos.
 */
function euclideanDistance(a: POIPoint, b: POIPoint): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Heurística do Vizinho Mais Próximo para o TSP.
 *
 * @param points - Lista de pontos de interesse
 * @param startIndex - Índice do ponto inicial (padrão: 0)
 * @returns Rota ordenada como array de índices em `points`
 *
 * Algoritmo:
 *   - Marca o ponto inicial como visitado.
 *   - Itera: entre todos os pontos não visitados, escolhe o mais próximo
 *     do ponto atual e o adiciona à rota.
 *   - Repete até visitar todos os pontos.
 *   - Fecha o ciclo retornando ao ponto inicial.
 */
export function nearestNeighborTSP(points: POIPoint[], startIndex: number = 0): number[] {
  const n = points.length;
  if (n === 0) return [];
  if (n === 1) return [0, 0]; // ciclo de um único ponto

  const visited = new Array(n).fill(false);
  const route: number[] = [];

  let current = startIndex;
  visited[current] = true;
  route.push(current);

  // Visitar os n-1 pontos restantes
  for (let step = 1; step < n; step++) {
    let nearestIndex = -1;
    let nearestDist = Infinity;

    // Encontrar o vizinho mais próximo não visitado
    for (let i = 0; i < n; i++) {
      if (visited[i]) continue;
      const dist = euclideanDistance(points[current], points[i]);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestIndex = i;
      }
    }

    if (nearestIndex === -1) break; // segurança

    visited[nearestIndex] = true;
    route.push(nearestIndex);
    current = nearestIndex;
  }

  // Fechar o ciclo: retornar ao ponto inicial
  route.push(startIndex);

  return route;
}

/**
 * Calcula a distância total de uma rota TSP.
 * Útil para exibir a informação na interface.
 */
export function routeTotalDistance(points: POIPoint[], route: number[]): number {
  let total = 0;
  for (let i = 0; i < route.length - 1; i++) {
    total += euclideanDistance(points[route[i]], points[route[i + 1]]);
  }
  return total;
}
