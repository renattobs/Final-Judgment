// ============================================================
// DESIGN: Gritty Wasteland Noir — dados do mapa
// Estrutura de dados: array 2D (grade do mapa)
// ============================================================

import { TileType, Tile, Material, MaterialType, InventoryItem, ItemRarity } from './types';
import { nanoid } from 'nanoid';

// Definição visual de cada tipo de tile (tema sci-fi alienígena)
export const TILE_DEFS: Record<TileType, Tile> = {
  floor:      { type: 'floor',     walkable: true,  color: '#1a1a2e', borderColor: '#0f0f1e' },
  road:       { type: 'road',      walkable: true,  color: '#16213e', borderColor: '#0f1420' },
  metal:      { type: 'metal',     walkable: true,  color: '#2a2a3e', borderColor: '#1a1a2e' },
  wall:       { type: 'wall',      walkable: false, color: '#3d3d5c', borderColor: '#2a2a3e' },
  rubble:     { type: 'rubble',    walkable: false, color: '#4a4a6a', borderColor: '#3a3a5a' },
  debris:     { type: 'debris',    walkable: false, color: '#5a5a7a', borderColor: '#4a4a6a' },
  building:   { type: 'building',  walkable: false, color: '#2e2e4e', borderColor: '#1e1e3e' },
  barrier:    { type: 'barrier',   walkable: false, color: '#6a3a2a', borderColor: '#4a2a1a' },
  door:       { type: 'door',      walkable: true,  color: '#3a6a9a', borderColor: '#2a5a8a' },
  boss_zone:  { type: 'boss_zone', walkable: true,  color: '#2a0a1a', borderColor: '#5a1a2a' },
};

