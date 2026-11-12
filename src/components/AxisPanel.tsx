import { AXIS_META } from "../../shared/patterns";
import type { AxisId, AxisScore } from "../../shared/types";

const ORDER: AxisId[] = ["ei", "sn", "tf", "jp"];

function stateLabel(state: AxisScore["state"]) {
  if (state === "settled") return "確定";
  if (state === "borderline") return "境界";
  return "情報不足";
}

export function AxisPanel({
  axes,
  animate = true,
}: {
  axes: Record<AxisId, AxisScore>;
  animate?: boolean;
}) {
  return (
    <div className="space-y-5">
      {ORDER.map((id, i) => {
        const axis = axes[id];
        const meta = AXIS_META[id];
        const left = ((axis.pole + 1) / 2) * 100;
        return (
          <div
            key={id}
            className={animate ? "ink-bleed" : undefined}
            style={animate ? { animationDelay: `${i * 90}ms` } : undefined}
          >
            <div className="flex items-baseline justify-between gap-3 mb-2 text-[0.86rem]">
              <div>
                <span className="text-[var(--muted)]">{meta.negLabel}</span>{" "}
                <span className="font-display text-[1.05rem]">{meta.neg}</span>
                <span className="text-[var(--muted)] mx-2">—</span>
                <span className="font-display text-[1.05rem]">{meta.pos}</span>{" "}
                <span className="text-[var(--muted)]">{meta.posLabel}</span>
              </div>
              <div className="text-[0.75rem] text-[var(--teal)] whitespace-nowrap">
                {stateLabel(axis.state)}
              </div>
            </div>
            <div className="relative h-3 rounded-sm bg-[rgba(232,224,212,0.08)] border border-[var(--line)]">
              <div className="absolute inset-y-0 left-1/2 w-px bg-[rgba(232,224,212,0.25)]" />
              <div
                className={`needle absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 -translate-x-1/2 rounded-sm bg-[var(--lamp)] ${
                  axis.state === "low_signal" ? "opacity-50" : ""
                }`}
                style={{ left: `${left}%` }}
              />
            </div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[0.78rem] text-[var(--muted)]">
              <span>
                傾き{" "}
                <strong className="text-[var(--paper)] font-medium">
                  {axis.letter} {axis.leanPercent}%
                </strong>
              </span>
              <span>
                信用度{" "}
                <strong className="text-[var(--paper)] font-medium">
                  {Math.round(axis.confidence * 100)}%
                </strong>
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
