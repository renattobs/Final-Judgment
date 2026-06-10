// ============================================================
// DESIGN: Gritty Wasteland Noir — motor do jogo
// Separação: entidades (types), sistemas (engine), dados (mapData/cards/npcs/enemies)
// ============================================================

import {
  GameState, Player, Vec2, TileType, MaterialType,
  BattleState, Enemy, Card, GameScreen, SortOrder,
} from './types';
import { buildMap, buildMaterials, MAP_WIDTH, MAP_HEIGHT, TILE_SIZE, TILE_DEFS } from './mapData';
import { buildNPCs } from './npcs';
import { buildEnemies } from './enemies';
import { buildPlayerDeck, shuffleDeck } from './cards';
import { findPath } from './pathfinder';
import { nanoid } from 'nanoid';

// ---- Inicialização ----

export function initGameState(): GameState {
  const deck = shuffleDeck(buildPlayerDeck());
  const player: Player = {
    x: 5, y: 9,
    hp: 80, maxHp: 80,
    speed: 0.12,
    facing: 'down',
    isMoving: false,
    energy: 3, maxEnergy: 3,
    block: 0,
    cards: [...deck],
    deck: [...deck],
    hand: [],
    discard: [],
  };

  const inventory: Map<MaterialType, number> = new Map([
    ['cristal', 0], ['tecnologia', 0], ['biotico', 0],
    ['nucleo', 0], ['metal', 0], ['energia', 0],
  ]);

  const battle: BattleState = {
    phase: 'none',
    enemy: null,
    turn: 0,
    log: [],
    selectedCardIndex: null,
    animating: false,
    animationTarget: null,
    animationTimer: 0,
    playerShake: false,
    enemyShake: false,
    floatingTexts: [],
  };

  return {
    screen: 'title',
    player,
    inventory,
    sortOrder: 'type',
    materials: buildMaterials(),
    npcs: buildNPCs(),
    enemies: buildEnemies(),
    map: buildMap(),
    mapWidth: MAP_WIDTH,
    mapHeight: MAP_HEIGHT,
    tileSize: TILE_SIZE,
    camera: { x: 0, y: 0 },
    activeDialog: null,
    battle,
    path: [],
    pathTarget: null,
    showInventory: false,
    showPath: true,
    bossDefeated: false,
    gameTime: 0,
    keys: new Set(),
  };
}

// ---- Helpers de Tile ----

export function isWalkableTile(map: TileType[][], tx: number, ty: number): boolean {
  if (ty < 0 || ty >= map.length || tx < 0 || tx >= map[0].length) return false;
  return TILE_DEFS[map[ty][tx]].walkable;
}

export function worldToTile(wx: number, wy: number): Vec2 {
  return { x: Math.floor(wx), y: Math.floor(wy) };
}

// ---- Movimentação do Player ----

export function updatePlayer(state: GameState, dt: number): void {
  if (state.screen !== 'game') return;
  if (state.activeDialog) return;

  const { player, keys, map } = state;
  let dx = 0, dy = 0;

  if (keys.has('ArrowUp') || keys.has('w') || keys.has('W')) { dy = -1; player.facing = 'up'; }
  if (keys.has('ArrowDown') || keys.has('s') || keys.has('S')) { dy = 1; player.facing = 'down'; }
  if (keys.has('ArrowLeft') || keys.has('a') || keys.has('A')) { dx = -1; player.facing = 'left'; }
  if (keys.has('ArrowRight') || keys.has('d') || keys.has('D')) { dx = 1; player.facing = 'right'; }

  const isKeyMoving = dx !== 0 || dy !== 0;

  // Pathfinding por clique
  if (!isKeyMoving && state.path.length > 0) {
    const target = state.path[0];
    const tdx = target.x - player.x;
    const tdy = target.y - player.y;
    const dist = Math.sqrt(tdx * tdx + tdy * tdy);
    if (dist < 0.15) {
      state.path.shift();
    } else {
      dx = tdx / dist;
      dy = tdy / dist;
    }
  } else if (isKeyMoving) {
    // Tecla cancela pathfinding
    state.path = [];
    state.pathTarget = null;
  }

  if (dx !== 0 || dy !== 0) {
    const len = Math.sqrt(dx * dx + dy * dy);
    dx = (dx / len) * player.speed;
    dy = (dy / len) * player.speed;

    const nx = player.x + dx;
    const ny = player.y + dy;
    const tile = worldToTile(nx, ny);

    // Colisão com tiles
    if (isWalkableTile(map, tile.x, tile.y)) {
      player.x = nx;
      player.y = ny;
    } else if (isWalkableTile(map, worldToTile(nx, player.y).x, worldToTile(nx, player.y).y)) {
      player.x = nx;
    } else if (isWalkableTile(map, worldToTile(player.x, ny).x, worldToTile(player.x, ny).y)) {
      player.y = ny;
    }

    player.isMoving = true;
  } else {
    player.isMoving = false;
  }

  // Limitar dentro do mapa
  player.x = Math.max(0.5, Math.min(MAP_WIDTH - 1.5, player.x));
  player.y = Math.max(0.5, Math.min(MAP_HEIGHT - 1.5, player.y));

  // Câmera segue o player
  updateCamera(state);
}

