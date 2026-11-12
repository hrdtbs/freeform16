export type AxisId = "ei" | "sn" | "tf" | "jp";

export type AxisState = "settled" | "borderline" | "low_signal";

export type AxisScore = {
  id: AxisId;
  letter: string;
  opposite: string;
  pole: number; // -1..+1, positive = first letter side (E/S/T/J)
  leanPercent: number; // 0..100 distance from center toward pole
  confidence: number; // 0..1
  state: AxisState;
  note: string;
};

export type PatternField = {
  id: string;
  label: string;
  placeholder: string;
  minChars: number;
};

export type PatternDef = {
  id: string;
  title: string;
  hint?: string;
  targetAxis?: AxisId | "quality";
  fields: PatternField[];
};

export type AnswerEntry = {
  patternId: string;
  fields: Record<string, string>;
};

export type DiagnosisStatus = "need_more" | "confident" | "low_confidence";

export type PublicResult = {
  id: string;
  displayName: string;
  createdAt: string;
  expiresAt: string;
  type: string;
  typeKey: string | null;
  status: "confident" | "low_confidence";
  overallConfidence: number;
  title: string;
  narrative: string;
  shareText: string;
  axes: Record<AxisId, AxisScore>;
  usingMock: boolean;
};

export type DiagnoseRequest = {
  displayName: string;
  answers: AnswerEntry[];
  usedPatterns: string[];
  round: number;
};

export type DiagnoseResponse =
  | {
      status: "need_more";
      round: number;
      maxRounds: number;
      next: PatternDef;
      previewAxes: Record<AxisId, AxisScore>;
      usingMock: boolean;
    }
  | {
      status: "confident" | "low_confidence";
      round: number;
      maxRounds: number;
      result: PublicResult;
      usingMock: boolean;
    };

export type RankingConfidenceRow = {
  rank: number;
  id: string;
  displayName: string;
  type: string;
  overallConfidence: number;
  createdAt: string;
};

export type RankingTypeRow = {
  rank: number;
  typeKey: string;
  count: number;
  share: number;
};
