import { useCallback, useEffect, useRef, useState } from 'react';
import { AuthError, toAuthError } from './errors';
import type {
  ProviderLogin,
  SignInOptions,
  SignInResult,
  SignOutOptions,
} from './provider';

export interface UseProviderLoginResult<TProfile> {
  /** Resolves with the result, or `null` if it failed (see `error`). */
  signIn(
    overrides?: Partial<SignInOptions>
  ): Promise<SignInResult<TProfile> | null>;
  signOut(options?: SignOutOptions): Promise<void>;
  loading: boolean;
  result: SignInResult<TProfile> | null;
  /** Last failure. A user cancellation is reported with code `CANCELLED`. */
  error: AuthError | null;
  isAvailable: boolean;
}

/** React state around a provider's `signIn` / `signOut`. */
export function useProviderLogin<TProfile>(
  login: ProviderLogin<TProfile>,
  options: SignInOptions
): UseProviderLoginResult<TProfile> {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SignInResult<TProfile> | null>(null);
  const [error, setError] = useState<AuthError | null>(null);
  const mounted = useRef(true);
  const latestOptions = useRef(options);
  latestOptions.current = options;

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const signIn = useCallback(
    async (overrides?: Partial<SignInOptions>) => {
      setLoading(true);
      setError(null);
      setResult(null);
      try {
        const next = await login.signIn({
          ...latestOptions.current,
          ...overrides,
        });
        if (mounted.current) {
          setResult(next);
        }
        return next;
      } catch (e) {
        if (mounted.current) {
          setError(toAuthError(e));
        }
        return null;
      } finally {
        if (mounted.current) {
          setLoading(false);
        }
      }
    },
    [login]
  );

  const signOut = useCallback(
    async (signOutOptions?: SignOutOptions) => {
      await login.signOut({
        clientId: latestOptions.current.clientId,
        ...signOutOptions,
      });
      if (mounted.current) {
        setResult(null);
        setError(null);
      }
    },
    [login]
  );

  return {
    signIn,
    signOut,
    loading,
    result,
    error,
    isAvailable: login.isAvailable(),
  };
}
