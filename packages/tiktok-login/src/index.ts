export {
  tikTokLogin,
  tikTokProvider,
  createTikTokLogin,
  mapTikTokProfile,
  grantedTikTokScopes,
  tikTokUserInfoUrl,
  TIKTOK_AUTHORIZATION_ENDPOINT,
  TIKTOK_TOKEN_ENDPOINT,
  TIKTOK_REVOCATION_ENDPOINT,
  TIKTOK_USERINFO_ENDPOINT,
  TIKTOK_DEFAULT_SCOPES,
  TIKTOK_BASIC_FIELDS,
  TIKTOK_PROFILE_FIELDS,
} from './provider';
export type { TikTokProfile } from './provider';
export { useTikTokLogin } from './useTikTokLogin';
export type { TikTokSignInOptions } from './useTikTokLogin';
// Same error class and codes as every plugin of the family.
export { AuthError, isAuthError } from '@franciscodlx/rn-auth-core';
export type { AuthErrorCode, SignInResult } from '@franciscodlx/rn-auth-core';
