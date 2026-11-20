export {
  linkedInLogin,
  linkedInProvider,
  createLinkedInLogin,
  mapLinkedInProfile,
  LINKEDIN_ISSUER,
  LINKEDIN_AUTHORIZATION_ENDPOINT,
  LINKEDIN_TOKEN_ENDPOINT,
  LINKEDIN_USERINFO_ENDPOINT,
  LINKEDIN_JWKS_URI,
  LINKEDIN_DEFAULT_SCOPES,
} from './provider';
export type { LinkedInProfile } from './provider';
export { useLinkedInLogin } from './useLinkedInLogin';
export type { LinkedInSignInOptions } from './useLinkedInLogin';
export { default as LinkedInModal } from './LinkedInModal';
export type {
  LinkedInModalPropTypes,
  LinkedInModalRef,
  LinkedInToken,
  ErrorType,
} from './LinkedInModal';
// Same error class and codes as every plugin of the family.
export { AuthError, isAuthError } from '@franciscodlxdev/rn-auth-core';
export type { AuthErrorCode, SignInResult } from '@franciscodlxdev/rn-auth-core';
