# Test Results — 2026-04-02

## Polymarket Tests: 6/6 PASS

| # | Scenario | Result | Output |
|---|----------|--------|--------|
| P1 | Real market, threshold met | PASS | 61.5% > 10% → triggered=true |
| P2 | Real market, threshold not met | PASS | 61.5% < 99% → triggered=false |
| P3 | "No" outcome, direction below | PASS | No at 38.5% < 90% → triggered=true |
| P4 | Invalid market ID | PASS | Graceful error: "Market 99999999 not found" |
| P5 | Empty market ID | PASS | Graceful error: "No marketId configured" |
| P6 | Polymarket → Notification chain | PASS | Expression resolution works end-to-end |

## Swap Tests: 10 scenarios, issues found

| # | Scenario | Result | Output |
|---|----------|--------|--------|
| SW1 | ETH→SOL | PASS | 1 ETH → 25.73 SOL, rate=25.86, dryRun |
| SW2 | BTC→ETH | PASS | 0.1 BTC → 3.22 ETH, rate=32.53, dryRun |
| SW3 | AAPLx→ETH (xStock) | **FAIL** | "Could not fetch price for AAPLx" — xStock symbols not mapped to CoinGecko |
| SW4 | Unknown token FOOBAR | PASS | Graceful error: "Could not fetch price for FOOBAR" |
| SW5 | Missing fromToken | PASS | Graceful error: "Both fromToken and toToken are required" |
| SW6 | Zero amount | PASS | Graceful error: "Amount must be greater than 0" |
| SW7 | Same token ETH→ETH | **FAIL** | "Could not fetch price for ETH" — CoinGecko 429 (rate limit) hit after many calls |
| SW8 | Price alert → Swap → Log | **FAIL** | CoinGecko 429 rate limit on price-alert step; swap also fails |
| SW9 | Large 10% slippage | **FAIL** | CoinGecko 429 rate limit |
| SW10 | Polymarket → Swap → Log | PASS | Market 63.5%, swapped $100 USDC → 0.048628 ETH |

## Issues Found (not fixed)

### 1. xStock symbols not mapped to CoinGecko (SW3)

The swap handler strips trailing 'x' from symbols (e.g., `AAPLx` → `AAPL`) and looks up the CoinGecko ID. But xStocks represent traditional stocks, and CoinGecko only tracks crypto. Stock symbols like `AAPL`, `GOOGL`, `V` won't have CoinGecko IDs.

**Impact:** xStocks tokens can be selected in the UI but swap quotes will fail.

**Fix options:**
1. Use a stock price API (e.g., Yahoo Finance, Alpha Vantage) for xStock underlying symbols
2. Or use the xStocks contract's on-chain price oracle if one exists
3. At minimum: detect xStock symbols and return a clearer error message

### 2. CoinGecko 429 rate limit (SW7, SW8, SW9)

CoinGecko free tier allows ~30 requests/minute. Running multiple test scenarios rapidly hits this limit. The swap handler and price-alert handler both call CoinGecko, and in chain scenarios (price-alert → swap) they double the call count.

**Impact:** Rapid sequential test runs or busy polling intervals will get rate-limited. Also affects the scheduler when multiple active workflows use price-alert triggers.

**Fix options:**
1. Add a simple in-memory cache (cache prices for 30-60 seconds)
2. Rate-limit outbound CoinGecko calls with a queue
3. Use CoinGecko's batch endpoint to fetch multiple prices in one call

### 3. Same-token swap not caught (SW7)

Swapping ETH→ETH should be caught as an error before calling CoinGecko, but instead it proceeds to fetch prices and fails due to rate limiting (or would return exchangeRate=1 with slippage loss).

**Fix:** Add validation: `if (fromSymbol === toSymbol) return error`

### 4. Expression resolution shows empty for missing values (SW8)

When price-alert fails (429), `currentPrice` is undefined. The Log Output message becomes `"ETH=$, swapped 1 ETH for  SOL"` — empty strings where values should be. This is correct behavior (missing refs → empty string), but the UX could show a clearer fallback.

**Not a bug** — working as designed. Could optionally add a `"N/A"` fallback for missing numeric refs.

## Previous Test Results (engine tests)

All 10 engine scenarios (S1-S10) passed after the condition handler boolean fix. See earlier in this file's git history.
