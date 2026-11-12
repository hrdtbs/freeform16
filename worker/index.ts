import { Hono } from "hono";
import { cors } from "hono/cors";
import {
  MAX_ROUNDS,
  PATTERNS,
  pickNextPattern,
  pickStarterPattern,
} from "../shared/patterns";
import {
  composeType,
  overallConfidence,
  shouldFinishConfident,
  weakestAxis,
} from "../shared/scoring";
import type {
  AnswerEntry,
  DiagnoseRequest,
  DiagnoseResponse,
  PublicResult,
} from "../shared/types";
import {
  expiresAtIso,
  getResult,
  newId,
  purgeExpired,
  rankingConfidence,
  rankingTypes,
  saveResult,
} from "./db";
import { scoreAxes } from "./decisions";
import { buildNarrative, extractHints } from "./narrative";

type Env = {
  DB: D1Database;
  GEMINI_API_KEY?: string;
};

const app = new Hono<{ Bindings: Env }>();

app.use("/api/*", cors());

app.get("/api/health", (c) =>
  c.json({ ok: true, service: "freeform16", mock: !c.env.GEMINI_API_KEY }),
);

app.get("/api/patterns/start", (c) =>
  c.json({ pattern: pickStarterPattern(), maxRounds: MAX_ROUNDS }),
);

function buildTranscript(answers: AnswerEntry[]) {
  return answers
    .map((a, idx) => {
      const pattern = PATTERNS[a.patternId];
      const title = pattern?.title ?? a.patternId;
      const body = Object.entries(a.fields)
        .map(([k, v]) => {
          const label =
            pattern?.fields.find((f) => f.id === k)?.label ?? k;
          return `[${label}] ${v.trim()}`;
        })
        .join("\n");
      return `--- Round ${idx + 1}: ${title} ---\n${body}`;
    })
    .join("\n\n");
}

function validateAnswers(answers: AnswerEntry[]) {
  if (!Array.isArray(answers) || answers.length === 0) {
    return "回答が空です";
  }
  for (const a of answers) {
    const pattern = PATTERNS[a.patternId];
    if (!pattern) return "不明な質問パターンです";
    for (const field of pattern.fields) {
      const value = (a.fields[field.id] ?? "").trim();
      if (value.length < field.minChars) {
        return `「${field.label}」をもう少し具体的に書いてください（${field.minChars}字以上）`;
      }
    }
  }
  return null;
}

app.post("/api/diagnose", async (c) => {
  const body = (await c.req.json()) as DiagnoseRequest;
  const displayName = (body.displayName ?? "").trim();
  if (displayName.length < 1 || displayName.length > 16) {
    return c.json({ error: "なまえは1〜16文字で入力してください" }, 400);
  }

  const err = validateAnswers(body.answers ?? []);
  if (err) return c.json({ error: err }, 400);

  const round = Math.max(0, Math.min(body.round ?? 0, MAX_ROUNDS - 1));
  const usedPatterns = body.usedPatterns?.length
    ? body.usedPatterns
    : body.answers.map((a) => a.patternId);

  const transcript = buildTranscript(body.answers);
  const scored = await scoreAxes(c.env.GEMINI_API_KEY, transcript);
  const axes = scored.axes;
  const weak = weakestAxis(axes);
  const finishedConfident = shouldFinishConfident(axes);
  const hitMax = round + 1 >= MAX_ROUNDS;

  if (!finishedConfident && !hitMax) {
    const next = pickNextPattern(
      round + 1,
      usedPatterns,
      weak,
      scored.enoughDetail,
    );
    const response: DiagnoseResponse = {
      status: "need_more",
      round: round + 1,
      maxRounds: MAX_ROUNDS,
      next,
      previewAxes: axes,
      usingMock: scored.usingMock,
    };
    return c.json(response);
  }

  const status = finishedConfident ? "confident" : "low_confidence";
  const { type, typeKey } = composeType(axes);
  const overall = overallConfidence(axes);
  const narrative = buildNarrative({
    displayName,
    type,
    typeKey,
    status,
    overallConfidence: overall,
    axes,
    excerptHints: extractHints(transcript),
  });

  const now = new Date();
  const result: PublicResult = {
    id: newId(),
    displayName,
    createdAt: now.toISOString(),
    expiresAt: expiresAtIso(now),
    type,
    typeKey,
    status,
    overallConfidence: overall,
    title: narrative.title,
    narrative: narrative.narrative,
    shareText: narrative.shareText,
    axes: narrative.axes,
    usingMock: scored.usingMock,
  };

  try {
    await saveResult(c.env.DB, result);
  } catch (e) {
    console.error("saveResult failed", e);
    return c.json({ error: "結果の保存に失敗しました" }, 500);
  }

  const response: DiagnoseResponse = {
    status,
    round: round + 1,
    maxRounds: MAX_ROUNDS,
    result,
    usingMock: scored.usingMock,
  };
  return c.json(response);
});

app.get("/api/results/:id", async (c) => {
  const id = c.req.param("id");
  const result = await getResult(c.env.DB, id);
  if (!result) return c.json({ error: "結果が見つからないか、失効しています" }, 404);
  return c.json({ result });
});

app.get("/api/ranking", async (c) => {
  const [confidence, types] = await Promise.all([
    rankingConfidence(c.env.DB),
    rankingTypes(c.env.DB),
  ]);
  return c.json({ confidence, types });
});

app.post("/api/cron/purge", async (c) => {
  await purgeExpired(c.env.DB);
  return c.json({ ok: true });
});

export default {
  fetch: app.fetch,
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(purgeExpired(env.DB));
  },
};
