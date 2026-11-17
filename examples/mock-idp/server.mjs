// Local OAuth 2.0 / OpenID Connect provider for the example apps.
// It behaves like a real provider for a PUBLIC client: authorization code +
// PKCE (S256), no client secret. Not for production use.
//
// The client id `confidential-app` (secret `mock-secret`) behaves like
// providers that need a backend, e.g. LinkedIn: PKCE is optional and the token
// endpoint requires the client secret.
//
//   node server.mjs                  → consent page with Approve / Deny
//   MOCK_IDP_AUTO=approve node …     → redirects back immediately (for e2e)
//   MOCK_IDP_AUTO=deny node …        → always answers access_denied
//   MOCK_IDP_DENY_ERROR=user_cancelled_login → error code used when denying
import {
  createHash,
  createSign,
  generateKeyPairSync,
  randomBytes,
} from 'node:crypto';
import { createServer } from 'node:http';
import { pathToFileURL } from 'node:url';

const USER = {
  sub: 'user-123',
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  email_verified: true,
};

/** Clients that must authenticate with a secret at the token endpoint. */
export const CONFIDENTIAL_CLIENTS = { 'confidential-app': 'mock-secret' };

const b64url = (input) => Buffer.from(input).toString('base64url');
const sha256 = (input) =>
  createHash('sha256').update(input).digest('base64url');