function updateCamera(state: GameState): void {
  const { player, tileSize } = state;
  // A câmera é em pixels
  const canvasW = 900;
  const canvasH = 600;
  state.camera.x = player.x * tileSize - canvasW / 2;
  state.camera.y = player.y * tileSize - canvasH / 2;
  // Limitar câmera
  state.camera.x = Math.max(0, Math.min(MAP_WIDTH * tileSize - canvasW, state.camera.x));
  state.camera.y = Math.max(0, Math.min(MAP_HEIGHT * tileSize - canvasH, state.camera.y));
}

// ---- Coleta de Materiais ----

export function checkMaterialCollection(state: GameState): string | null {
  const { player, materials, inventory } = state;
  const COLLECT_RADIUS = 0.8;

  for (const mat of materials) {
    if (mat.collected) continue;
    const dx = mat.x + 0.5 - player.x;
    const dy = mat.y + 0.5 - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < COLLECT_RADIUS) {
      mat.collected = true;
      const current = inventory.get(mat.type) ?? 0;
      inventory.set(mat.type, current + 1);
      return `+1 ${mat.name}`;
    }
  }
  return null;
}

// ---- Ordenação do Inventário ----

export function getSortedInventory(
  inventory: Map<MaterialType, number>,
  order: SortOrder
): Array<{ type: MaterialType; amount: number }> {
  const entries = Array.from(inventory.entries()).map(([type, amount]) => ({ type, amount }));

  switch (order) {
    case 'name':
      return entries.sort((a, b) => a.type.localeCompare(b.type));
    case 'quantity':
      return entries.sort((a, b) => b.amount - a.amount);
    case 'type':
    default:
      const typeOrder: MaterialType[] = ['cristal', 'tecnologia', 'biotico', 'nucleo', 'metal', 'energia'];
      return entries.sort((a, b) => typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type));
  }
}

// ---- IA de Inimigos ----

export function updateEnemies(state: GameState, dt: number): void {
  if (state.screen !== 'game') return;
  if (state.activeDialog) return;

  const { player, enemies, map } = state;
  const DETECT_RADIUS = 5;
  const BATTLE_RADIUS = 1.2;

  for (const enemy of enemies) {
    if (enemy.state === 'dead') continue;
    if (enemy.state === 'battle') continue;

    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Detectar player
    if (dist < DETECT_RADIUS) {
      enemy.state = 'chase';
    } else if (enemy.state === 'chase' && dist > DETECT_RADIUS * 1.5) {
      enemy.state = 'patrol';
    }

    // Iniciar batalha
    if (dist < BATTLE_RADIUS && enemy.state === 'chase') {
      startBattle(state, enemy);
      return;
    }

    if (enemy.state === 'patrol') {
      updateEnemyPatrol(enemy, dt);
    } else if (enemy.state === 'chase') {
      updateEnemyChase(enemy, player, map, dt);
    }
  }
}

