import { RESULT_TTL_DAYS } from "../shared/patterns";
import type {
  PublicResult,
  RankingConfidenceRow,
  RankingTypeRow,
} from "../shared/types";

export type Db = D1Database;

export function expiresAtIso(from = new Date()) {
  const d = new Date(from);
  d.setUTCDate(d.getUTCDate() + RESULT_TTL_DAYS);
  return d.toISOString();
}

export async function saveResult(db: Db, result: PublicResult) {
  await db
    .prepare(
      `INSERT INTO results (id, display_name, type_code, type_key, status, overall_confidence, payload, created_at, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      result.id,
      result.displayName,
      result.type,
      result.typeKey,
      result.status,
      result.overallConfidence,
      JSON.stringify(result),
      result.createdAt,
      result.expiresAt,
    )
    .run();
}

export async function getResult(db: Db, id: string) {
  const row = await db
    .prepare(
      `SELECT payload, expires_at FROM results WHERE id = ? LIMIT 1`,
    )
    .bind(id)
    .first<{ payload: string; expires_at: string }>();

  if (!row) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) return null;
  return JSON.parse(row.payload) as PublicResult;
}

export async function rankingConfidence(db: Db, limit = 30) {
  const now = new Date().toISOString();
  const { results } = await db
    .prepare(
      `SELECT id, display_name, type_code, overall_confidence, created_at
       FROM results
       WHERE expires_at > ? AND status = 'confident'
       ORDER BY overall_confidence DESC, created_at ASC
       LIMIT ?`,
    )
    .bind(now, limit)
    .all<{
      id: string;
      display_name: string;
      type_code: string;
      overall_confidence: number;
      created_at: string;
    }>();

  return (results ?? []).map((r, i): RankingConfidenceRow => ({
    rank: i + 1,
    id: r.id,
    displayName: r.display_name,
    type: r.type_code,
    overallConfidence: r.overall_confidence,
    createdAt: r.created_at,
  }));
}

export async function rankingTypes(db: Db) {
  const now = new Date().toISOString();
  const { results } = await db
    .prepare(
      `SELECT type_key as typeKey, COUNT(*) as count
       FROM results
       WHERE expires_at > ? AND type_key IS NOT NULL AND status = 'confident'
       GROUP BY type_key
       ORDER BY count DESC, type_key ASC`,
    )
    .bind(now)
    .all<{ typeKey: string; count: number }>();

  const rows = results ?? [];
  const total = rows.reduce((s, r) => s + Number(r.count), 0) || 1;
  return rows.map((r, i): RankingTypeRow => ({
    rank: i + 1,
    typeKey: r.typeKey,
    count: Number(r.count),
    share: Number(r.count) / total,
  }));
}

export async function purgeExpired(db: Db) {
  const now = new Date().toISOString();
  await db.prepare(`DELETE FROM results WHERE expires_at <= ?`).bind(now).run();
}

export function newId() {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}
