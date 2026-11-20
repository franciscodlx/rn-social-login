import { useMemo } from 'react';
import {
  useProviderLogin,
  type ProviderLogin,
  type UseProviderLoginResult,
} from '@franciscodlxdev/rn-auth-core';
import { createPresetLogin, type PresetSignInOptions } from './login';
import type { PresetName, PresetProfile } from './presets';

/**
 * ```tsx
 * const { signIn, loading, error } = useOAuthPreset('github', {
 *   clientId,
 *   redirectUri: 'https://api.miapp.com/auth/github/callback',
 *   callbackUri: 'miapp://callback',
 * });
 * const result = await signIn(); // → { code, codeVerifier?, nonce?, redirectUri }
 * ```
 */
export function useOAuthPreset(
  preset: PresetName,
  options: PresetSignInOptions,
  login?: ProviderLogin<PresetProfile>
): UseProviderLoginResult<PresetProfile> {
  const instance = useMemo(
    () => login ?? createPresetLogin(preset),
    [login, preset]
  );
  return useProviderLogin(instance, options);
}
