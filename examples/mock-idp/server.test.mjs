import assert from 'node:assert/strict';
import { createHash, createPublicKey, createVerify } from 'node:crypto';
import { after, before, test } from 'node:test';
import { createMockIdp } from './server.mjs';

let server;
let base;

before(async () => {
  server = createMockIdp();
  await new Promise((resolve) => server.listen(0, resolve));
  base = `http://localhost:${server.address().port}`;
});
after(() => server.close());

const verifier = 'a'.repeat(43);
const challenge = createHash('sha256').update(verifier).digest('base64url');

async function getCode(extra = {}) {
  const query = new URLSearchParams({
    response_type: 'code',
    client_id: 'app',
    redirect_uri: 'myapp://callback',
    state: 's1',
    nonce: 'n1',
    code_challenge: challenge,
    code_challenge_method: 'S256',
    decision: 'approve',
    ...extra,
  });
  const res = await fetch(`${base}/authorize?${query}`, { redirect: 'manual' });
  return new URL(res.headers.get('location'));
}

const exchange = (form) =>
  fetch(`${base}/token`, { method: 'POST', body: new URLSearchParams(form) });

test('full code + PKCE flow returns tokens and a signed id_token', async () => {
  const location = await getCode();
  assert.equal(location.searchParams.get('state'), 's1');

  const res = await exchange({
    grant_type: 'authorization_code',
    code: location.searchParams.get('code'),
    client_id: 'app',
    redirect_uri: 'myapp://callback',
    code_verifier: verifier,
  });
  assert.equal(res.status, 200);
  const tokens = await res.json();

  const [header, payload, signature] = tokens.id_token.split('.');
  const claims = JSON.parse(Buffer.from(payload, 'base64url'));
  assert.equal(claims.nonce, 'n1');
  assert.equal(claims.aud, 'app');

  const { keys } = await (await fetch(`${base}/jwks`)).json();
  const valid = createVerify('RSA-SHA256')
    .update(`${header}.${payload}`)
    .verify(
      createPublicKey({ key: keys[0], format: 'jwk' }),
      signature,
      'base64url'
    );
  assert.equal(valid, true);

  const userinfo = await fetch(`${base}/userinfo`, {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  assert.equal((await userinfo.json()).email, 'ada@example.com');
});

test('a wrong verifier is rejected and the code cannot be reused', async () => {
  const code = (await getCode()).searchParams.get('code');
  const form = {
    grant_type: 'authorization_code',
    code,
    client_id: 'app',
    redirect_uri: 'myapp://callback',
  };
  const bad = await exchange({ ...form, code_verifier: 'b'.repeat(43) });
  assert.equal(bad.status, 400);
  const replay = await exchange({ ...form, code_verifier: verifier });
  assert.equal(replay.status, 400);
});

test('requests without PKCE and denied requests redirect with an error', async () => {
  const noPkce = await getCode({ code_challenge_method: 'plain' });
  assert.equal(noPkce.searchParams.get('error'), 'invalid_request');
  const denied = await getCode({ decision: 'deny' });
  assert.equal(denied.searchParams.get('error'), 'access_denied');
  assert.equal(denied.searchParams.get('state'), 's1');
});