function updateEnemyPatrol(enemy: Enemy, dt: number): void {
  if (enemy.patrolPath.length === 0) return;
  const target = enemy.patrolPath[enemy.patrolIndex];
  const dx = target.x + 0.5 - enemy.x;
  const dy = target.y + 0.5 - enemy.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist < 0.15) {
    enemy.patrolIndex = (enemy.patrolIndex + 1) % enemy.patrolPath.length;
  } else {
    enemy.x += (dx / dist) * enemy.speed;
    enemy.y += (dy / dist) * enemy.speed;
  }
}

function updateEnemyChase(enemy: Enemy, player: Player, map: TileType[][], dt: number): void {
  const dx = player.x - enemy.x;
  const dy = player.y - enemy.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist < 0.1) return;

  const nx = enemy.x + (dx / dist) * enemy.speed;
  const ny = enemy.y + (dy / dist) * enemy.speed;
  const tile = worldToTile(nx, ny);

  if (isWalkableTile(map, tile.x, tile.y)) {
    enemy.x = nx;
    enemy.y = ny;
  }
}

// ---- Sistema de Batalha ----

export function startBattle(state: GameState, enemy: Enemy): void {
  enemy.state = 'battle';
  state.screen = 'battle';

  // Preparar baralho do player
  const player = state.player;
  player.deck = shuffleDeck([...player.cards]);
  player.hand = [];
  player.discard = [];
  player.block = 0;

  // Preparar baralho do inimigo
  enemy.deck = shuffleDeck([...enemy.cards]);
  enemy.hand = [];
  enemy.discard = [];
  enemy.block = 0;

  state.battle = {
    phase: 'player_turn',
    enemy,
    turn: 1,
    log: [`Batalha iniciada contra ${enemy.name}!`],
    selectedCardIndex: null,
    animating: false,
    animationTarget: null,
    animationTimer: 0,
    playerShake: false,
    enemyShake: false,
    floatingTexts: [],
  };

  // Comprar mão inicial (5 cartas)
  drawCards(state, 5);

  // Inimigo prepara intenção
  state.battle.enemy!.intentIndex = 0;
}

export function drawCards(state: GameState, count: number): void {
  const player = state.player;
  for (let i = 0; i < count; i++) {
    if (player.deck.length === 0) {
      // Reembaralhar descarte
      player.deck = shuffleDeck([...player.discard]);
      player.discard = [];
    }
    if (player.deck.length > 0) {
      player.hand.push(player.deck.shift()!);
    }
  }
}

export function playCard(state: GameState, cardIndex: number): boolean {
  const { battle, player } = state;
  if (battle.phase !== 'player_turn') return false;
  if (cardIndex < 0 || cardIndex >= player.hand.length) return false;

  const card = player.hand[cardIndex];
  if (card.cost > player.energy) {
    addBattleLog(state, 'Energia insuficiente!');
    return false;
  }

  player.energy -= card.cost;
  player.hand.splice(cardIndex, 1);

  // Aplicar efeitos
  let doubleDamage = false;
  for (const effect of card.effects) {
    if (effect.type === 'double_damage') { doubleDamage = true; continue; }
    applyCardEffect(state, effect, doubleDamage);
  }

  if (card.exhaust) {
    // Carta exausta — não vai para o descarte
    addBattleLog(state, `${card.name} foi exausta!`);
  } else {
    player.discard.push(card);
  }

  addBattleLog(state, `Jogou: ${card.name}`);
  battle.animating = true;
  battle.animationTarget = card.effects.some(e => e.target === 'enemy') ? 'enemy' : 'player';
  battle.animationTimer = 300;

  // Verificar vitória
  if (battle.enemy && battle.enemy.hp <= 0) {
    endBattle(state, 'victory');
  }

  return true;
}

