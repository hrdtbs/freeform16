import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Brand } from "../components/Brand";
import { fetchRanking } from "../lib/api";
import type {
  RankingConfidenceRow,
  RankingTypeRow,
} from "../../shared/types";

export function RankingPage() {
  const [confidence, setConfidence] = useState<RankingConfidenceRow[]>([]);
  const [types, setTypes] = useState<RankingTypeRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "ランキング — freeform16";
    fetchRanking()
      .then((data) => {
        setConfidence(data.confidence);
        setTypes(data.types);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="relative z-10 mx-auto min-h-screen w-full max-w-2xl px-5 py-6 sm:py-10">
      <Brand />
      <main className="mt-10 sm:mt-14 space-y-10 ink-bleed">
        <h1 className="font-display text-[2rem]">ランキング</h1>
        {loading && <p className="text-[var(--muted)]">集計中…</p>}
        {error && <p className="text-[var(--danger)]">{error}</p>}

        {!loading && !error && (
          <>
            <section className="space-y-4">
              <h2 className="font-display text-[1.2rem] text-[var(--lamp)]">
                信頼度の高い記録
              </h2>
              {confidence.length === 0 ? (
                <p className="text-[0.9rem] text-[var(--muted)]">
                  まだ掲載できる記録がありません。
                </p>
              ) : (
                <ol className="space-y-2">
                  {confidence.map((row) => (
                    <li key={row.id}>
                      <Link
                        to={`/r/${row.id}`}
                        className="paper-panel flex items-center justify-between gap-3 rounded-sm px-4 py-3 no-underline text-[var(--paper)] hover:border-[var(--lamp)]"
                      >
                        <div className="flex items-baseline gap-3 min-w-0">
                          <span className="font-display text-[1.05rem] text-[var(--teal)] w-6">
                            {row.rank}
                          </span>
                          <span className="truncate">{row.displayName}</span>
                          <span className="text-[var(--muted)] text-[0.85rem]">
                            {row.type}
                          </span>
                        </div>
                        <span className="text-[0.9rem] text-[var(--lamp)] whitespace-nowrap">
                          {Math.round(row.overallConfidence * 100)}%
                        </span>
                      </Link>
                    </li>
                  ))}
                </ol>
              )}
            </section>

            <section className="space-y-4">
              <h2 className="font-display text-[1.2rem] text-[var(--lamp)]">
                多いタイプ
              </h2>
              {types.length === 0 ? (
                <p className="text-[0.9rem] text-[var(--muted)]">
                  確定タイプの集計はまだありません。
                </p>
              ) : (
                <ol className="space-y-2">
                  {types.map((row) => (
                    <li
                      key={row.typeKey}
                      className="paper-panel flex items-center justify-between gap-3 rounded-sm px-4 py-3"
                    >
                      <div className="flex items-baseline gap-3">
                        <span className="font-display text-[1.05rem] text-[var(--teal)] w-6">
                          {row.rank}
                        </span>
                        <span className="font-display text-[1.15rem]">
                          {row.typeKey}
                        </span>
                      </div>
                      <div className="text-[0.88rem] text-[var(--muted)]">
                        {row.count}件 · {Math.round(row.share * 100)}%
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
