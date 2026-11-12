import type { AxisId } from "../shared/types";
import {
  buildAxis,
  enoughDetailScore,
  heuristicScores,
} from "../shared/scoring";
import type { AxisScore } from "../shared/types";

type DecisionAnswer =
  | { type: "score"; score: number; confidence: number }
  | { type: "noul"; noul: number; confidence: number };

type DecisionsResponse = {
  answers: Record<string, DecisionAnswer>;
};

// Rubric index 0 = negative pole (I/N/F/P), 4 = positive pole (E/S/T/J)
const AXIS_CRITERIA: Record<AxisId, string[]> = {
  ei: [
    "Strongly prefers solitude to recharge; reduces social stimulation.",
    "Mostly inward-focused; socializes selectively and recovers alone.",
    "Mixed or balanced signals between solitude and social energy.",
    "Energized by interaction more often than solitude.",
    "Strongly seeks interaction; processes by talking with others.",
  ],
  sn: [
    "Strongly prioritizes hypotheses and big-picture possibilities.",
    "Leans toward patterns, meanings, and future possibilities.",
    "Mixes concrete details and abstract possibilities.",
    "Mostly practical and specific, with limited abstraction.",
    "Focuses on concrete facts, steps, and present details.",
  ],
  tf: [
    "Strongly prioritizes harmony, care, and people's impact.",
    "Weighs relationships and feelings more than pure logic.",
    "Balances logic and interpersonal impact.",
    "Mostly logic-first, with limited attention to feelings.",
    "Decides mainly by impersonal criteria, logic, and efficiency.",
  ],
  jp: [
    "Strongly prefers spontaneity and open-ended process.",
    "Keeps options open and adapts in the moment.",
    "Mixes planning and improvisation.",
    "Mostly planful with some flexibility.",
    "Plans early, closes decisions, and prefers structure.",
  ],
};

function formatInput(blocks: string) {
  return blocks;
}

export async function scoreAxes(
  apiKey: string | undefined,
  transcript: string,
): Promise<{
  axes: Record<AxisId, AxisScore>;
  enoughDetail: number;
  usingMock: boolean;
}> {
  if (!apiKey) {
    return mockScore(transcript);
  }

  try {
    const res = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/decisions?key=" +
        encodeURIComponent(apiKey),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "gemini-decision-1",
          input: formatInput(transcript),
          questions: {
            axis_ei: {
              type: "score",
              instructions:
                "Based only on the provided episode answers, rate extraversion vs introversion. Lower = introversion preference, higher = extraversion. Do not invent facts.",
              criteria: AXIS_CRITERIA.ei,
            },
            axis_sn: {
              type: "score",
              instructions:
                "Based only on the provided episode answers, rate sensing vs intuition. Lower scores = intuition (N), higher scores = sensing (S). Do not invent facts.",
              criteria: AXIS_CRITERIA.sn,
            },
            axis_tf: {
              type: "score",
              instructions:
                "Based only on the provided episode answers, rate thinking vs feeling. Lower scores = feeling (F), higher scores = thinking (T). Do not invent facts.",
              criteria: AXIS_CRITERIA.tf,
            },
            axis_jp: {
              type: "score",
              instructions:
                "Based only on the provided episode answers, rate judging vs perceiving. Lower scores = perceiving (P), higher scores = judging (J). Do not invent facts.",
              criteria: AXIS_CRITERIA.jp,
            },
            enough_detail: {
              type: "noul",
              instructions:
                "Is there enough concrete behavioral evidence in the answers to estimate personality preferences?",
              criteria: {
                true_description:
                  "Mentions real actions, decisions, timing, or interpersonal behavior.",
                false_description:
                  "Too vague, joke-only, or no usable behavioral detail.",
              },
            },
          },
        }),
      },
    );

    if (!res.ok) {
      console.error("Decisions API error", res.status, await res.text());
      return mockScore(transcript);
    }

    const data = (await res.json()) as DecisionsResponse;
    const getScore = (key: string) => {
      const a = data.answers[key];
      if (!a || a.type !== "score") return { score: 2, confidence: 0.5 };
      return { score: a.score, confidence: a.confidence };
    };
    const enough =
      data.answers.enough_detail?.type === "noul"
        ? data.answers.enough_detail.noul
        : enoughDetailScore(transcript);

    return {
      usingMock: false,
      enoughDetail: enough,
      axes: {
        ei: buildAxis("ei", getScore("axis_ei").score, getScore("axis_ei").confidence),
        sn: buildAxis("sn", getScore("axis_sn").score, getScore("axis_sn").confidence),
        tf: buildAxis("tf", getScore("axis_tf").score, getScore("axis_tf").confidence),
        jp: buildAxis("jp", getScore("axis_jp").score, getScore("axis_jp").confidence),
      },
    };
  } catch (err) {
    console.error("Decisions API failed", err);
    return mockScore(transcript);
  }
}

function mockScore(transcript: string) {
  const h = heuristicScores(transcript);
  return {
    usingMock: true,
    enoughDetail: enoughDetailScore(transcript),
    axes: {
      ei: buildAxis("ei", h.ei.score, h.ei.confidence),
      sn: buildAxis("sn", h.sn.score, h.sn.confidence),
      tf: buildAxis("tf", h.tf.score, h.tf.confidence),
      jp: buildAxis("jp", h.jp.score, h.jp.confidence),
    },
  };
}