function applyCardEffect(state: GameState, effect: { type: string; value: number; target: string }, doubleDamage: boolean): void {
  const { battle, player } = state;
  const enemy = battle.enemy!;
  const mult = doubleDamage && effect.type === 'damage' ? 2 : 1;

  switch (effect.type) {
    case 'damage': {
      let dmg = effect.value * mult;
      // Aplicar enfraquecimento
      if ((player as any).weakened) dmg = Math.floor(dmg * 0.75);
      const absorbed = Math.min(enemy.block, dmg);
      enemy.block = Math.max(0, enemy.block - dmg);
      const realDmg = Math.max(0, dmg - absorbed);
      enemy.hp = Math.max(0, enemy.hp - realDmg);
      addFloatingText(state, `-${realDmg}`, 'enemy', '#e74c3c');
      if (absorbed > 0) addFloatingText(state, `🛡️${absorbed}`, 'enemy', '#3498db');
      battle.enemyShake = true;
      setTimeout(() => { if (state.battle) state.battle.enemyShake = false; }, 300);
      break;
    }
    case 'block':
      player.block += effect.value;
      addFloatingText(state, `+${effect.value}🛡️`, 'player', '#3498db');
      break;
    case 'heal':
      player.hp = Math.min(player.maxHp, player.hp + effect.value);
      addFloatingText(state, `+${effect.value}❤️`, 'player', '#27ae60');
      break;
    case 'draw':
      drawCards(state, effect.value);
      addBattleLog(state, `Comprou ${effect.value} carta(s).`);
      break;
    case 'energy':
      player.energy = Math.min(player.maxEnergy + effect.value, player.maxEnergy + 3);
      addFloatingText(state, `+${effect.value}⚡`, 'player', '#f39c12');
      break;
    case 'poison':
      (enemy as any).poisoned = ((enemy as any).poisoned || 0) + effect.value;
      addFloatingText(state, `☠️+${effect.value}`, 'enemy', '#8e44ad');
      break;
    case 'weaken':
      (enemy as any).weakened = ((enemy as any).weakened || 0) + effect.value;
      addFloatingText(state, `⬇️Fraco`, 'enemy', '#e67e22');
      break;
    case 'strengthen':
      (player as any).strengthened = ((player as any).strengthened || 0) + effect.value;
      addFloatingText(state, `⬆️Forte`, 'player', '#f39c12');
      break;
    case 'burn':
      (enemy as any).burning = ((enemy as any).burning || 0) + effect.value;
      addFloatingText(state, `🔥+${effect.value}`, 'enemy', '#e74c3c');
      break;
  }
}

function addFloatingText(state: GameState, text: string, target: 'player' | 'enemy', color: string): void {
  const x = target === 'player' ? 200 : 650;
  const y = 250;
  state.battle.floatingTexts.push({
    id: nanoid(),
    text,
    x: x + (Math.random() - 0.5) * 60,
    y: y + (Math.random() - 0.5) * 40,
    color,
    opacity: 1,
    vy: -1.5,
    timer: 80,
  });
}

export function addBattleLog(state: GameState, msg: string): void {
  state.battle.log.unshift(msg);
  if (state.battle.log.length > 8) state.battle.log.pop();
}

export function endPlayerTurn(state: GameState): void {
  const { battle, player } = state;
  if (battle.phase !== 'player_turn') return;

  // Descartar mão
  player.discard.push(...player.hand);
  player.hand = [];
  player.block = 0;

  battle.phase = 'enemy_turn';
  addBattleLog(state, '--- Turno do Inimigo ---');

  // Executar turno do inimigo após delay
  setTimeout(() => executeEnemyTurn(state), 800);
}

