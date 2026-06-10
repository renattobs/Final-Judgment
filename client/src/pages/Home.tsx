// ============================================================
// DESIGN: Gritty Wasteland Noir — componente principal do jogo
// Fontes: Bebas Neue + Share Tech Mono + Crimson Text
// Paleta: #1a1a1a / #8B3A1A / #D4A017 / #2d4a1e / #e8e0d0
// ============================================================

import { useEffect, useRef, useCallback, useState } from 'react';
import { GameState } from '@/game/types';
import { initGameState, updateGame, handleMapClick, checkNPCInteraction, advanceDialog, endPlayerTurn, playCard, getCollectMessage } from '@/game/engine';
import {
  renderTitle, renderMap, renderPath, renderMaterials, renderNPCs,
  renderEnemies, renderPlayer, renderHUD, renderInventory, renderDialog,
  renderBattle, renderGameOver, renderVictory, renderMapOverlay,
} from '@/game/renderer';

const CANVAS_W = 900;
const CANVAS_H = 600;

// URLs das imagens
const IMG_TITLE = '';
const IMG_CARD_BG = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663677323564/CwRSKfNdbVy3as7D9xKnQU/battle_card_bg-cCMqcuMY8EFokuE4mzKjua.webp';
const IMG_BOSS = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663677323564/CwRSKfNdbVy3as7D9xKnQU/boss_portrait-bLKERoHVU4UPu33PvoSzE5.webp';
const IMG_HEALER = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663677323564/CwRSKfNdbVy3as7D9xKnQU/npc_healer-2kioyXZwBckC6rfFs3EZ6w.webp';
const IMG_TRADER = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663677323564/CwRSKfNdbVy3as7D9xKnQU/npc_trader-beQZvPkqD5d44AUQSDHHwb.webp';
const IMG_SCOUT = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663677323564/CwRSKfNdbVy3as7D9xKnQU/npc_scout-eFKNBYqbErY9FgRmM76swZ.webp';

