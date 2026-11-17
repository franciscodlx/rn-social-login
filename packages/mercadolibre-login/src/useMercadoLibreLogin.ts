import { useMemo } from 'react';
import {
  useProviderLogin,
  type ProviderLogin,
  type SignInOptions,
  type UseProviderLoginResult,
} from '@franciscodlx/rn-auth-core';
import {
  createMercadoLibreLogin,
  type MercadoLibreCountry,
  type MercadoLibreProfile,
} from './provider';

export interface MercadoLibreSignInOptions extends Omit<
  SignInOptions,
  'exchangeCode'
> {
  country: MercadoLibreCountry;
}

/**
 * ```tsx
 * const { signIn, loading, error } = useMercadoLibreLogin({
 *   country: 'MX',
 *   clientId,
 *   redirectUri: 'https://api.miapp.com/auth/mercadolibre/callback',
 *   callbackUri: 'miapp://callback',
 * });
 * const result = await signIn(); // → { code, codeVerifier, redirectUri }
 * ```
 */
export function useMercadoLibreLogin(
  { country, ...options }: MercadoLibreSignInOptions,
  login?: ProviderLogin<MercadoLibreProfile>
): UseProviderLoginResult<MercadoLibreProfile> {
  const instance = useMemo(
    () => login ?? createMercadoLibreLogin({ country }),
    [login, country]
  );
  return useProviderLogin(instance, options);
}
