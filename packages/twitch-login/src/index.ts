export {
  twitchLogin,
  twitchProvider,
  createTwitchLogin,
  mapTwitchProfile,
  twitchClaims,
  TWITCH_ISSUER,
  TWITCH_AUTHORIZATION_ENDPOINT,
  TWITCH_TOKEN_ENDPOINT,
  TWITCH_USERINFO_ENDPOINT,
  TWITCH_JWKS_URI,
  TWITCH_VALIDATE_ENDPOINT,
  TWITCH_REVOCATION_ENDPOINT,
  TWITCH_DEFAULT_SCOPES,
  TWITCH_DEFAULT_CLAIMS,
} from './provider';
export type { TwitchClaim, TwitchProfile } from './provider';
export { useTwitchLogin } from './useTwitchLogin';
export type { TwitchSignInOptions } from './useTwitchLogin';
// Same error class and codes as every plugin of the family.
export { AuthError, isAuthError } from '@franciscodlx/rn-auth-core';
export type { AuthErrorCode, SignInResult } from '@franciscodlx/rn-auth-core';