export function createMockIdp({
  issuer = 'http://localhost:4000',
  auto = process.env.MOCK_IDP_AUTO ?? '',
  denyError = process.env.MOCK_IDP_DENY_ERROR || 'access_denied',
  log = () => {},
} = {}) {
  const { privateKey, publicKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
  });
  const jwk = {
    ...publicKey.export({ format: 'jwk' }),
    kid: 'mock-1',
    use: 'sig',
    alg: 'RS256',
  };
  const codes = new Map(); // code → pending authorization
  const tokens = new Set(); // live access tokens

  function signIdToken(claims) {
    const header = b64url(
      JSON.stringify({ alg: 'RS256', typ: 'JWT', kid: jwk.kid })
    );
    const payload = b64url(JSON.stringify(claims));
    const signature = createSign('RSA-SHA256')
      .update(`${header}.${payload}`)
      .sign(privateKey)
      .toString('base64url');
    return `${header}.${payload}.${signature}`;
  }

  function send(res, status, body, headers = {}) {
    const isJson = typeof body !== 'string';
    res.writeHead(status, {
      'Content-Type': isJson ? 'application/json' : 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      ...headers,
    });
    res.end(isJson ? JSON.stringify(body) : body);
  }

  const redirect = (res, to) => send(res, 302, '', { Location: to });

  function withParams(uri, params) {
    const query = new URLSearchParams(params).toString();
    return `${uri}${uri.includes('?') ? '&' : '?'}${query}`;
  }

  function authorize(url, res) {
    const q = Object.fromEntries(url.searchParams);
    if (!q.client_id || !q.redirect_uri) {
      return send(res, 400, '<h1>Missing client_id or redirect_uri</h1>');
    }
    const fail = (error, description) =>
      redirect(
        res,
        withParams(q.redirect_uri, {
          error,
          error_description: description,
          ...(q.state ? { state: q.state } : {}),
        })
      );

    if (q.response_type !== 'code') {
      return fail(
        'unsupported_response_type',
        'Only response_type=code is supported'
      );
    }
    const confidential = q.client_id in CONFIDENTIAL_CLIENTS;
    const hasPkce =
      Boolean(q.code_challenge) && q.code_challenge_method === 'S256';
    if (!hasPkce && (!confidential || q.code_challenge)) {
      return fail('invalid_request', 'PKCE with S256 is required');
    }

    const decision = url.searchParams.get('decision') ?? auto;
    if (decision === 'deny') {
      return fail(denyError, 'The user denied the request');
    }
    if (decision === 'approve') {
      const code = randomBytes(16).toString('base64url');
      codes.set(code, {
        clientId: q.client_id,
        redirectUri: q.redirect_uri,
        codeChallenge: q.code_challenge,
        nonce: q.nonce,
        scope: q.scope ?? '',
        expiresAt: Date.now() + 60_000,
      });
      log(`issued code for ${q.client_id}`);
      return redirect(
        res,
        withParams(q.redirect_uri, {
          code,
          ...(q.state ? { state: q.state } : {}),
        })
      );
    }

    const link = (value) => {
      const next = new URL(url);
      next.searchParams.set('decision', value);
      return `${next.pathname}${next.search}`.replace(/&/g, '&amp;');
    };
    return send(
      res,
      200,
      `<!doctype html><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Mock IdP</title>
<body style="font-family: system-ui; padding: 24px; max-width: 480px; margin: auto">
<h1>Mock IdP</h1>
<p><b>${escapeHtml(q.client_id)}</b> wants to sign you in as ${USER.name}.</p>
<p>Scopes: <code>${escapeHtml(q.scope ?? '(none)')}</code></p>
<p><a id="approve" href="${link('approve')}" style="display:block;padding:16px;background:#1f6feb;color:#fff;text-align:center;border-radius:8px;text-decoration:none">Approve</a></p>
<p><a id="deny" href="${link('deny')}" style="display:block;padding:16px;text-align:center">Deny</a></p>
</body>`
    );
  }

  function token(form, res) {
    const secret = CONFIDENTIAL_CLIENTS[form.client_id];
    if (secret !== undefined && form.client_secret !== secret) {
      return send(res, 401, {
        error: 'invalid_client',
        error_description: 'client_secret is missing or wrong',
      });
    }

    const invalid = (description) =>
      send(res, 400, {
        error: 'invalid_grant',
        error_description: description,
      });

    if (form.grant_type === 'refresh_token') {
      if (!form.refresh_token?.startsWith('rt-')) {
        return invalid('Unknown refresh token');
      }
    } else if (form.grant_type === 'authorization_code') {
      const pending = codes.get(form.code);
      codes.delete(form.code); // single use
      if (!pending || pending.expiresAt < Date.now()) {
        return invalid('Unknown or expired code');
      }
      if (
        pending.clientId !== form.client_id ||
        pending.redirectUri !== form.redirect_uri
      ) {
        return invalid(
          'client_id or redirect_uri does not match the authorization request'
        );
      }
      if (
        pending.codeChallenge &&
        (!form.code_verifier ||
          sha256(form.code_verifier) !== pending.codeChallenge)
      ) {
        return invalid('PKCE verification failed');
      }
      form.nonce = pending.nonce;
      form.scope = pending.scope;
    } else {
      return send(res, 400, { error: 'unsupported_grant_type' });
    }

    const accessToken = `at-${randomBytes(16).toString('base64url')}`;
    tokens.add(accessToken);
    const now = Math.floor(Date.now() / 1000);
    return send(res, 200, {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 3600,
      refresh_token: `rt-${randomBytes(16).toString('base64url')}`,
      scope: form.scope ?? '',
      id_token: signIdToken({
        iss: issuer,
        aud: form.client_id,
        iat: now,
        exp: now + 3600,
        ...(form.nonce ? { nonce: form.nonce } : {}),
        ...USER,
      }),
    });
  }

  async function readForm(req) {
    let body = '';
    for await (const chunk of req) {
      body += chunk;
    }
    return Object.fromEntries(new URLSearchParams(body));
  }

  return createServer(async (req, res) => {
    const url = new URL(req.url, issuer);
    log(`${req.method} ${url.pathname}`);
    try {
      if (
        req.method === 'GET' &&
        url.pathname === '/.well-known/openid-configuration'
      ) {
        return send(res, 200, {
          issuer,
          authorization_endpoint: `${issuer}/authorize`,
          token_endpoint: `${issuer}/token`,
          userinfo_endpoint: `${issuer}/userinfo`,
          revocation_endpoint: `${issuer}/revoke`,
          jwks_uri: `${issuer}/jwks`,
          response_types_supported: ['code'],
          code_challenge_methods_supported: ['S256'],
          id_token_signing_alg_values_supported: ['RS256'],
        });
      }
      if (req.method === 'GET' && url.pathname === '/jwks') {
        return send(res, 200, { keys: [jwk] });
      }
      if (req.method === 'GET' && url.pathname === '/authorize') {
        return authorize(url, res);
      }
      if (req.method === 'POST' && url.pathname === '/token') {
        return token(await readForm(req), res);
      }
      if (req.method === 'GET' && url.pathname === '/userinfo') {
        const bearer = (req.headers.authorization ?? '').replace(
          /^Bearer /i,
          ''
        );
        return tokens.has(bearer)
          ? send(res, 200, USER)
          : send(res, 401, { error: 'invalid_token' });
      }
      if (req.method === 'POST' && url.pathname === '/revoke') {
        tokens.delete((await readForm(req)).token);
        return send(res, 200, {});
      }
      return send(res, 404, { error: 'not_found' });
    } catch (error) {
      return send(res, 500, {
        error: 'server_error',
        error_description: String(error),
      });
    }
  });
}

function escapeHtml(value) {
  return String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        c
      ]
  );
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const port = Number(process.env.PORT ?? 4000);
  createMockIdp({ log: (line) => console.log(`[mock-idp] ${line}`) }).listen(
    port,
    () => {
      console.log(
        `[mock-idp] http://localhost:${port} (auto: ${process.env.MOCK_IDP_AUTO || 'off'})`
      );
    }
  );
}
