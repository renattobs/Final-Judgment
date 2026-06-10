// ============================================================
// DESIGN: Gritty Wasteland Noir — tipos e interfaces do jogo
// Paleta: #1a1a1a / #8B3A1A / #D4A017 / #2d4a1e / #e8e0d0
// ============================================================

export type Vec2 = { x: number; y: number };

export type TileType =
  | 'floor'
  | 'wall'
  | 'rubble'
  | 'debris'
  | 'metal'
  | 'road'
  | 'building'
  | 'barrier'
  | 'door'
  | 'boss_zone';

export interface Tile {
  type: TileType;
  walkable: boolean;
  color: string;
  borderColor?: string;
}

export type MaterialType = 'cristal' | 'tecnologia' | 'biotico' | 'energia' | 'metal' | 'nucleo';

export interface Material {
  id: string;
  type: MaterialType;
  name: string;
  color: string;
  icon: string;
  x: number;
  y: number;
  collected: boolean;
}

// Inventário: Map<MaterialType, quantity>
export type Inventory = Map<MaterialType, number>;

export type SortOrder = 'name' | 'quantity' | 'type';

export interface Player {
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  speed: number;
  facing: 'up' | 'down' | 'left' | 'right';
  isMoving: boolean;
  energy: number;
  maxEnergy: number;
  block: number;
  cards: Card[];
  deck: Card[];
  hand: Card[];
  discard: Card[];
}

// ---- NPC / Diálogos (estrutura de árvore) ----

export interface DialogOption {
  text: string;
  nextNodeId: string | null;
  action?: DialogAction;
}

export interface DialogNode {
  id: string;
  speaker: string;
  text: string;
  options: DialogOption[];
  action?: DialogAction;
}

export type DialogAction =
  | { type: 'give_item'; item: MaterialType; amount: number }
  | { type: 'give_card'; card: Card }
  | { type: 'heal'; amount: number }
  | { type: 'start_battle'; enemyId: string }
  | { type: 'end_dialog' };

export interface DialogTree {
  rootId: string;
  nodes: Map<string, DialogNode>;
}

export interface NPC {
  id: string;
  name: string;
  title: string; // Comandante, Médico, Veterano
  x: number;
  y: number;
  color: string;
  portraitUrl: string;
  dialogTree: DialogTree;
  interacted: boolean;
}

// ---- Inimigos ----

export type EnemyState = 'patrol' | 'chase' | 'battle' | 'dead';

export interface Enemy {
  id: string;
  name: string;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  color: string;
  state: EnemyState;
  patrolPath: Vec2[];
  patrolIndex: number;
  speed: number;
  isBoss: boolean;
  cards: Card[];
  deck: Card[];
  hand: Card[];
  discard: Card[];
  block: number;
  energy: number;
  maxEnergy: number;
  intentIndex: number;
  intents: EnemyIntent[];
}

export interface EnemyIntent {
  type: 'attack' | 'defend' | 'buff' | 'special';
  value: number;
  description: string;
}

// ---- Cartas (estilo Slay the Spire) ----

export type CardType = 'attack' | 'skill' | 'power' | 'curse';
export type CardRarity = 'common' | 'uncommon' | 'rare' | 'boss';

export interface CardEffect {
  type:
    | 'damage'
    | 'block'
    | 'heal'
    | 'draw'
    | 'energy'
    | 'poison'
    | 'burn'
    | 'weaken'
    | 'strengthen'
    | 'double_damage'
    | 'exhaust_all';
  value: number;
  target: 'self' | 'enemy' | 'all_enemies';
}

export interface Card {
  id: string;
  name: string;
  type: CardType;
  rarity: CardRarity;
  cost: number;
  description: string;
  effects: CardEffect[];
  color: string;
  exhaust?: boolean;
}

// ---- Estado de Batalha ----

export type BattlePhase = 'player_turn' | 'enemy_turn' | 'victory' | 'defeat' | 'none';

export interface BattleState {
  phase: BattlePhase;
  enemy: Enemy | null;
  turn: number;
  log: string[];
  selectedCardIndex: number | null;
  animating: boolean;
  animationTarget: 'player' | 'enemy' | null;
  animationTimer: number;
  playerShake: boolean;
  enemyShake: boolean;
  floatingTexts: FloatingText[];
}

export interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  opacity: number;
  vy: number;
  timer: number;
}

// ---- Pathfinding ----

export interface PathNode {
  x: number;
  y: number;
  g: number;
  h: number;
  f: number;
  parent: PathNode | null;
}

// ---- Estado Global do Jogo ----

export type GameScreen = 'title' | 'game' | 'battle' | 'inventory' | 'gameover' | 'victory';

export interface GameState {
  screen: GameScreen;
  player: Player;
  inventory: Inventory;
  sortOrder: SortOrder;
  materials: Material[];
  npcs: NPC[];
  enemies: Enemy[];
  map: TileType[][];
  mapWidth: number;
  mapHeight: number;
  tileSize: number;
  camera: Vec2;
  activeDialog: { npc: NPC; nodeId: string } | null;
  battle: BattleState;
  path: Vec2[];
  pathTarget: Vec2 | null;
  showInventory: boolean;
  showPath: boolean;
  bossDefeated: boolean;
  gameTime: number;
  keys: Set<string>;
}
