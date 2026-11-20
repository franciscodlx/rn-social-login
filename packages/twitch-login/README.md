# @franciscodlxdev/react-native-twitch-login

Login con Twitch para React Native (iOS, Android, Expo) con OpenID Connect, en el navegador del sistema. Sin WebView y sin `client_secret` en la app.

## Compatibilidad

| Paquete | React Native   | Expo SDK                       | iOS    | Android        | New Architecture |
| ------- | -------------- | ------------------------------ | ------ | -------------- | ---------------- |
| 0.1.x   | 0.88 (probado) | development build (no Expo Go) | ≥ 15.1 | ≥ 7.0 (API 24) | Requerida        |

## Instalación

```sh
npm i @franciscodlxdev/react-native-twitch-login @franciscodlxdev/rn-auth-core
cd ios && pod install
```

Android necesita el esquema de tu app en `android/app/build.gradle`:

```groovy
manifestPlaceholders["authCoreRedirectScheme"] = "miapp"
```

Expo: `plugins: [["@franciscodlxdev/rn-auth-core", { "scheme": "miapp" }]]`.

## Configurar el proveedor

1. Registra la aplicación en la [consola de Twitch](https://dev.twitch.tv/console/apps) con tipo de cliente **Confidential** y genera un Client Secret.
2. En "OAuth Redirect URLs" registra una URL **https de tu backend**, por ejemplo `https://api.miapp.com/auth/twitch/callback`.

El flujo de código de Twitch exige el `client_secret` y no documenta PKCE, así que necesitas un backend con dos rutas: una que reenvíe el redirect a tu app y otra que haga el canje. [`examples/twitch-backend`](../../examples/twitch-backend) es una implementación completa.

```
app ──signIn()──▶ Twitch ──https──▶ tu backend /callback ──miapp://callback──▶ app
app ──code + nonce──▶ tu backend /exchange ──code + secret──▶ Twitch ──▶ id_token verificado + perfil
```

Los clientes de tipo Public de Twitch solo pueden usar el flujo de código de dispositivo (pensado para TV y consolas), que este paquete no implementa.

## Uso

```tsx
import { useTwitchLogin } from '@franciscodlxdev/react-native-twitch-login';

const { signIn, loading, error } = useTwitchLogin({
  clientId: 'TU_CLIENT_ID',
  redirectUri: 'https://api.miapp.com/auth/twitch/callback',
  callbackUri: 'miapp://callback',
});

const result = await signIn();
if (result) {
  await fetch('https://api.miapp.com/auth/twitch/exchange', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code: result.code,
      nonce: result.nonce,
      redirectUri: result.redirectUri,
    }),
  });
}
```

Scopes por defecto: `openid user:read:email`. Twitch solo devuelve `sub` salvo que pidas los demás claims; el paquete pide `email`, `email_verified`, `picture` y `preferred_username`. Para cambiarlos o forzar la pantalla de autorización:

```ts
const login = createTwitchLogin({
  extraAuthParams: {
    claims: twitchClaims(['picture', 'preferred_username']),
    force_verify: 'true',
  },
});
```

| Exporta                                                                                    | Para qué                                                          |
| ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------- |
| `useTwitchLogin(options)`                                                                  | Hook: `{ signIn, signOut, loading, result, error, isAvailable }`  |
| `twitchLogin`                                                                              | `signIn`, `signOut`, `isAvailable` sin React                      |
| `createTwitchLogin(overrides)`                                                             | Otra instancia: claims distintos o un servidor de pruebas         |
| `twitchClaims(claims)`                                                                     | Valor del parámetro `claims`                                      |
| `mapTwitchProfile(userinfo)`                                                               | Convierte userinfo o los claims del `id_token` en `TwitchProfile` |
| `TWITCH_TOKEN_ENDPOINT`, `TWITCH_JWKS_URI`, `TWITCH_ISSUER`, `TWITCH_VALIDATE_ENDPOINT`, … | Constantes para tu backend                                        |

## Backend (canje del código)

Node, completo y con pruebas: [`examples/twitch-backend/server.mjs`](../../examples/twitch-backend/server.mjs). Laravel:

```php
// Reenvía el redirect de Twitch a la app.
Route::get('/auth/twitch/callback', fn (Request $r) =>
    redirect()->away('miapp://callback?' . $r->getQueryString()));

Route::post('/auth/twitch/exchange', function (Request $r) {
    $tokens = Http::asForm()->post('https://id.twitch.tv/oauth2/token', [
        'grant_type' => 'authorization_code',
        'code' => $r->input('code'),
        'redirect_uri' => config('services.twitch.redirect'), // fijo, no el que mande la app
        'client_id' => config('services.twitch.client_id'),
        'client_secret' => config('services.twitch.client_secret'),
    ])->throw()->json();

    // Verifica el id_token: firma RS256 con https://id.twitch.tv/oauth2/keys,
    // iss = https://id.twitch.tv/oauth2, aud = tu client id, exp,
    // y nonce === $r->input('nonce'). Por ejemplo con firebase/php-jwt.
    $claims = verifyTwitchIdToken($tokens['id_token'], $r->input('nonce'));

    // Crea aquí tu propia sesión para $claims->sub.
    return ['profile' => $claims];
});
```

## Errores normalizados

`CANCELLED | NETWORK | INVALID_CONFIG | PROVIDER_ERROR | NOT_SUPPORTED`, en `error.code`. Si el usuario rechaza, Twitch responde `access_denied` ("The user denied you access") y llega como `CANCELLED`.

## Seguridad

- El `client_secret` y los tokens de Twitch viven solo en tu backend.
- `state` y `nonce` se generan en el dispositivo; el backend comprueba que el `nonce` del `id_token` sea el de este inicio de sesión, lo que impide inyectar un código ajeno.
- Twitch no documenta PKCE, así que no se envía.
- En tu backend, el destino del reenvío y el `redirect_uri` del canje deben ser fijos, no tomados de la petición.
- Si conservas el access token, Twitch exige validarlo al arrancar y cada hora (`TWITCH_VALIDATE_ENDPOINT`).
- `email` llega vacío cuando la cuenta no tiene el correo verificado.

## Sin verificar contra Twitch real

La documentación no dice si acepta esquemas propios (`miapp://`) como redirect; por eso el paquete usa un redirect https a tu backend, que funciona en cualquier caso.

## Probar sin credenciales

`examples/twitch-login-example` corre contra `examples/mock-idp` y `examples/twitch-backend`. Ver [CONTRIBUTING.md](../../CONTRIBUTING.md).

## Licencia

MIT.
