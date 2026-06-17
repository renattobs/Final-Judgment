// ============================================================
// DESIGN: Gritty Wasteland Noir — sistema de cartas
// Estilo Slay the Spire: baralho, mão, descarte, exausto
// ============================================================

import { Card, CardEffect } from './types';
import { nanoid } from 'nanoid';

function makeCard(
  name: string,
  type: Card['type'],
  rarity: Card['rarity'],
  cost: number,
  description: string,
  effects: CardEffect[],
  color: string,
  exhaust?: boolean
): Card {
  return { id: nanoid(), name, type, rarity, cost, description, effects, color, exhaust };
}

// ---- Cartas do Player ----
export const PLAYER_CARD_POOL: Card[] = [
  // Ataques comuns
  makeCard('Golpe Enferrujado', 'attack', 'common', 1,
    'Causa 6 de dano.',
    [{ type: 'damage', value: 6, target: 'enemy' }], '#c0392b'),
  makeCard('Rajada de Sucata', 'attack', 'common', 1,
    'Causa 4 de dano. Causa 4 de dano novamente.',
    [{ type: 'damage', value: 4, target: 'enemy' }, { type: 'damage', value: 4, target: 'enemy' }], '#e74c3c'),
  makeCard('Faca Improvisada', 'attack', 'common', 1,
    'Causa 8 de dano.',
    [{ type: 'damage', value: 8, target: 'enemy' }], '#c0392b'),
  makeCard('Bomba de Prego', 'attack', 'uncommon', 2,
    'Causa 14 de dano.',
    [{ type: 'damage', value: 14, target: 'enemy' }], '#e74c3c'),
  makeCard('Explosão Tóxica', 'attack', 'uncommon', 2,
    'Causa 10 de dano. Aplica 3 de Veneno.',
    [{ type: 'damage', value: 10, target: 'enemy' }, { type: 'poison', value: 3, target: 'enemy' }], '#8e44ad'),
  makeCard('Chuva de Balas', 'attack', 'rare', 2,
    'Causa 5 de dano três vezes.',
    [{ type: 'damage', value: 5, target: 'enemy' }, { type: 'damage', value: 5, target: 'enemy' }, { type: 'damage', value: 5, target: 'enemy' }], '#e74c3c'),
  makeCard('Golpe Devastador', 'attack', 'rare', 3,
    'Causa 30 de dano. Exausto.',
    [{ type: 'damage', value: 30, target: 'enemy' }], '#c0392b', true),

  // Habilidades comuns
  makeCard('Escudo de Ferro-Velho', 'skill', 'common', 1,
    'Ganha 5 de Bloqueio.',
    [{ type: 'block', value: 5, target: 'self' }], '#2980b9'),
  makeCard('Bandagem de Campo', 'skill', 'common', 1,
    'Recupera 4 de HP.',
    [{ type: 'heal', value: 4, target: 'self' }], '#27ae60'),
  makeCard('Adrenalina', 'skill', 'uncommon', 0,
    'Compra 2 cartas. Exausto.',
    [{ type: 'draw', value: 2, target: 'self' }], '#f39c12', true),
  makeCard('Bunker Improvisado', 'skill', 'uncommon', 2,
    'Ganha 12 de Bloqueio.',
    [{ type: 'block', value: 12, target: 'self' }], '#2980b9'),
  makeCard('Kit Médico', 'skill', 'uncommon', 2,
    'Recupera 10 de HP. Exausto.',
    [{ type: 'heal', value: 10, target: 'self' }], '#27ae60', true),
  makeCard('Recarga Rápida', 'skill', 'rare', 1,
    'Ganha +2 de Energia neste turno.',
    [{ type: 'energy', value: 2, target: 'self' }], '#f39c12'),
  makeCard('Fortaleza Tóxica', 'skill', 'rare', 2,
    'Ganha 8 de Bloqueio. Aplica 2 de Veneno ao inimigo.',
    [{ type: 'block', value: 8, target: 'self' }, { type: 'poison', value: 2, target: 'enemy' }], '#8e44ad'),

  // Poderes
  makeCard('Fúria do Sobrevivente', 'power', 'uncommon', 1,
    'Cada vez que atacar, causa +2 de dano extra.',
    [{ type: 'strengthen', value: 2, target: 'self' }], '#d35400'),
  makeCard('Armadura Reforçada', 'power', 'uncommon', 2,
    'No início de cada turno, ganha 3 de Bloqueio.',
    [{ type: 'block', value: 3, target: 'self' }], '#2980b9'),
  makeCard('Veneno Persistente', 'power', 'rare', 2,
    'Aplica 5 de Veneno ao inimigo.',
    [{ type: 'poison', value: 5, target: 'enemy' }], '#8e44ad'),
  makeCard('Modo Berserk', 'power', 'boss', 3,
    'Dobra o dano de todos os ataques neste turno. Exausto.',
    [{ type: 'double_damage', value: 1, target: 'self' }], '#c0392b', true),
];

