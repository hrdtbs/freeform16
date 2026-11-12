import { Link } from "react-router-dom";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <header className="flex items-center justify-between gap-4">
      <Link to="/" className="group no-underline">
        <div className="font-display text-[1.15rem] tracking-[0.04em] text-[var(--paper)] group-hover:text-[var(--lamp)] transition-colors">
          freeform16
        </div>
        {!compact && (
          <div className="text-[0.72rem] text-[var(--muted)] mt-0.5">
            自由入力16タイプ診断
          </div>
        )}
      </Link>
      <Link
        to="/ranking"
        className="text-[0.78rem] text-[var(--muted)] hover:text-[var(--lamp)] no-underline"
      >
        ランキング
      </Link>
    </header>
  );
}
