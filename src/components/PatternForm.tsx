import { useEffect, useState } from "react";
import type { PatternDef } from "../../shared/types";

function emptyFields(pattern: PatternDef): Record<string, string> {
  const obj: Record<string, string> = {};
  for (const f of pattern.fields) obj[f.id] = "";
  return obj;
}

function fieldValue(fields: Record<string, string>, id: string) {
  return fields[id] ?? "";
}

export function PatternForm({
  pattern,
  round,
  maxRounds,
  submitting,
  onSubmit,
}: {
  pattern: PatternDef;
  round: number;
  maxRounds: number;
  submitting: boolean;
  onSubmit: (fields: Record<string, string>) => void;
}) {
  const [fields, setFields] = useState(() => emptyFields(pattern));
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    setFields(emptyFields(pattern));
    setLocalError(null);
  }, [pattern]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    for (const f of pattern.fields) {
      if (fieldValue(fields, f.id).trim().length < f.minChars) {
        setLocalError(
          `「${f.label}」をもう少し具体的に（${f.minChars}字以上）`,
        );
        return;
      }
    }
    setLocalError(null);
    onSubmit(fields);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="text-[0.75rem] tracking-[0.14em] uppercase text-[var(--teal)]">
            {round + 1}/{maxRounds}
          </div>
          <h1 className="font-display text-[1.65rem] mt-1 leading-tight">
            {pattern.title}
          </h1>
          {pattern.hint && (
            <p className="text-[0.88rem] text-[var(--muted)] mt-2">
              {pattern.hint}
            </p>
          )}
        </div>
      </div>

      {pattern.fields.map((field) => {
        const value = fieldValue(fields, field.id);
        return (
          <label key={field.id} className="block space-y-2">
            <div className="text-[0.82rem] text-[var(--lamp)]">{field.label}</div>
            <textarea
              value={value}
              onChange={(e) =>
                setFields((prev) => ({ ...prev, [field.id]: e.target.value }))
              }
              placeholder={field.placeholder}
              rows={pattern.fields.length > 1 ? 4 : 7}
              className="w-full resize-y rounded-sm border border-[var(--line)] bg-[rgba(8,14,24,0.45)] px-3 py-3 text-[0.95rem] leading-relaxed text-[var(--paper)] placeholder:text-[rgba(232,224,212,0.35)] focus:outline-none focus:border-[var(--lamp)]"
            />
            <div className="text-[0.72rem] text-[var(--muted)]">
              {value.trim().length}/{field.minChars}字〜
            </div>
          </label>
        );
      })}

      {localError && (
        <p className="text-[0.85rem] text-[var(--danger)]">{localError}</p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="lamp-pulse w-full sm:w-auto min-w-[10rem] rounded-sm bg-[var(--lamp)] px-5 py-3 text-[0.95rem] font-medium text-[var(--ink)] disabled:opacity-60"
      >
        {submitting ? "読解中…" : round === 0 ? "診断する" : "続ける"}
      </button>
    </form>
  );
}
