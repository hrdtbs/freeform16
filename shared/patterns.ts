import type { AxisId, PatternDef } from "./types";

export const MAX_ROUNDS = 4;
export const CONF_AXIS = 0.7;
export const SEP_AXIS = 0.2;
export const CONF_OVERALL = 0.68;
export const RESULT_TTL_DAYS = 90;

export const AXIS_META: Record<
  AxisId,
  { pos: string; neg: string; posLabel: string; negLabel: string }
> = {
  ei: { pos: "E", neg: "I", posLabel: "外向", negLabel: "内向" },
  sn: { pos: "S", neg: "N", posLabel: "感覚", negLabel: "直観" },
  tf: { pos: "T", neg: "F", posLabel: "思考", negLabel: "感情" },
  jp: { pos: "J", neg: "P", posLabel: "判断", negLabel: "知覚" },
};

export const PATTERNS: Record<string, PatternDef> = {
  A: {
    id: "A",
    title: "最近の一場面",
    hint: "ここ1〜2ヶ月の、具体的な一場面を書いてください。",
    fields: [
      {
        id: "scene",
        label: "場面",
        placeholder:
          "例: 金曜夕方の定例で、進捗が遅れていると指摘された。チーム3人とオンライン。",
        minChars: 40,
      },
      {
        id: "thought",
        label: "考え",
        placeholder: "その瞬間、頭に浮かんだことをそのまま。",
        minChars: 30,
      },
      {
        id: "action",
        label: "行動",
        placeholder: "実際に何をしたか／しなかったか。",
        minChars: 30,
      },
      {
        id: "after",
        label: "あと味",
        placeholder: "終わったあと、どう感じたか。",
        minChars: 20,
      },
    ],
  },
  B: {
    id: "B",
    title: "人と関わったあと",
    targetAxis: "ei",
    fields: [
      {
        id: "detail",
        label: "追記",
        placeholder:
          "その前後で、人と関わって楽になった瞬間、または一人になって楽になった瞬間を具体的に。",
        minChars: 40,
      },
    ],
  },
  C: {
    id: "C",
    title: "何を先に見たか",
    targetAxis: "sn",
    fields: [
      {
        id: "detail",
        label: "追記",
        placeholder:
          "事実・手順と、意味・可能性のどちらを先に見たか。何を根拠にそう言えますか。",
        minChars: 40,
      },
    ],
  },
  D: {
    id: "D",
    title: "決断の決め手",
    targetAxis: "tf",
    fields: [
      {
        id: "detail",
        label: "追記",
        placeholder:
          "最終的に動いた決め手は何でしたか。正しさ・効率・関係・配慮のどれが効いたかを、出来事で。",
        minChars: 40,
      },
    ],
  },
  E: {
    id: "E",
    title: "進め方の順序",
    targetAxis: "jp",
    fields: [
      {
        id: "detail",
        label: "追記",
        placeholder:
          "何を先に決め、何をその場で決ましたか。予定どおりの点と臨機応変だった点を分けて。",
        minChars: 40,
      },
    ],
  },
  F: {
    id: "F",
    title: "別の対照場面",
    fields: [
      {
        id: "detail",
        label: "追記",
        placeholder:
          "似た状況で、前回と違う選択をした別の場面があれば書いてください。",
        minChars: 40,
      },
    ],
  },
  G: {
    id: "G",
    title: "もう一段具体的に",
    targetAxis: "quality",
    fields: [
      {
        id: "detail",
        label: "追記",
        placeholder:
          "その場で見えたこと・言ったこと・やったことを、時刻や相手の反応も含めて。",
        minChars: 40,
      },
    ],
  },
};

export function pickNextPattern(
  round: number,
  usedPatterns: string[],
  weakestAxis: AxisId | null,
  enoughDetail: number,
): PatternDef {
  if (round === 0) return PATTERNS.A;

  if (enoughDetail < 0.6 && !usedPatterns.includes("G")) {
    return PATTERNS.G;
  }

  const axisMap: Record<AxisId, string> = {
    ei: "B",
    sn: "C",
    tf: "D",
    jp: "E",
  };

  if (weakestAxis) {
    const id = axisMap[weakestAxis];
    if (!usedPatterns.includes(id)) return PATTERNS[id];
  }

  if (!usedPatterns.includes("F")) return PATTERNS.F;
  if (!usedPatterns.includes("G")) return PATTERNS.G;

  // Fallback: any unused pattern
  for (const id of ["B", "C", "D", "E", "F", "G"]) {
    if (!usedPatterns.includes(id)) return PATTERNS[id];
  }

  return PATTERNS.F;
}
