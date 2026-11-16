import { getNativeModule } from './native';

export interface PkcePair {
  /** Keep it in memory and send it with the code to the token endpoint. */
  codeVerifier: string;
  /** `BASE64URL(SHA256(codeVerifier))`, sent in the authorization request. */
  codeChallenge: string;
  codeChallengeMethod: 'S256';
}

/** URL-safe random string backed by the platform CSPRNG. */
export function randomString(byteLength = 32): string {
  return getNativeModule().randomBase64Url(byteLength);
}

/** RFC 7636 verifier/challenge pair (S256). 32 random bytes → 43 chars. */
export function createPkcePair(): PkcePair {
  const native = getNativeModule();
  const codeVerifier = native.randomBase64Url(32);
  return {
    codeVerifier,
    codeChallenge: native.sha256Base64Url(codeVerifier),
    codeChallengeMethod: 'S256',
  };
}
