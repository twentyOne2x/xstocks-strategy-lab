# CoW Quote Sweep

- Generated at: 2026-04-01T18:56:04.549Z
- Proof mode: hosted_quote_sweep
- API base URL: https://api-production-e70b.up.railway.app
- Slot ID: onboarding.default_basket
- Manifest ID: onboarding.default_basket:basket-starter-h6-p100-c5-cap18-a0-r300-v1:promoted
- Ladder: 25, 50, 100, 250, 500
- Minimum executable gross notional USD: not_found
- Strongest truthful claim: Hosted linked-wallet quote-only sweep across 25, 50, 100, 250, 500 USD gross proves the promoted basket does not become all-leg quoteable in the tested band; structurally blocked assets on current CoW venue truth are MSFTx, AAPLx, METAx, AMZNx, GOOGLx.
- Structurally blocked assets: MSFTx, AAPLx, METAx, AMZNx, GOOGLx

## Matrix

- 25 USD: allActionableLegsQuoteable=no; approvalReadyAssets=NVDAx; blockedAssets=MSFTx:cow_internal_server_error, AAPLx:cow_internal_server_error, METAx:cow_internal_server_error, AMZNx:cow_internal_server_error, GOOGLx:cow_internal_server_error
- 50 USD: allActionableLegsQuoteable=no; approvalReadyAssets=NVDAx; blockedAssets=MSFTx:cow_internal_server_error, AAPLx:cow_internal_server_error, METAx:cow_no_liquidity, AMZNx:cow_internal_server_error, GOOGLx:cow_no_liquidity
- 100 USD: allActionableLegsQuoteable=no; approvalReadyAssets=NVDAx; blockedAssets=MSFTx:cow_no_liquidity, AAPLx:cow_no_liquidity, METAx:cow_no_liquidity, AMZNx:cow_no_liquidity, GOOGLx:cow_no_liquidity
- 250 USD: allActionableLegsQuoteable=no; approvalReadyAssets=NVDAx; blockedAssets=MSFTx:cow_no_liquidity, AAPLx:cow_no_liquidity, METAx:cow_no_liquidity, AMZNx:cow_no_liquidity, GOOGLx:cow_no_liquidity
- 500 USD: allActionableLegsQuoteable=no; approvalReadyAssets=NVDAx; blockedAssets=MSFTx:cow_no_liquidity, AAPLx:cow_no_liquidity, METAx:cow_no_liquidity, AMZNx:cow_no_liquidity, GOOGLx:cow_no_liquidity

## Assets

- NVDAx: 25=awaiting_approval, 50=awaiting_approval, 100=awaiting_approval, 250=awaiting_approval, 500=awaiting_approval
- MSFTx: 25=blocked(cow_internal_server_error), 50=blocked(cow_internal_server_error), 100=blocked(cow_no_liquidity), 250=blocked(cow_no_liquidity), 500=blocked(cow_no_liquidity)
- AAPLx: 25=blocked(cow_internal_server_error), 50=blocked(cow_internal_server_error), 100=blocked(cow_no_liquidity), 250=blocked(cow_no_liquidity), 500=blocked(cow_no_liquidity)
- METAx: 25=blocked(cow_internal_server_error), 50=blocked(cow_no_liquidity), 100=blocked(cow_no_liquidity), 250=blocked(cow_no_liquidity), 500=blocked(cow_no_liquidity)
- AMZNx: 25=blocked(cow_internal_server_error), 50=blocked(cow_internal_server_error), 100=blocked(cow_no_liquidity), 250=blocked(cow_no_liquidity), 500=blocked(cow_no_liquidity)
- GOOGLx: 25=blocked(cow_internal_server_error), 50=blocked(cow_no_liquidity), 100=blocked(cow_no_liquidity), 250=blocked(cow_no_liquidity), 500=blocked(cow_no_liquidity)
