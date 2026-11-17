# @franciscodlx/react-native-x-login

Login con X (Twitter) para React Native (iOS, Android, Expo) con OAuth 2.0 + PKCE, en el navegador del sistema. Cliente público: sin consumer secret en la app.

## Compatibilidad

| Paquete | React Native   | Expo SDK                       | iOS    | Android        | New Architecture |
| ------- | -------------- | ------------------------------ | ------ | -------------- | ---------------- |
| 0.1.x   | 0.88 (probado) | development build (no Expo Go) | ≥ 15.1 | ≥ 7.0 (API 24) | Requerida        |

## Instalación

```sh
npm i @franciscodlx/react-native-x-login @franciscodlx/rn-auth-core
cd ios && pod install
```

Android necesita el esquema de tu app en `android/app/build.gradle`:

```groovy
manifestPlaceholders["authCoreRedirectScheme"] = "miapp"
```

Expo: `plugins: [["@franciscodlx/rn-auth-core", { "scheme": "miapp" }]]`.

## Configurar el proveedor

1. Crea un proyecto y una app en el [portal de desarrolladores de X](https://developer.x.com).
2. En User authentication settings elige el tipo **Native App** (cliente público, sin secret).
3. Registra tu Callback URI, por ejemplo `miapp://callback`. X la compara de forma exacta.
4. Usa el **Client ID** de OAuth 2.0 (no la API Key de OAuth 1.0a).

## Uso

```tsx
import { useXLogin } from '@franciscodlx/react-native-x-login';

const { signIn, loading, error } = useXLogin({
  clientId: 'TU_CLIENT_ID',
  redirectUri: 'miapp://callback',
});

// Recomendado: tu backend hace el canje.
const result = await signIn(); // { code, codeVerifier, redirectUri }

// O en el dispositivo:
const session = await signIn({
  exchangeCode: true,
  scopes: ['users.read', 'tweet.read', 'users.email', 'offline.access'],
}); // { accessToken, refreshToken, expiresIn, profile }
```

| Exporta                                              | Para qué                                                  |
| ---------------------------------------------------- | --------------------------------------------------------- |
| `useXLogin(options)`                                 | Hook: `{ signIn, signOut, loading, result, error }`       |
| `xLogin.signIn / signOut / isAvailable`              | Lo mismo sin React; `signOut({ clientId, token })` revoca |
| `xLogin.refresh({ clientId, refreshToken })`         | Nuevo access token (requiere `offline.access`)            |
| `createXLogin(overrides)`                            | Otra instancia, p. ej. contra un servidor de pruebas      |
| `mapXProfile`, `xUserInfoUrl`, `X_TOKEN_ENDPOINT`, … | Utilidades y constantes para tu backend                   |
| `TwitterSignIn`                                      | Capa de compatibilidad (obsoleta), ver "Migrar"           |

Scopes por defecto: `users.read tweet.read` (los que pide `GET /2/users/me`). `offline.access` agrega el refresh token; `users.email` agrega `profile.email`.

## Backend (canje del código)

El código de X **caduca a los 30 segundos**: envíalo al backend de inmediato.

```js
// Node
const res = await fetch('https://api.x.com/2/oauth2/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    code_verifier: codeVerifier,
    redirect_uri: 'miapp://callback',
    client_id: process.env.X_CLIENT_ID,
  }),
});
const { access_token } = await res.json();
const me = await fetch('https://api.x.com/2/users/me', {
  headers: { Authorization: `Bearer ${access_token}` },
}).then((r) => r.json()); // { data: { id, name, username } }
```

```php
// Laravel
$tokens = Http::asForm()->post('https://api.x.com/2/oauth2/token', [
    'grant_type' => 'authorization_code',
    'code' => $request->input('code'),
    'code_verifier' => $request->input('codeVerifier'),
    'redirect_uri' => config('services.x.redirect'),
    'client_id' => config('services.x.client_id'),
])->throw()->json();
$me = Http::withToken($tokens['access_token'])
    ->get('https://api.x.com/2/users/me')->throw()->json('data');
```

## Errores normalizados

`CANCELLED | NETWORK | INVALID_CONFIG | PROVIDER_ERROR | NOT_SUPPORTED`, en `error.code`; el código original de X queda en `error.providerError`.

## Seguridad

- PKCE con S256 y `state` generados y verificados en el dispositivo.
- Sin secret en la app. Si canjeas en el dispositivo, guarda los tokens en Keychain/Keystore, no en AsyncStorage.
- El access token dura 2 horas. Al refrescar, guarda el refresh token nuevo que llegue.
- X no es OpenID Connect: no hay `id_token`. La identidad se confirma en el backend llamando a `/2/users/me`.

## Migrar desde react-native-twitter-signin

| Antes                                                                 | Ahora                                                                        |
| --------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `RNTwitterSignIn.init(consumerKey, consumerSecret)`                   | `TwitterSignIn.init(clientId, { redirectUri })`                              |
| `logIn()` → `{ authToken, authTokenSecret, userName, userID, email }` | Igual; `authToken` es el access token OAuth 2.0 y `authTokenSecret` va vacío |
| `logOut()`                                                            | Igual; revoca el token                                                       |
| Twitter Kit, `twitterkit-<key>://` en Info.plist                      | Ya no se necesitan                                                           |

Los tokens OAuth 2.0 no sirven para endpoints de la API v1.1 que exigen OAuth 1.0a.

## Probar sin credenciales

`examples/x-login-example` corre contra `examples/mock-idp`. Ver [CONTRIBUTING.md](../../CONTRIBUTING.md).

## Sin verificar contra X real

La documentación de X no confirma: esquemas propios en la Callback URI, el código de error al cancelar (se asume `access_denied`), si el refresh token rota, y qué pasa en Android con la app de X instalada (el núcleo abre siempre el navegador, no la app).

## Licencia y créditos

MIT. Reescritura inspirada en la API de [react-native-twitter-signin](https://github.com/react-native-twitter-signin/twitter-signin); no reutiliza su código.
