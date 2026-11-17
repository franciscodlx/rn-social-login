import {
  useProviderLogin,
  type ProviderLogin,
  type SignInOptions,
  type UseProviderLoginResult,
} from '@franciscodlx/rn-auth-core';
import { twitchLogin, type TwitchProfile } from './provider';

export type TwitchSignInOptions = Omit<SignInOptions, 'exchangeCode'>;

/**
 * ```tsx
 * const { signIn, loading, error } = useTwitchLogin({
 *   clientId,
 *   redirectUri: 'https://api.miapp.com/auth/twitch/callback',
 *   callbackUri: 'miapp://callback',
 * });
 * const result = await signIn(); // → { code, nonce, redirectUri }
 * ```
 */
export function useTwitchLogin(
  options: TwitchSignInOptions,
  login: ProviderLogin<TwitchProfile> = twitchLogin
): UseProviderLoginResult<TwitchProfile> {
  return useProviderLogin(login, options);
}