// Mapa 40×30 tiles — layout pós-apocalíptico
// Legenda: 0=floor, 1=wall, 2=rubble, 3=water, 4=grass, 5=road, 6=building, 7=fence, 8=door, 9=boss_zone
const RAW_MAP: number[][] = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,4,4,4,4,4,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,4,4,4,4,4,1],
  [1,4,6,6,6,4,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,5,4,6,6,6,4,1],
  [1,4,6,0,6,4,5,0,4,4,4,4,4,4,4,0,0,0,4,4,4,4,4,0,0,0,4,4,4,4,4,4,0,5,4,6,0,6,4,1],
  [1,4,8,0,8,4,5,0,4,2,2,2,2,4,4,0,0,0,4,0,0,0,4,0,0,0,4,0,0,0,0,4,0,5,4,8,0,8,4,1],
  [1,4,6,0,6,4,5,0,4,2,0,0,2,4,4,0,0,0,4,0,0,0,4,0,0,0,4,0,0,0,0,4,0,5,4,6,0,6,4,1],
  [1,4,6,6,6,4,5,0,4,2,0,0,2,4,4,0,0,0,4,0,0,0,8,0,0,0,4,0,0,0,0,4,0,5,4,6,6,6,4,1],
  [1,4,4,4,4,4,5,0,4,2,2,2,2,4,4,0,0,0,4,4,4,4,4,0,0,0,4,4,4,4,4,4,0,5,4,4,4,4,4,1],
  [1,5,5,5,5,5,5,0,4,4,4,4,4,4,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,5,5,5,5,5,5,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,7,7,7,7,7,7,0,0,0,0,0,0,0,3,3,3,3,3,3,0,0,0,0,0,0,0,7,7,7,7,7,7,0,0,0,0,0,1],
  [1,0,7,0,0,0,0,7,0,0,0,0,0,0,3,3,3,3,3,3,3,3,0,0,0,0,0,0,7,0,0,0,0,7,0,0,0,0,0,1],
  [1,0,7,0,4,4,0,7,0,0,0,0,0,3,3,3,3,3,3,3,3,3,3,0,0,0,0,0,7,0,4,4,0,7,0,0,0,0,0,1],
  [1,0,7,0,4,4,0,7,0,0,0,0,3,3,3,0,0,0,0,0,3,3,3,3,0,0,0,0,7,0,4,4,0,7,0,0,0,0,0,1],
  [1,0,7,0,0,0,0,7,0,0,0,0,3,3,0,0,0,0,0,0,0,3,3,3,0,0,0,0,7,0,0,0,0,7,0,0,0,0,0,1],
  [1,0,7,7,7,7,7,7,0,0,0,0,3,3,0,0,0,0,0,0,0,3,3,3,0,0,0,0,7,7,7,7,7,7,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,3,3,3,0,0,0,0,0,3,3,3,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,3,3,3,3,3,3,3,3,3,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,2,2,2,0,0,0,0,0,0,0,3,3,3,3,3,3,3,3,0,0,0,0,0,0,0,2,2,2,0,0,0,0,0,0,0,1],
  [1,0,0,0,2,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,2,0,0,0,0,0,0,0,1],
  [1,0,0,0,2,2,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,2,2,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,9,9,9,9,9,9,9,9,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,9,9,9,9,9,9,9,9,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,9,9,9,9,9,9,9,9,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,9,9,9,9,9,9,9,9,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

const TILE_MAP: Record<number, TileType> = {
  0: 'floor', 1: 'wall', 2: 'rubble', 3: 'debris',
  4: 'metal', 5: 'road', 6: 'building', 7: 'barrier',
  8: 'door', 9: 'boss_zone',
};

export function buildMap(): TileType[][] {
  return RAW_MAP.map(row => row.map(n => TILE_MAP[n]));
}

export const MAP_WIDTH = 40;
export const MAP_HEIGHT = 30;
export const TILE_SIZE = 40;

// Posições de spawn de materiais
const MATERIAL_CONFIGS: Array<{ type: MaterialType; x: number; y: number }> = [
  // Cristais de Energia (azul violeta)
  { type: 'cristal', x: 3, y: 3 }, { type: 'cristal', x: 12, y: 12 }, { type: 'cristal', x: 28, y: 14 },
  { type: 'cristal', x: 8, y: 22 }, { type: 'cristal', x: 35, y: 9 }, { type: 'cristal', x: 20, y: 22 },
  // Tecnologia Alienígena (ciano)
  { type: 'tecnologia', x: 5, y: 5 }, { type: 'tecnologia', x: 19, y: 3 }, { type: 'tecnologia', x: 32, y: 5 },
  { type: 'tecnologia', x: 10, y: 20 }, { type: 'tecnologia', x: 30, y: 20 }, { type: 'tecnologia', x: 25, y: 9 },
  // Material Biológico (verde)
  { type: 'biotico', x: 2, y: 9 }, { type: 'biotico', x: 15, y: 8 }, { type: 'biotico', x: 36, y: 15 },
  { type: 'biotico', x: 7, y: 16 }, { type: 'biotico', x: 33, y: 22 }, { type: 'biotico', x: 22, y: 27 },
  // Núcleos de Energia (vermelho)
  { type: 'nucleo', x: 9, y: 3 }, { type: 'nucleo', x: 30, y: 3 }, { type: 'nucleo', x: 6, y: 25 },
  { type: 'nucleo', x: 37, y: 25 }, { type: 'nucleo', x: 20, y: 9 },
  // Metal Extraterrestre (laranja)
  { type: 'metal', x: 4, y: 19 }, { type: 'metal', x: 29, y: 19 }, { type: 'metal', x: 14, y: 22 },
  { type: 'metal', x: 26, y: 22 }, { type: 'metal', x: 38, y: 8 },
  // Energia Bruta (amarelo)
  { type: 'energia', x: 1, y: 15 }, { type: 'energia', x: 38, y: 15 }, { type: 'energia', x: 20, y: 27 },
];

const MATERIAL_COLORS: Record<MaterialType, string> = {
  cristal:    '#9C27B0',
  tecnologia: '#00BCD4',
  biotico:   '#4CAF50',
  nucleo:    '#F44336',
  metal:     '#FF9800',
  energia:   '#FFEB3B',
};

const MATERIAL_ICONS: Record<MaterialType, string> = {
  cristal:    '💠',
  tecnologia: '🔷',
  biotico:   '🧬',
  nucleo:    '⚛️',
  metal:     '🔩',
  energia:   '⚡',
};

const MATERIAL_NAMES: Record<MaterialType, string> = {
  cristal:    'Cristal de Energia',
  tecnologia: 'Tecnologia Alienígena',
  biotico:   'Material Biológico',
  nucleo:    'Núcleo de Energia',
  metal:     'Metal Extraterrestre',
  energia:   'Energia Bruta',
};

export function buildMaterials(): Material[] {
  return MATERIAL_CONFIGS.map(cfg => ({
    id: nanoid(),
    type: cfg.type,
    name: MATERIAL_NAMES[cfg.type],
    color: MATERIAL_COLORS[cfg.type],
    icon: MATERIAL_ICONS[cfg.type],
    x: cfg.x,
    y: cfg.y,
    collected: false,
  }));
}

// ============================================================
// DEFINIÇÕES DE ITENS DO INVENTÁRIO
// Cada item possui: Nome, Peso, Raridade, Valor, Descrição
// ============================================================

export interface ItemDefinition {
  name: string;
  weight: number;
  rarity: ItemRarity;
  value: number;
  description: string;
  icon: string;
  color: string;
  materialType: MaterialType;
  collectMessage: string; // Mensagem exibida ao coletar
}

export const ITEM_DEFINITIONS: Record<MaterialType, ItemDefinition> = {
  cristal: {
    name: 'Carta Flamejante',
    weight: 0.1,
    rarity: 'raro',
    value: 150,
    description: 'Um cristal pulsante que contém energia de fogo alienígena. Pode ser usado para amplificar cartas de ataque.',
    icon: '💠',
    color: '#9C27B0',
    materialType: 'cristal',
    collectMessage: 'Você encontrou a Carta Flamejante!',
  },
  tecnologia: {
    name: 'Fragmento de Energia',
    weight: 0.3,
    rarity: 'incomum',
    value: 80,
    description: 'Tecnologia alienígena avançada. Fragmento de um dispositivo desconhecido que emite pulsos de energia.',
    icon: '🔷',
    color: '#00BCD4',
    materialType: 'tecnologia',
    collectMessage: 'Item coletado: Fragmento de Energia.',
  },
  biotico: {
    name: 'Essência Biológica',
    weight: 0.2,
    rarity: 'comum',
    value: 40,
    description: 'Material orgânico extraterrestre com propriedades regenerativas. Utilizado em síntese de curas.',
    icon: '🧬',
    color: '#4CAF50',
    materialType: 'biotico',
    collectMessage: 'Item coletado: Essência Biológica.',
  },
  nucleo: {
    name: 'Núcleo Cósmico',
    weight: 1.5,
    rarity: 'épico',
    value: 300,
    description: 'O coração energético de uma nave alienígena. Extremamente valioso e perigoso de manusear.',
    icon: '⚛️',
    color: '#F44336',
    materialType: 'nucleo',
    collectMessage: 'Você encontrou o Núcleo Cósmico!',
  },
  metal: {
    name: 'Liga Extraterrestre',
    weight: 2.0,
    rarity: 'incomum',
    value: 90,
    description: 'Metal de origem desconhecida, mais resistente que qualquer liga terrestre. Ideal para armaduras.',
    icon: '🔩',
    color: '#FF9800',
    materialType: 'metal',
    collectMessage: 'Item coletado: Liga Extraterrestre.',
  },
  energia: {
    name: 'Cristal de Plasma',
    weight: 0.05,
    rarity: 'lendário',
    value: 500,
    description: 'Um cristal de plasma puro de origem cósmica. Lendário entre os caçadores de relíquias alienígenas.',
    icon: '⚡',
    color: '#FFEB3B',
    materialType: 'energia',
    collectMessage: 'Você encontrou o Cristal de Plasma! Item LENDÁRIO!',
  },
};
