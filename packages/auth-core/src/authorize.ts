import { AuthError, toAuthError } from './errors';
import { getNativeModule } from './native';
import {
  appendParams,
  getScheme,
  matchesRedirectUri,
  parseRedirectParams,
  type Params,
} from './url';

export interface AuthorizeRequest {
  authorizationEndpoint: string;
  clientId: string;
  /** Custom scheme (`myapp://callback`) or https Universal/App Link. */
  redirectUri: string;
  scopes?: string[];
  /** Defaults to a space, as in RFC 6749. Some providers use a comma. */
  scopeSeparator?: string;
  /** Defaults to true. Only disable for providers that reject PKCE. */
  usePKCE?: boolean;
  /** Sends an OpenID Connect `nonce`. Enable when requesting an `id_token`. */
  useNonce?: boolean;
  /** Extra authorization parameters (`prompt`, `login_hint`, …). */
  extraParams?: Record<string, string>;
  /** Name of the client id parameter. Defaults to `client_id`. */
  clientIdParam?: string;
  /** iOS: do not share cookies with Safari. Android: ephemeral Custom Tab when supported. */
  prefersEphemeralSession?: boolean;
}

export interface AuthorizeResult {
  /** Authorization code to exchange at the token endpoint. */
  code: string;
  /** PKCE verifier to send along with the code. Undefined when PKCE is off. */
  codeVerifier?: string;
  state: string;
  /** Nonce the `id_token` must carry. Undefined unless `useNonce` is set. */
  nonce?: string;
  redirectUri: string;
  /** Every parameter the provider sent back in the redirect. */
  params: Params;
}

let inProgress = false;

function assertConfig(request: AuthorizeRequest): void {
  const missing = (
    ['authorizationEndpoint', 'clientId', 'redirectUri'] as const
  ).filter((key) => !request[key]);
  if (missing.length > 0) {
    throw new AuthError(
      'INVALID_CONFIG',
      `Missing required option(s): ${missing.join(', ')}`
    );
  }
  if (getScheme(request.authorizationEndpoint) !== 'https') {
    throw new AuthError(
      'INVALID_CONFIG',
      'authorizationEndpoint must be an https URL'
    );
  }
  if (!getScheme(request.redirectUri)) {
    throw new AuthError(
      'INVALID_CONFIG',
      'redirectUri must be an absolute URI, e.g. myapp://callback'
    );
  }
}

/**
 * Runs the OAuth 2.0 authorization code flow in the system browser and
 * returns the code. `state` is generated and verified here; nothing is stored.
 */
export async function authorize(
  request: AuthorizeRequest
): Promise<AuthorizeResult> {
  assertConfig(request);
  const native = getNativeModule();
  if (inProgress) {
    throw new AuthError(
      'INVALID_CONFIG',
      'Another sign-in is already in progress'
    );
  }

  const state = native.randomBase64Url(16);
  const nonce = request.useNonce ? native.randomBase64Url(16) : undefined;
  const codeVerifier =
    request.usePKCE === false ? undefined : native.randomBase64Url(32);

  const url = appendParams(request.authorizationEndpoint, {
    ...request.extraParams,
    response_type: 'code',
    [request.clientIdParam ?? 'client_id']: request.clientId,
    redirect_uri: request.redirectUri,
    scope:
      request.scopes && request.scopes.length > 0
        ? request.scopes.join(request.scopeSeparator ?? ' ')
        : undefined,
    state,
    nonce,
    code_challenge: codeVerifier
      ? native.sha256Base64Url(codeVerifier)
      : undefined,
    code_challenge_method: codeVerifier ? 'S256' : undefined,
  });

  let redirect: string;
  inProgress = true;
  try {
    redirect = await native.openAuthSession(
      url,
      request.redirectUri,
      request.prefersEphemeralSession ?? false
    );
  } catch (error) {
    throw toAuthError(error);
  } finally {
    inProgress = false;
  }

  if (!matchesRedirectUri(redirect, request.redirectUri)) {
    throw new AuthError(
      'PROVIDER_ERROR',
      'The browser returned to an unexpected redirect URI'
    );
  }

  const params = parseRedirectParams(redirect);
  // Reported before the state check: some providers omit `state` on errors,
  // and an error grants nothing.
  if (params.error) {
    throw new AuthError(
      params.error === 'access_denied' ? 'CANCELLED' : 'PROVIDER_ERROR',
      params.error_description || `The provider returned "${params.error}"`,
      {
        providerError: params.error,
        providerErrorDescription: params.error_description,
      }
    );
  }
  // A code is only accepted with the state we generated: anything else did
  // not come from the request we started.
  if (params.state !== state) {
    throw new AuthError(
      'PROVIDER_ERROR',
      'State mismatch: the response does not belong to this sign-in'
    );
  }
  if (!params.code) {
    throw new AuthError(
      'PROVIDER_ERROR',
      'The provider did not return an authorization code'
    );
  }

  return {
    code: params.code,
    codeVerifier,
    state,
    nonce,
    redirectUri: request.redirectUri,
    params,
  };
}

/** Dismisses the browser of the sign-in in progress; it rejects with CANCELLED. */
export function cancelAuthorize(): void {
  getNativeModule().cancelAuthSession();
}
