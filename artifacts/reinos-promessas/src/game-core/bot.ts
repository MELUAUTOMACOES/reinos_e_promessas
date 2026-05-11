import type { GameState, PlayerId, TerritoryId, CardId, Territory, Card, BotDifficulty } from "@/types";
import { TROOP_LIMITS } from "@/types";
import { resolveCombat } from "./combat";
import { resolveInfluence } from "./influence";
import { SECRET_OBJECTIVES } from "@/game-data/objectives";
import { checkObjectiveCompleted } from "./objectives";
import { canBuyCard, isCharacterActive } from "./cards";

interface ScoredAction {
  type: string;
  score: number;
  data: Record<string, unknown>;
}

function rolarDado(): number {
  return Math.floor(Math.random() * 6) + 1;
}

function randInt(max: number): number {
  return Math.floor(Math.random() * max);
}

function simularCombate(tropas: number, def: Territory, bonus = 0) {
  const r = resolveCombat(tropas, def, bonus);
  return { vence: r.vencedor === "atacante", fa: r.forcaAtacante, fd: r.forcaDefensor };
}

function simularInfluencia(inf: number, ouro: number, t: Territory) {
  const r = resolveInfluence(inf, ouro, t);
  return { sucesso: r.sucesso };
}

function isRebelde(t: Territory) { return t.feAtual >= 0 && t.feAtual <= 19; }
function isFeFraca(t: Territory) { return t.feAtual >= 0 && t.feAtual <= 39; }
function countTerritories(s: GameState, pid: PlayerId) { return s.territories.filter(t => t.donoAtual === pid).length; }
function totalTroops(s: GameState, pid: PlayerId) { return s.territories.filter(t => t.donoAtual === pid).reduce((a, t) => a + t.tropasAtuais, 0); }

function isNearLegacyVictory(s: GameState, pid: PlayerId): boolean {
  const p = s.players.find(x => x.id === pid);
  if (!p) return false;
  const req = s.mode === "rapido" ? 100 : 150;
  return p.resources.legado >= req * 0.8;
}

function isNearObjective(s: GameState, pid: PlayerId): boolean {
  const p = s.players.find(x => x.id === pid);
  if (!p || !p.objetivoSecretoId) return false;
  const obj = SECRET_OBJECTIVES.find(o => o.id === p.objetivoSecretoId);
  if (!obj) return false;
  const pt = s.territories.filter(t => t.donoAtual === pid);
  const req = obj.conditionData?.territories || [];
  const ctrl = req.filter(tid => pt.some(t => t.id === tid)).length;
  return ctrl >= req.length - 1;
}

function genRecruit(s: GameState, pid: PlayerId): ScoredAction[] {
  const acts: ScoredAction[] = [];
  for (const t of s.territories.filter(x => x.donoAtual === pid)) {
    const lim = TROOP_LIMITS[t.type];
    if (t.tropasAtuais >= lim) continue;
    let sc = 10;
    const hasEnemy = t.connections.some(cid => {
      const a = s.territories.find(x => x.id === cid);
      return a && a.donoAtual !== pid && a.donoAtual !== null;
    });
    if (hasEnemy) sc += 20;
    if (t.tropasAtuais <= 2) sc += 15;
    if (isRebelde(t)) sc += 10;
    acts.push({ type: "recruit", score: sc, data: { territoryId: t.id } });
  }
  return acts;
}

function genMove(s: GameState, pid: PlayerId): ScoredAction[] {
  const acts: ScoredAction[] = [];
  for (const from of s.territories.filter(x => x.donoAtual === pid)) {
    if (from.tropasAtuais < 2) continue;
    for (const toId of from.connections) {
      const to = s.territories.find(x => x.id === toId);
      if (!to || to.donoAtual !== pid) continue;
      const lim = TROOP_LIMITS[to.type];
      if (to.tropasAtuais >= lim) continue;
      const max = Math.min(from.tropasAtuais - 1, lim - to.tropasAtuais);
      if (max < 1) continue;
      let sc = 5;
      const toEnemy = to.connections.some(cid => {
        const a = s.territories.find(x => x.id === cid);
        return a && a.donoAtual !== pid && a.donoAtual !== null;
      });
      if (toEnemy) sc += 25;
      acts.push({ type: "move", score: sc, data: { fromId: from.id, toId: to.id, count: Math.min(max, 3) } });
    }
  }
  return acts;
}

function genAttack(s: GameState, pid: PlayerId): ScoredAction[] {
  const acts: ScoredAction[] = [];
  const p = s.players.find(x => x.id === pid);
  if (!p) return acts;
  for (const from of s.territories.filter(x => x.donoAtual === pid)) {
    if (from.tropasAtuais < 2) continue;
    for (const tid of from.connections) {
      const tgt = s.territories.find(x => x.id === tid);
      if (!tgt || tgt.donoAtual === pid) continue;
      const tropas = Math.min(from.tropasAtuais - 1, 5);
      if (tropas < 1) continue;
      const sim = simularCombate(tropas, tgt);
      let sc = 0;
      if (sim.vence) {
        sc += 35;
        if (tgt.type === "estrategico") sc += 15;
        if (tgt.type === "sagrado") sc += 25;
        if (tgt.type === "capital") sc += 30;
        if (p.objetivoSecretoId) {
          const obj = SECRET_OBJECTIVES.find(o => o.id === p.objetivoSecretoId);
          if (obj?.conditionData?.territories?.includes(tgt.id)) sc += 40;
        }
        if (tgt.donoAtual && isNearLegacyVictory(s, tgt.donoAtual)) sc += 30;
        if (tgt.donoAtual && isNearObjective(s, tgt.donoAtual)) sc += 35;
      } else { sc -= 30; }
      if (from.tropasAtuais - tropas <= 1) sc -= 25;
      if (p.resources.provisao < 2) sc -= 25;
      acts.push({ type: "attack", score: sc, data: { fromId: from.id, toId: tgt.id, tropas } });
    }
  }
  return acts;
}

