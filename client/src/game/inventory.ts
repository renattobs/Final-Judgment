// ============================================================
// SISTEMA DE INVENTÁRIO — Requisito Acadêmico
// Implementa: estrutura de dados, QuickSort, CRUD de itens
// ============================================================

import { InventoryItem, SortCriteria, ItemRarity, RARITY_ORDER } from './types';
import { ITEM_DEFINITIONS, ItemDefinition } from './mapData';
import { nanoid } from 'nanoid';

// ============================================================
// QUICKSORT — Algoritmo de Ordenação do Inventário
// Critérios: peso, raridade, valor
// ============================================================

/**
 * Particiona o array em torno de um pivô para o QuickSort.
 * Retorna o índice final do pivô após a partição.
 */
function partition(
  items: InventoryItem[],
  low: number,
  high: number,
  compareFn: (a: InventoryItem, b: InventoryItem) => number
): number {
  const pivot = items[high];
  let i = low - 1;

  for (let j = low; j < high; j++) {
    if (compareFn(items[j], pivot) <= 0) {
      i++;
      // Troca items[i] e items[j]
      [items[i], items[j]] = [items[j], items[i]];
    }
  }

  // Coloca o pivô na posição correta
  [items[i + 1], items[high]] = [items[high], items[i + 1]];
  return i + 1;
}

/**
 * QuickSort recursivo para ordenação do inventário.
 * Complexidade: O(n log n) médio, O(n²) pior caso.
 */
function quickSort(
  items: InventoryItem[],
  low: number,
  high: number,
  compareFn: (a: InventoryItem, b: InventoryItem) => number
): void {
  if (low < high) {
    const pivotIndex = partition(items, low, high, compareFn);
    quickSort(items, low, pivotIndex - 1, compareFn);
    quickSort(items, pivotIndex + 1, high, compareFn);
  }
}

/**
 * Retorna a função de comparação para o critério de ordenação escolhido.
 */
function getCompareFn(criteria: SortCriteria): (a: InventoryItem, b: InventoryItem) => number {
  switch (criteria) {
    case 'peso':
      return (a, b) => a.weight - b.weight;
    case 'raridade':
      return (a, b) => RARITY_ORDER[a.rarity] - RARITY_ORDER[b.rarity];
    case 'valor':
      return (a, b) => b.value - a.value; // Decrescente: mais valioso primeiro
    case 'nome':
      return (a, b) => a.name.localeCompare(b.name, 'pt-BR');
    case 'quantidade':
      return (a, b) => b.quantity - a.quantity; // Decrescente: mais quantidade primeiro
    default:
      return (a, b) => a.name.localeCompare(b.name, 'pt-BR');
  }
}

/**
 * Ordena o inventário usando QuickSort pelo critério especificado.
 * Retorna uma nova cópia ordenada do array.
 */
export function sortInventoryQuickSort(
  items: InventoryItem[],
  criteria: SortCriteria
): InventoryItem[] {
  if (items.length <= 1) return [...items];
  const sorted = [...items];
  const compareFn = getCompareFn(criteria);
  quickSort(sorted, 0, sorted.length - 1, compareFn);
  return sorted;
}

// ============================================================
// OPERAÇÕES DO INVENTÁRIO
// Adicionar, Remover, Listar, Visualizar Detalhes
// ============================================================

/**
 * Adiciona um item ao inventário.
 * Se o item já existir (mesmo materialType), incrementa a quantidade.
 */
export function addItemToInventory(
  items: InventoryItem[],
  materialType: keyof typeof ITEM_DEFINITIONS
): { updatedItems: InventoryItem[]; collectMessage: string } {
  const def: ItemDefinition = ITEM_DEFINITIONS[materialType];

  // Verificar se o item já existe no inventário
  const existingIndex = items.findIndex(item => item.materialType === materialType);

  let updatedItems: InventoryItem[];
  if (existingIndex >= 0) {
    // Incrementar quantidade
    updatedItems = items.map((item, idx) =>
      idx === existingIndex ? { ...item, quantity: item.quantity + 1 } : item
    );
  } else {
    // Criar novo item
    const newItem: InventoryItem = {
      id: nanoid(),
      name: def.name,
      weight: def.weight,
      rarity: def.rarity,
      value: def.value,
      description: def.description,
      icon: def.icon,
      color: def.color,
      quantity: 1,
      materialType,
    };
    updatedItems = [...items, newItem];
  }

  return { updatedItems, collectMessage: def.collectMessage };
}

/**
 * Remove um item do inventário (decrementa quantidade ou remove se quantidade = 1).
 */
export function removeItemFromInventory(
  items: InventoryItem[],
  itemId: string
): InventoryItem[] {
  return items
    .map(item => {
      if (item.id === itemId) {
        return { ...item, quantity: item.quantity - 1 };
      }
      return item;
    })
    .filter(item => item.quantity > 0);
}

/**
 * Lista todos os itens do inventário ordenados pelo critério especificado.
 */
export function listInventory(
  items: InventoryItem[],
  criteria: SortCriteria
): InventoryItem[] {
  return sortInventoryQuickSort(items, criteria);
}

/**
 * Visualiza os detalhes de um item específico pelo índice.
 */
export function getItemDetails(
  items: InventoryItem[],
  index: number
): InventoryItem | null {
  if (index < 0 || index >= items.length) return null;
  return items[index];
}

/**
 * Calcula o peso total do inventário.
 */
export function getTotalWeight(items: InventoryItem[]): number {
  return items.reduce((total, item) => total + item.weight * item.quantity, 0);
}

/**
 * Calcula o valor total do inventário.
 */
export function getTotalValue(items: InventoryItem[]): number {
  return items.reduce((total, item) => total + item.value * item.quantity, 0);
}

/**
 * Retorna o rótulo de exibição para cada critério de ordenação.
 */
export function getSortLabel(criteria: SortCriteria): string {
  const labels: Record<SortCriteria, string> = {
    peso: 'Por Peso',
    raridade: 'Por Raridade',
    valor: 'Por Valor',
    nome: 'Por Nome',
    quantidade: 'Por Qtd',
  };
  return labels[criteria];
}

/**
 * Retorna a cor associada à raridade do item.
 */
export function getRarityColor(rarity: ItemRarity): string {
  const colors: Record<ItemRarity, string> = {
    'comum': '#9E9E9E',
    'incomum': '#4CAF50',
    'raro': '#42A5F5',
    'épico': '#AB47BC',
    'lendário': '#FFD700',
  };
  return colors[rarity];
}
