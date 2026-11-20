# @franciscodlxdev/rn-oauth-presets

Login con GitHub, Discord, Slack y Strava para React Native (iOS, Android, Expo) sobre [`@franciscodlxdev/rn-auth-core`](../auth-core): navegador del sistema, sin WebView y sin `client_secret` en la app.

## Compatibilidad

| Paquete | React Native   | Expo SDK                       | iOS    | Android        | New Architecture |
| ------- | -------------- | ------------------------------ | ------ | -------------- | ---------------- |
| 0.1.x   | 0.88 (probado) | development build (no Expo Go) | ≥ 15.1 | ≥ 7.0 (API 24) | Requerida        |

## Instalación

```sh
npm i @franciscodlxdev/rn-oauth-presets @franciscodlxdev/rn-auth-core
cd ios && pod install
```

Android necesita el esquema de tu app en `android/app/build.gradle`:

```groovy
manifestPlaceholders["authCoreRedirectScheme"] = "miapp"
```

Expo: `plugins: [["@franciscodlxdev/rn-auth-core", { "scheme": "miapp" }]]`.

## Presets

| Preset    | Scopes por defecto          | Protección además de `state`    | Dónde se registra el redirect                |
| --------- | --------------------------- | ------------------------------- | -------------------------------------------- |
| `github`  | `read:user user:email`      | PKCE (S256)                     | OAuth App → Authorization callback URL       |
| `discord` | `identify email`            | PKCE (S256), `iss` del redirect | Developer Portal → OAuth2 → Redirects        |
| `slack`   | `openid profile email`      | `nonce` (OpenID Connect)        | App → OAuth & Permissions → Redirect URLs    |
| `strava`  | `read` (separados por coma) | ninguna documentada             | API settings → Authorization Callback Domain |

Los cuatro exigen el `client_secret` para cambiar el código por tokens, así que el canje va en tu backend. [`examples/presets-backend`](../../examples/presets-backend) lo implementa para los cuatro.

```
app ──signIn()──▶ proveedor ──https──▶ tu backend /callback ──miapp://callback──▶ app
app ──code + codeVerifier | nonce──▶ tu backend /exchange ──+ secret──▶ proveedor ──▶ perfil
```

## Uso

```tsx
import { useOAuthPreset } from '@franciscodlxdev/rn-oauth-presets';

const { signIn, loading, error } = useOAuthPreset('github', {
  clientId: 'TU_CLIENT_ID',
  redirectUri: 'https://api.miapp.com/auth/github/callback',
  callbackUri: 'miapp://callback',
});

const result = await signIn();
if (result) {
  await fetch('https://api.miapp.com/auth/github/exchange', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code: result.code,
      codeVerifier: result.codeVerifier, // GitHub y Discord
      nonce: result.nonce, // Slack
      redirectUri: result.redirectUri,
    }),
  });
}
```

Sin hook: `githubLogin.signIn(options)`, `discordLogin`, `slackLogin`, `stravaLogin`.

| Exporta                                                                        | Para qué                                                                |
| ------------------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| `useOAuthPreset(name, options)`                                                | Hook: `{ signIn, signOut, loading, result, error, isAvailable }`        |
| `githubLogin`, `discordLogin`, `slackLogin`, `stravaLogin`                     | `signIn`, `signOut`, `isAvailable` sin React                            |
| `createPresetLogin(name, overrides)`                                           | Otra instancia: otros scopes, parámetros extra o un servidor de pruebas |
| `presets.<name>.backend`                                                       | Endpoints de token, usuario, revocación y JWKS para tu backend          |
| `mapGitHubProfile`, `mapDiscordProfile`, `mapSlackProfile`, `mapStravaProfile` | Perfil normalizado `{ id, username, name, email, picture, raw }`        |

Ejemplos de ajustes:

```ts
createPresetLogin('strava', { defaultScopes: ['read', 'activity:read'] });
createPresetLogin('strava', { extraAuthParams: { approval_prompt: 'force' } });
createPresetLogin('github', { extraAuthParams: { prompt: 'select_account' } });
createPresetLogin('slack', { extraAuthParams: { team: 'T0123456' } });
```

Otro proveedor: pasa tu propio objeto en vez del nombre, `createPresetLogin({ id, authorizationEndpoint, defaultScopes, backend: { tokenEndpoint } })`.

## Backend (canje del código)

Node, completo y con pruebas: [`examples/presets-backend/server.mjs`](../../examples/presets-backend/server.mjs). Laravel, con GitHub como ejemplo:

```php
Route::get('/auth/github/callback', fn (Request $r) =>
    redirect()->away('miapp://callback?' . $r->getQueryString()));

Route::post('/auth/github/exchange', function (Request $r) {
    $tokens = Http::asForm()->acceptJson()->post('https://github.com/login/oauth/access_token', [
        'code' => $r->input('code'),
        'code_verifier' => $r->input('codeVerifier'),
        'redirect_uri' => config('services.github.redirect'), // fijo, no el que mande la app
        'client_id' => config('services.github.client_id'),
        'client_secret' => config('services.github.client_secret'),
    ])->throw()->json();

    $user = Http::withToken($tokens['access_token'])
        ->get('https://api.github.com/user')->throw()->json();

    // Crea aquí tu propia sesión para $user['id'].
    return ['profile' => $user];
});
```

Diferencias por proveedor:

- **GitHub**: pide `Accept: application/json` en el token (si no, responde form-encoded). `email` viene `null` si es privado; el principal está en `/user/emails` (scope `user:email`). El código caduca a los 10 minutos.
- **Discord**: el token solo acepta `application/x-www-form-urlencoded`.
- **Slack**: las respuestas traen `ok: true/false`; revisa `ok` además del estado HTTP. Verifica el `id_token` con `https://slack.com/openid/connect/keys`, emisor `https://slack.com` y el `nonce`.
- **Strava**: el perfil (`athlete`) llega en la respuesta de tokens. El access token dura 6 horas y el refresh token puede cambiar en cada renovación.

## Errores normalizados

`CANCELLED | NETWORK | INVALID_CONFIG | PROVIDER_ERROR | NOT_SUPPORTED`, en `error.code`; el código original del proveedor queda en `error.providerError`.

## Seguridad

- El `client_secret` y los tokens viven solo en tu backend.
- `state` siempre; PKCE donde el proveedor lo documenta (GitHub, Discord) y `nonce` en Slack.
- Discord incluye `iss` en el redirect: el paquete rechaza la respuesta si no es `https://discord.com`.
- En tu backend, el destino del reenvío y el `redirect_uri` del canje deben ser fijos, no tomados de la petición.

## Sin verificar contra los proveedores reales

- Si GitHub, Discord, Slack o Strava aceptan esquemas propios (`miapp://`) como redirect: la documentación no lo dice, y con el redirect https al backend no hace falta.
- El código de error al rechazar en GitHub, Discord y Slack (se asume `access_denied`; Strava sí lo documenta).
- Slack acepta `code_verifier` en el token pero no documenta `code_challenge` en la autorización, así que PKCE queda apagado en ese preset. Para probarlo: `createPresetLogin('slack', { usePKCE: true })`.
- Con la app de Strava instalada, el endpoint móvil puede abrir la app en vez del navegador; ese camino no se probó.

## Probar sin credenciales

`examples/oauth-presets-example` corre contra `examples/mock-idp` y `examples/presets-backend`. Ver [CONTRIBUTING.md](../../CONTRIBUTING.md).

## Licencia

MIT.