// Baralho inicial do player (10 cartas)
export function buildPlayerDeck(): Card[] {
  return [
    makeCard('Golpe Enferrujado', 'attack', 'common', 1, 'Causa 6 de dano.', [{ type: 'damage', value: 6, target: 'enemy' }], '#c0392b'),
    makeCard('Golpe Enferrujado', 'attack', 'common', 1, 'Causa 6 de dano.', [{ type: 'damage', value: 6, target: 'enemy' }], '#c0392b'),
    makeCard('Golpe Enferrujado', 'attack', 'common', 1, 'Causa 6 de dano.', [{ type: 'damage', value: 6, target: 'enemy' }], '#c0392b'),
    makeCard('Faca Improvisada', 'attack', 'common', 1, 'Causa 8 de dano.', [{ type: 'damage', value: 8, target: 'enemy' }], '#c0392b'),
    makeCard('Escudo de Ferro-Velho', 'skill', 'common', 1, 'Ganha 5 de Bloqueio.', [{ type: 'block', value: 5, target: 'self' }], '#2980b9'),
    makeCard('Escudo de Ferro-Velho', 'skill', 'common', 1, 'Ganha 5 de Bloqueio.', [{ type: 'block', value: 5, target: 'self' }], '#2980b9'),
    makeCard('Bandagem de Campo', 'skill', 'common', 1, 'Recupera 4 de HP.', [{ type: 'heal', value: 4, target: 'self' }], '#27ae60'),
    makeCard('Bandagem de Campo', 'skill', 'common', 1, 'Recupera 4 de HP.', [{ type: 'heal', value: 4, target: 'self' }], '#27ae60'),
    makeCard('Rajada de Sucata', 'attack', 'common', 1, 'Causa 4 de dano duas vezes.', [{ type: 'damage', value: 4, target: 'enemy' }, { type: 'damage', value: 4, target: 'enemy' }], '#e74c3c'),
    makeCard('Adrenalina', 'skill', 'uncommon', 0, 'Compra 2 cartas. Exausto.', [{ type: 'draw', value: 2, target: 'self' }], '#f39c12', true),
  ];
}

// ---- Cartas dos Inimigos ----
export function buildEnemyDeck(isBoss: boolean): Card[] {
  if (isBoss) {
    return [
      makeCard('Punho de Aço', 'attack', 'boss', 0, 'Causa 18 de dano.', [{ type: 'damage', value: 18, target: 'enemy' }], '#8B3A1A'),
      makeCard('Barreira Mutante', 'skill', 'boss', 0, 'Ganha 15 de Bloqueio.', [{ type: 'block', value: 15, target: 'self' }], '#2980b9'),
      makeCard('Toxina Devastadora', 'attack', 'boss', 0, 'Causa 12 de dano. Aplica 4 de Veneno.', [{ type: 'damage', value: 12, target: 'enemy' }, { type: 'poison', value: 4, target: 'enemy' }], '#8e44ad'),
      makeCard('Fúria Total', 'attack', 'boss', 0, 'Causa 25 de dano.', [{ type: 'damage', value: 25, target: 'enemy' }], '#c0392b'),
      makeCard('Regeneração Mutante', 'skill', 'boss', 0, 'Recupera 20 de HP.', [{ type: 'heal', value: 20, target: 'self' }], '#27ae60'),
      makeCard('Onda de Choque', 'attack', 'boss', 0, 'Causa 10 de dano. Enfraquece o inimigo.', [{ type: 'damage', value: 10, target: 'enemy' }, { type: 'weaken', value: 2, target: 'enemy' }], '#e74c3c'),
    ];
  }
  return [
    makeCard('Mordida Infectada', 'attack', 'common', 0, 'Causa 8 de dano.', [{ type: 'damage', value: 8, target: 'enemy' }], '#8B3A1A'),
    makeCard('Garra Enferrujada', 'attack', 'common', 0, 'Causa 6 de dano.', [{ type: 'damage', value: 6, target: 'enemy' }], '#c0392b'),
    makeCard('Escudo de Ossos', 'skill', 'common', 0, 'Ganha 6 de Bloqueio.', [{ type: 'block', value: 6, target: 'self' }], '#2980b9'),
    makeCard('Veneno Fraco', 'attack', 'common', 0, 'Aplica 2 de Veneno.', [{ type: 'poison', value: 2, target: 'enemy' }], '#8e44ad'),
  ];
}

export function shuffleDeck(deck: Card[]): Card[] {
  const d = [...deck];
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}
