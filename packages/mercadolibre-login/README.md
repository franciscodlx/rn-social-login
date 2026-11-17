# @franciscodlx/react-native-mercadolibre-login

Login con Mercado Libre para React Native (iOS, Android, Expo) con OAuth 2.0 + PKCE, en el navegador del sistema. Sin WebView y sin `client_secret` en la app.

> **Estado:** probado de punta a punta contra un proveedor local. La documentación de Mercado Libre no se pudo consultar al escribir esta versión (bloquea clientes automáticos), así que los detalles del proveedor de este README están pendientes de confirmar con una aplicación real.

## Compatibilidad

| Paquete | React Native   | Expo SDK                       | iOS    | Android        | New Architecture |
| ------- | -------------- | ------------------------------ | ------ | -------------- | ---------------- |
| 0.1.x   | 0.88 (probado) | development build (no Expo Go) | ≥ 15.1 | ≥ 7.0 (API 24) | Requerida        |

## Instalación

```sh
npm i @franciscodlx/react-native-mercadolibre-login @franciscodlx/rn-auth-core
cd ios && pod install
```

Android necesita el esquema de tu app en `android/app/build.gradle`:

```groovy
manifestPlaceholders["authCoreRedirectScheme"] = "miapp"
```

Expo: `plugins: [["@franciscodlx/rn-auth-core", { "scheme": "miapp" }]]`.

## Configurar el proveedor

1. Crea la aplicación en el DevCenter de Mercado Libre (Mis aplicaciones).
2. Registra como URI de redirect una URL **https de tu backend**, por ejemplo `https://api.miapp.com/auth/mercadolibre/callback`.
3. Activa PKCE en la aplicación y elige los permisos (lectura, escritura, `offline_access` para refresh token). Los scopes se configuran en la aplicación, no en la petición.

El canje del código exige el `client_secret`, así que necesitas un backend con dos rutas: una que reenvíe el redirect a tu app y otra que haga el canje. [`examples/mercadolibre-backend`](../../examples/mercadolibre-backend) es una implementación completa.

```
app ──signIn()──▶ Mercado Libre ──https──▶ tu backend /callback ──miapp://callback──▶ app
app ──code + codeVerifier──▶ tu backend /exchange ──+ secret──▶ Mercado Libre ──▶ perfil
```

## Uso

```tsx
import { useMercadoLibreLogin } from '@franciscodlx/react-native-mercadolibre-login';

const { signIn, loading, error } = useMercadoLibreLogin({
  country: 'MX',
  clientId: 'TU_APP_ID',
  redirectUri: 'https://api.miapp.com/auth/mercadolibre/callback',
  callbackUri: 'miapp://callback',
});

const result = await signIn();
if (result) {
  await fetch('https://api.miapp.com/auth/mercadolibre/exchange', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code: result.code,
      codeVerifier: result.codeVerifier,
      redirectUri: result.redirectUri,
    }),
  });
}
```

### País

Cada cuenta pertenece a un sitio, y el usuario debe entrar por el host de su país. `country` acepta `AR BO BR CL CO CR DO EC MX PA PE PY UY VE` (ver `MERCADOLIBRE_AUTH_HOSTS`). Si tu app opera en varios países, pregunta el país antes de llamar a `signIn` y pásalo al hook.

| Exporta                                                         | Para qué                                                               |
| --------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `useMercadoLibreLogin(options)`                                 | Hook: `{ signIn, signOut, loading, result, error, isAvailable }`       |
| `createMercadoLibreLogin({ country, ...overrides })`            | `signIn`, `signOut`, `isAvailable` sin React, o un servidor de pruebas |
| `mapMercadoLibreProfile(user)`                                  | Convierte la respuesta de `/users/me` en `MercadoLibreProfile`         |
| `MERCADOLIBRE_TOKEN_ENDPOINT`, `MERCADOLIBRE_USERINFO_ENDPOINT` | Constantes para tu backend                                             |

## Backend (canje del código)

Node, completo y con pruebas: [`examples/mercadolibre-backend/server.mjs`](../../examples/mercadolibre-backend/server.mjs). Laravel:

```php
// Reenvía el redirect de Mercado Libre a la app.
Route::get('/auth/mercadolibre/callback', fn (Request $r) =>
    redirect()->away('miapp://callback?' . $r->getQueryString()));

Route::post('/auth/mercadolibre/exchange', function (Request $r) {
    $tokens = Http::asForm()->acceptJson()->post('https://api.mercadolibre.com/oauth/token', [
        'grant_type' => 'authorization_code',
        'code' => $r->input('code'),
        'code_verifier' => $r->input('codeVerifier'),
        'redirect_uri' => config('services.mercadolibre.redirect'), // fijo, no el que mande la app
        'client_id' => config('services.mercadolibre.client_id'),
        'client_secret' => config('services.mercadolibre.client_secret'),
    ])->throw()->json();

    $user = Http::withToken($tokens['access_token'])
        ->get('https://api.mercadolibre.com/users/me')->throw()->json();

    // Guarda $tokens en el servidor y crea tu propia sesión para $user['id'].
    return ['profile' => $user];
});
```

## Errores normalizados

`CANCELLED | NETWORK | INVALID_CONFIG | PROVIDER_ERROR | NOT_SUPPORTED`, en `error.code`; el código original del proveedor queda en `error.providerError`.

## Seguridad

- El `client_secret` y los tokens de Mercado Libre viven solo en tu backend.
- `state` y PKCE (S256) se generan en el dispositivo; el `codeVerifier` viaja al backend junto con el código, así un código interceptado no sirve por sí solo.
- En tu backend, el destino del reenvío y el `redirect_uri` del canje deben ser fijos, no tomados de la petición.

## Pendiente de confirmar con una aplicación real

- Que el host de autorización de cada país sea el de `MERCADOLIBRE_AUTH_HOSTS`.
- El código de error que llega cuando el usuario rechaza (se asume `access_denied`).
- Duración del access token y del refresh token.
- Si un usuario operador (colaborador) puede autorizar o solo el titular de la cuenta.

## Probar sin credenciales

`examples/mercadolibre-login-example` corre contra `examples/mock-idp` y `examples/mercadolibre-backend`. Ver [CONTRIBUTING.md](../../CONTRIBUTING.md).

## Licencia

MIT.
