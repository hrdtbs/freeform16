import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { Brand } from "../components/Brand";
import { ResultView } from "../components/ResultView";
import { fetchResult } from "../lib/api";
import type { PublicResult } from "../../shared/types";

export function ResultPage() {
  const { id } = useParams();
  const location = useLocation();
  const seeded = (location.state as { result?: PublicResult } | null)?.result;
  const [result, setResult] = useState<PublicResult | null>(
    seeded && seeded.id === id ? seeded : null,
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!result);

  useEffect(() => {
    if (!id) return;
    if (seeded && seeded.id === id) {
      setResult(seeded);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchResult(id)
      .then((data) => setResult(data.result))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id, seeded]);

  useEffect(() => {
    if (!result) return;
    document.title = `${result.type} / ${result.displayName} — freeform16`;
    const desc = result.narrative.slice(0, 120);
    upsertMeta("og:title", `${result.type}寄り — ${result.displayName}`);
    upsertMeta("og:description", desc);
    upsertMeta("description", desc);
  }, [result]);

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/r/${id}`
      : `/r/${id}`;

  return (
    <div className="relative z-10 mx-auto min-h-screen w-full max-w-2xl px-5 py-6 sm:py-10">
      <Brand />
      <main className="mt-10 sm:mt-14">
        {loading && (
          <p className="text-[var(--muted)]">記録を開いています…</p>
        )}
        {error && <p className="text-[var(--danger)]">{error}</p>}
        {result && <ResultView result={result} shareUrl={shareUrl} />}
      </main>
    </div>
  );
}

function upsertMeta(property: string, content: string) {
  const isOg = property.startsWith("og:");
  const selector = isOg
    ? `meta[property="${property}"]`
    : `meta[name="${property}"]`;
  let el = document.head.querySelector(selector) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    if (isOg) el.setAttribute("property", property);
    else el.setAttribute("name", property);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}
