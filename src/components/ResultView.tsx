import { useState } from "react";
import { Link } from "react-router-dom";
import type { PublicResult } from "../../shared/types";
import { AxisPanel } from "./AxisPanel";

export function ResultView({
  result,
  shareUrl,
}: {
  result: PublicResult;
  shareUrl: string;
}) {
  const [copied, setCopied] = useState<"link" | "text" | null>(null);
  const conf = Math.round(result.overallConfidence * 100);

  async function copy(kind: "link" | "text") {
    const value =
      kind === "link"
        ? shareUrl
        : `${result.shareText}\n${shareUrl}`;
    await navigator.clipboard.writeText(value);
    setCopied(kind);
    if (navigator.share && kind === "link") {
      try {
        await navigator.share({
          title: `freeform16 / ${result.displayName}`,
          text: result.shareText,
          url: shareUrl,
        });
      } catch {
        // user cancelled share sheet — clipboard already done
      }
    }
    setTimeout(() => setCopied(null), 1600);
  }

  return (
    <div className="space-y-8 ink-bleed">
      {result.status === "low_confidence" && (
        <div className="paper-panel rounded-sm px-4 py-3 text-[0.88rem] text-[var(--lamp)]">
          情報が足りず、確信度は低めの結果です。軸の内訳と読解は「今回の記録から見える範囲」として読んでください。
        </div>
      )}

      {result.usingMock && (
        <div className="text-[0.75rem] text-[var(--muted)]">
          ※ GEMINI_API_KEY 未設定のため、サンプル採点で動作しています
        </div>
      )}

      <section className="space-y-2">
        <div className="text-[0.75rem] tracking-[0.14em] uppercase text-[var(--teal)]">
          {result.displayName}
        </div>
        <h1 className="font-display text-[2.2rem] leading-none">
          {result.type}{" "}
          <span className="text-[1.1rem] text-[var(--muted)]">
            {result.status === "confident" ? "寄り" : "の可能性"}
          </span>
        </h1>
        <p className="text-[1.05rem] text-[var(--lamp)] font-display">
          {result.title}
        </p>
        <p className="text-[0.9rem] text-[var(--muted)]">信用度 {conf}%</p>
      </section>

      <section className="paper-panel rounded-sm p-5">
        <h2 className="font-display text-[1.15rem] mb-4">4軸の内訳</h2>
        <AxisPanel axes={result.axes} />
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-[1.15rem]">読解</h2>
        <div className="whitespace-pre-wrap text-[0.95rem] leading-7 text-[rgba(232,224,212,0.92)]">
          {result.narrative}
        </div>
      </section>

      <section className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => copy("link")}
          className="lamp-pulse rounded-sm bg-[var(--lamp)] px-4 py-2.5 text-[0.9rem] font-medium text-[var(--ink)]"
        >
          {copied === "link" ? "コピーした" : "結果をシェア"}
        </button>
        <button
          type="button"
          onClick={() => copy("text")}
          className="rounded-sm border border-[var(--line)] px-4 py-2.5 text-[0.9rem] text-[var(--paper)]"
        >
          {copied === "text" ? "コピーした" : "文章をコピー"}
        </button>
        <Link
          to="/ranking"
          className="rounded-sm border border-[var(--line)] px-4 py-2.5 text-[0.9rem] text-[var(--paper)] no-underline"
        >
          ランキング
        </Link>
      </section>

      <p className="text-[0.72rem] text-[var(--muted)]">
        娯楽・自己理解用です。公式MBTIではありません。記録は90日で失効します。
      </p>
    </div>
  );
}
