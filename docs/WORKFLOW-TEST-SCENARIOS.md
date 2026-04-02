# Workflow Engine Test Scenarios

Manual end-to-end tests run from the UI. For each scenario: build the workflow on the canvas, configure nodes, save, run, then check outputs in the Execution History panel.

> **Tip:** The "Log Output" node echoes its resolved `message` — use it as a terminal node to verify expression resolution.

---

## S1: Simple linear chain — basic expression resolution

**Workflow:** `X Post` → `Log Output`

**Config:**
- X Post: username = `@testuser`
- Log Output message: `Post by [X Post.username]: [X Post.text]`
  *(use the { } button to insert references)*

**Expected Log output:**
```
Post by @mockuser: Mock tweet content from @testuser
```

**Verifies:** Basic `{{nodeId.key}}` resolution, string interpolation with multiple expressions

---

## S2: Type preservation — number through condition

**Workflow:** `Price Alert` → `Condition` → `Log Output`

**Config:**
- Price Alert: token = `ETH`, direction = Above, price = `1000`
- Condition: field = `currentPrice`, operator = `>`, value = `1000`
- Log Output message: `Price result: [Condition.result], actual: [Condition.actual]`

**Expected:**
- Condition output: `result = true` (mock price is 3200.50)
- Log output: `Price result: true, actual: 3200.5`

**Verifies:** Condition handler evaluates numeric comparisons correctly, boolean/number types flow through expressions

---

## S3: Multi-expression in one field

**Workflow:** `Balance Monitor` → `Notification`

**Config:**
- Balance Monitor: address = `0xABC`, token = `ETH`, threshold = `1`
- Notification: channel = Email, message = `Wallet [Balance Monitor.address] has [Balance Monitor.balance] [Balance Monitor.token]`

**Expected Notification output message:**
```
Wallet 0xABC has 1.234 ETH
```

**Verifies:** Three separate expressions all resolve correctly within a single text field

---

## S4: Missing reference — graceful fallback

**Workflow:** `Every Period` → `Log Output`

**Config:**
- Every Period: interval = 1, unit = Hours
- Log Output message: type manually `Value: {{nonexistent.field}} and ` then insert `[Every Period.triggeredAt]`

**Expected Log output:**
```
Value:  and 2026-04-02T...
```
*(empty string where the missing ref was)*

**Verifies:** Missing references resolve to `""` without crashing the execution

---

## S5: Branching DAG — one trigger, two actions

**Workflow:**
```
X Post → Sentiment Analysis
X Post → Notification
```
*(draw two edges from the X Post trigger)*

**Config:**
- X Post: username = `@crypto`
- Sentiment: text = `[X Post.text]`
- Notification: channel = Push, message = `New post: [X Post.text]`

**Expected:**
- Sentiment completes with a score (0-1), label, and referencedAsset
- Notification output message: `New post: Mock tweet content from @crypto`
- Both branches execute successfully (both show "completed")

**Verifies:** DAG with fan-out from one trigger, topological sort handles multiple children

---

## S6: Three-node chain — chained expressions

**Workflow:** `X Post` → `Sentiment Analysis` → `Log Output`

**Config:**
- X Post: username = `@bullish`
- Sentiment: text = `[X Post.text]`
- Log Output message: `Sentiment: [Sentiment Analysis.score] ([Sentiment Analysis.label]) asset: [Sentiment Analysis.referencedAsset]`

**Expected Log output:**
```
Sentiment: 0.xx (positive/neutral/negative) asset: ...
```
*(actual values depend on mock tweet text and sentiment word matching)*

**Verifies:** Node C reads Node B's output, which was computed from Node A's output — chained expression resolution

---

## S7: Condition evaluation — boolean expression

**Workflow:** `Price Alert` → `Condition` → `Log Output`

**Config:**
- Price Alert: token = `BTC`, direction = Above, price = `500`
- Condition: field = `triggered`, operator = `==`, value = `true`
- Log Output message: `Alert triggered: [Condition.result]`

**Expected:**
- Condition output: `result = true` (mock always returns triggered=true)
- Log output: `Alert triggered: true`

**Verifies:** Condition handles boolean string comparison (`"true" == "true"`)

---

## S8: Polymarket trigger → Notification

**Workflow:** `Polymarket` → `Notification`

**Config:**
- Polymarket: search and select any market, outcome = Yes, threshold = 50, direction = Above
- Notification message: `Market '[Polymarket.question]' at [Polymarket.currentPrice]%`

**Expected Notification output message:**
```
Market '<selected question>' at <mock price>%
```

**Verifies:** Polymarket handler outputs resolve correctly through expressions

---

## S9: Object in text — type behavior

**Workflow:** `Webhook` → `Log Output`

**Config:**
- Webhook: (defaults)
- Log Output message: `Payload: [Webhook.payload]`

**Expected Log output:**
```
Payload: [object Object]
```

**Verifies:** When an object value is embedded in a mixed-text expression, it gets stringified (expected limitation — documents current behavior)

---

## S10: Disconnected node — still executes

**Workflow:**
- `X Post` → `Log Output` (connected)
- `Notification` (standalone, no edges)

**Config:**
- X Post: username = `@test`
- Log Output message: `Got: [X Post.text]`
- Notification: channel = Email, message = `Static message with no expressions`

**Expected:**
- All 3 nodes show "completed"
- Log output: `Got: Mock tweet content from @test`
- Notification output message: `Static message with no expressions`

**Verifies:** Disconnected nodes are still included in topological sort and execute with their static config

---

## Result Tracking

| # | Scenario | Pass/Fail | Notes |
|---|----------|-----------|-------|
| S1 | Simple linear chain | | |
| S2 | Type preservation | | |
| S3 | Multi-expression | | |
| S4 | Missing reference | | |
| S5 | Branching DAG | | |
| S6 | Three-node chain | | |
| S7 | Condition boolean | | |
| S8 | Polymarket trigger | | |
| S9 | Object in text | | |
| S10 | Disconnected node | | |
