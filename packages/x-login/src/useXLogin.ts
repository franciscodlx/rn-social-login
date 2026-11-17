import {
  useProviderLogin,
  type SignInOptions,
  type UseProviderLoginResult,
} from '@franciscodlx/rn-auth-core';
import { xLogin, type XLogin, type XProfile } from './provider';

/**
 * ```tsx
 * const { signIn, loading, error } = useXLogin({
 *   clientId,
 *   redirectUri: 'miapp://callback',
 * });
 * const result = await signIn(); // → { code, codeVerifier, redirectUri }
 * ```
 *
 * Pass `exchangeCode: true` to get `accessToken` and `profile` on the device.
 */
export function useXLogin(
  options: SignInOptions,
  login: XLogin = xLogin
): UseProviderLoginResult<XProfile> {
  return useProviderLogin(login, options);
}