function loadImage(src: string): HTMLImageElement {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = src;
  return img;
}

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState>(initGameState());
  const animFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const [, forceUpdate] = useState(0);

  // Imagens
  const imgsRef = useRef({
    title: loadImage(IMG_TITLE),
    cardBg: loadImage(IMG_CARD_BG),
    boss: loadImage(IMG_BOSS),
    portraits: {
      marta: loadImage(IMG_HEALER),
      reko: loadImage(IMG_TRADER),
      lyra: loadImage(IMG_SCOUT),
    } as Record<string, HTMLImageElement>,
  });

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const state = stateRef.current;
    const imgs = imgsRef.current;

    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    switch (state.screen) {
      case 'title':
        renderTitle(ctx, imgs.title);
        break;
      case 'game':
        renderMap(ctx, state);
        renderPath(ctx, state);
        renderMaterials(ctx, state);
        renderNPCs(ctx, state);
        renderEnemies(ctx, state);
        renderPlayer(ctx, state);
        renderMapOverlay(ctx);
        renderHUD(ctx, state);
        if (state.activeDialog) {
          renderDialog(ctx, state, imgs.portraits);
        }
        if (state.showInventory) {
          renderInventory(ctx, state);
        }
        break;
      case 'battle':
        renderBattle(ctx, state, imgs.cardBg, imgs.boss);
        break;
      case 'gameover':
        renderGameOver(ctx);
        break;
      case 'victory':
        renderVictory(ctx);
        break;
    }
  }, []);

  const gameLoop = useCallback((timestamp: number) => {
    const dt = Math.min((timestamp - lastTimeRef.current) / 1000, 0.05);
    lastTimeRef.current = timestamp;

    updateGame(stateRef.current, dt);
    // Expor mensagem de coleta ao renderer
    (window as any).__collectMsg = getCollectMessage();
    render();

    animFrameRef.current = requestAnimationFrame(gameLoop);
  }, [render]);

  useEffect(() => {
    lastTimeRef.current = performance.now();
    animFrameRef.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [gameLoop]);

  // ---- Input de Teclado ----
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const state = stateRef.current;
      state.keys.add(e.key);

      // Prevenir scroll da página com setas
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      // Tela de título
      if (state.screen === 'title') {
        if (e.key === 'Enter' || e.key === ' ') {
          state.screen = 'game';
        }
        return;
      }

      // Game Over / Vitória
      if (state.screen === 'gameover' || state.screen === 'victory') {
        if (e.key === 'r' || e.key === 'R') {
          stateRef.current = initGameState();
          stateRef.current.screen = 'game';
        }
        return;
      }

      // Batalha
      if (state.screen === 'battle') {
        const { battle, player } = state;

        // Selecionar carta por número
        const num = parseInt(e.key);
        if (!isNaN(num) && num >= 1 && num <= 9) {
          const idx = num - 1;
          if (idx < player.hand.length) {
            if (battle.selectedCardIndex === idx) {
              // Jogar carta selecionada
              playCard(state, idx);
            } else {
              battle.selectedCardIndex = idx;
            }
          }
        }

        // Jogar carta selecionada com Enter/Space
        if ((e.key === 'Enter' || e.key === ' ') && battle.selectedCardIndex !== null) {
          playCard(state, battle.selectedCardIndex);
          battle.selectedCardIndex = null;
        }

        // Encerrar turno
        if (e.key === 't' || e.key === 'T') {
          endPlayerTurn(state);
        }

        // Escape — desselecionar
        if (e.key === 'Escape') {
          battle.selectedCardIndex = null;
        }
        return;
      }

      // Jogo principal
      if (state.screen === 'game') {
        // Inventário
        if (e.key === 'i' || e.key === 'I') {
          state.showInventory = !state.showInventory;
        }

        // Escape fecha inventário ou diálogo
        if (e.key === 'Escape') {
          if (state.showInventory) {
            state.showInventory = false;
          } else if (state.activeDialog) {
            state.activeDialog = null;
          }
        }

        // Interação com NPC
        if ((e.key === 'e' || e.key === 'E') && !state.showInventory) {
          if (state.activeDialog) {
            // Selecionar primeira opção
            advanceDialog(state, 0);
          } else {
            checkNPCInteraction(state);
          }
        }

        // Opções de diálogo por número
        if (state.activeDialog) {
          const num = parseInt(e.key);
          if (!isNaN(num) && num >= 1 && num <= 9) {
            advanceDialog(state, num - 1);
          }
        }

        // Ordenação do inventário
        if (state.showInventory) {
          if (e.key === '1') state.sortOrder = 'type';
          if (e.key === '2') state.sortOrder = 'name';
          if (e.key === '3') state.sortOrder = 'quantity';
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      stateRef.current.keys.delete(e.key);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  // ---- Input de Mouse/Clique ----
  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const state = stateRef.current;

    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;
    const cx = (e.clientX - rect.left) * scaleX;
    const cy = (e.clientY - rect.top) * scaleY;

    // Tela de título
    if (state.screen === 'title') {
      const bx = CANVAS_W / 2 - 120, by = 320, bw = 240, bh = 55;
      if (cx >= bx && cx <= bx + bw && cy >= by && cy <= by + bh) {
        state.screen = 'game';
      }
      return;
    }

    // Game Over / Vitória
    if (state.screen === 'gameover' || state.screen === 'victory') {
      stateRef.current = initGameState();
      stateRef.current.screen = 'game';
      return;
    }

    // Batalha — clicar em carta
    if (state.screen === 'battle') {
      const { battle, player } = state;
      if (battle.phase !== 'player_turn') return;

      const hand = player.hand;
      const cardW = 90, cardH = 130;
      const totalW = hand.length * (cardW + 8) - 8;
      const startX = (CANVAS_W - totalW) / 2;
      const baseY = CANVAS_H - cardH - 15;

      // Botão encerrar turno
      const bx = CANVAS_W - 130, by = CANVAS_H - 90, bw = 120, bh = 40;
      if (cx >= bx && cx <= bx + bw && cy >= by && cy <= by + bh) {
        endPlayerTurn(state);
        return;
      }

      for (let i = 0; i < hand.length; i++) {
        const cardX = startX + i * (cardW + 8);
        const isSelected = battle.selectedCardIndex === i;
        const cardY = isSelected ? baseY - 15 : baseY;
        if (cx >= cardX && cx <= cardX + cardW && cy >= cardY && cy <= cardY + cardH) {
          if (battle.selectedCardIndex === i) {
            playCard(state, i);
            battle.selectedCardIndex = null;
          } else {
            battle.selectedCardIndex = i;
          }
          return;
        }
      }

      battle.selectedCardIndex = null;
      return;
    }

    // Jogo principal — inventário
    if (state.screen === 'game') {
      if (state.showInventory) {
        // Botões de ordenação
        const pw = 500, py = (CANVAS_H - 420) / 2;
        const px = (CANVAS_W - pw) / 2;
        const sortOptions = ['type', 'name', 'quantity'] as const;
        sortOptions.forEach((opt, i) => {
          const bx = px + 30 + i * 150, by = py + 60, bw = 130, bh = 28;
          if (cx >= bx && cx <= bx + bw && cy >= by && cy <= by + bh) {
            state.sortOrder = opt;
          }
        });
        return;
      }

      // Diálogo — clicar em opção
      if (state.activeDialog) {
        const { npc, nodeId } = state.activeDialog;
        const node = npc.dialogTree.nodes.get(nodeId);
        if (node) {
          const dh = 220, dy = CANVAS_H - dh - 10;
          node.options.forEach((_, i) => {
            const oy = dy + 150 + i * 22;
            if (cy >= oy - 14 && cy <= oy + 4 && cx >= 130) {
              advanceDialog(state, i);
            }
          });
        }
        return;
      }

      // Mover por clique (pathfinding)
      handleMapClick(state, cx, cy);
    }
  }, []);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0a0806',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: '"Share Tech Mono", monospace',
      }}
    >
      {/* Título da página */}
      <div style={{
        color: '#D4A017',
        fontFamily: '"Bebas Neue", "Impact", sans-serif',
        fontSize: '14px',
        letterSpacing: '4px',
        marginBottom: '8px',
        opacity: 0.7,
      }}>
        FINAL JUDGMENT
      </div>

      {/* Canvas do jogo */}
      <div style={{
        position: 'relative',
        border: '2px solid #8B3A1A',
        boxShadow: '0 0 40px rgba(139,58,26,0.4), 0 0 80px rgba(139,58,26,0.15)',
      }}>
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          onClick={handleClick}
          style={{
            display: 'block',
            cursor: 'crosshair',
            maxWidth: '100vw',
            maxHeight: 'calc(100vh - 80px)',
          }}
        />
      </div>

      {/* Controles */}
      <div style={{
        color: '#4a4038',
        fontSize: '11px',
        marginTop: '8px',
        letterSpacing: '1px',
        textAlign: 'center',
      }}>
        WASD/Setas: Mover &nbsp;|&nbsp; E: Interagir &nbsp;|&nbsp; I: Inventário &nbsp;|&nbsp;
        Clique: Mover/Selecionar &nbsp;|&nbsp; 1-9: Cartas &nbsp;|&nbsp; T: Encerrar Turno &nbsp;|&nbsp; R: Reiniciar
      </div>
    </div>
  );
}
