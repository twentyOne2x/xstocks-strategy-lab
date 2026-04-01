import { generateKeyPairSync, sign as signJwtPayload } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { createProviderRebalanceRequestDigest } from '/Users/user/PycharmProjects/xstocks-strategy-lab/packages/shared/src/rebalance.js';

function encodeBase64UrlJson(value) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function signEs256kJwt({ privateKey, kid, payload }) {
  const encodedHeader = encodeBase64UrlJson({ alg: 'ES256K', kid, typ: 'JWT' });
  const encodedPayload = encodeBase64UrlJson(payload);
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signature = signJwtPayload('sha256', Buffer.from(signingInput), {
    key: privateKey,
    dsaEncoding: 'ieee-p1363',
  });
  return `${signingInput}.${signature.toString('base64url')}`;
}

const endpoint = 'https://api-production-e70b.up.railway.app/api/internal/rebalances/provider-events';
const { privateKey } = generateKeyPairSync('ec', { namedCurve: 'secp256k1' });
const body = {
  version: '1',
  providerId: 'chainlink_cre',
  deliveryId: 'deployed_probe_delivery_1',
  eventId: 'deployed_probe_event_1',
  eventType: 'rebalance_review_requested',
  triggerMode: 'review_only',
  chain: 'ethereum',
  slotId: 'onboarding.default_basket',
  activationId: 'activation_provider_1',
  triggeredAt: new Date().toISOString(),
  summary: 'Deployed signed-event probe for XSL-011B.',
};
const requestDigest = createProviderRebalanceRequestDigest(body);
const nowSeconds = Math.floor(Date.now() / 1000);
const token = signEs256kJwt({
  privateKey,
  kid: 'deployed-probe-key',
  payload: {
    iss: '0x5555555555555555555555555555555555555555',
    sub: 'chainlink-cre-provider',
    aud: 'xstocks-provider-rebalance-review',
    iat: nowSeconds,
    exp: nowSeconds + 3600,
    jti: 'deployed_probe_jti_1',
    digest: requestDigest,
  },
});
const requestPayload = { ...body, requestDigest };
const response = await fetch(endpoint, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify(requestPayload),
});
const responseText = await response.text();
await writeFile('tmp/proof/xsl-011b/request.json', `${JSON.stringify({ endpoint, requestPayload }, null, 2)}\n`, 'utf8');
await writeFile('tmp/proof/xsl-011b/response.json', responseText.endsWith('\n') ? responseText : `${responseText}\n`, 'utf8');
console.log(JSON.stringify({ status: response.status }, null, 2));
console.log(responseText);
