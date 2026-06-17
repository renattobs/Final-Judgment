// ============================================================
// DESIGN: Final Judgment — NPCs e árvores de diálogo
// Temática: Invasão alienígena, esquadrão de jovens soldados
// Estrutura de dados: árvore (DialogTree com Map de nós)
// ============================================================

import { NPC, DialogTree, DialogNode } from './types';

function buildTree(nodes: DialogNode[]): DialogTree {
  const map = new Map<string, DialogNode>();
  for (const n of nodes) map.set(n.id, n);
  return { rootId: nodes[0].id, nodes: map };
}

// ---- NPC 1: Comandante Reeves — Líder do Esquadrão ----
const reevesTree: DialogTree = buildTree([
  {
    id: 'reeves_root',
    speaker: 'Comandante Reeves',
    text: 'Soldado! Bem-vindo ao Esquadrão Final Judgment. Sou o Comandante Reeves. A humanidade depende de nós agora. Os alienígenas não param de vir.',
    options: [
      { text: 'Qual é a situação, Comandante?', nextNodeId: 'reeves_situation' },
      { text: 'Onde está o prodígio?', nextNodeId: 'reeves_prodigy' },
      { text: 'Como posso ajudar?', nextNodeId: 'reeves_mission' },
      { text: 'Entendido, Senhor.', nextNodeId: null },
    ],
  },
  {
    id: 'reeves_situation',
    speaker: 'Comandante Reeves',
    text: 'Os alienígenas avançam rapidamente. Perdemos 70% das nossas forças. O General do Império foi derrotado, mas nosso prodígio foi capturado. Precisamos recuperá-lo e encontrar uma forma de vencer.',
    options: [
      { text: 'Vou ajudar no que for preciso.', nextNodeId: 'reeves_reward' },
      { text: 'Qual é o plano?', nextNodeId: 'reeves_plan' },
    ],
  },
  {
    id: 'reeves_prodigy',
    speaker: 'Comandante Reeves',
    text: 'Ele foi capturado pela nave-mãe alienígena. Seu potencial é único — o tratamento experimental funcionou perfeitamente nele. Se conseguirmos recuperá-lo, talvez ainda tenhamos uma chance.',
    options: [
      { text: 'Vou encontrá-lo.', nextNodeId: 'reeves_reward' },
      { text: 'Entendido.', nextNodeId: null },
    ],
  },
  {
    id: 'reeves_mission',
    speaker: 'Comandante Reeves',
    text: 'Colete cristais de energia alienígena e tecnologia inimiga. Precisamos fortalecer nosso arsenal. Aqui, tome esta carta de combate avançada.',
    options: [
      { text: 'Vou começar a coleta.', nextNodeId: 'reeves_farewell' },
    ],
    action: { type: 'give_card', card: { id: 'plasma_burst', name: 'Rajada de Plasma', type: 'attack', rarity: 'uncommon', cost: 2, description: 'Dispara plasma concentrado. Causa 15 de dano.', effects: [{ type: 'damage', value: 15, target: 'enemy' }], color: '#e74c3c', exhaust: false } },
  },
  {
    id: 'reeves_plan',
    speaker: 'Comandante Reeves',
    text: 'Nosso plano é simples: fortaleça-se, derrote os inimigos que encontrar, e prepare-se para o confronto final. A nave-mãe está ao norte. Lá está o prodígio.',
    options: [
      { text: 'Vou me preparar.', nextNodeId: 'reeves_farewell' },
    ],
  },
  {
    id: 'reeves_reward',
    speaker: 'Comandante Reeves',
    text: 'Excelente. Aqui está uma carta especial para você. Use-a com sabedoria. A humanidade está contando com você.',
    options: [
      { text: 'Obrigado, Comandante.', nextNodeId: 'reeves_farewell' },
    ],
    action: { type: 'give_card', card: { id: 'tactical_shield', name: 'Escudo Tático', type: 'skill', rarity: 'uncommon', cost: 1, description: 'Ativa escudo de energia. Bloqueia 12 de dano.', effects: [{ type: 'block', value: 12, target: 'self' }], color: '#3498db', exhaust: false } },
  },
  {
    id: 'reeves_farewell',
    speaker: 'Comandante Reeves',
    text: 'Boa sorte, soldado. A humanidade está em suas mãos.',
    options: [],
  },
]);

