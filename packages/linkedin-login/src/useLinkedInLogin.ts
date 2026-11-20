import {
  useProviderLogin,
  type ProviderLogin,
  type SignInOptions,
  type UseProviderLoginResult,
} from '@franciscodlxdev/rn-auth-core';
import { linkedInLogin, type LinkedInProfile } from './provider';

export type LinkedInSignInOptions = Omit<SignInOptions, 'exchangeCode'>;

/**
 * ```tsx
 * const { signIn, loading, error } = useLinkedInLogin({
 *   clientId,
 *   redirectUri: 'https://api.miapp.com/auth/linkedin/callback',
 *   callbackUri: 'miapp://callback',
 * });
 * const result = await signIn(); // → { code, state, redirectUri }
 * ```
 */
export function useLinkedInLogin(
  options: LinkedInSignInOptions,
  login: ProviderLogin<LinkedInProfile> = linkedInLogin
): UseProviderLoginResult<LinkedInProfile> {
  return useProviderLogin(login, options);
}
