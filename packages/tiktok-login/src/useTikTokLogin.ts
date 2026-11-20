import {
  useProviderLogin,
  type ProviderLogin,
  type SignInOptions,
  type UseProviderLoginResult,
} from '@franciscodlxdev/rn-auth-core';
import { tikTokLogin, type TikTokProfile } from './provider';

export type TikTokSignInOptions = Omit<SignInOptions, 'exchangeCode'>;

/**
 * ```tsx
 * const { signIn, loading, error } = useTikTokLogin({
 *   clientId, // the app's Client Key
 *   redirectUri: 'https://api.miapp.com/auth/tiktok/callback',
 *   callbackUri: 'miapp://callback',
 * });
 * const result = await signIn(); // → { code, redirectUri }
 * ```
 */
export function useTikTokLogin(
  options: TikTokSignInOptions,
  login: ProviderLogin<TikTokProfile> = tikTokLogin
): UseProviderLoginResult<TikTokProfile> {
  return useProviderLogin(login, options);
}
