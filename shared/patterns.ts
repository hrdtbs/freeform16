import type { AxisId, PatternDef, PatternField } from "./types";

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

const CORE_FIELDS: PatternField[] = [
  {
    id: "scene",
    label: "場面",
    placeholder: "いつ・どこで・誰と・何が起きたかを具体的に。",
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
    placeholder: "終わったあと、どう感じたか。エネルギーは上がったか下がったか。",
    minChars: 20,
  },
];

function starter(
  id: string,
  title: string,
  hint: string,
  scenePlaceholder: string,
): PatternDef {
  return {
    id,
    title,
    hint,
    fields: CORE_FIELDS.map((f) =>
      f.id === "scene" ? { ...f, placeholder: scenePlaceholder } : { ...f },
    ),
  };
}

/** First-round situation hooks. One is chosen at start. */
export const STARTER_PATTERNS: PatternDef[] = [
  starter(
    "A1",
    "意見が割れたとき",
    "ここ1〜2ヶ月で、人と意見や方針がぶつかった場面を1つ。",
    "例: 定例で進め方を巡って意見が分かれ、オンラインで3人と話していた。",
  ),
  starter(
    "A2",
    "予定が崩れたとき",
    "ここ1〜2ヶ月で、予定・計画が大きく変わった／崩れた場面を1つ。",
    "例: 金曜の提出予定が午後に延期され、残りのタスクをその場で組み直した。",
  ),
  starter(
    "A3",
    "大事な決断をしたとき",
    "ここ1〜2ヶ月で、迷った末に決断した場面を1つ。",
    "例: 転職／担当変更／大きな依頼を引き受けるか、週末に決めた。",
  ),
  starter(
    "A4",
    "初めての場に入ったとき",
    "ここ1〜2ヶ月で、初対面や新しい環境に入った場面を1つ。",
    "例: 他部署のキックオフに初めて参加し、知らない人が6人いた。",
  ),
  starter(
    "A5",
    "急ぎの依頼が来たとき",
    "ここ1〜2ヶ月で、急な依頼や割り込み対応をした場面を1つ。",
    "例: 夕方に急ぎの確認依頼が来て、予定を止めて対応した。",
  ),
  starter(
    "A6",
    "うまくいかなかったあと",
    "ここ1〜2ヶ月で、失敗・ミス・期待外れのあと、どう動いたかを1つ。",
    "例: 発表資料の指摘を受けたあと、その日のうちに修正方針を決めた。",
  ),
];

export const STARTER_IDS = STARTER_PATTERNS.map((p) => p.id);

export const PATTERNS: Record<string, PatternDef> = {
  ...Object.fromEntries(STARTER_PATTERNS.map((p) => [p.id, p])),
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

export function pickStarterPattern(): PatternDef {
  const idx = Math.floor(Math.random() * STARTER_PATTERNS.length);
  return STARTER_PATTERNS[idx] ?? STARTER_PATTERNS[0];
}

export function isStarterPattern(id: string) {
  return STARTER_IDS.includes(id);
}

export function pickNextPattern(
  _round: number,
  usedPatterns: string[],
  weakestAxis: AxisId | null,
  enoughDetail: number,
): PatternDef {
  // Starters are chosen only by /api/patterns/start.
  // Follow-ups never re-pick another starter.
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

  for (const id of ["B", "C", "D", "E", "F", "G"]) {
    if (!usedPatterns.includes(id)) return PATTERNS[id];
  }

  return PATTERNS.F;
}
