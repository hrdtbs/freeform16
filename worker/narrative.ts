import { AXIS_META } from "../shared/patterns";
import type { AxisId, AxisScore } from "../shared/types";

const TITLES: Record<string, string> = {
  INTJ: "静かな設計者",
  INTP: "仮説を編む観察者",
  ENTJ: "場を切る推進者",
  ENTP: "可能性を開く論客",
  INFJ: "文脈を読む構想家",
  INFP: "価値に従う探求者",
  ENFJ: "関係を束ねる導き手",
  ENFP: "場を開く仮説型",
  ISTJ: "手順を守る実務家",
  ISFJ: "守りを固める支援者",
  ESTJ: "秩序を通す実行者",
  ESFJ: "輪を整える世話役",
  ISTP: "手元で解く職人",
  ISFP: "感覚で選ぶ表現者",
  ESTP: "現場で動く即応型",
  ESFP: "空気を動かす実践者",
};

function axisLine(axis: AxisScore) {
  const meta = AXIS_META[axis.id];
  if (axis.state === "low_signal") {
    return `${meta.pos}/${meta.neg} は記述が薄く、今回は霞んでいる。`;
  }
  if (axis.state === "borderline") {
    return `${meta.posLabel}と${meta.negLabel}の境で揺れている（信用度 ${Math.round(axis.confidence * 100)}%）。`;
  }
  const side = axis.pole >= 0 ? meta.posLabel : meta.negLabel;
  return `${side}寄り ${axis.leanPercent}%（信用度 ${Math.round(axis.confidence * 100)}%）。`;
}

export function buildNarrative(opts: {
  displayName: string;
  type: string;
  typeKey: string | null;
  status: "confident" | "low_confidence";
  overallConfidence: number;
  axes: Record<AxisId, AxisScore>;
  excerptHints: string[];
}) {
  const key = opts.typeKey ?? "";
  const title = TITLES[key] ?? "今回の記録の読み";
  const conf = Math.round(opts.overallConfidence * 100);
  const hedge =
    opts.status === "low_confidence"
      ? "情報が足りず確信度は低めだが、今回の記録から見える範囲では"
      : "今回の記録を読む限り";

  const hints = opts.excerptHints.slice(0, 2);
  const evidence =
    hints.length > 0
      ? hints.map((h) => `「${h}」`).join("、") + "といった描写が、傾きの根拠になっている。"
      : "具体的な行動と決断の書きぶりが、傾きの根拠になっている。";

  const axisNotes = {
    ei: axisLine(opts.axes.ei),
    sn: axisLine(opts.axes.sn),
    tf: axisLine(opts.axes.tf),
    jp: axisLine(opts.axes.jp),
  };

  const narrative = [
    `${opts.displayName}さんの結果は、${opts.type} 寄り（信用度 ${conf}%）。`,
    `${hedge}、${title}の気配がある。`,
    evidence,
    `軸の内訳 — E/I: ${axisNotes.ei} S/N: ${axisNotes.sn} T/F: ${axisNotes.tf} J/P: ${axisNotes.jp}`,
  ].join("\n");

  const shareText = [
    `freeform16 / ${opts.displayName}`,
    `${opts.type} 寄り・信用度 ${conf}%`,
    `E/I ${opts.axes.ei.letter} ${opts.axes.ei.leanPercent}% (${Math.round(opts.axes.ei.confidence * 100)}%)`,
    `S/N ${opts.axes.sn.letter} ${opts.axes.sn.leanPercent}% (${Math.round(opts.axes.sn.confidence * 100)}%)`,
    `T/F ${opts.axes.tf.letter} ${opts.axes.tf.leanPercent}% (${Math.round(opts.axes.tf.confidence * 100)}%)`,
    `J/P ${opts.axes.jp.letter} ${opts.axes.jp.leanPercent}% (${Math.round(opts.axes.jp.confidence * 100)}%)`,
  ].join("\n");

  // attach notes onto axes
  const axes = { ...opts.axes };
  (Object.keys(axisNotes) as AxisId[]).forEach((id) => {
    axes[id] = { ...axes[id], note: axisNotes[id] };
  });

  return { title, narrative, shareText, axes };
}

export function extractHints(transcript: string) {
  return transcript
    .split(/\n+/)
    .map((l) => l.replace(/^\[.*?\]\s*/, "").trim())
    .filter((l) => l.length >= 12 && l.length <= 48)
    .slice(0, 4);
}