// ---- NPC 2: Dra. Yuki — Médica de Campo ----
const yukiTree: DialogTree = buildTree([
  {
    id: 'yuki_root',
    speaker: 'Dra. Yuki',
    text: 'Olá, soldado. Sou a Dra. Yuki, médica de campo do esquadrão. Vejo que está ferido. Deixe-me ajudar.',
    options: [
      { text: 'Preciso de cura urgente.', nextNodeId: 'yuki_heal' },
      { text: 'Como funciona o tratamento experimental?', nextNodeId: 'yuki_treatment' },
      { text: 'Você conhece o prodígio?', nextNodeId: 'yuki_prodigy' },
      { text: 'Obrigado, mas estou bem.', nextNodeId: null },
    ],
  },
  {
    id: 'yuki_heal',
    speaker: 'Dra. Yuki',
    text: 'Deixe-me aplicar o nanobiótico. Isso deve curar seus ferimentos rapidamente.',
    options: [
      { text: 'Muito obrigado.', nextNodeId: 'yuki_farewell' },
    ],
    action: { type: 'heal', amount: 30 },
  },
  {
    id: 'yuki_treatment',
    speaker: 'Dra. Yuki',
    text: 'O tratamento experimental aumenta drasticamente as capacidades físicas e mentais. Infelizmente, nem todos conseguem sobreviver. Apenas os mais fortes adaptam-se completamente.',
    options: [
      { text: 'E o prodígio?', nextNodeId: 'yuki_prodigy' },
      { text: 'Entendo.', nextNodeId: 'yuki_farewell' },
    ],
  },
  {
    id: 'yuki_prodigy',
    speaker: 'Dra. Yuki',
    text: 'Ele é extraordinário. Seu corpo reagiu de forma perfeita ao tratamento. Seus níveis de energia estão fora dos gráficos. Se conseguirmos recuperá-lo, ele pode ser a chave para a vitória.',
    options: [
      { text: 'Vou encontrá-lo.', nextNodeId: 'yuki_reward' },
      { text: 'Entendido.', nextNodeId: 'yuki_farewell' },
    ],
  },
  {
    id: 'yuki_reward',
    speaker: 'Dra. Yuki',
    text: 'Aqui, tome este kit de cura avançada. Pode salvar sua vida em combate.',
    options: [
      { text: 'Obrigado, Dra. Yuki.', nextNodeId: 'yuki_farewell' },
    ],
    action: { type: 'give_card', card: { id: 'field_medic', name: 'Cura de Campo', type: 'skill', rarity: 'uncommon', cost: 1, description: 'Ativa nanobióticos. Cura 20 de HP.', effects: [{ type: 'heal', value: 20, target: 'self' }], color: '#27ae60', exhaust: false } },
  },
  {
    id: 'yuki_farewell',
    speaker: 'Dra. Yuki',
    text: 'Cuide-se, soldado. Precisamos de você vivo.',
    options: [],
  },
]);

