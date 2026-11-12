import {
  AXIS_META,
  CONF_AXIS,
  CONF_OVERALL,
  SEP_AXIS,
} from "./patterns";
import type { AxisId, AxisScore, AxisState } from "./types";

export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/** Decisions score 0..4 -> pole -1..+1 */
export function scoreToPole(score: number) {
  return clamp((score / 4) * 2 - 1, -1, 1);
}

export function axisState(pole: number, confidence: number): AxisState {
  if (confidence < 0.55) return "low_signal";
  if (Math.abs(pole) < SEP_AXIS) return "borderline";
  return "settled";
}

export function buildAxis(
  id: AxisId,
  score: number,
  confidence: number,
  note = "",
): AxisScore {
  const meta = AXIS_META[id];
  const pole = scoreToPole(score);
  const state = axisState(pole, confidence);
  const letter =
    state === "borderline"
      ? `${meta.pos}/${meta.neg}`
      : pole >= 0
        ? meta.pos
        : meta.neg;
  const opposite = pole >= 0 ? meta.neg : meta.pos;
  return {
    id,
    letter,
    opposite,
    pole,
    leanPercent: Math.round(Math.abs(pole) * 100),
    confidence: clamp(confidence, 0, 1),
    state,
    note,
  };
}

export function isAxisConfident(axis: AxisScore) {
  return axis.confidence >= CONF_AXIS && Math.abs(axis.pole) >= SEP_AXIS;
}

export function weakestAxis(
  axes: Record<AxisId, AxisScore>,
): AxisId | null {
  const ids: AxisId[] = ["ei", "sn", "tf", "jp"];
  const unsettled = ids
    .filter((id) => !isAxisConfident(axes[id]))
    .sort((a, b) => {
      const scoreA =
        axes[a].confidence * 0.6 + Math.abs(axes[a].pole) * 0.4;
      const scoreB =
        axes[b].confidence * 0.6 + Math.abs(axes[b].pole) * 0.4;
      return scoreA - scoreB;
    });
  return unsettled[0] ?? null;
}

export function overallConfidence(axes: Record<AxisId, AxisScore>) {
  const vals = Object.values(axes).map((a) => a.confidence);
  return vals.reduce((s, v) => s + v, 0) / vals.length;
}

export function composeType(axes: Record<AxisId, AxisScore>) {
  const order: AxisId[] = ["ei", "sn", "tf", "jp"];
  const letters = order.map((id) => {
    const a = axes[id];
    if (a.state === "borderline" || a.state === "low_signal") {
      return AXIS_META[id].pos + "/" + AXIS_META[id].neg;
    }
    return a.letter;
  });

  const type = letters.join("");
  const fullyResolved = order.every((id) => isAxisConfident(axes[id]));
  const typeKey = fullyResolved
    ? order
        .map((id) =>
          axes[id].pole >= 0 ? AXIS_META[id].pos : AXIS_META[id].neg,
        )
        .join("")
    : null;

  return { type, typeKey };
}

export function shouldFinishConfident(axes: Record<AxisId, AxisScore>) {
  const ids: AxisId[] = ["ei", "sn", "tf", "jp"];
  const settled = ids.filter((id) => isAxisConfident(axes[id])).length;
  if (settled === 4) return true;
  if (settled >= 3 && overallConfidence(axes) >= CONF_OVERALL) return true;
  return false;
}

/** Lightweight local heuristic from Japanese free text (mock / fallback). */
export function heuristicScores(text: string): Record<
  AxisId,
  { score: number; confidence: number }
> {
  const t = text.toLowerCase();
  const hit = (words: string[]) =>
    words.reduce((n, w) => n + (t.includes(w) ? 1 : 0), 0);

  const e = hit([
    "話",
    "共有",
    "相談",
    "チーム",
    "みんな",
    "伝えた",
    "配った",
    "会議",
  ]);
  const i = hit(["一人", "ひとり", "黙", "後で", "チャット", "整理してから"]);
  const s = hit(["手順", "具体", "事実", "数字", "例", "詳細", "確認"]);
  const n = hit(["可能性", "別案", "イメージ", "全体", "仮説", "もし"]);
  const th = hit(["正し", "効率", "論理", "論点", "優先", "基準"]);
  const f = hit(["気持ち", "関係", "配慮", "空気", "負担", "共感"]);
  const j = hit(["計画", "予定", "締切", "先に決め", "リスト", "段取り"]);
  const p = hit(["その場", "臨機応変", "気分", "とりあえず", "余白", "即興"]);

  const axis = (
    pos: number,
    neg: number,
  ): { score: number; confidence: number } => {
    const total = pos + neg;
    if (total === 0) return { score: 2, confidence: 0.42 };
    const ratio = pos / total;
    const score = ratio * 4;
    const confidence = clamp(0.45 + total * 0.08, 0.45, 0.92);
    return { score, confidence };
  };

  return {
    ei: axis(e, i),
    sn: axis(s, n),
    tf: axis(th, f),
    jp: axis(j, p),
  };
}

export function enoughDetailScore(text: string) {
  const len = text.replace(/\s+/g, "").length;
  if (len < 80) return 0.35;
  if (len < 160) return 0.55;
  if (len < 280) return 0.72;
  return 0.88;
}
