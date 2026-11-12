import type {
  DiagnoseRequest,
  DiagnoseResponse,
  PatternDef,
  PublicResult,
  RankingConfidenceRow,
  RankingTypeRow,
} from "../../shared/types";

async function parse<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) {
    throw new Error((data as { error?: string }).error ?? "リクエストに失敗しました");
  }
  return data as T;
}

export async function fetchStartPattern() {
  return parse<{ pattern: PatternDef; maxRounds: number }>(
    await fetch("/api/patterns/start"),
  );
}

export async function diagnose(body: DiagnoseRequest) {
  return parse<DiagnoseResponse>(
    await fetch("/api/diagnose", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

export async function fetchResult(id: string) {
  return parse<{ result: PublicResult }>(await fetch(`/api/results/${id}`));
}

export async function fetchRanking() {
  return parse<{
    confidence: RankingConfidenceRow[];
    types: RankingTypeRow[];
  }>(await fetch("/api/ranking"));
}
