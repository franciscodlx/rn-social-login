import { createHash } from 'crypto';

/** In-memory stand-in for the native module, with real SHA-256. */
export function createNativeMock() {
  let counter = 0;
  return {
    isAvailable: jest.fn(() => true),
    randomBase64Url: jest.fn(
      (byteLength: number) => `rnd${byteLength}-${++counter}`
    ),
    sha256Base64Url: jest.fn((input: string) =>
      createHash('sha256').update(input).digest('base64url')
    ),
    openAuthSession: jest.fn<Promise<string>, [string, string, boolean]>(),
    cancelAuthSession: jest.fn(),
  };
}

export type NativeMock = ReturnType<typeof createNativeMock>;

/** Makes the fake browser approve: redirects back echoing `state`. */
export function approveWith(
  native: NativeMock,
  params: Record<string, string> = { code: 'the-code' }
) {
  native.openAuthSession.mockImplementation(async (url, redirectUri) => {
    const state = /[?&]state=([^&]+)/.exec(url)?.[1] ?? '';
    const query = Object.entries({ ...params, state })
      .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
      .join('&');
    return `${redirectUri}?${query}`;
  });
}

export function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(body),
  } as Response;
}

export function makeJwt(claims: Record<string, unknown>): string {
  const encode = (value: unknown) =>
    Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${encode({ alg: 'RS256' })}.${encode(claims)}.signature`;
}
