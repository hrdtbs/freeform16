# freeform16

自由入力16タイプ診断。最近の一場面を書いて、4軸（E/I・S/N・T/F・J/P）の傾きと信用度を読みます。

世界観は「記録灯」。公式MBTIではありません。

## できること

- なまえ入力 → CBT風の自由記述（場面 / 考え / 行動 / あと味）
- Gemini Decisions API で4軸を確率採点（キー未設定時はヒューリスティックで動作）
- 信用度が足りなければ追記質問（最大4ラウンド）
- 結果URL `/r/:id` でシェア（公開ペイロードのみ、生回答は保存しない）
- 信頼度ランキング / タイプランキング
- 結果は90日で失効（D1）

## 技術

- React + Vite + Tailwind
- Cloudflare Workers（Hono）+ D1
- `@cloudflare/vite-plugin`

## ローカル起動

```bash
npm install
npm run db:migrate:local
npm run dev
```

開く URL: http://127.0.0.1:4177

### Gemini Decisions API

```bash
# .dev.vars
GEMINI_API_KEY=your_key_here
```

未設定でもモック採点で一通り動作します。

## Cloudflare へデプロイ

```bash
npx wrangler d1 create freeform16
# wrangler.jsonc の database_id を更新
npx wrangler d1 migrations apply freeform16 --remote
npx wrangler secret put GEMINI_API_KEY
npm run deploy
```

## 注意

- 試験展開のため、ワンショットロックは未実装（何度でも診断可）
- ランキングは連投で操作可能
- 採用・医療判断には使わないでください
