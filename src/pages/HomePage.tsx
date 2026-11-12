import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Brand } from "../components/Brand";
import { PatternForm } from "../components/PatternForm";
import { diagnose, fetchStartPattern } from "../lib/api";
import type { AnswerEntry, PatternDef } from "../../shared/types";

type Phase = "name" | "ask";

export function HomePage() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("name");
  const [displayName, setDisplayName] = useState("");
  const [pattern, setPattern] = useState<PatternDef | null>(null);
  const [maxRounds, setMaxRounds] = useState(4);
  const [round, setRound] = useState(0);
  const [answers, setAnswers] = useState<AnswerEntry[]>([]);
  const [usedPatterns, setUsedPatterns] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchStartPattern()
      .then((data) => {
        setPattern(data.pattern);
        setMaxRounds(data.maxRounds);
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  function start(e: React.FormEvent) {
    e.preventDefault();
    const name = displayName.trim();
    if (name.length < 1 || name.length > 16) {
      setError("なまえは1〜16文字で入力してください");
      return;
    }
    setError(null);
    setPhase("ask");
  }

  async function submitFields(fields: Record<string, string>) {
    if (!pattern) return;
    setSubmitting(true);
    setError(null);
    const nextAnswers = [...answers, { patternId: pattern.id, fields }];
    const nextUsed = usedPatterns.includes(pattern.id)
      ? usedPatterns
      : [...usedPatterns, pattern.id];

    try {
      const res = await diagnose({
        displayName: displayName.trim(),
        answers: nextAnswers,
        usedPatterns: nextUsed,
        round,
      });

      setAnswers(nextAnswers);
      setUsedPatterns(nextUsed);

      if (res.status === "need_more") {
        setPattern(res.next);
        setRound(res.round);
        setPhase("ask");
      } else {
        navigate(`/r/${res.result.id}`, { state: { result: res.result } });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "診断に失敗しました");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative z-10 mx-auto min-h-screen w-full max-w-2xl px-5 py-6 sm:py-10">
      <Brand />

      <main className="mt-10 sm:mt-14">
        {phase === "name" && (
          <form onSubmit={start} className="space-y-6 ink-bleed">
            <div>
              <label className="block text-[0.82rem] text-[var(--lamp)] mb-2">
                なまえ
              </label>
              <input
                autoFocus
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={16}
                placeholder="ニックネームでOK"
                className="w-full rounded-sm border border-[var(--line)] bg-[rgba(8,14,24,0.45)] px-3 py-3 text-[1.15rem] text-[var(--paper)] placeholder:text-[rgba(232,224,212,0.35)] focus:outline-none focus:border-[var(--lamp)]"
              />
            </div>
            {error && (
              <p className="text-[0.85rem] text-[var(--danger)]">{error}</p>
            )}
            <button
              type="submit"
              className="lamp-pulse rounded-sm bg-[var(--lamp)] px-5 py-3 text-[0.95rem] font-medium text-[var(--ink)]"
            >
              記録をはじめる
            </button>
          </form>
        )}

        {phase === "ask" && pattern && (
          <div className="ink-bleed">
            {error && (
              <p className="mb-4 text-[0.85rem] text-[var(--danger)]">{error}</p>
            )}
            <PatternForm
              key={pattern.id + round}
              pattern={pattern}
              round={round}
              maxRounds={maxRounds}
              submitting={submitting}
              onSubmit={submitFields}
            />
          </div>
        )}
      </main>
    </div>
  );
}
