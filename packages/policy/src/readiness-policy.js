import { assertPromotedActivationManifest } from "./manifest.js";
import { deriveCanonicalWalletRequirements } from "./wallet-requirements.js";

export function deriveReadinessWalletRequirements(activationManifest) {
  const manifest = assertPromotedActivationManifest(activationManifest);
  return deriveCanonicalWalletRequirements(
    manifest,
    manifest.walletRequirements ?? {},
  );
}
