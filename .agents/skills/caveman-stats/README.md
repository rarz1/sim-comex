# caveman-stats

Estimated session token usage. Compatible with Antigravity IDE.

## What it does

Reads the conversation transcript (`transcript.jsonl`) from the current Antigravity session and estimates input/output token usage plus caveman savings. Uses character-to-token ratio (~4 chars/token for English/code, ~3.5 for Spanish).

**Note**: These are estimates. Antigravity IDE does not expose exact token counts like Claude Code does.

## How to invoke

```
/caveman-stats
```

Or ask: "token stats", "cuántos tokens", "caveman stats"

## Example output

```
🦴 CAVEMAN STATS — Session Report
═══════════════════════════════════
📊 Model output tokens:  ~4,200
📥 User input tokens:    ~1,100
🔧 Tool call tokens:     ~8,500
📦 Total session:        ~13,800
───────────────────────────────────
💰 Estimated savings:    ~62% (5,400 tokens)
🔋 Caveman status:       ACTIVE
🎚️  Intensity:            full
═══════════════════════════════════
```

## Differences from Claude Code version

| Feature | Claude Code | Antigravity IDE |
|---------|-------------|-----------------|
| Token source | Session JSONL log (exact) | Transcript JSONL (estimated) |
| Computation | Hook-injected (caveman-mode-tracker.js) | Model-computed from transcript |
| Accuracy | Exact token counts | ~±15% estimate |
| Statusline badge | ⛏ suffix file | Not supported |

## See also

- [`SKILL.md`](./SKILL.md) — estimation method and format
