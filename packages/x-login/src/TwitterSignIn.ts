import { AuthError } from '@franciscodlx/rn-auth-core';
import { xLogin, X_EMAIL_SCOPE, type XLogin } from './provider';

export interface TwitterSignInOptions {
  /** A Callback URI registered in the X app, e.g. `miapp://callback`. */
  redirectUri: string;
  /** Defaults to the package scopes plus `users.email`. */
  scopes?: string[];
  prefersEphemeralSession?: boolean;
  /** For tests or a custom instance. */
  login?: XLogin;
}

/** Same shape `react-native-twitter-signin` resolved `logIn()` with. */
export interface TwitterLoginData {
  /** OAuth 2.0 access token (it used to be the OAuth 1.0a token). */
  authToken: string;
  /** Always empty: OAuth 2.0 has no token secret. */
  authTokenSecret: string;
  userName: string;
  userID: string;
  /** Empty when the account has no confirmed email or the scope was not granted. */
  email: string;
  name: string;
  /** Only when `offline.access` is among the scopes. */
  refreshToken?: string;
}

let current:
  (TwitterSignInOptions & { clientId: string; login: XLogin }) | undefined;
let lastToken: string | undefined;
let warned = false;

function warnOnce(): void {
  if (!warned && __DEV__) {
    warned = true;
    console.warn(
      'TwitterSignIn is a compatibility layer for react-native-twitter-signin and will be removed. Use useXLogin() or xLogin.signIn().'
    );
  }
}

/**
 * Drop-in replacement for the default export of `react-native-twitter-signin`
 * on top of X OAuth 2.0 + PKCE.
 *
 * @deprecated Use `useXLogin()` or `xLogin`.
 */
export const TwitterSignIn = {
  /**
   * Before: `init(consumerKey, consumerSecret)`.
   * Now: `init(clientId, { redirectUri })`. There is no secret in the app.
   */
  init(clientId: string, options: TwitterSignInOptions): Promise<void> {
    warnOnce();
    if (typeof options !== 'object' || options === null) {
      return Promise.reject(
        new AuthError(
          'INVALID_CONFIG',
          'TwitterSignIn.init(clientId, { redirectUri }): the consumer secret is no longer used and must not ship in the app'
        )
      );
    }
    if (!clientId || !options.redirectUri) {
      return Promise.reject(
        new AuthError('INVALID_CONFIG', 'clientId and redirectUri are required')
      );
    }
    current = { ...options, clientId, login: options.login ?? xLogin };
    return Promise.resolve();
  },

  async logIn(): Promise<TwitterLoginData> {
    if (!current) {
      throw new AuthError(
        'INVALID_CONFIG',
        'Call TwitterSignIn.init(clientId, { redirectUri }) first'
      );
    }
    const { login, clientId, redirectUri, prefersEphemeralSession } = current;
    const result = await login.signIn({
      clientId,
      redirectUri,
      prefersEphemeralSession,
      scopes: current.scopes ?? [
        ...login.provider.defaultScopes,
        X_EMAIL_SCOPE,
      ],
      exchangeCode: true,
    });
    if (!result.accessToken || !result.profile) {
      throw new AuthError('PROVIDER_ERROR', 'X did not return a session');
    }
    lastToken = result.accessToken;
    return {
      authToken: result.accessToken,
      authTokenSecret: '',
      userName: result.profile.username,
      userID: result.profile.id,
      email: result.profile.email ?? '',
      name: result.profile.name ?? '',
      refreshToken: result.refreshToken,
    };
  },

  /** Revokes the access token of the last `logIn()`. */
  async logOut(): Promise<void> {
    const token = lastToken;
    lastToken = undefined;
    if (current && token) {
      await current.login.signOut({
        clientId: current.clientId,
        token,
        tokenTypeHint: 'access_token',
      });
    }
  },
};
