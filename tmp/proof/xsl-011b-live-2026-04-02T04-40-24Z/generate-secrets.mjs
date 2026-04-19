import { writeFileSync } from "node:fs";

import {
  generatePrivateKey,
  privateKeyToAccount,
} from "/Users/user/PycharmProjects/xstocks-strategy-lab-xsl-011b/apps/web/node_modules/viem/_esm/accounts/index.js";

const dir = "tmp/proof/xsl-011b-live-2026-04-02T04-40-24Z";

function toJwk(publicKey) {
  const hex = publicKey.slice(4);
  const x = Buffer.from(hex.slice(0, 64), "hex").toString("base64url");
  const y = Buffer.from(hex.slice(64), "hex").toString("base64url");
  return {
    kty: "EC",
    crv: "secp256k1",
    x,
    y,
  };
}

const providerPrivateKey = generatePrivateKey();
const providerAccount = privateKeyToAccount(providerPrivateKey);
const providerKid = "xsl011b-provider-hot-20260402";
const providerAllowlist = [
  {
    address: providerAccount.address.toLowerCase(),
    providerIds: ["chainlink_cre"],
    kid: providerKid,
    jwk: toJwk(providerAccount.publicKey),
  },
];

const treasuryPrivateKey = generatePrivateKey();
const treasuryAccount = privateKeyToAccount(treasuryPrivateKey);

writeFileSync(
  `${dir}/provider-signer.secret.json`,
  `${JSON.stringify(
    {
      issuerAddress: providerAccount.address.toLowerCase(),
      kid: providerKid,
      privateKey: providerPrivateKey,
      publicJwk: providerAllowlist[0].jwk,
      allowlistJson: JSON.stringify(providerAllowlist),
    },
    null,
    2,
  )}\n`,
);

writeFileSync(
  `${dir}/hot-treasury.secret.json`,
  `${JSON.stringify(
    {
      ownerUserId: "did:xstocks:hot_treasury_xsl011b",
      issuer: "internal://xsl011b/hot-treasury",
      walletAddress: treasuryAccount.address.toLowerCase(),
      privateKey: treasuryPrivateKey,
    },
    null,
    2,
  )}\n`,
);

writeFileSync(
  `${dir}/provider-allowlist.public.json`,
  `${JSON.stringify(providerAllowlist, null, 2)}\n`,
);

console.log(
  JSON.stringify(
    {
      dir,
      providerAddress: providerAccount.address.toLowerCase(),
      hotTreasuryWallet: treasuryAccount.address.toLowerCase(),
    },
    null,
    2,
  ),
);