function genFaith(s: GameState, pid: PlayerId): ScoredAction[] {
  const acts: ScoredAction[] = [];
  for (const t of s.territories.filter(x => x.donoAtual === pid)) {
    let sc = 0;
    if (isRebelde(t)) sc += 45;
    else if (isFeFraca(t)) sc += 25;
    else if (t.feAtual < 60) sc += 10;
    if (t.type === "sagrado" && t.feAtual < 70) sc += 20;
    if (sc > 0) acts.push({ type: "faith", score: sc, data: { territoryId: t.id, option: "safe" } });
  }
  return acts;
}

function genInfluence(s: GameState, pid: PlayerId): ScoredAction[] {
  const acts: ScoredAction[] = [];
  const p = s.players.find(x => x.id === pid);
  if (!p) return acts;
  for (const from of s.territories.filter(x => x.donoAtual === pid)) {
    for (const tid of from.connections) {
      const tgt = s.territories.find(x => x.id === tid);
      if (!tgt || tgt.donoAtual === pid) continue;
      if (tgt.donoAtual !== null) continue;
      const inf = Math.min(p.resources.influencia, 3);
      const ouro = Math.min(p.resources.ouro, 2);
      if (inf < 1) continue;
      const sim = simularInfluencia(inf, ouro, tgt);
      let sc = 0;
      if (sim.sucesso) {
        sc += 30;
        if (tgt.type === "estrategico") sc += 15;
        if (tgt.type === "sagrado") sc += 20;
        if (p.objetivoSecretoId) {
          const obj = SECRET_OBJECTIVES.find(o => o.id === p.objetivoSecretoId);
          if (obj?.conditionData?.territories?.includes(tgt.id)) sc += 35;
        }
      } else { sc -= 10; }
      acts.push({ type: "influence", score: sc, data: { fromId: from.id, toId: tgt.id, influencia: inf, ouro } });
    }
  }
  return acts;
}

function genBuyCard(s: GameState, pid: PlayerId): ScoredAction[] {
  const acts: ScoredAction[] = [];
  const p = s.players.find(x => x.id === pid);
  if (!p) return acts;
  if (p.cartasNaMao.length >= 5) return acts;
  if (p.resources.ouro >= 4 && s.mercado.length > 0) {
    for (const card of s.mercado) {
      let sc = 20;
      if (card.type === "personagem") sc += 15;
      if (card.type === "tatica") sc += 10;
      acts.push({ type: "buyMarket", score: sc, data: { cardId: card.id } });
    }
  }
  if (p.resources.ouro >= 2 && s.deck.length > 0) {
    acts.push({ type: "buyRandom", score: 15, data: {} });
  }
  return acts;
}

function genUseCard(s: GameState, pid: PlayerId): ScoredAction[] {
  const acts: ScoredAction[] = [];
  const p = s.players.find(x => x.id === pid);
  if (!p) return acts;
  for (const card of p.cartasNaMao) {
    if (card.type === "personagem" && !isCharacterActive(s, card.id)) {
      acts.push({ type: "activateChar", score: 30, data: { cardId: card.id } });
    }
  }
  return acts;
}

function genPass(): ScoredAction[] {
  return [{ type: "pass", score: -100, data: {} }];
}

function pickAction(actions: ScoredAction[], diff: BotDifficulty): ScoredAction {
  const sorted = [...actions].sort((a, b) => b.score - a.score);
  if (sorted.length === 0) return { type: "pass", score: -100, data: {} };
  if (diff === "facil") {
    const pool = sorted.slice(0, Math.min(4, sorted.length));
    return pool[randInt(pool.length)];
  } else if (diff === "medio") {
    const pool = sorted.slice(0, Math.min(2, sorted.length));
    if (Math.random() < 0.15 && sorted.length > 2) return sorted[randInt(sorted.length)];
    return pool[randInt(pool.length)];
  } else {
    if (Math.random() < 0.1 && sorted.length > 1) return sorted[1];
    return sorted[0];
  }
}

export interface BotActionResult {
  type: string;
  data: Record<string, unknown>;
}

export function decideBotAction(state: GameState, playerId: PlayerId): BotActionResult {
  const player = state.players.find(p => p.id === playerId);
  if (!player) return { type: "pass", data: {} };
  const diff: BotDifficulty = player.botDifficulty || "medio";
  const allActions: ScoredAction[] = [
    ...genRecruit(state, playerId),
    ...genMove(state, playerId),
    ...genAttack(state, playerId),
    ...genFaith(state, playerId),
    ...genInfluence(state, playerId),
    ...genBuyCard(state, playerId),
    ...genUseCard(state, playerId),
    ...genPass(),
  ];
  const chosen = pickAction(allActions, diff);
  return { type: chosen.type, data: chosen.data };
}