function executeEnemyTurn(state: GameState): void {
  const { battle, player } = state;
  if (!battle.enemy || battle.phase !== 'enemy_turn') return;

  const enemy = battle.enemy;
  const intent = enemy.intents[enemy.intentIndex % enemy.intents.length];

  // Aplicar veneno
  if ((enemy as any).poisoned > 0) {
    const poison = (enemy as any).poisoned;
    enemy.hp = Math.max(0, enemy.hp - poison);
    (enemy as any).poisoned = Math.max(0, poison - 1);
    addBattleLog(state, `${enemy.name} sofreu ${poison} de veneno!`);
    addFloatingText(state, `-${poison}☠️`, 'enemy', '#8e44ad');
  }

  if (enemy.hp <= 0) {
    endBattle(state, 'victory');
    return;
  }

  // Executar intenção
  switch (intent.type) {
    case 'attack': {
      let dmg = intent.value;
      if ((enemy as any).weakened) {
        dmg = Math.floor(dmg * 0.75);
        (enemy as any).weakened = Math.max(0, (enemy as any).weakened - 1);
      }
      const absorbed = Math.min(player.block, dmg);
      player.block = Math.max(0, player.block - dmg);
      const realDmg = Math.max(0, dmg - absorbed);
      player.hp = Math.max(0, player.hp - realDmg);
      addBattleLog(state, `${enemy.name}: ${intent.description} — ${realDmg} dano!`);
      addFloatingText(state, `-${realDmg}`, 'player', '#e74c3c');
      battle.playerShake = true;
      setTimeout(() => { if (state.battle) state.battle.playerShake = false; }, 300);
      break;
    }
    case 'defend':
      enemy.block += intent.value;
      addBattleLog(state, `${enemy.name}: ${intent.description}`);
      addFloatingText(state, `+${intent.value}🛡️`, 'enemy', '#3498db');
      break;
    case 'special':
      enemy.hp = Math.min(enemy.maxHp, enemy.hp + intent.value);
      addBattleLog(state, `${enemy.name}: ${intent.description}`);
      addFloatingText(state, `+${intent.value}❤️`, 'enemy', '#27ae60');
      break;
    case 'buff':
      addBattleLog(state, `${enemy.name}: ${intent.description}`);
      break;
  }

  enemy.intentIndex = (enemy.intentIndex + 1) % enemy.intents.length;

  // Verificar derrota
  if (player.hp <= 0) {
    endBattle(state, 'defeat');
    return;
  }

  // Iniciar turno do player
  setTimeout(() => {
    if (state.battle.phase !== 'enemy_turn') return;
    battle.phase = 'player_turn';
    battle.turn++;
    player.energy = player.maxEnergy;
    player.block = 0;
    drawCards(state, 5);
    addBattleLog(state, `--- Turno ${battle.turn} ---`);
  }, 600);
}

function endBattle(state: GameState, result: 'victory' | 'defeat'): void {
  const { battle } = state;
  battle.phase = result;

  if (result === 'victory' && battle.enemy) {
    battle.enemy.state = 'dead';
    addBattleLog(state, `Vitória! ${battle.enemy.name} foi derrotado!`);

    if (battle.enemy.isBoss) {
      state.bossDefeated = true;
    }

    // Recompensa: adicionar carta ao baralho
    const rewardCards = [
      { name: 'Bomba de Prego', type: 'attack' as const, rarity: 'uncommon' as const, cost: 2, description: 'Causa 14 de dano.', effects: [{ type: 'damage' as const, value: 14, target: 'enemy' as const }], color: '#e74c3c' },
      { name: 'Bunker Improvisado', type: 'skill' as const, rarity: 'uncommon' as const, cost: 2, description: 'Ganha 12 de Bloqueio.', effects: [{ type: 'block' as const, value: 12, target: 'self' as const }], color: '#2980b9' },
      { name: 'Explosão Tóxica', type: 'attack' as const, rarity: 'uncommon' as const, cost: 2, description: 'Causa 10 de dano. Aplica 3 de Veneno.', effects: [{ type: 'damage' as const, value: 10, target: 'enemy' as const }, { type: 'poison' as const, value: 3, target: 'enemy' as const }], color: '#8e44ad' },
    ];
    const reward = rewardCards[Math.floor(Math.random() * rewardCards.length)];
    state.player.cards.push({ ...reward, id: nanoid() });

    setTimeout(() => {
      state.screen = 'game';
      state.battle.phase = 'none';
      state.battle.enemy = null;
      state.player.hand = [];
      state.player.discard = [];
      state.player.block = 0;
    }, 2000);
  } else if (result === 'defeat') {
    addBattleLog(state, 'Você foi derrotado...');
    setTimeout(() => {
      state.screen = 'gameover';
    }, 2000);
  }
}

// ---- Pathfinding por Clique ----

