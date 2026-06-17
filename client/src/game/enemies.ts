// ============================================================
// DESIGN: Final Judgment — inimigos alienígenas e boss
// Temática: Invasão extraterrestre, soldados e General
// Boss Final: aparece SOMENTE após todos os inimigos comuns serem derrotados
// ============================================================

import { Enemy, Vec2, EnemyState } from './types';
import { buildEnemyDeck, shuffleDeck } from './cards';
import { nanoid } from 'nanoid';

function makeEnemy(
  name: string,
  x: number,
  y: number,
  hp: number,
  color: string,
  patrolPath: Vec2[],
  isBoss: boolean,
  speed: number = 0.04,
  initialState: EnemyState = 'patrol'
): Enemy {
  const deck = shuffleDeck(buildEnemyDeck(isBoss));
  return {
    id: nanoid(),
    name,
    x,
    y,
    hp,
    maxHp: hp,
    color,
    state: initialState,
    patrolPath,
    patrolIndex: 0,
    speed,
    isBoss,
    cards: [...deck],
    deck: [...deck],
    hand: [],
    discard: [],
    block: 0,
    energy: 3,
    maxEnergy: 3,
    intentIndex: 0,
    intents: isBoss
      ? [
          { type: 'attack', value: 22, description: 'Rajada de Plasma — 22 dano' },
          { type: 'defend', value: 18, description: 'Escudo de Energia — 18 bloqueio' },
          { type: 'attack', value: 16, description: 'Pulso Tóxico — 16 dano + 5 veneno' },
          { type: 'attack', value: 28, description: 'Fúria Cósmica — 28 dano' },
          { type: 'special', value: 25, description: 'Regeneração Alienígena — cura 25 HP' },
          { type: 'attack', value: 12, description: 'Onda de Choque — 12 dano + Enfraquece' },
        ]
      : [
          { type: 'attack', value: 10, description: 'Disparo Plasma — 10 dano' },
          { type: 'defend', value: 7, description: 'Escudo Tático — 7 bloqueio' },
          { type: 'attack', value: 8, description: 'Lâmina de Energia — 8 dano' },
        ],
  };
}

export function buildEnemies(): Enemy[] {
  return [
    // ---- Inimigos Comuns — patrulham o mapa desde o início ----
    makeEnemy('Soldado Alienígena Menor', 9, 9, 40, '#7B2D8B',
      [{ x: 9, y: 9 }, { x: 12, y: 9 }, { x: 12, y: 12 }, { x: 9, y: 12 }], false),
    makeEnemy('Sentinela Cibernético', 25, 9, 45, '#00BCD4',
      [{ x: 25, y: 9 }, { x: 28, y: 9 }, { x: 28, y: 12 }, { x: 25, y: 12 }], false),
    makeEnemy('Drone de Ataque', 5, 18, 30, '#FF9800',
      [{ x: 5, y: 18 }, { x: 8, y: 18 }, { x: 8, y: 21 }, { x: 5, y: 21 }], false),
    makeEnemy('Soldado Elite Alienígena', 30, 18, 50, '#9C27B0',
      [{ x: 30, y: 18 }, { x: 33, y: 18 }, { x: 33, y: 21 }, { x: 30, y: 21 }], false),
    makeEnemy('Criatura Biomodificada', 15, 22, 35, '#4CAF50',
      [{ x: 15, y: 22 }, { x: 18, y: 22 }, { x: 18, y: 25 }, { x: 15, y: 25 }], false),
    makeEnemy('Guardião do Império', 35, 22, 42, '#F44336',
      [{ x: 35, y: 22 }, { x: 37, y: 22 }, { x: 37, y: 25 }, { x: 35, y: 25 }], false),

    // ---- Boss Final — General do Império ----
    // Estado inicial: 'hidden' — só aparece após todos os inimigos comuns serem derrotados
    makeEnemy('General do Império', 19, 24, 200, '#D32F2F',
      [{ x: 19, y: 24 }, { x: 21, y: 24 }], true, 0.02, 'hidden'),
  ];
}
