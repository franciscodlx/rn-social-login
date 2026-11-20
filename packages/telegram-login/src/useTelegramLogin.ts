import {
  useProviderLogin,
  type ProviderLogin,
  type SignInOptions,
  type UseProviderLoginResult,
} from '@franciscodlxdev/rn-auth-core';
import { telegramLogin, type TelegramProfile } from './provider';

export type TelegramSignInOptions = Omit<SignInOptions, 'exchangeCode'>;

/**
 * ```tsx
 * const { signIn, loading, error } = useTelegramLogin({
 *   clientId, // Client ID shown by BotFather
 *   redirectUri: 'https://api.miapp.com/auth/telegram/callback',
 *   callbackUri: 'miapp://callback',
 * });
 * const result = await signIn(); // → { code, codeVerifier, redirectUri }
 * ```
 */
export function useTelegramLogin(
  options: TelegramSignInOptions,
  login: ProviderLogin<TelegramProfile> = telegramLogin
): UseProviderLoginResult<TelegramProfile> {
  return useProviderLogin(login, options);
}