export function handleMapClick(state: GameState, canvasX: number, canvasY: number): void {
  if (state.screen !== 'game') return;
  if (state.activeDialog) return;

  const worldX = (canvasX + state.camera.x) / state.tileSize;
  const worldY = (canvasY + state.camera.y) / state.tileSize;
  const tileX = Math.floor(worldX);
  const tileY = Math.floor(worldY);

  if (!isWalkableTile(state.map, tileX, tileY)) return;

  const startTile = worldToTile(state.player.x, state.player.y);
  const path = findPath(state.map, startTile, { x: tileX, y: tileY });

  if (path.length > 0) {
    // Converter tiles para posições centrais
    state.path = path.slice(1).map(p => ({ x: p.x + 0.5, y: p.y + 0.5 }));
    state.pathTarget = { x: tileX, y: tileY };
  }
}

// ---- Interação com NPCs ----

export function checkNPCInteraction(state: GameState): void {
  if (state.screen !== 'game') return;
  if (state.activeDialog) return;

  const { player, npcs } = state;
  const INTERACT_RADIUS = 1.5;

  for (const npc of npcs) {
    const dx = npc.x + 0.5 - player.x;
    const dy = npc.y + 0.5 - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < INTERACT_RADIUS) {
      state.activeDialog = { npc, nodeId: npc.dialogTree.rootId };
      return;
    }
  }
}

export function advanceDialog(state: GameState, optionIndex: number): void {
  if (!state.activeDialog) return;

  const { npc, nodeId } = state.activeDialog;
  const node = npc.dialogTree.nodes.get(nodeId);
  if (!node) { state.activeDialog = null; return; }

  const option = node.options[optionIndex];
  if (!option) return;

  // Executar ação do nó atual se houver
  if (node.action) {
    executeDialogAction(state, node.action);
  }

  if (option.nextNodeId === null) {
    state.activeDialog = null;
    npc.interacted = true;
    return;
  }

  // Executar ação da opção se houver
  if (option.action) {
    executeDialogAction(state, option.action);
  }

  state.activeDialog = { npc, nodeId: option.nextNodeId };

  // Verificar ação do próximo nó
  const nextNode = npc.dialogTree.nodes.get(option.nextNodeId);
  if (nextNode?.action) {
    executeDialogAction(state, nextNode.action);
    // Limpar ação para não executar de novo
    nextNode.action = undefined;
  }
}

function executeDialogAction(state: GameState, action: NonNullable<import('./types').DialogNode['action']>): void {
  switch (action.type) {
    case 'give_item':
      const current = state.inventory.get(action.item) ?? 0;
      state.inventory.set(action.item, current + action.amount);
      break;
    case 'give_card':
      state.player.cards.push({ ...action.card, id: nanoid() });
      break;
    case 'heal':
      state.player.hp = Math.min(state.player.maxHp, state.player.hp + action.amount);
      break;
    case 'end_dialog':
      state.activeDialog = null;
      break;
  }
}

// ---- Atualização de Textos Flutuantes ----

export function updateFloatingTexts(state: GameState): void {
  const texts = state.battle.floatingTexts;
  for (let i = texts.length - 1; i >= 0; i--) {
    const t = texts[i];
    t.y += t.vy;
    t.timer--;
    t.opacity = t.timer / 80;
    if (t.timer <= 0) texts.splice(i, 1);
  }
}

// ---- Notificação de Coleta ----

let lastCollectMsg = '';
let collectMsgTimer = 0;

export function getCollectMessage(): { msg: string; timer: number } {
  return { msg: lastCollectMsg, timer: collectMsgTimer };
}

// ---- Loop Principal ----

export function updateGame(state: GameState, dt: number): void {
  if (state.screen === 'game') {
    updatePlayer(state, dt);
    updateEnemies(state, dt);
    const collected = checkMaterialCollection(state);
    if (collected) {
      lastCollectMsg = collected;
      collectMsgTimer = 120;
    }
    if (collectMsgTimer > 0) collectMsgTimer--;
    state.gameTime += dt;
  }
  // Verificar vitória total
  if (state.bossDefeated && state.screen === 'game') {
    // Manter no jogo mas mostrar mensagem de vitória
  }
  if (state.screen === 'battle') {
    updateFloatingTexts(state);
    if (state.battle.animationTimer > 0) {
      state.battle.animationTimer -= dt * 1000;
      if (state.battle.animationTimer <= 0) {
        state.battle.animating = false;
        state.battle.animationTarget = null;
      }
    }
  }
}
