---
name: caveman-stats
description: >
  Show estimated token usage and caveman savings for the current session.
  Compatible with Antigravity IDE. Reads conversation transcript to estimate
  token counts. Triggers on /caveman-stats.
---

## How it works (Antigravity IDE)

When user triggers `/caveman-stats` or asks for token stats, the model MUST:

1. **Read transcript** from conversation logs:
   `<appDataDir>\brain\<conversation-id>\.system_generated\logs\transcript.jsonl`

2. **Count tokens** by estimating from character count:
   - ~4 characters per token (English/code average)
   - Count MODEL responses only (source = "MODEL", type includes "PLANNER_RESPONSE")
   - Count USER inputs separately

3. **Estimate caveman savings**:
   - If caveman was active: compare actual output vs estimated "normal" output (~1.5x multiplier)
   - If caveman was NOT active: estimate what savings WOULD have been (~60-75% reduction)

4. **Display formatted stats**:

```
🦴 CAVEMAN STATS — Session Report
═══════════════════════════════════
📊 Model output tokens:  ~{count}
📥 User input tokens:    ~{count}  
🔧 Tool call tokens:     ~{count}
📦 Total session:        ~{count}
───────────────────────────────────
💰 Estimated savings:    ~{percentage}% ({saved_tokens} tokens)
🔋 Caveman status:       {ACTIVE/INACTIVE}
🎚️  Intensity:            {lite/full/ultra}
═══════════════════════════════════
```

## Estimation method

- Read each line of transcript.jsonl
- For MODEL steps: sum `content` length / 4 = approx tokens
- For tool_calls: sum arguments length / 4 = approx tokens  
- Caveman savings = if responses average < 200 chars, caveman likely active → show actual savings
- If responses average > 400 chars, caveman likely NOT active → show potential savings

## Important

- These are ESTIMATES. Antigravity IDE does not expose exact token counts.
- Character-to-token ratio varies by language (Spanish ~3.5 chars/token, code ~3 chars/token).
- The model computes and displays these stats directly (no hook injection).