// ---- NPC 3: Sargento Marcus — Veterano de Combate ----
const marcusTree: DialogTree = buildTree([
  {
    id: 'marcus_root',
    speaker: 'Sargento Marcus',
    text: 'Ei, recruta! Sou o Sargento Marcus. Sobrevivi a mais de 50 batalhas contra os alienígenas. Quer alguns conselhos?',
    options: [
      { text: 'Como devo lutar contra os alienígenas?', nextNodeId: 'marcus_tactics' },
      { text: 'Qual é o seu segredo para sobreviver?', nextNodeId: 'marcus_survival' },
      { text: 'Você viu o prodígio em ação?', nextNodeId: 'marcus_prodigy' },
      { text: 'Preciso de armas melhores.', nextNodeId: 'marcus_weapons' },
    ],
  },
  {
    id: 'marcus_tactics',
    speaker: 'Sargento Marcus',
    text: 'Simples: seja rápido, seja forte, e nunca deixe o inimigo respirar. Use cartas de ataque em sequência. Bloqueio é para os fracos — ataque é a melhor defesa!',
    options: [
      { text: 'Entendido, Sargento.', nextNodeId: 'marcus_reward' },
      { text: 'Obrigado pelo conselho.', nextNodeId: null },
    ],
  },
  {
    id: 'marcus_survival',
    speaker: 'Sargento Marcus',
    text: 'Experiência, soldado. Muita experiência. E sorte. Muita sorte. Mas principalmente, nunca desista. Enquanto estiver vivo, há esperança.',
    options: [
      { text: 'Vou lembrar disso.', nextNodeId: 'marcus_reward' },
      { text: 'Obrigado.', nextNodeId: null },
    ],
  },
  {
    id: 'marcus_prodigy',
    speaker: 'Sargento Marcus',
    text: 'Sim, vi. Aquele garoto é um monstro — no bom sentido. Derrotou o General do Império sozinho. Ninguém mais conseguiu fazer isso. Ele é nosso último trunfo.',
    options: [
      { text: 'Vou ajudar a resgatá-lo.', nextNodeId: 'marcus_reward' },
      { text: 'Entendido.', nextNodeId: null },
    ],
  },
  {
    id: 'marcus_weapons',
    speaker: 'Sargento Marcus',
    text: 'Aqui, recruta. Tome esta carta de combate avançado. Aprendi a usá-la em 40 batalhas. Ela nunca falha.',
    options: [
      { text: 'Muito obrigado, Sargento.', nextNodeId: 'marcus_farewell' },
    ],
    action: { type: 'give_card', card: { id: 'veteran_strike', name: 'Golpe Veterano', type: 'attack', rarity: 'rare', cost: 3, description: 'Ataque combinado. Causa 25 de dano + enfraquece inimigo.', effects: [{ type: 'damage', value: 25, target: 'enemy' }, { type: 'weaken', value: 2, target: 'enemy' }], color: '#e74c3c', exhaust: false } },
  },
  {
    id: 'marcus_reward',
    speaker: 'Sargento Marcus',
    text: 'Você tem potencial, recruta. Aqui está uma carta especial. Use-a bem.',
    options: [
      { text: 'Obrigado, Sargento.', nextNodeId: 'marcus_farewell' },
    ],
    action: { type: 'give_card', card: { id: 'adrenaline_rush', name: 'Surto de Adrenalina', type: 'power', rarity: 'uncommon', cost: 1, description: 'Próximas cartas de ataque causam +5 de dano.', effects: [{ type: 'strengthen', value: 5, target: 'self' }], color: '#f39c12', exhaust: false } },
  },
  {
    id: 'marcus_farewell',
    speaker: 'Sargento Marcus',
    text: 'Boa sorte, recruta. Volte vivo.',
    options: [],
  },
]);

export function buildNPCs(): NPC[] {
  return [
    {
      id: 'reeves',
      name: 'Comandante Reeves',
      title: 'Líder do Esquadrão',
      x: 3,
      y: 4,
      color: '#3498db',
      portraitUrl: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663677323564/CwRSKfNdbVy3as7D9xKnQU/npc_healer-2kioyXZwBckC6rfFs3EZ6w.webp',
      dialogTree: reevesTree,
      interacted: false,
    },
    {
      id: 'yuki',
      name: 'Dra. Yuki',
      title: 'Médica de Campo',
      x: 36,
      y: 4,
      color: '#27ae60',
      portraitUrl: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663677323564/CwRSKfNdbVy3as7D9xKnQU/npc_trader-beQZvPkqD5d44AUQSDHHwb.webp',
      dialogTree: yukiTree,
      interacted: false,
    },
    {
      id: 'marcus',
      name: 'Sargento Marcus',
      title: 'Veterano de Combate',
      x: 20,
      y: 2,
      color: '#e74c3c',
      portraitUrl: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663677323564/CwRSKfNdbVy3as7D9xKnQU/npc_scout-eFKNBYqbErY9FgRmM76swZ.webp',
      dialogTree: marcusTree,
      interacted: false,
    },
  ];
}
